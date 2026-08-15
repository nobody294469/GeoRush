import { CandidateLocation } from '../types/game';
import { calculateHaversineDistance } from '../utils/scoring';

export interface ValidationReport {
  totalCount: number;
  duplicateIds: string[];
  invalidCoordinates: string[];
  missingMetadata: string[];
  invalidCountryCodes: string[];
  suspiciousContinents: string[];
  closePairs: { id1: string; id2: string; distanceMeters: number }[];
  countryCounts: Record<string, number>;
  continentCounts: Record<string, number>;
  environmentCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
}

export function validateLocationDataset(
  locations: CandidateLocation[],
  minimumDistanceMeters: number = 0
): ValidationReport {
  const report: ValidationReport = {
    totalCount: locations.length,
    duplicateIds: [],
    invalidCoordinates: [],
    missingMetadata: [],
    invalidCountryCodes: [],
    suspiciousContinents: [],
    closePairs: [],
    countryCounts: {},
    continentCounts: {},
    environmentCounts: {},
    difficultyCounts: {},
  };

  const idSet = new Set<string>();
  
  const knownContinents = new Set([
    'Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania', 'Antarctica'
  ]);

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    
    // Duplicate IDs
    if (idSet.has(loc.id)) {
      report.duplicateIds.push(loc.id);
    }
    idSet.add(loc.id);

    // Coordinates
    if (
      typeof loc.latitude !== 'number' ||
      typeof loc.longitude !== 'number' ||
      loc.latitude < -90 ||
      loc.latitude > 90 ||
      loc.longitude < -180 ||
      loc.longitude > 180 ||
      isNaN(loc.latitude) ||
      isNaN(loc.longitude)
    ) {
      report.invalidCoordinates.push(loc.id || `index_${i}`);
    }

    // Missing metadata
    if (!loc.id || !loc.country || !loc.countryCode || !loc.continent) {
      report.missingMetadata.push(loc.id || `index_${i}`);
    }

    // Country code format
    if (loc.countryCode && !/^[A-Z]{2}$/.test(loc.countryCode)) {
      report.invalidCountryCodes.push(loc.id || `index_${i}`);
    }

    // Continent consistency
    if (loc.continent && !knownContinents.has(loc.continent)) {
      report.suspiciousContinents.push(loc.id || `index_${i}`);
    }

    // Metadata counts
    if (loc.country) {
      report.countryCounts[loc.country] = (report.countryCounts[loc.country] || 0) + 1;
    }
    if (loc.continent) {
      report.continentCounts[loc.continent] = (report.continentCounts[loc.continent] || 0) + 1;
    }
    if (loc.environment) {
      report.environmentCounts[loc.environment] = (report.environmentCounts[loc.environment] || 0) + 1;
    }
    if (loc.difficulty) {
      report.difficultyCounts[loc.difficulty] = (report.difficultyCounts[loc.difficulty] || 0) + 1;
    }
  }

  // Geographic proximity
  if (minimumDistanceMeters > 0) {
    for (let i = 0; i < locations.length; i++) {
      for (let j = i + 1; j < locations.length; j++) {
        const distKm = calculateHaversineDistance(
          locations[i].latitude,
          locations[i].longitude,
          locations[j].latitude,
          locations[j].longitude
        );
        const distMeters = distKm * 1000;
        if (distMeters < minimumDistanceMeters) {
          report.closePairs.push({
            id1: locations[i].id,
            id2: locations[j].id,
            distanceMeters: Math.round(distMeters),
          });
        }
      }
    }
  }

  return report;
}

/**
 * Panorama duplicate foundation
 * This can be used in development to find instances where multiple CandidateLocations
 * resolve to the same Street View panoId.
 */
export function findDuplicatePanoramas(
  resolvedResults: { candidateId: string; panoId?: string }[]
): { panoId: string; candidateIds: string[] }[] {
  const panoMap = new Map<string, string[]>();
  
  for (const res of resolvedResults) {
    if (!res.panoId) continue;
    const existing = panoMap.get(res.panoId) || [];
    existing.push(res.candidateId);
    panoMap.set(res.panoId, existing);
  }

  const duplicates: { panoId: string; candidateIds: string[] }[] = [];
  for (const [panoId, ids] of panoMap.entries()) {
    if (ids.length > 1) {
      duplicates.push({ panoId, candidateIds: ids });
    }
  }

  return duplicates;
}
