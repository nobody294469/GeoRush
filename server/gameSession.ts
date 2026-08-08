import { selectCandidateLocations } from '../src/utils/locationSelector';
import { calculateHaversineDistance, calculateGeoScore } from '../src/utils/scoring';
import {
  MultiplayerGameSession,
  ActiveRoundTarget,
  CandidateSeed,
  TargetResolutionResult,
  TargetLocationDetails,
  PlayerGuess,
  RoundResult,
  PlayerScoreSummary,
  RoomPlayer,
  RoomState
} from '../src/shared/types/multiplayer';

export class GameSessionManager {
  public roomCode: string;
  public currentRound: number = 0;
  public maxRounds: number = 5;
  public timeLimitSeconds: number = 0;
  public gameMode: 'normal' | 'pro' = 'normal';
  public gameType: 'classic' = 'classic';
  public roundState: RoomState = 'LOBBY';

  public activeTarget?: ActiveRoundTarget;
  public secretTarget?: TargetLocationDetails;
  public pendingCandidateSeed?: CandidateSeed;

  public usedCandidateIds: Set<string> = new Set();
  public roundStartedAt?: number;
  public roundEndsAt?: number;
  private timerHandle?: NodeJS.Timeout;

  // roundIndex -> (playerId -> PlayerGuess)
  private guesses: Map<number, Map<string, PlayerGuess>> = new Map();
  public roundResults: RoundResult[] = [];
  
  // playerId -> { totalScore, roundScores }
  private playerScores: Map<string, { totalScore: number; roundScores: number[] }> = new Map();

  constructor(
    roomCode: string,
    maxRounds: number = 5,
    timeLimitSeconds: number = 0,
    gameMode: 'normal' | 'pro' = 'normal'
  ) {
    this.roomCode = roomCode;
    this.maxRounds = maxRounds;
    this.timeLimitSeconds = timeLimitSeconds;
    this.gameMode = gameMode;
  }

  /**
   * Initializes session and prepares round 1 candidate seed.
   */
  public initSession(players: RoomPlayer[]): CandidateSeed {
    this.currentRound = 1;
    this.roundState = 'ROUND_LOADING';
    this.usedCandidateIds.clear();
    this.guesses.clear();
    this.roundResults = [];
    this.playerScores.clear();

    players.forEach(p => {
      this.playerScores.set(p.id, { totalScore: 0, roundScores: [] });
    });

    return this.selectNextCandidateSeed();
  }

  /**
   * Selects candidate seed from candidate locations pool.
   */
  public selectNextCandidateSeed(): CandidateSeed {
    const candidates = selectCandidateLocations(1, this.usedCandidateIds);
    if (candidates.length === 0) {
      throw new Error('No candidate locations available.');
    }

    const cand = candidates[0];
    this.usedCandidateIds.add(cand.id);

    const seed: CandidateSeed = {
      candidateId: cand.id,
      latitude: cand.latitude,
      longitude: cand.longitude,
      heading: 0,
      pitch: 0,
      country: cand.country,
      locationName: `${cand.country} (${cand.region})`
    };

    this.pendingCandidateSeed = seed;
    return seed;
  }

  /**
   * Locks resolved target received from host client and starts the active round.
   */
  public activateRoundFromHostResolution(
    resolution: TargetResolutionResult,
    onTimerExpire?: () => void,
    players?: RoomPlayer[]
  ): { activeTarget: ActiveRoundTarget; session: MultiplayerGameSession } {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = undefined;
    }

    let lat = resolution.resolvedLat;
    let lng = resolution.resolvedLng;
    let panoId = resolution.panoId;
    let country = resolution.country || this.pendingCandidateSeed?.country || 'World';
    let locationName = resolution.locationName || this.pendingCandidateSeed?.locationName || country;

