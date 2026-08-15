import { AbstractBaseSession } from './baseSession';
import { selectStreakCandidateLocation, getCountryList } from '../src/data/countryList';
import { GAMEPLAY_CANDIDATE_LOCATIONS } from '../src/data/gameplayLocations';
import {
  MultiplayerGameSession,
  CandidateSeed,
  RoundResult,
  RoomPlayer,
  GameType,
  PlayerGuess,
  StreakState,
  StreakPlayerState
} from '../src/shared/types/multiplayer';

export class StreakSessionManager extends AbstractBaseSession {
  public readonly gameType: GameType = 'country_streak';

  public playerStreaks: Map<string, number> = new Map();
  public eliminatedPlayers: Set<string> = new Set();
  public eliminatedInRound: Map<string, number> = new Map();

  public matchFinished: boolean = false;
  public winnerPlayerId: string | null = null;
  public isDraw: boolean = false;
  public endReason?: 'LAST_SURVIVOR' | 'SAFETY_CAP' | 'ALL_ELIMINATED';

  // roundIndex -> Map(playerId -> guess)
  private streakGuesses: Map<number, Map<string, { countryCode: string; countryName: string; isCorrect: boolean; submittedAt: number }>> = new Map();

  constructor(
    roomCode: string,
    maxRounds: number = 100,
    timeLimitSeconds: number = 0,
    gameMode: 'normal' | 'pro' = 'normal',
    mapId: string = 'world'
  ) {
    super(roomCode, Math.min(maxRounds || 100, 100), timeLimitSeconds, gameMode, 'world');
  }

  public initSession(players: RoomPlayer[]): CandidateSeed {
    this.currentRound = 1;
    this.playerStreaks.clear();
    this.eliminatedPlayers.clear();
    this.eliminatedInRound.clear();
    this.usedCandidateIds.clear();
    this.streakGuesses.clear();
    this.guesses.clear();
    this.roundResults = [];
    this.playerScores.clear();
    this.matchFinished = false;
    this.winnerPlayerId = null;
    this.isDraw = false;
    this.endReason = undefined;
    this.roundState = 'ROUND_LOADING';

    for (const p of players) {
      this.playerStreaks.set(p.id, 0);
      this.playerScores.set(p.id, { totalScore: 0, roundScores: [] });
    }

    return this.selectNextCandidateSeed();
  }

  public selectNextCandidateSeed(): CandidateSeed {
    // Determine maximum active streak among active players
    let maxStreak = 0;
    for (const [pId, streak] of this.playerStreaks.entries()) {
      if (!this.eliminatedPlayers.has(pId) && streak > maxStreak) {
        maxStreak = streak;
      }
    }

    const cand = selectStreakCandidateLocation(maxStreak, this.usedCandidateIds);
    this.usedCandidateIds.add(cand.id);

    const seed: CandidateSeed = {
      candidateId: cand.id,
      latitude: cand.latitude,
      longitude: cand.longitude,
      heading: 0,
      pitch: 0,
      country: cand.country,
      countryCode: cand.countryCode,
      locationName: `${cand.country} (${cand.region})`
    };

    this.pendingCandidateSeed = seed;
    return seed;
  }

