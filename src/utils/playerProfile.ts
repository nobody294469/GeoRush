/**
 * GeoRush — Player Identity & Statistics Persistence Engine
 * 
 * Provides local-first persistent storage for:
 * - Player Display Name
 * - Anonymous Persistent Player ID
 * - Personal Game Statistics (Games played, win/loss, high scores per mode/map, streaks)
 * - Personal Best Detection (Idempotent per completed match)
 */

export const STORAGE_KEY_NAME = 'geoworld_player_name';
export const STORAGE_KEY_ID = 'geoworld_player_id';
export const STORAGE_KEY_STATS = 'geoworld_player_stats';
export const STORAGE_KEY_RECORDED_MATCHES = 'geoworld_recorded_matches';

export interface PlayerStats {
  version: number;
  totalGamesPlayed: number;
  classicGamesPlayed: number;
  timeAttackGamesPlayed: number;
  countryStreakGamesPlayed: number;
  duelsGamesPlayed: number;
  duelsWins: number;
  duelsLosses: number;
  bestOverallScore: number;
  bestClassicScore: number;
  bestTimeAttackScore: number;
  longestCountryStreak: number;
  bestScoreByMap: Record<string, number>;
  lastPlayedTimestamp?: number;
}

export interface CompletedMatchData {
  matchId: string; // Unique match identifier for idempotency
  mode: 'classic' | 'time_attack' | 'country_streak' | 'duels';
  score?: number;
  mapId?: string;
  streak?: number;
  duelWon?: boolean;
  duelLost?: boolean;
}

export interface PersonalBestResult {
  isNewBestOverall: boolean;
  isNewModeBest: boolean;
  isNewMapBest: boolean;
  isNewStreakBest: boolean;
  previousBestOverall: number;
  previousModeBest: number;
  previousMapBest: number;
  previousStreakBest: number;
  currentStats: PlayerStats;
  alreadyRecorded: boolean;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  version: 1,
  totalGamesPlayed: 0,
  classicGamesPlayed: 0,
  timeAttackGamesPlayed: 0,
  countryStreakGamesPlayed: 0,
  duelsGamesPlayed: 0,
  duelsWins: 0,
  duelsLosses: 0,
  bestOverallScore: 0,
  bestClassicScore: 0,
  bestTimeAttackScore: 0,
  longestCountryStreak: 0,
  bestScoreByMap: {}
};

/**
 * Retrieves the stored player display name or returns default.
 */
export function getPlayerName(defaultName = 'Explorer'): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NAME);
    if (stored && stored.trim().length > 0) {
      return stored.trim().slice(0, 24);
    }
  } catch {
    // LocalStorage unavailable/disabled
  }
  return defaultName;
}

/**
 * Updates the stored player display name.
 */
export function setPlayerName(name: string): string {
  const sanitized = (name || '').trim().slice(0, 24) || 'Explorer';
  try {
    localStorage.setItem(STORAGE_KEY_NAME, sanitized);
  } catch {
    // LocalStorage unavailable/disabled
  }
  return sanitized;
}

/**
 * Retrieves the persistent anonymous player ID, generating one if not present.
 */