    // Fallback if host resolution returned fallback without pano
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      lat = this.pendingCandidateSeed?.latitude || 0;
      lng = this.pendingCandidateSeed?.longitude || 0;
    }

    // Secret target stored exclusively on server
    this.secretTarget = {
      latitude: lat,
      longitude: lng,
      country,
      locationName,
      panoId
    };

    // Active target sent to clients (no lat/lng exposed!)
    this.activeTarget = {
      roundIndex: this.currentRound,
      panoId,
      mockLocationId: !panoId ? this.pendingCandidateSeed?.candidateId : undefined,
      initialHeading: resolution.heading ?? this.pendingCandidateSeed?.heading ?? 0,
      initialPitch: resolution.pitch ?? this.pendingCandidateSeed?.pitch ?? 0
    };

    this.roundState = 'ROUND_ACTIVE';
    this.roundStartedAt = Date.now();

    if (this.timeLimitSeconds > 0) {
      this.roundEndsAt = this.roundStartedAt + this.timeLimitSeconds * 1000;
      this.timerHandle = setTimeout(() => {
        if (this.roundState === 'ROUND_ACTIVE' && onTimerExpire) {
          onTimerExpire();
        }
      }, this.timeLimitSeconds * 1000);
    } else {
      this.roundEndsAt = undefined;
    }

    return {
      activeTarget: this.activeTarget,
      session: this.toPublicSession(players || [])
    };
  }

  /**
   * Submits a guess for a player.
   */
  public submitGuess(
    playerId: string,
    displayName: string,
    latitude: number,
    longitude: number
  ): { success: boolean; distanceKm: number; score: number; error?: string } {
    if (this.roundState !== 'ROUND_ACTIVE') {
      return { success: false, distanceKm: 0, score: 0, error: 'Round is not active.' };
    }

    if (!this.secretTarget) {
      return { success: false, distanceKm: 0, score: 0, error: 'Secret target not set.' };
    }

    let roundGuesses = this.guesses.get(this.currentRound);
    if (!roundGuesses) {
      roundGuesses = new Map();
      this.guesses.set(this.currentRound, roundGuesses);
    }

    if (roundGuesses.has(playerId)) {
      return { success: false, distanceKm: 0, score: 0, error: 'Guess already submitted for this round.' };
    }

    const distanceKm = calculateHaversineDistance(
      latitude,
      longitude,
      this.secretTarget.latitude,
      this.secretTarget.longitude
    );

    const score = calculateGeoScore(distanceKm);

    const guess: PlayerGuess = {
      playerId,
      displayName,
      latitude,
      longitude,
      distanceKm,
      score,
      submittedAt: Date.now()
    };

    roundGuesses.set(playerId, guess);

    return { success: true, distanceKm, score };
  }

  /**
   * Returns list of player IDs who have submitted a guess for the current round.
   */
  public getSubmittedPlayerIds(): string[] {
    const roundGuesses = this.guesses.get(this.currentRound);
    return roundGuesses ? Array.from(roundGuesses.keys()) : [];
  }

  /**
   * Checks if all active players have submitted guesses.
   */
  public haveAllPlayersSubmitted(activePlayers: RoomPlayer[]): boolean {
    const submittedIds = new Set(this.getSubmittedPlayerIds());
    const connectedActive = activePlayers.filter(p => p.status === 'CONNECTED');
    return connectedActive.every(p => submittedIds.has(p.id));
  }

  /**
   * End round authoritatively. Formulates RoundResult, updates player scores.
   */
  public endRound(players: RoomPlayer[]): { session: MultiplayerGameSession; roundResult: RoundResult } {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = undefined;
    }

    this.roundState = 'ROUND_RESULTS';

    const roundGuessesMap = this.guesses.get(this.currentRound) || new Map<string, PlayerGuess>();
    const finalGuesses: PlayerGuess[] = [];

    // Ensure every player in the room has a guess entry (or timeout)
    players.forEach(player => {
      let guess = roundGuessesMap.get(player.id);
      if (!guess) {
        // Player timed out without submitting
        guess = {
          playerId: player.id,
          displayName: player.displayName,
          latitude: null,
          longitude: null,
          distanceKm: 20000,
          score: 0,
          submittedAt: Date.now(),
          timedOut: true
        };
        roundGuessesMap.set(player.id, guess);
      }
      finalGuesses.push(guess);

      // Update player score history
      let playerScore = this.playerScores.get(player.id);
      if (!playerScore) {
        playerScore = { totalScore: 0, roundScores: [] };
        this.playerScores.set(player.id, playerScore);
      }
      playerScore.roundScores[this.currentRound - 1] = guess.score;
      playerScore.totalScore = playerScore.roundScores.reduce((a, b) => a + (b || 0), 0);
    });

    const targetLocation: TargetLocationDetails = this.secretTarget || {
      latitude: 0,
      longitude: 0,
      country: 'World',
      locationName: 'Unknown'
    };

    const roundResult: RoundResult = {
      roundIndex: this.currentRound,
      targetLocation,
      guesses: finalGuesses.sort((a, b) => b.score - a.score)
    };

    this.roundResults.push(roundResult);

    return {
      session: this.toPublicSession(players),
      roundResult
    };
  }

  /**
   * Prepares next round or finishes game.
   */
  public prepareNextRound(players: RoomPlayer[]): { finished: boolean; candidateSeed?: CandidateSeed; session: MultiplayerGameSession } {
    if (this.currentRound >= this.maxRounds) {
      this.roundState = 'GAME_FINISHED';
      return {
        finished: true,
        session: this.toPublicSession(players)
      };
    }

    this.currentRound += 1;
    this.roundState = 'ROUND_LOADING';
    const candidateSeed = this.selectNextCandidateSeed();

    return {
      finished: false,
      candidateSeed,
      session: this.toPublicSession(players)
    };
  }

  /**
   * Generates public standings sorted by total score.
   */
  public getStandings(players: RoomPlayer[]): PlayerScoreSummary[] {
    return players
      .map(p => {
        const scoreData = this.playerScores.get(p.id) || { totalScore: 0, roundScores: [] };
        return {
          playerId: p.id,
          displayName: p.displayName,
          totalScore: scoreData.totalScore,
          roundScores: [...scoreData.roundScores]
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Prepares public game session object for broadcast.
   */
  public toPublicSession(players: RoomPlayer[] = []): MultiplayerGameSession {
    return {
      roomCode: this.roomCode,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      timeLimitSeconds: this.timeLimitSeconds,
      gameMode: this.gameMode,
      gameType: 'classic',
      roundState: this.roundState,
      activeTarget: this.activeTarget,
      roundStartedAt: this.roundStartedAt,
      roundEndsAt: this.roundEndsAt,
      submittedPlayerIds: this.getSubmittedPlayerIds(),
      roundResults: this.roundResults,
      standings: this.getStandings(players)
    };
  }
}