  public submitGuess(
    playerId: string,
    displayName: string,
    latitude: number,
    longitude: number,
    submittedCountryCode?: string
  ): { success: boolean; distanceKm: number; score: number; error?: string } {
    if (this.roundState !== 'ROUND_ACTIVE') {
      return { success: false, distanceKm: 0, score: 0, error: 'Round is not active.' };
    }

    if (this.eliminatedPlayers.has(playerId)) {
      return { success: false, distanceKm: 0, score: 0, error: 'Player has been eliminated.' };
    }

    if (!this.secretTarget) {
      return { success: false, distanceKm: 0, score: 0, error: 'Secret target not set.' };
    }

    let roundMap = this.streakGuesses.get(this.currentRound);
    if (!roundMap) {
      roundMap = new Map();
      this.streakGuesses.set(this.currentRound, roundMap);
    }

    if (roundMap.has(playerId)) {
      return { success: false, distanceKm: 0, score: 0, error: 'Guess already submitted for this round.' };
    }

    // Determine target country code
    let targetCountryCode = (this.secretTarget.countryCode || '').toUpperCase();
    if (!targetCountryCode && this.pendingCandidateSeed?.candidateId) {
      const match = GAMEPLAY_CANDIDATE_LOCATIONS.find(c => c.id === this.pendingCandidateSeed?.candidateId);
      if (match) targetCountryCode = match.countryCode.toUpperCase();
    }

    const userCode = (submittedCountryCode || '').trim().toUpperCase();
    
    // Find country name for UI display
    const countryList = getCountryList();
    const countryMatch = countryList.find(c => c.code === userCode);
    const countryName = countryMatch ? countryMatch.name : userCode;

    const isCorrect = userCode.length > 0 && userCode === targetCountryCode;

    roundMap.set(playerId, {
      countryCode: userCode,
      countryName,
      isCorrect,
      submittedAt: Date.now()
    });

    // Also populate base class guesses map for standard API compatibility
    let baseRoundMap = this.guesses.get(this.currentRound);
    if (!baseRoundMap) {
      baseRoundMap = new Map();
      this.guesses.set(this.currentRound, baseRoundMap);
    }

    const playerGuess: PlayerGuess = {
      playerId,
      displayName,
      latitude: latitude || 0,
      longitude: longitude || 0,
      distanceKm: isCorrect ? 0 : 1000,
      score: isCorrect ? 1 : 0,
      submittedAt: Date.now(),
      guessedCountryCode: userCode,
      guessedCountryName: countryName,
      isCorrectCountry: isCorrect
    };

    baseRoundMap.set(playerId, playerGuess);

    return { success: true, distanceKm: isCorrect ? 0 : 1000, score: isCorrect ? 1 : 0 };
  }

  public haveAllPlayersSubmitted(activePlayers: RoomPlayer[]): boolean {
    const roundGuesses = this.streakGuesses.get(this.currentRound);
    const submittedIds = new Set(roundGuesses ? Array.from(roundGuesses.keys()) : []);
    
    // Only check active (non-eliminated, connected) players
    const activeSurviving = activePlayers.filter(
      p => p.status === 'CONNECTED' && !this.eliminatedPlayers.has(p.id)
    );

    return activeSurviving.every(p => submittedIds.has(p.id));
  }

