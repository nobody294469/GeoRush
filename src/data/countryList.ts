import { GAMEPLAY_CANDIDATE_LOCATIONS } from './gameplayLocations';
import { CandidateLocation } from '../types/game';

export interface CountryOption {
  code: string;
  name: string;
  flagEmoji: string;
}

/**
 * Generates flag emoji from 2-letter ISO country code.
 */
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

let cachedCountryList: CountryOption[] | null = null;

/**
 * Returns a sorted list of unique countries present in the candidate location dataset.
 */
export function getCountryList(): CountryOption[] {
  if (cachedCountryList) return cachedCountryList;

  const map = new Map<string, { code: string; name: string }>();

  for (const c of GAMEPLAY_CANDIDATE_LOCATIONS) {
    if (c.countryCode && c.country) {
      const upperCode = c.countryCode.toUpperCase();
      if (!map.has(upperCode)) {
        map.set(upperCode, {
          code: upperCode,
          name: c.country
        });
      }
    }
  }

  const list: CountryOption[] = Array.from(map.values()).map(item => ({
    code: item.code,
    name: item.name,
    flagEmoji: getFlagEmoji(item.code)
  }));

  list.sort((a, b) => a.name.localeCompare(b.name));
  cachedCountryList = list;
  return list;
}

/**
 * Selects a candidate location for Country Streak based on difficulty progression.
 *
 * Difficulty weights:
 * - Early streak (0-3): Easy ~70%, Medium ~25%, Hard ~5%
 * - Mid streak (4-9): Easy ~30%, Medium ~55%, Hard ~15%
 * - High streak (10+): Easy ~10%, Medium ~50%, Hard ~40%
 */
export function selectStreakCandidateLocation(
  streakCount: number,
  usedIds: Set<string> = new Set(),
  candidates: CandidateLocation[] = GAMEPLAY_CANDIDATE_LOCATIONS
): CandidateLocation {
  const available = candidates.filter(
    c => !usedIds.has(c.id) && c.verificationStatus !== 'unavailable'
  );

  // Fallback if available pool is exhausted
  let pool = available;
  if (available.length === 0) {
    pool = candidates.filter(c => c.verificationStatus !== 'unavailable');
  }

  if (pool.length === 0) {
    throw new Error('No candidate locations available for Country Streak.');
  }

  const easyPool = pool.filter(c => c.difficulty === 'easy');
  const mediumPool = pool.filter(c => c.difficulty === 'medium');
  const hardPool = pool.filter(c => c.difficulty === 'hard');

  let weights: { easy: number; medium: number; hard: number };

  if (streakCount <= 3) {
    weights = { easy: 0.70, medium: 0.25, hard: 0.05 };
  } else if (streakCount <= 9) {
    weights = { easy: 0.30, medium: 0.55, hard: 0.15 };
  } else {
    weights = { easy: 0.10, medium: 0.50, hard: 0.40 };
  }

  // Roll difficulty
  const rand = Math.random();
  let selectedPool: CandidateLocation[] = [];

  if (rand < weights.easy) {
    selectedPool = easyPool;
  } else if (rand < weights.easy + weights.medium) {
    selectedPool = mediumPool;
  } else {
    selectedPool = hardPool;
  }

  // Fallback to any non-empty pool if rolled pool is empty
  if (selectedPool.length === 0) {
    if (easyPool.length > 0) selectedPool = easyPool;
    else if (mediumPool.length > 0) selectedPool = mediumPool;
    else if (hardPool.length > 0) selectedPool = hardPool;
    else selectedPool = pool;
  }

  // Pick random candidate from selected pool
  const randomIndex = Math.floor(Math.random() * selectedPool.length);
  return selectedPool[randomIndex];
}