export function getPlayerId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_ID);
    if (existing && existing.trim().length > 0) {
      return existing.trim();
    }
    const newId = `geo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem(STORAGE_KEY_ID, newId);
    return newId;
  } catch {
    return `geo_session_${Date.now()}`;
  }
}

/**
 * Loads player statistics with backward compatibility and fallback defaults.
 */
export function getPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_PLAYER_STATS,
          ...parsed,
          bestScoreByMap: {
            ...DEFAULT_PLAYER_STATS.bestScoreByMap,
            ...(parsed.bestScoreByMap || {})
          }
        };
      }
    }
    // Backward compatibility: migrate legacy country_streak_best if available
    const legacyStreak = parseInt(localStorage.getItem('country_streak_best') || '0', 10) || 0;
    if (legacyStreak > 0) {
      const initialStats: PlayerStats = {
        ...DEFAULT_PLAYER_STATS,
        longestCountryStreak: legacyStreak
      };
      savePlayerStats(initialStats);
      return initialStats;
    }
  } catch {
    // Malformed JSON or localStorage error
  }
  return { ...DEFAULT_PLAYER_STATS };
}

/**
 * Saves player statistics to localStorage.
 */
export function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify({
      ...stats,
      version: 1,
      lastPlayedTimestamp: Date.now()
    }));
    // Sync legacy streak key
    if (stats.longestCountryStreak > 0) {
      localStorage.setItem('country_streak_best', stats.longestCountryStreak.toString());
    }
  } catch {
    // LocalStorage unavailable/quota exceeded
  }
}

/**
 * Retrieves the set of recorded match IDs (idempotency check).
 */
function getRecordedMatchIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDED_MATCHES);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return new Set(list);
      }
    }
  } catch {
    // fallback
  }
  return new Set();
}

/**
 * Saves recorded match IDs, capping history to the last 100 entries.
 */
function markMatchRecorded(matchId: string): void {
  try {
    const current = Array.from(getRecordedMatchIds());
    if (!current.includes(matchId)) {
      current.push(matchId);
      // Keep last 100
      const trimmed = current.slice(-100);
      localStorage.setItem(STORAGE_KEY_RECORDED_MATCHES, JSON.stringify(trimmed));
    }
  } catch {
    // fallback
  }
}

/**
 * Records a completed game match idempotently and determines if any Personal Bests were achieved.
 */
export function recordCompletedMatch(match: CompletedMatchData): PersonalBestResult {
  const currentStats = getPlayerStats();
  const recordedIds = getRecordedMatchIds();

  // Baseline empty result
  const result: PersonalBestResult = {
    isNewBestOverall: false,
    isNewModeBest: false,
    isNewMapBest: false,
    isNewStreakBest: false,
    previousBestOverall: currentStats.bestOverallScore,
    previousModeBest: 0,
    previousMapBest: 0,
    previousStreakBest: currentStats.longestCountryStreak,
    currentStats,
    alreadyRecorded: false
  };

  // Idempotency: skip if already recorded
  if (recordedIds.has(match.matchId)) {
    result.alreadyRecorded = true;
    return result;
  }

  // Clone stats for modification
  const updatedStats: PlayerStats = {
    ...currentStats,
    totalGamesPlayed: currentStats.totalGamesPlayed + 1,
    bestScoreByMap: { ...currentStats.bestScoreByMap }
  };

  if (match.mode === 'classic') {
    updatedStats.classicGamesPlayed += 1;
    result.previousModeBest = currentStats.bestClassicScore;

    const score = match.score ?? 0;
    if (score > 0 && score > currentStats.bestClassicScore) {
      updatedStats.bestClassicScore = score;
      result.isNewModeBest = true;
    }
    if (score > 0 && score > currentStats.bestOverallScore) {
      updatedStats.bestOverallScore = score;
      result.isNewBestOverall = true;
    }

    if (match.mapId) {
      const prevMapBest = currentStats.bestScoreByMap[match.mapId] || 0;
      result.previousMapBest = prevMapBest;
      if (score > 0 && score > prevMapBest) {
        updatedStats.bestScoreByMap[match.mapId] = score;
        result.isNewMapBest = true;
      }
    }
  } else if (match.mode === 'time_attack') {
    updatedStats.timeAttackGamesPlayed += 1;
    result.previousModeBest = currentStats.bestTimeAttackScore;

    const score = match.score ?? 0;
    if (score > 0 && score > currentStats.bestTimeAttackScore) {
      updatedStats.bestTimeAttackScore = score;
      result.isNewModeBest = true;
    }
    if (score > 0 && score > currentStats.bestOverallScore) {
      updatedStats.bestOverallScore = score;
      result.isNewBestOverall = true;
    }

    if (match.mapId) {
      const prevMapBest = currentStats.bestScoreByMap[match.mapId] || 0;
      result.previousMapBest = prevMapBest;
      if (score > 0 && score > prevMapBest) {
        updatedStats.bestScoreByMap[match.mapId] = score;
        result.isNewMapBest = true;
      }
    }
  } else if (match.mode === 'country_streak') {
    updatedStats.countryStreakGamesPlayed += 1;
    result.previousStreakBest = currentStats.longestCountryStreak;

    const streak = match.streak ?? 0;
    if (streak > 0 && streak > currentStats.longestCountryStreak) {
      updatedStats.longestCountryStreak = streak;
      result.isNewStreakBest = true;
    }
  } else if (match.mode === 'duels') {
    updatedStats.duelsGamesPlayed += 1;
    if (match.duelWon) {
      updatedStats.duelsWins += 1;
    } else if (match.duelLost) {
      updatedStats.duelsLosses += 1;
    }
  }

  // Save changes
  savePlayerStats(updatedStats);
  markMatchRecorded(match.matchId);

  result.currentStats = updatedStats;
  return result;
}

/**
 * Resets player statistics (primarily for testing and debug resets).
 */
export function resetPlayerStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_STATS);
    localStorage.removeItem(STORAGE_KEY_RECORDED_MATCHES);
  } catch {
    // fallback
  }
}