  public endRound(players: RoomPlayer[]): { session: MultiplayerGameSession; roundResult: RoundResult } {
    this.clearTimer();

    const roundMap = this.streakGuesses.get(this.currentRound) || new Map();
    const activeSurvivingBeforeRound = players.filter(p => !this.eliminatedPlayers.has(p.id));

    // Evaluate each active player's answer
    for (const p of activeSurvivingBeforeRound) {
      const g = roundMap.get(p.id);
      if (g && g.isCorrect) {
        const prevStreak = this.playerStreaks.get(p.id) || 0;
        const newStreak = prevStreak + 1;
        this.playerStreaks.set(p.id, newStreak);

        // Update score summary
        const sData = this.playerScores.get(p.id) || { totalScore: 0, roundScores: [] };
        sData.totalScore = newStreak;
        sData.roundScores.push(1);
        this.playerScores.set(p.id, sData);
      } else {
        // Player got answer wrong or timed out -> eliminate
        this.eliminatedPlayers.add(p.id);
        this.eliminatedInRound.set(p.id, this.currentRound);

        const sData = this.playerScores.get(p.id) || { totalScore: 0, roundScores: [] };
        sData.roundScores.push(0);
        this.playerScores.set(p.id, sData);
      }
    }

    // Check remaining surviving players
    const survivors = players.filter(p => !this.eliminatedPlayers.has(p.id));

    if (survivors.length === 1 && players.length >= 2) {
      // 1 Survivor left -> Winner!
      this.matchFinished = true;
      this.winnerPlayerId = survivors[0].id;
      this.endReason = 'LAST_SURVIVOR';
      this.roundState = 'GAME_FINISHED';
    } else if (survivors.length === 0) {
      // All remaining active players were eliminated in this round!
      this.matchFinished = true;
      this.endReason = 'ALL_ELIMINATED';
      this.roundState = 'GAME_FINISHED';

      // Find player with highest streak
      let maxStreak = -1;
      let topPlayerIds: string[] = [];

      for (const p of players) {
        const streak = this.playerStreaks.get(p.id) || 0;
        if (streak > maxStreak) {
          maxStreak = streak;
          topPlayerIds = [p.id];
        } else if (streak === maxStreak) {
          topPlayerIds.push(p.id);
        }
      }

      if (topPlayerIds.length === 1) {
        this.winnerPlayerId = topPlayerIds[0];
        this.isDraw = false;
      } else {
        this.winnerPlayerId = null;
        this.isDraw = true;
      }
    } else if (this.currentRound >= this.maxRounds) {
      // Safety cap 100 reached!
      this.matchFinished = true;
      this.endReason = 'SAFETY_CAP';
      this.roundState = 'GAME_FINISHED';

      let maxStreak = -1;
      let topPlayerIds: string[] = [];

      for (const p of players) {
        const streak = this.playerStreaks.get(p.id) || 0;
        if (streak > maxStreak) {
          maxStreak = streak;
          topPlayerIds = [p.id];
        } else if (streak === maxStreak) {
          topPlayerIds.push(p.id);
        }
      }

      if (topPlayerIds.length === 1) {
        this.winnerPlayerId = topPlayerIds[0];
        this.isDraw = false;
      } else {
        this.winnerPlayerId = null;
        this.isDraw = true;
      }
    } else {
      // Game continues!
      this.roundState = 'ROUND_RESULTS';
    }

    // Target details revealed in RoundResult
    const targetDetails = {
      latitude: this.secretTarget?.latitude || 0,
      longitude: this.secretTarget?.longitude || 0,
      country: this.secretTarget?.country || 'Unknown',
      countryCode: this.secretTarget?.countryCode || '',
      locationName: this.secretTarget?.locationName || '',
      panoId: this.secretTarget?.panoId
    };

    const roundGuessesList: PlayerGuess[] = players.map(p => {
      const g = roundMap.get(p.id);
      return {
        playerId: p.id,
        displayName: p.displayName,
        latitude: 0,
        longitude: 0,
        distanceKm: g && g.isCorrect ? 0 : 1000,
        score: g && g.isCorrect ? 1 : 0,
        submittedAt: g?.submittedAt || Date.now(),
        timedOut: !g,
        guessedCountryCode: g?.countryCode || '',
        guessedCountryName: g?.countryName || 'No Answer',
        isCorrectCountry: g?.isCorrect || false
      };
    });

    const result: RoundResult = {
      roundIndex: this.currentRound,
      targetLocation: targetDetails,
      guesses: roundGuessesList
    };

    this.roundResults.push(result);
    return { session: this.toPublicSession(players), roundResult: result };
  }

  public prepareNextRound(players: RoomPlayer[]): { finished: boolean; candidateSeed?: CandidateSeed; session: MultiplayerGameSession } {
    if (this.matchFinished || this.roundState === 'GAME_FINISHED') {
      return { finished: true, session: this.toPublicSession(players) };
    }

    this.currentRound += 1;
    this.roundState = 'ROUND_LOADING';
    const seed = this.selectNextCandidateSeed();

    return {
      finished: false,
      candidateSeed: seed,
      session: this.toPublicSession(players)
    };
  }

  public toPublicSession(players: RoomPlayer[] = []): MultiplayerGameSession {
    const playerStates: Record<string, StreakPlayerState> = {};
    for (const p of players) {
      playerStates[p.id] = {
        playerId: p.id,
        displayName: p.displayName,
        streak: this.playerStreaks.get(p.id) || 0,
        isEliminated: this.eliminatedPlayers.has(p.id),
        eliminatedInRound: this.eliminatedInRound.get(p.id)
      };
    }

    const streakState: StreakState = {
      playerStates,
      matchFinished: this.matchFinished,
      winnerPlayerId: this.winnerPlayerId,
      isDraw: this.isDraw,
      endReason: this.endReason
    };

    return {
      roomCode: this.roomCode,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      timeLimitSeconds: this.timeLimitSeconds,
      gameMode: this.gameMode,
      mapId: 'world',
      gameType: 'country_streak',
      roundState: this.roundState,
      activeTarget: this.activeTarget,
      roundStartedAt: this.roundStartedAt,
      roundEndsAt: this.roundEndsAt,
      submittedPlayerIds: this.getSubmittedPlayerIds(),
      roundResults: this.roundResults,
      standings: this.getStandings(players),
      streakState
    };
  }
}
