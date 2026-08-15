import { GameSessionManager } from './gameSession';
import { calculateTimeAttackScore, calculateHaversineDistance } from '../src/utils/scoring';
import { MapRegistry } from '../src/game/mapRegistry';
import {
  MultiplayerGameSession,
  PlayerGuess,
  RoundResult,
  RoomPlayer,
  GameType
} from '../src/shared/types/multiplayer';

export class TimeAttackSessionManager extends GameSessionManager {
  public override readonly gameType: GameType = 'time_attack';

  constructor(
    roomCode: string,
    maxRounds: number = 5,
    timeLimitSeconds: number = 30,
    gameMode: 'normal' | 'pro' = 'normal',
    mapId: string = 'world'
  ) {
    super(roomCode, maxRounds, 30, gameMode, mapId);
  }

  /**
   * Submits a guess for a player with server-authoritative time-attack scoring.
   */
  public override submitGuess(
    playerId: string,
    displayName: string,
    latitude: number,
    longitude: number,
    _countryCode?: string
  ): { success: boolean; distanceKm: number; score: number; error?: string } {
    if (this.roundState !== 'ROUND_ACTIVE') {
      return { success: false, distanceKm: 0, score: 0, error: 'Round is not active.' };
    }

    if (!this.secretTarget) {
      return { success: false, distanceKm: 0, score: 0, error: 'Secret target not set.' };
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
      return { success: false, distanceKm: 0, score: 0, error: 'Invalid coordinates.' };
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

    // Server-authoritative elapsed time calculation
    const now = Date.now();
    const elapsedTimeMs = this.roundStartedAt ? now - this.roundStartedAt : 0;
    const elapsedTimeSeconds = Math.max(0, elapsedTimeMs / 1000);

    const mapDef = MapRegistry.getInstance().getMap(this.mapId);
    const scaleFactor = mapDef ? mapDef.scaleFactor : 1491.6;

    const scoreResult = calculateTimeAttackScore(distanceKm, elapsedTimeSeconds, scaleFactor, true);

    const guess: PlayerGuess = {
      playerId,
      displayName,
      latitude,
      longitude,
      distanceKm,
      score: scoreResult.finalScore,
      baseScore: scoreResult.baseScore,
      timeMultiplier: scoreResult.timeMultiplier,
      hasPinnedLocation: true,
      submittedAt: now
    };

    roundGuesses.set(playerId, guess);

    return { success: true, distanceKm, score: scoreResult.finalScore };
  }

  /**
   * End round authoritatively. Formulates RoundResult, updates player scores.
   */
  public override endRound(players: RoomPlayer[]): { session: MultiplayerGameSession; roundResult: RoundResult } {
    this.clearTimer();
    this.roundState = 'ROUND_RESULTS';

    const roundGuessesMap = this.guesses.get(this.currentRound) || new Map<string, PlayerGuess>();
    const finalGuesses: PlayerGuess[] = [];

    players.forEach(player => {
      let guess = roundGuessesMap.get(player.id);
      if (!guess) {
        // Player timed out without submitting a pin
        guess = {
          playerId: player.id,
          displayName: player.displayName,
          latitude: null,
          longitude: null,
          distanceKm: 20000,
          score: 0,
          baseScore: 0,
          timeMultiplier: 1.0,
          hasPinnedLocation: false,
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

    const targetLocation = this.secretTarget || {
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
   * Prepares public game session object for broadcast.
   */
  public override toPublicSession(players: RoomPlayer[] = []): MultiplayerGameSession {
    return {
      roomCode: this.roomCode,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      timeLimitSeconds: this.timeLimitSeconds,
      gameMode: this.gameMode,
      mapId: this.mapId,
      gameType: 'time_attack',
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
