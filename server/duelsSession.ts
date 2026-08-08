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
  RoomState,
  DuelPlayerState,
  DuelRoundResult,
  DuelState
} from '../src/shared/types/multiplayer';

export class DuelsSessionManager {
  public roomCode: string;
  public currentRound: number = 0;
  public maxRounds: number = 20; // 20-round safety cap
  public timeLimitSeconds: number = 0;
  public gameMode: 'normal' | 'pro' = 'normal';
  public gameType: 'duels' = 'duels';
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
  public duelRoundResults: DuelRoundResult[] = [];

  // playerId -> { totalScore, roundScores }
  private playerScores: Map<string, { totalScore: number; roundScores: number[] }> = new Map();
  private playersMap: Map<string, RoomPlayer> = new Map();

  // Duels State: playerId -> hp (starts at 6000) & damageMultiplier (starts at 1.0)
  public playerHp: Map<string, number> = new Map();
  public playerMultipliers: Map<string, number> = new Map();

  public matchFinished: boolean = false;
  public matchWinnerId: string | null = null;
  public isDraw: boolean = false;
  public endReason?: 'KNOCKOUT' | 'MAX_ROUNDS' | 'FORFEIT';

  constructor(
    roomCode: string,
    maxRounds: number = 20,
    timeLimitSeconds: number = 0,
    gameMode: 'normal' | 'pro' = 'normal'
  ) {
    this.roomCode = roomCode;
    this.maxRounds = Math.min(20, Math.max(1, maxRounds));
    this.timeLimitSeconds = timeLimitSeconds;
    this.gameMode = gameMode;
  }

