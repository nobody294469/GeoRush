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

export const GAME_MODE_DEFINITIONS: Record<string, GameModeDefinition> = {
  classic: CLASSIC_MODE
};
