import { Location } from '../types/game';
import { selectCandidateLocations } from '../utils/locationSelector';
import { resolveCandidateLocation } from '../utils/streetViewResolver';
import { MapDefinition } from './maps';

export interface LocationEngineResolveOptions {
  map: MapDefinition;
  count: number;
  usedCandidateIds: Set<string>;
  apiMode: 'MOCK' | 'REAL';
  apiKey?: string;
  mockLocations?: Location[];
  randomFn?: () => number;
}

export interface LocationEngineResult {
  locations: Location[];
  error?: string;
}

function shuffleDeterministic<T>(array: T[], randomFn: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * LocationEngine thin facade for session location candidate selection and Street View resolution.
 * 
 * Invariants:
 * - REAL API mode uses real Street View resolution. Never silently substitutes mock locations.
 * - MOCK mode uses provided mock locations and makes zero Google Maps API requests.
 */
export async function resolveSessionLocations(
  options: LocationEngineResolveOptions
): Promise<LocationEngineResult> {
  const { map, count, usedCandidateIds, apiMode, apiKey, mockLocations = [], randomFn } = options;

  // 1. MOCK Mode Branch
  if (apiMode === 'MOCK' || !apiKey) {
    const rng = randomFn || Math.random;
    const shuffledMock = shuffleDeterministic(mockLocations, rng).slice(0, count);
    return { locations: shuffledMock };
  }

  // 2. REAL API Mode Branch via StreetViewService
  const resolvedList: Location[] = [];
  const sessionPanoIds = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 20;

  while (resolvedList.length < count && attempts < maxAttempts) {
    attempts++;
    const needed = count - resolvedList.length;
    let candidates = selectCandidateLocations(
      needed,
      usedCandidateIds,
      map.candidates,
      map.distributionPolicy,
      randomFn
    );

    if (candidates.length === 0) {
      // Recycle candidate pool if exhausted
      usedCandidateIds.clear();
      candidates = selectCandidateLocations(
        needed,
        usedCandidateIds,
        map.candidates,
        map.distributionPolicy,
        randomFn
      );
    }

    if (candidates.length === 0) break;

    for (const candidate of candidates) {
      if (resolvedList.length >= count) break;

      usedCandidateIds.add(candidate.id);

      const resolved = await resolveCandidateLocation(candidate, apiKey, 'REAL');

      if (resolved && resolved.panoId) {
        if (sessionPanoIds.has(resolved.panoId)) {
          console.warn(`Duplicate panorama ID (${resolved.panoId}) in active session detected for candidate ${candidate.id}. Skipping...`);
          continue;
        }

        sessionPanoIds.add(resolved.panoId);
        resolvedList.push(resolved);
      }
    }
  }

  // Strict invariant: REAL API mode must NEVER silently substitute mock data!
  if (resolvedList.length < count) {
    console.error(`REAL API mode failed to resolve ${count} real Street View panoramas (resolved ${resolvedList.length}).`);
    return {
      locations: resolvedList,
      error: 'Unable to resolve real Street View panoramas from Google Maps API. Please check your API key and connection, then try again.'
    };
  }

  return { locations: resolvedList };
}
