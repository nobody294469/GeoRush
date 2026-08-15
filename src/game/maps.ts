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

const filterByContinent = (continent: string) => GAMEPLAY_CANDIDATE_LOCATIONS.filter(c => c.continent === continent);
const filterByCountry = (countryCode: string) => GAMEPLAY_CANDIDATE_LOCATIONS.filter(c => c.countryCode === countryCode);

export const ASIA_MAP: MapDefinition = {
  id: 'asia',
  name: 'Asia',
  description: 'Locations across Asia',
  candidates: filterByContinent('Asia'),
  distributionPolicy: 'CONTINENT_BALANCED'
};

export const EUROPE_MAP: MapDefinition = {
  id: 'europe',
  name: 'Europe',
  description: 'Locations across Europe',
  candidates: filterByContinent('Europe'),
  distributionPolicy: 'CONTINENT_BALANCED'
};

export const NORTH_AMERICA_MAP: MapDefinition = {
  id: 'north_america',
  name: 'North America',
  description: 'Locations across North America',
  candidates: filterByContinent('North America'),
  distributionPolicy: 'CONTINENT_BALANCED'
};

export const SOUTH_AMERICA_MAP: MapDefinition = {
  id: 'south_america',
  name: 'South America',
  description: 'Locations across South America',
  candidates: filterByContinent('South America'),
  distributionPolicy: 'CONTINENT_BALANCED'
};

export const AFRICA_MAP: MapDefinition = {
  id: 'africa',
  name: 'Africa',
  description: 'Locations across Africa',
  candidates: filterByContinent('Africa'),
  distributionPolicy: 'CONTINENT_BALANCED'
};

export const OCEANIA_MAP: MapDefinition = {
  id: 'oceania',
  name: 'Oceania',
  description: 'Locations across Oceania',
  candidates: filterByContinent('Oceania'),
  distributionPolicy: 'CONTINENT_BALANCED'
};

export const INDIA_MAP: MapDefinition = {
  id: 'india',
  name: 'India',
  description: 'Locations across India',
  candidates: filterByCountry('IN'),
  distributionPolicy: 'COUNTRY_FILTERED'
};

export const MAP_PRESETS: Record<string, MapDefinition> = {
  world: WORLD_MAP,
  asia: ASIA_MAP,
  europe: EUROPE_MAP,
  north_america: NORTH_AMERICA_MAP,
  south_america: SOUTH_AMERICA_MAP,
  africa: AFRICA_MAP,
  oceania: OCEANIA_MAP,
  india: INDIA_MAP
};
