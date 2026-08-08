import { CandidateLocation, DistributionPolicy } from '../types/game';
import { GAMEPLAY_CANDIDATE_LOCATIONS } from '../data/gameplayLocations';

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  candidates: CandidateLocation[];
  distributionPolicy: DistributionPolicy;
  scaleFactor?: number;
}

export const WORLD_MAP: MapDefinition = {
  id: 'world',
  name: 'World',
  description: 'Locations from around the globe',
  candidates: GAMEPLAY_CANDIDATE_LOCATIONS,
  distributionPolicy: 'WORLD_BALANCED',
  scaleFactor: 1491.6
};

export const MAP_PRESETS: Record<string, MapDefinition> = {
  world: WORLD_MAP
};
