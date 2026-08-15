import { AbstractBaseSession } from './baseSession';
import {
  MultiplayerGameSession,
  CandidateSeed,
  RoundResult,
  RoomPlayer,
  DuelPlayerState,
  DuelRoundResult,
  DuelState,
  GameType
} from '../src/shared/types/multiplayer';

export class DuelsSessionManager extends AbstractBaseSession {
  public readonly gameType: GameType = 'duels';

  public duelRoundResults: DuelRoundResult[] = [];
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
    gameMode: 'normal' | 'pro' = 'normal',
    mapId: string = 'world'
  ) {
    super(roomCode, Math.min(20, Math.max(1, maxRounds)), timeLimitSeconds, gameMode, mapId);
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
   * Ends round authoritatively, calculates damage, updates HP & multipliers, checks match termination.
   */
  public endRound(players: RoomPlayer[]): { session: MultiplayerGameSession; roundResult: RoundResult } {
    this.clearTimer();
    this.roundState = 'ROUND_RESULTS';

    const roundGuessesMap = this.guesses.get(this.currentRound) || new Map();

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

    const targetLocation = this.secretTarget || {
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
   * Generates public Duels game session payload for broadcast.
   */
  public toPublicSession(players?: RoomPlayer[]): MultiplayerGameSession {
    if (players && players.length > 0) {
      players.forEach(p => this.playersMap.set(p.id, p));
    }

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
      mapId: this.mapId,
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
