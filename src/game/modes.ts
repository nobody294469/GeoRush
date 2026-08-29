import { MapDefinition, WORLD_MAP } from './maps';
import { calculateGeoScore, calculateHaversineDistance } from '../utils/scoring';

export interface GameModeDefinition {
  id: string;
  name: string;
  description: string;
  defaultMaxRounds: number;
  defaultMap: MapDefinition;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  calculateScore: (distanceKm: number, scaleFactor?: number) => number;
}

export const CLASSIC_MODE: GameModeDefinition = {
  id: 'classic',
  name: 'Classic',
  description: '5 rounds of global Street View guessing',
  defaultMaxRounds: 5,
  defaultMap: WORLD_MAP,
  calculateDistance: calculateHaversineDistance,
  calculateScore: calculateGeoScore
};

export const STREAK_MODE: GameModeDefinition = {
  id: 'country_streak',
  name: 'Country Streak',
  description: 'Identify the country of global Street View panoramas to build a streak',
  defaultMaxRounds: 100,
  defaultMap: WORLD_MAP,
  calculateDistance: calculateHaversineDistance,
  calculateScore: (_distanceKm) => 0
};

export const TIME_ATTACK_MODE: GameModeDefinition = {
  id: 'time_attack',
  name: 'Time Attack',
  description: '5 rounds with 30-second countdowns where speed multiplies your geographic score',
  defaultMaxRounds: 5,
  defaultMap: WORLD_MAP,
  calculateDistance: calculateHaversineDistance,
  calculateScore: calculateGeoScore
};

export const DAILY_CHALLENGE_MODE: GameModeDefinition = {
  id: 'daily_challenge',
  name: 'Daily Challenge',
  description: 'Daily global challenge: 5 rounds with a fixed 2-minute timer on the World map',
  defaultMaxRounds: 5,
  defaultMap: WORLD_MAP,
  calculateDistance: calculateHaversineDistance,
  calculateScore: calculateGeoScore
};

export const GAME_MODE_DEFINITIONS: Record<string, GameModeDefinition> = {
  classic: CLASSIC_MODE,
  country_streak: STREAK_MODE,
  time_attack: TIME_ATTACK_MODE,
  daily_challenge: DAILY_CHALLENGE_MODE
};

export * from './modeRegistry';