  /**
   * Initializes Duels session. Requires exactly 2 players.
   */
  public initSession(players: RoomPlayer[]): CandidateSeed {
    if (players.length !== 2) {
      throw new Error('Duels mode requires exactly 2 players.');
    }

    this.currentRound = 1;
    this.roundState = 'ROUND_LOADING';
    this.usedCandidateIds.clear();
    this.guesses.clear();
    this.roundResults = [];
    this.duelRoundResults = [];
    this.playerScores.clear();
    this.playersMap.clear();
    this.playerHp.clear();
    this.playerMultipliers.clear();
    this.matchFinished = false;
    this.matchWinnerId = null;
    this.isDraw = false;
    this.endReason = undefined;

    players.forEach(p => {
      this.playersMap.set(p.id, p);
      this.playerHp.set(p.id, 6000);
      this.playerMultipliers.set(p.id, 1.0);
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
   * Locks resolved target received from host client and starts active round.
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

    if (players && players.length > 0) {
      players.forEach(p => this.playersMap.set(p.id, p));
    }

    let lat = resolution.resolvedLat;
    let lng = resolution.resolvedLng;
    let panoId = resolution.panoId;
    let country = resolution.country || this.pendingCandidateSeed?.country || 'World';
    let locationName = resolution.locationName || this.pendingCandidateSeed?.locationName || country;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      lat = this.pendingCandidateSeed?.latitude || 0;
      lng = this.pendingCandidateSeed?.longitude || 0;
    }

    this.secretTarget = {
      latitude: lat,
      longitude: lng,
      country,
      locationName,
      panoId
    };

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
      session: this.toPublicSession(players)
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
   * Returns player IDs who submitted guesses for current round.
   */
  public getSubmittedPlayerIds(): string[] {
    const roundGuesses = this.guesses.get(this.currentRound);
    return roundGuesses ? Array.from(roundGuesses.keys()) : [];
  }

  /**
   * Checks if all connected players submitted guesses.
   */
  public haveAllPlayersSubmitted(activePlayers: RoomPlayer[]): boolean {
    const submittedIds = new Set(this.getSubmittedPlayerIds());
    const connectedActive = activePlayers.filter(p => p.status === 'CONNECTED');
    return connectedActive.every(p => submittedIds.has(p.id));
  }

  /**
   * Ends round authoritatively, calculates damage, updates HP & multipliers, checks match termination.
   */
  public endRound(players: RoomPlayer[]): { session: MultiplayerGameSession; roundResult: RoundResult } {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = undefined;
    }

    this.roundState = 'ROUND_RESULTS';

    const roundGuessesMap = this.guesses.get(this.currentRound) || new Map<string, PlayerGuess>();

    // Get the two players
    const playerA = players[0];
    const playerB = players[1];

    if (!playerA || !playerB) {
      // Edge case: player left mid round
      const remaining = players.find(p => p !== undefined);
      if (remaining) {
        this.matchFinished = true;
        this.matchWinnerId = remaining.id;
        this.endReason = 'FORFEIT';
        this.roundState = 'GAME_FINISHED';
      }
      return {
        session: this.toPublicSession(players),
        roundResult: {
          roundIndex: this.currentRound,
          targetLocation: this.secretTarget || { latitude: 0, longitude: 0, country: 'World' },
          guesses: []
        }
      };
    }

    // Process guesses / timeouts for player A and B
    [playerA, playerB].forEach(player => {
      let guess = roundGuessesMap.get(player.id);
      if (!guess) {
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

      let scoreData = this.playerScores.get(player.id);
      if (!scoreData) {
        scoreData = { totalScore: 0, roundScores: [] };
        this.playerScores.set(player.id, scoreData);
      }
      scoreData.roundScores[this.currentRound - 1] = guess.score;
      scoreData.totalScore = scoreData.roundScores.reduce((a, b) => a + (b || 0), 0);
    });

    const guessA = roundGuessesMap.get(playerA.id)!;
    const guessB = roundGuessesMap.get(playerB.id)!;

    const hpA = this.playerHp.get(playerA.id) ?? 6000;
    const hpB = this.playerHp.get(playerB.id) ?? 6000;
    const multA = this.playerMultipliers.get(playerA.id) ?? 1.0;
    const multB = this.playerMultipliers.get(playerB.id) ?? 1.0;

    const damageBase = Math.abs(guessA.score - guessB.score);
    let damageDealt = 0;
    let roundWinnerId: string | null = null;

    if (guessA.score > guessB.score) {
      // Player A wins round
      roundWinnerId = playerA.id;
      damageDealt = Math.round(damageBase * multA);
      const newHpB = Math.max(0, hpB - damageDealt);
      this.playerHp.set(playerB.id, newHpB);
      this.playerMultipliers.set(playerA.id, Number((multA + 0.5).toFixed(2)));
    } else if (guessB.score > guessA.score) {
      // Player B wins round
      roundWinnerId = playerB.id;
      damageDealt = Math.round(damageBase * multB);
      const newHpA = Math.max(0, hpA - damageDealt);
      this.playerHp.set(playerA.id, newHpA);
      this.playerMultipliers.set(playerB.id, Number((multB + 0.5).toFixed(2)));
    } else {
      // Tie round
      roundWinnerId = null;
      damageDealt = 0;
      this.playerMultipliers.set(playerA.id, Number((multA + 0.5).toFixed(2)));
      this.playerMultipliers.set(playerB.id, Number((multB + 0.5).toFixed(2)));
    }

    const currentHpA = this.playerHp.get(playerA.id)!;
    const currentHpB = this.playerHp.get(playerB.id)!;

    const targetLocation: TargetLocationDetails = this.secretTarget || {
      latitude: 0,
      longitude: 0,
      country: 'World',
      locationName: 'Unknown'
    };

    const duelRoundResult: DuelRoundResult = {
      roundIndex: this.currentRound,
      targetLocation,
      guesses: [guessA, guessB].sort((a, b) => b.score - a.score),
      damageBase,
      damageDealt,
      roundWinnerId,
      playerStatesAfter: {
        [playerA.id]: { hp: currentHpA, damageMultiplier: this.playerMultipliers.get(playerA.id)! },
        [playerB.id]: { hp: currentHpB, damageMultiplier: this.playerMultipliers.get(playerB.id)! }
      }
    };

    this.roundResults.push(duelRoundResult);
    this.duelRoundResults.push(duelRoundResult);

    // Check Match Termination Rules
    if (currentHpA === 0 || currentHpB === 0) {
      this.matchFinished = true;
      this.endReason = 'KNOCKOUT';
      if (currentHpA > currentHpB) {
        this.matchWinnerId = playerA.id;
      } else if (currentHpB > currentHpA) {
        this.matchWinnerId = playerB.id;
      } else {
        this.matchWinnerId = null;
        this.isDraw = true;
      }
      this.roundState = 'GAME_FINISHED';
    } else if (this.currentRound >= this.maxRounds) {
      this.matchFinished = true;
      this.endReason = 'MAX_ROUNDS';
      if (currentHpA > currentHpB) {
        this.matchWinnerId = playerA.id;
      } else if (currentHpB > currentHpA) {
        this.matchWinnerId = playerB.id;
      } else {
        this.matchWinnerId = null;
        this.isDraw = true;
      }
      this.roundState = 'GAME_FINISHED';
    }

    return {
      session: this.toPublicSession(players),
      roundResult: duelRoundResult
    };
  }

  /**
   * Prepares next round or finishes match.
   */
  public prepareNextRound(players: RoomPlayer[]): { finished: boolean; candidateSeed?: CandidateSeed; session: MultiplayerGameSession } {
    if (this.matchFinished || this.currentRound >= this.maxRounds) {
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
   * Returns standings.
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
   * Generates public Duels game session payload for broadcast.
   */
  public toPublicSession(players?: RoomPlayer[]): MultiplayerGameSession {
    const effectivePlayers = (players && players.length > 0)
      ? players
      : Array.from(this.playersMap.values());

    const playerStates: Record<string, DuelPlayerState> = {};
    effectivePlayers.forEach(p => {
      playerStates[p.id] = {
        playerId: p.id,
        displayName: p.displayName,
        hp: this.playerHp.get(p.id) ?? 6000,
        damageMultiplier: this.playerMultipliers.get(p.id) ?? 1.0
      };
    });

    if (Object.keys(playerStates).length === 0) {
      for (const [pId, hp] of this.playerHp.entries()) {
        playerStates[pId] = {
          playerId: pId,
          displayName: pId,
          hp,
          damageMultiplier: this.playerMultipliers.get(pId) ?? 1.0
        };
      }
    }

    const duelState: DuelState = {
      playerStates,
      matchFinished: this.matchFinished,
      matchWinnerId: this.matchWinnerId,
      isDraw: this.isDraw,
      endReason: this.endReason,
      lastRoundResult: this.duelRoundResults[this.duelRoundResults.length - 1]
    };

    return {
      roomCode: this.roomCode,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      timeLimitSeconds: this.timeLimitSeconds,
      gameMode: this.gameMode,
      gameType: 'duels',
      roundState: this.roundState,
      activeTarget: this.activeTarget,
      roundStartedAt: this.roundStartedAt,
      roundEndsAt: this.roundEndsAt,
      submittedPlayerIds: this.getSubmittedPlayerIds(),
      roundResults: this.roundResults,
      standings: this.getStandings(effectivePlayers),
      duelState
    };
  }
}
