/**
 * GeoRush — Asynchronous Challenge & Duel Link Manager
 */

export interface ChallengeDuelData {
  seed: string;
  challengerName: string;
  challengerScore: number;
  mapId: string;
  gameMode: 'normal' | 'pro';
  modeId: 'classic' | 'time_attack';
  timeLimit: number;
  maxRounds: number;
  roundScores?: number[];
  createdAt: number;
}

const CHALLENGE_STORAGE_PREFIX = 'georush_challenge_';

/**
 * Creates a deterministic Mulberry32 pseudo-random number generator for an arbitrary seed string.
 */
export function createSeedPrng(seedStr: string): () => number {
  let hash = 0;
  const str = `georush_seed_${seedStr}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  let s = Math.abs(hash) || 987654321;

  return function() {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a unique 6-character challenge seed ID.
 */
export function generateChallengeSeed(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'EXP-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a shareable URL containing the challenge duel parameters.
 */
export function generateChallengeUrl(challenge: ChallengeDuelData): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set('challenge', challenge.seed);
  params.set('c_name', encodeURIComponent(challenge.challengerName));
  params.set('c_score', challenge.challengerScore.toString());
  params.set('c_map', challenge.mapId);
  params.set('c_mode', challenge.gameMode);
  params.set('c_type', challenge.modeId);
  params.set('c_time', challenge.timeLimit.toString());
  params.set('c_rounds', challenge.maxRounds.toString());

  if (challenge.roundScores && challenge.roundScores.length > 0) {
    params.set('c_rounds_scores', challenge.roundScores.join(','));
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Parses challenge data from current window URL search parameters.
 */
export function parseChallengeFromUrl(): ChallengeDuelData | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const challengeSeed = params.get('challenge') || params.get('seed');

    if (!challengeSeed) return null;

    const challengerName = params.get('c_name') ? decodeURIComponent(params.get('c_name')!) : 'Anonymous Explorer';
    const challengerScore = parseInt(params.get('c_score') || '0', 10);
    const mapId = params.get('c_map') || 'world';
    const gameMode = (params.get('c_mode') === 'pro' ? 'pro' : 'normal') as 'normal' | 'pro';
    const modeId = (params.get('c_type') === 'time_attack' ? 'time_attack' : 'classic') as 'classic' | 'time_attack';
    const timeLimit = parseInt(params.get('c_time') || '0', 10);
    const maxRounds = parseInt(params.get('c_rounds') || '5', 10);

    const roundScoresParam = params.get('c_rounds_scores');
    const roundScores = roundScoresParam ? roundScoresParam.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n)) : undefined;

    return {
      seed: challengeSeed.toUpperCase(),
      challengerName,
      challengerScore,
      mapId,
      gameMode,
      modeId,
      timeLimit,
      maxRounds,
      roundScores,
      createdAt: Date.now()
    };
  } catch (err) {
    console.error('Failed to parse challenge from URL:', err);
    return null;
  }
}

export const parseChallengeUrlParams = parseChallengeFromUrl;

/**
 * Saves challenge results locally for comparison.
 */
export function saveChallengeResult(seed: string, userScore: number): void {
  try {
    localStorage.setItem(`${CHALLENGE_STORAGE_PREFIX}${seed}`, JSON.stringify({
      userScore,
      completedAt: Date.now()
    }));
  } catch {
    // Ignore storage issues
  }
}

/**
 * Clears challenge URL parameters from browser address bar without triggering a reload.
 */
export function clearChallengeUrlParams(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('challenge');
    url.searchParams.delete('seed');
    url.searchParams.delete('c_name');
    url.searchParams.delete('c_score');
    url.searchParams.delete('c_map');
    url.searchParams.delete('c_mode');
    url.searchParams.delete('c_type');
    url.searchParams.delete('c_time');
    url.searchParams.delete('c_rounds');
    url.searchParams.delete('c_rounds_scores');
    window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
  } catch {
    // Ignore
  }
}
