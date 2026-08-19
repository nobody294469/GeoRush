export type PlayerConnectionStatus = 'CONNECTED' | 'DISCONNECTED';

export interface RoomPlayer {
  id: string;
  displayName: string;
  isHost: boolean;
  status: PlayerConnectionStatus;
  joinedAt: number;
}

export type RoomState = 
  | 'LOBBY'
  | 'STARTING'
  | 'ROUND_LOADING'
  | 'ROUND_ACTIVE'
  | 'ROUND_LOCKED'
  | 'ROUND_RESULTS'
  | 'GAME_FINISHED'
  | 'CANCELLED';

export type GameType = 'classic' | 'duels' | 'country_streak' | 'time_attack';

export interface RoomSettings {
  maxRounds: number;
  timeLimitSeconds: number;
  gameMode: 'normal' | 'pro';
  mapId: string;
  gameType?: GameType;
}

export interface Room {
  code: string;
  hostPlayerId: string;
  players: RoomPlayer[];
  state: RoomState;
  settings: RoomSettings;
  createdAt: number;
}

export interface RoomActionResponse {
  success: boolean;
  room?: Room;
  playerId?: string;
  error?: string;
}

export interface ActiveRoundTarget {
  roundIndex: number;
  panoId?: string;
  mockLocationId?: string;
  initialHeading?: number;
  initialPitch?: number;
  apiMode?: 'REAL' | 'MOCK';
}

export interface CandidateSeed {
  candidateId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  pitch?: number;
  country: string;
  countryCode?: string;
  locationName?: string;
}

export interface TargetResolutionResult {
  roundIndex: number;
  candidateId: string;
  apiMode?: 'REAL' | 'MOCK';
  panoId?: string;
  resolvedLat?: number;
  resolvedLng?: number;
  country?: string;
  countryCode?: string;
  locationName?: string;
  heading?: number;
  pitch?: number;
  failed?: boolean;
  error?: string;
}

export interface PlayerGuess {
  playerId: string;
  displayName: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number;
  score: number;
  submittedAt: number;
  timedOut?: boolean;
  guessedCountryCode?: string;
  guessedCountryName?: string;
  isCorrectCountry?: boolean;
  baseScore?: number;
  timeMultiplier?: number;
  hasPinnedLocation?: boolean;
}

export interface TargetLocationDetails {
  latitude: number;
  longitude: number;
  locationName?: string;
  country: string;
  countryCode?: string;
  flagEmoji?: string;
  panoId?: string;
}

export interface RoundResult {
  roundIndex: number;
  targetLocation: TargetLocationDetails;
  guesses: PlayerGuess[];
}

export interface PlayerScoreSummary {
  playerId: string;
  displayName: string;
  totalScore: number;
  roundScores: number[];
}

export interface DuelPlayerState {
  playerId: string;
  displayName: string;
  hp: number;
  damageMultiplier: number;
}

export interface DuelRoundResult extends RoundResult {
  damageBase: number;
  damageDealt: number;
  roundWinnerId: string | null;
  playerStatesAfter: Record<string, { hp: number; damageMultiplier: number }>;
}

export interface DuelState {
  playerStates: Record<string, DuelPlayerState>;
  matchFinished: boolean;
  matchWinnerId: string | null;
  isDraw: boolean;
  endReason?: 'KNOCKOUT' | 'MAX_ROUNDS' | 'FORFEIT';
  lastRoundResult?: DuelRoundResult;
}

export interface StreakPlayerState {
  playerId: string;
  displayName: string;
  streak: number;
  isEliminated: boolean;
  eliminatedInRound?: number;
}

export interface StreakState {
  playerStates: Record<string, StreakPlayerState>;
  matchFinished: boolean;
  winnerPlayerId: string | null;
  isDraw: boolean;
  endReason?: 'LAST_SURVIVOR' | 'SAFETY_CAP' | 'ALL_ELIMINATED';
}

export interface MultiplayerGameSession {
  roomCode: string;
  currentRound: number;
  maxRounds: number;
  timeLimitSeconds: number;
  gameMode: 'normal' | 'pro';
  mapId?: string;
  gameType?: GameType;
  roundState: RoomState;
  activeTarget?: ActiveRoundTarget;
  roundStartedAt?: number;
  roundEndsAt?: number;
  submittedPlayerIds: string[];
  roundResults: RoundResult[];
  standings: PlayerScoreSummary[];
  duelState?: DuelState;
  streakState?: StreakState;
}

export interface ClientToServerEvents {
  'room:create': (
    payload: { displayName: string; settings?: Partial<RoomSettings> },
    callback: (response: RoomActionResponse) => void
  ) => void;
  'room:join': (
    payload: { roomCode: string; displayName: string },
    callback: (response: RoomActionResponse) => void
  ) => void;
  'room:leave': (
    callback?: (response: RoomActionResponse) => void
  ) => void;
  'room:update_settings': (
    payload: { settings: Partial<RoomSettings> },
    callback: (response: RoomActionResponse) => void
  ) => void;
  'game:start': (
    callback: (response: RoomActionResponse) => void
  ) => void;
  'game:resolve_target_response': (
    payload: TargetResolutionResult,
    callback?: (response: RoomActionResponse) => void
  ) => void;
  'game:submit_guess': (
    payload: { roundIndex: number; latitude: number; longitude: number; countryCode?: string },
    callback: (response: { success: boolean; distanceKm?: number; score?: number; error?: string }) => void
  ) => void;
  'game:next_round': (
    callback: (response: RoomActionResponse) => void
  ) => void;
  'game:play_again': (
    callback: (response: RoomActionResponse) => void
  ) => void;
}

export interface ServerToClientEvents {
  'room:updated': (room: Room) => void;
  'room:player_joined': (player: RoomPlayer) => void;
  'room:player_left': (payload: { playerId: string; reason: string }) => void;
  'room:closed': (payload: { reason: string }) => void;
  'error': (payload: { message: string }) => void;

  'game:resolve_target_request': (payload: { roundIndex: number; candidateSeed: CandidateSeed }) => void;
  'game:round_started': (payload: { session: MultiplayerGameSession; activeTarget: ActiveRoundTarget }) => void;
  'game:guess_submitted': (payload: { playerId: string; submittedCount: number; totalPlayers: number }) => void;
  'game:round_ended': (payload: { session: MultiplayerGameSession; roundResult: RoundResult }) => void;
  'game:finished': (payload: { session: MultiplayerGameSession }) => void;
}

