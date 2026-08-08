import { CandidateLocation, DistributionPolicy } from '../types/game';
import { GAMEPLAY_CANDIDATE_LOCATIONS } from '../data/gameplayLocations';
import { calculateHaversineDistance } from './scoring';

/**
 * PHASE 3A LOCATION SELECTION ENGINE
 * 
 * Features:
 * 1. Hard Candidate Duplicate Prevention: Excludes candidates in `usedIds` and unavailable candidates.
 * 2. Proximity Soft Penalty Engine:
 *    - < 1 km: 0.05x weight (strong penalty)
 *    - 1–5 km: 0.30x weight (moderate penalty)
 *    - 5–15 km: 0.70x weight (mild penalty)
 *    - > 15 km: 1.00x weight (no penalty)
 * 3. Soft Geographic Diversity (WORLD_BALANCED):
 *    - Rotates across continents
 *    - Softly prefers unrepresented countries & environments
 *    - Allows country repetition when necessary (no hard 1-country-per-game lock)
 */

/**
 * Calculates proximity multiplier based on distance to nearest candidate in selected batch.
 */
export function getProximityWeightMultiplier(
  candidate: CandidateLocation,
  selectedBatch: CandidateLocation[]
): number {
  if (selectedBatch.length === 0) return 1.0;

  let minDistanceKm = Infinity;
  for (const s of selectedBatch) {
    const dist = calculateHaversineDistance(
      candidate.latitude,
      candidate.longitude,
      s.latitude,
      s.longitude
    );
    if (dist < minDistanceKm) {
      minDistanceKm = dist;
    }
  }

  if (minDistanceKm < 1.0) {
    return 0.05; // Strong proximity penalty
  } else if (minDistanceKm < 5.0) {
    return 0.30; // Moderate proximity penalty
  } else if (minDistanceKm < 15.0) {
    return 0.70; // Mild proximity penalty
  }

  return 1.0; // No penalty
}

/**
 * Utility to shuffle an array in place using Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Main candidate selection function for game sessions.
 */
export function selectCandidateLocations(
  count: number = 5,
  usedIds: Set<string> = new Set(),
  candidates: CandidateLocation[] = GAMEPLAY_CANDIDATE_LOCATIONS,
  policy: DistributionPolicy = 'WORLD_BALANCED'
): CandidateLocation[] {
  // Filter out candidates already used or marked unavailable
  const availableCandidates = candidates.filter(
    c => !usedIds.has(c.id) && c.verificationStatus !== 'unavailable'
  );

  // Fallback to full pool if available pool is exhausted
  let pool = availableCandidates;
  if (availableCandidates.length < count) {
    console.warn('Candidate pool exhausted for requested count, recycling candidate pool.');
    pool = candidates.filter(c => c.verificationStatus !== 'unavailable');
  }

  if (pool.length === 0) {
    return [];
  }

  switch (policy) {
    case 'WORLD_BALANCED':
    case 'CONTINENT_BALANCED':
      return applyWorldBalancedPolicy(pool, count);
    case 'CURATED':
    case 'COUNTRY_FILTERED':
    default:
      return applyWorldBalancedPolicy(pool, count);
  }
}

/**
 * WORLD_BALANCED policy implementation with continent rotation and proximity soft penalties.
 */
function applyWorldBalancedPolicy(
  pool: CandidateLocation[],
  count: number
): CandidateLocation[] {
  const selectedBatch: CandidateLocation[] = [];
  const selectedCountries = new Set<string>();

  // Group candidates by continent
  const continentMap = new Map<string, CandidateLocation[]>();
  for (const c of shuffleArray(pool)) {
    const list = continentMap.get(c.continent) || [];
    list.push(c);
    continentMap.set(c.continent, list);
  }

  const continents = shuffleArray(Array.from(continentMap.keys()));
  let loopSafety = 0;

  while (selectedBatch.length < count && loopSafety < 150) {
    loopSafety++;

    for (const continent of continents) {
      if (selectedBatch.length >= count) break;

      const candidatesInContinent = continentMap.get(continent) || [];
      if (candidatesInContinent.length === 0) continue;

      // Score each candidate in this continent based on country novelty and proximity penalty
      let bestCandidateIdx = -1;
      let highestWeight = -1;

      for (let i = 0; i < candidatesInContinent.length; i++) {
        const cand = candidatesInContinent[i];
        
        // Country novelty bonus (soft preference for distinct countries)
        const countryMultiplier = selectedCountries.has(cand.country) ? 0.4 : 1.0;
        
        // Proximity soft penalty
        const proximityMultiplier = getProximityWeightMultiplier(cand, selectedBatch);

        // Combined random-weighted score
        const weight = (Math.random() + 0.1) * countryMultiplier * proximityMultiplier;

        if (weight > highestWeight) {
          highestWeight = weight;
          bestCandidateIdx = i;
        }
      }

      if (bestCandidateIdx !== -1) {
        const picked = candidatesInContinent.splice(bestCandidateIdx, 1)[0];
        if (picked) {
          selectedBatch.push(picked);
          selectedCountries.add(picked.country);
        }
      }
    }

    // Check if continent pool is completely exhausted
    const remainingCount = Array.from(continentMap.values()).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    if (remainingCount === 0) break;
  }

  return selectedBatch;
}
