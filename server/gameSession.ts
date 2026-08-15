import { AbstractBaseSession } from './baseSession';
import {
  MultiplayerGameSession,
  CandidateSeed,
  PlayerGuess,
  RoundResult,
  RoomPlayer,
  GameType
} from '../src/shared/types/multiplayer';

export class GameSessionManager extends AbstractBaseSession {
  public readonly gameType: GameType = 'classic';

  constructor(
    roomCode: string,
    maxRounds: number = 5,
    timeLimitSeconds: number = 0,
    gameMode: 'normal' | 'pro' = 'normal',
    mapId: string = 'world'
  ) {
    super(roomCode, maxRounds, timeLimitSeconds, gameMode, mapId);
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
   * End round authoritatively. Formulates RoundResult, updates player scores.
   */
  public endRound(players: RoomPlayer[]): { session: MultiplayerGameSession; roundResult: RoundResult } {
    this.clearTimer();
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
   * Prepares public game session object for broadcast.
   */
  public toPublicSession(players: RoomPlayer[] = []): MultiplayerGameSession {
    return {
      roomCode: this.roomCode,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      timeLimitSeconds: this.timeLimitSeconds,
      gameMode: this.gameMode,
      mapId: this.mapId,
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
