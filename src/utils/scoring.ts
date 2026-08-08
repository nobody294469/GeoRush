/**
 * Pure Geographic Distance and GeoGuessr-style Scoring Engine.
 * Independent of UI and external Map SDKs.
 */

const EARTH_RADIUS_KM = 6371.0088;
export const MAX_ROUND_SCORE = 5000;
export const PERFECT_SCORE_THRESHOLD_KM = 0.025; // 25 meters

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula.
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates GeoGuessr-style score using exponential decay calibrated for world maps.
 * 
 * @param distanceKm Distance between guess and target in kilometers
 * @param scaleFactor Scale factor determining point falloff rate (default 1491.6 km for World map)
 * @returns Score integer from 0 to 5000
 */
export function calculateGeoScore(
  distanceKm: number,
  scaleFactor: number = 1491.6
): number {
  if (distanceKm <= PERFECT_SCORE_THRESHOLD_KM) {
    return MAX_ROUND_SCORE;
  }

  // Exponential decay
  const rawScore = MAX_ROUND_SCORE * Math.exp(-distanceKm / scaleFactor);
  const roundedScore = Math.round(rawScore);

  return Math.max(0, Math.min(MAX_ROUND_SCORE, roundedScore));
}

/**
 * Formats distance into human-readable string (meters or kilometers)
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters.toLocaleString()} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Formats time in seconds to mm:ss format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Returns a performance rating message based on score
 */
export function getScoreRating(score: number): { title: string; color: string } {
  if (score === 5000) return { title: 'PERFECT!', color: 'text-emerald-400' };
  if (score >= 4800) return { title: 'Bullseye!', color: 'text-emerald-400' };
  if (score >= 4000) return { title: 'Outstanding!', color: 'text-teal-400' };
  if (score >= 3000) return { title: 'Great Guess!', color: 'text-blue-400' };
  if (score >= 1500) return { title: 'Decent Attempt', color: 'text-amber-400' };
  if (score >= 500) return { title: 'Wrong Region', color: 'text-orange-400' };
  return { title: 'Far Away', color: 'text-rose-400' };
}
