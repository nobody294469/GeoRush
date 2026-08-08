export type EnvironmentType = 
  | 'urban' 
  | 'suburban' 
  | 'rural' 
  | 'highway' 
  | 'small_town' 
  | 'coastal' 
  | 'mountainous';

export type DistributionPolicy = 
  | 'WORLD_BALANCED' 
  | 'CONTINENT_BALANCED' 
  | 'COUNTRY_FILTERED' 
  | 'CURATED';

export interface CandidateLocation {
  id: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  region: string;
  continent: string;
  environment: EnvironmentType;
  difficulty: 'easy' | 'medium' | 'hard';
  verificationStatus?: 'unverified' | 'verified' | 'unavailable';
  lastVerified?: number;
}

export interface LocationNode {
  id: string;
  lat: number;
  lng: number;
  heading: number; // default orientation
  pitch?: number;
  description?: string;
  connectedNodeIds: string[]; // for movement
}

export interface Location {
  id: string;
  candidateId?: string;
  panoId?: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  continent?: string;
  environment?: EnvironmentType;
  lat: number;          // Actual resolved target latitude (used for scoring)
  lng: number;          // Actual resolved target longitude (used for scoring)
  originalLat?: number; // Original candidate seed latitude
  originalLng?: number; // Original candidate seed longitude
  heading: number;
  pitch: number;
  zoom: number;
  description: string;
  hints: string[];
  panoramaTheme?: 'tokyo' | 'paris' | 'newyork' | 'sydney' | 'capetown' | 'rio' | 'reykjavik' | 'cairo';
  initialNodeId: string;
  nodes: Record<string, LocationNode>;
}

export interface Guess {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface RoundResult {
  roundNumber: number;
  location: Location;
  nodeUsed: LocationNode;
  guess: Guess;
  distanceKm: number;
  score: number;
  timeTakenSeconds: number;
}

export type GameStatus = 
  | 'IDLE' 
  | 'PLAYING' 
  | 'ROUND_RESULT' 
  | 'GAME_FINISHED';

export type MovementRule = 'ALLOW_MOVING' | 'NO_MOVING';
export type PanRule = 'ALLOW_PAN' | 'NO_PAN';
export type ZoomRule = 'ALLOW_ZOOM' | 'NO_ZOOM';
export type TimeLimitRule = 0 | 15 | 30 | 60 | 120 | 180; // 0 = Unlimited

export type GameMode = 'normal' | 'pro';

export const GAME_MODE_PRESETS: Record<GameMode, { movement: MovementRule; pan: PanRule; zoom: ZoomRule }> = {
  normal: {
    movement: 'ALLOW_MOVING',
    pan: 'ALLOW_PAN',
    zoom: 'ALLOW_ZOOM',
  },
  pro: {
    movement: 'NO_MOVING',
    pan: 'NO_PAN',
    zoom: 'NO_ZOOM',
  },
};

export interface GameRules {
  movement: MovementRule;
  pan: PanRule;
  zoom: ZoomRule;
  timeLimitSeconds: TimeLimitRule;
}

export interface GameSettings {
  maxRounds: number;
  gameMode?: GameMode;
  modeId?: string;
  rules: GameRules;
  mapType: 'world' | 'urban' | 'landmarks';
  mapId?: string;
  // Backward compatibility helpers
  allowMovement?: boolean;
  allowZoom?: boolean;
  allowRotate?: boolean;
  timeLimitSeconds?: number | null;
}

export interface TelemetryData {
  apiMode: 'MOCK' | 'REAL';
  mapsJsInits: number;
  panoramaInstances: number;
  mapInstances: number;
  setPanoCalls: number;
  setPositionCalls: number;
  streetViewServiceRequests: number;
  quotaSafetyLimit: number;
  quotaUsed: number;
  sessionDurationSeconds: number;
  currentPanoId: string | null;
  currentLatLng: { lat: number; lng: number } | null;
}
