/**
 * GeoRush — Daily Challenge System
 * 
 * Provides:
 * - Deterministic daily seed generator (same 5 locations worldwide for every player on that day)
 * - Daily challenge rules: 2-minute (120s) timer per round, World map lock, 5 rounds
 * - Daily streak tracking and history storage
 */

export const STORAGE_KEY_DAILY = 'georush_daily_challenge_data';

export interface DailyChallengeRecord {
  date: string; // "YYYY-MM-DD"
  score: number;
  maxScore: number;
  completedAt: number;
  roundScores: number[];
}

export interface DailyChallengeStorage {
  version: number;
  currentStreak: number;
  maxStreak: number;
  lastCompletedDate: string | null;
  history: Record<string, DailyChallengeRecord>;
}

export const DEFAULT_DAILY_STORAGE: DailyChallengeStorage = {
  version: 1,
  currentStreak: 0,
  maxStreak: 0,
  lastCompletedDate: null,
  history: {}
};

/**
 * Returns date in YYYY-MM-DD format based on local time.
 */
export function getDailyDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date in YYYY-MM-DD format.
 */
export function getYesterdayDateString(date: Date = new Date()): string {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getDailyDateString(yesterday);
}

/**
 * Formats a YYYY-MM-DD string nicely for display, e.g. "Aug 28, 2026".
 */
export function formatDailyDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Hashes date string to a 32-bit positive integer seed.
 */
export function getDailySeedNumber(dateStr: string): number {
  let hash = 0;
  const str = `georush_daily_seed_${dateStr}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Creates a deterministic Mulberry32 pseudo-random number generator for the given date.
 */
export function createDailyPrng(dateStr: string = getDailyDateString()): () => number {
  const seed = getDailySeedNumber(dateStr);
  let s = seed || 123456789;
  return function() {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Loads daily challenge storage from localStorage.
 */
export function getDailyChallengeStorage(): DailyChallengeStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_DAILY_STORAGE,
          ...parsed,
          history: parsed.history || {}
        };
      }
    }
  } catch {
    // Fallback if localStorage disabled or corrupted
  }
  return { ...DEFAULT_DAILY_STORAGE };
}

/**
 * Saves daily challenge storage to localStorage.
 */
export function saveDailyChallengeStorage(data: DailyChallengeStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or disabled
  }
}

export interface DailyChallengeInfo {
  dateStr: string;
  formattedDate: string;
  isCompletedToday: boolean;
  todayRecord: DailyChallengeRecord | null;
  currentStreak: number;
  maxStreak: number;
  totalCompleted: number;
}

/**
 * Computes status and current active streak for today's challenge.
 */
export function getDailyChallengeInfo(date: Date = new Date()): DailyChallengeInfo {
  const storage = getDailyChallengeStorage();
  const dateStr = getDailyDateString(date);
  const yesterdayStr = getYesterdayDateString(date);
  const todayRecord = storage.history[dateStr] || null;
  const isCompletedToday = Boolean(todayRecord);

  // Active streak is maintained if completed today or yesterday
  let activeStreak = storage.currentStreak;
  if (storage.lastCompletedDate !== dateStr && storage.lastCompletedDate !== yesterdayStr) {
    activeStreak = 0;
  }

  return {
    dateStr,
    formattedDate: formatDailyDate(dateStr),
    isCompletedToday,
    todayRecord,
    currentStreak: activeStreak,
    maxStreak: storage.maxStreak,
    totalCompleted: Object.keys(storage.history).length
  };
}

/**
 * Records a completed daily challenge and updates streak.
 */
export function recordDailyChallengeCompletion(
  score: number,
  roundScores: number[],
  date: Date = new Date()
): { info: DailyChallengeInfo; isNewDailyBest: boolean } {
  const storage = getDailyChallengeStorage();
  const dateStr = getDailyDateString(date);
  const yesterdayStr = getYesterdayDateString(date);
  const alreadyRecorded = Boolean(storage.history[dateStr]);

  let isNewDailyBest = false;
  let newCurrentStreak = storage.currentStreak;

  if (!alreadyRecorded) {
    if (storage.lastCompletedDate === yesterdayStr) {
      newCurrentStreak = storage.currentStreak + 1;
    } else {
      newCurrentStreak = 1;
    }
  }

  const newMaxStreak = Math.max(storage.maxStreak, newCurrentStreak);

  // Check if score is best among completed dailies
  const previousBestScore = Object.values(storage.history).reduce((max, rec) => Math.max(max, rec.score), 0);
  if (score > previousBestScore) {
    isNewDailyBest = true;
  }

  const record: DailyChallengeRecord = {
    date: dateStr,
    score,
    maxScore: 25000,
    completedAt: Date.now(),
    roundScores
  };

  storage.currentStreak = newCurrentStreak;
  storage.maxStreak = newMaxStreak;
  storage.lastCompletedDate = dateStr;
  storage.history[dateStr] = record;

  saveDailyChallengeStorage(storage);

  return {
    info: {
      dateStr,
      formattedDate: formatDailyDate(dateStr),
      isCompletedToday: true,
      todayRecord: record,
      currentStreak: newCurrentStreak,
      maxStreak: newMaxStreak,
      totalCompleted: Object.keys(storage.history).length
    },
    isNewDailyBest
  };
}

/**
 * Calculates remaining milliseconds until next midnight (12:00 AM night local time).
 */
export function getMsUntilNextMidnight(now: Date = new Date()): number {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(0, nextMidnight.getTime() - now.getTime());
}

/**
 * Formats milliseconds into "HH:MM:SS" or "Xh Ym Zs".
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}
