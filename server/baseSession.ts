import { selectCandidateLocations } from '../src/utils/locationSelector';
import { calculateHaversineDistance, calculateGeoScore } from '../src/utils/scoring';
import { MapRegistry } from '../src/game/mapRegistry';
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
  GameType
} from '../src/shared/types/multiplayer';

export abstract class AbstractBaseSession {
  public roomCode: string;
  public currentRound: number = 0;
  public maxRounds: number = 5;
  public timeLimitSeconds: number = 0;
  public gameMode: 'normal' | 'pro' = 'normal';
  public mapId: string = 'world';
  public abstract readonly gameType: GameType;
  public roundState: RoomState = 'LOBBY';

  public activeTarget?: ActiveRoundTarget;
  public secretTarget?: TargetLocationDetails;
  public pendingCandidateSeed?: CandidateSeed;

  public usedCandidateIds: Set<string> = new Set();
  public resolutionAttempts: number = 0;
  public roundStartedAt?: number;
  public roundEndsAt?: number;
  protected timerHandle?: NodeJS.Timeout;

  // roundIndex -> (playerId -> PlayerGuess)
  protected guesses: Map<number, Map<string, PlayerGuess>> = new Map();
  public roundResults: RoundResult[] = [];

  // playerId -> { totalScore, roundScores }
  protected playerScores: Map<string, { totalScore: number; roundScores: number[] }> = new Map();

  constructor(
    roomCode: string,
    maxRounds: number = 5,
    timeLimitSeconds: number = 0,
    gameMode: 'normal' | 'pro' = 'normal',
    mapId: string = 'world'
  ) {
    this.roomCode = roomCode;
    this.maxRounds = maxRounds;
    this.timeLimitSeconds = timeLimitSeconds;
    this.gameMode = gameMode;
    this.mapId = mapId || 'world';
  }

  public abstract initSession(players: RoomPlayer[]): CandidateSeed;

  public clearTimer(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = undefined;
    }
  }

  public selectNextCandidateSeed(): CandidateSeed {
    const mapDef = MapRegistry.getInstance().getMap(this.mapId) || MapRegistry.getInstance().getMap('world');
    const mapCandidates = mapDef ? mapDef.candidates : undefined;
    const distributionPolicy = mapDef ? mapDef.distributionPolicy : 'WORLD_BALANCED';

    const candidates = selectCandidateLocations(1, this.usedCandidateIds, mapCandidates, distributionPolicy);
    if (candidates.length === 0) {
      throw new Error(`No candidate locations available for map: ${this.mapId}`);
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

  public activateRoundFromResolution(
    resolution: TargetResolutionResult,
    onTimerExpire?: () => void,
    players?: RoomPlayer[]
  ): { success: boolean; activeTarget?: ActiveRoundTarget; session?: MultiplayerGameSession; error?: string } {
    if (resolution.apiMode === 'REAL' && (!resolution.panoId || !resolution.panoId.trim())) {
      return {
        success: false,
        error: 'Target resolution requires a valid non-empty panoId in REAL mode.'
      };
    }

    this.clearTimer();
    this.resolutionAttempts = 0;

    let lat = resolution.resolvedLat;
    let lng = resolution.resolvedLng;
    let panoId = resolution.panoId?.trim() || '';
    let country = resolution.country || this.pendingCandidateSeed?.country || 'World';
    let locationName = resolution.locationName || this.pendingCandidateSeed?.locationName || country;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      lat = this.pendingCandidateSeed?.latitude || 0;
      lng = this.pendingCandidateSeed?.longitude || 0;
    }

    // Secret target stored exclusively on server
    this.secretTarget = {
      latitude: lat,
      longitude: lng,
      country,
      countryCode: resolution.countryCode || this.pendingCandidateSeed?.countryCode,
      locationName,
      panoId
    };

    // Active target sent to clients (no lat/lng exposed!)
    this.activeTarget = {
      roundIndex: this.currentRound,
      panoId,
      apiMode: resolution.apiMode || 'MOCK',
      mockLocationId: (!panoId && resolution.apiMode !== 'REAL') ? this.pendingCandidateSeed?.candidateId : undefined,
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
      success: true,
      activeTarget: this.activeTarget,
      session: this.toPublicSession(players || [])
    };
  }

  public activateRoundFromHostResolution(
    resolution: TargetResolutionResult,
    onTimerExpire?: () => void,
    players?: RoomPlayer[]
  ) {
    return this.activateRoundFromResolution(resolution, onTimerExpire, players);
  }

  public submitGuess(
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

  public getSubmittedPlayerIds(): string[] {
    const roundGuesses = this.guesses.get(this.currentRound);
    return roundGuesses ? Array.from(roundGuesses.keys()) : [];
  }

  public haveAllPlayersSubmitted(activePlayers: RoomPlayer[]): boolean {
    const submittedIds = new Set(this.getSubmittedPlayerIds());
    const connectedActive = activePlayers.filter(p => p.status === 'CONNECTED');
    return connectedActive.every(p => submittedIds.has(p.id));
  }

  public abstract endRound(players: RoomPlayer[]): { session: MultiplayerGameSession; roundResult: RoundResult };

  public abstract prepareNextRound(players: RoomPlayer[]): { finished: boolean; candidateSeed?: CandidateSeed; session: MultiplayerGameSession };

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

  public abstract toPublicSession(players?: RoomPlayer[]): MultiplayerGameSession;
}
