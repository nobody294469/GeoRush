import 'dotenv/config';
import { CandidateSeed, TargetResolutionResult } from '../src/shared/types/multiplayer';

export interface ServerResolverOptions {
  apiKey?: string;
  mockMode?: boolean;
  radiusMeters?: number;
  timeoutMs?: number;
}

export function isDummyKey(key: string): boolean {
  if (!key) return true;
  const k = key.trim();
  const lower = k.toLowerCase();

  // Obvious generic human placeholders
  if (
    lower.includes('your_api_key') ||
    lower.includes('my_api_key') ||
    lower.includes('placeholder') ||
    lower.includes('dummy') ||
    lower.includes('fake') ||
    lower === 'undefined' ||
    lower === 'null' ||
    lower === 'none'
  ) {
    return true;
  }

  // Basic structural sanity check for Google Maps API keys:
  // Legitimate Google API keys start with 'AIzaSy'
  if (!k.startsWith('AIzaSy')) {
    return true;
  }

  // Reject absurdly short or obviously malformed keys
  if (k.length < 20) {
    return true;
  }

  return false;
}

/**
 * Resolves nearest Street View panorama on the server using Google Maps Street View Metadata REST API.
 * Falls back to MOCK mode if configured or if no valid API key is provided.
 */
export async function resolveCandidateOnServer(
  candidateSeed: CandidateSeed,
  options: ServerResolverOptions = {}
): Promise<TargetResolutionResult> {
  const apiKey =
    options.apiKey ||
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    '';

  const isMockEnv =
    options.mockMode === true ||
    process.env.VITE_MOCK_STREETVIEW === 'true' ||
    !apiKey ||
    isDummyKey(apiKey);

  // In MOCK mode or if no valid API key is configured, return instant mock resolution
  if (isMockEnv) {
    return {
      roundIndex: 0,
      candidateId: candidateSeed.candidateId,
      apiMode: 'MOCK',
      panoId: `mock_pano_${candidateSeed.candidateId}`,
      resolvedLat: candidateSeed.latitude,
      resolvedLng: candidateSeed.longitude,
      country: candidateSeed.country,
      countryCode: candidateSeed.countryCode,
      locationName: candidateSeed.locationName || candidateSeed.country,
      heading: candidateSeed.heading || 0,
      pitch: candidateSeed.pitch || 0,
      failed: false
    };
  }

  const radius = options.radiusMeters || 50;
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${candidateSeed.latitude},${candidateSeed.longitude}&radius=${radius}&source=outdoor&key=${apiKey}`;

  const timeoutMs = options.timeoutMs || 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        roundIndex: 0,
        candidateId: candidateSeed.candidateId,
        apiMode: 'REAL',
        failed: true,
        error: `HTTP Error ${res.status}: ${res.statusText}`
      };
    }

    const data = await res.json();

    if (data.status === 'OK' && data.pano_id) {
      const snappedLat = typeof data.location?.lat === 'number' ? data.location.lat : candidateSeed.latitude;
      const snappedLng = typeof data.location?.lng === 'number' ? data.location.lng : candidateSeed.longitude;

      return {
        roundIndex: 0,
        candidateId: candidateSeed.candidateId,
        apiMode: 'REAL',
        panoId: data.pano_id,
        resolvedLat: snappedLat,
        resolvedLng: snappedLng,
        country: candidateSeed.country,
        countryCode: candidateSeed.countryCode,
        locationName: candidateSeed.locationName || candidateSeed.country,
        heading: candidateSeed.heading || 0,
        pitch: candidateSeed.pitch || 0,
        failed: false
      };
    } else if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT' || data.status === 'INVALID_REQUEST') {
      // If the API key is not authorized for Street View Metadata API or quota exceeded,
      // fallback gracefully to MOCK mode so the game session can continue uninterrupted.
      return {
        roundIndex: 0,
        candidateId: candidateSeed.candidateId,
        apiMode: 'MOCK',
        panoId: `mock_pano_${candidateSeed.candidateId}`,
        resolvedLat: candidateSeed.latitude,
        resolvedLng: candidateSeed.longitude,
        country: candidateSeed.country,
        countryCode: candidateSeed.countryCode,
        locationName: candidateSeed.locationName || candidateSeed.country,
        heading: candidateSeed.heading || 0,
        pitch: candidateSeed.pitch || 0,
        failed: false
      };
    } else {
      return {
        roundIndex: 0,
        candidateId: candidateSeed.candidateId,
        apiMode: 'REAL',
        failed: true,
        error: data.status || 'ZERO_RESULTS'
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      roundIndex: 0,
      candidateId: candidateSeed.candidateId,
      apiMode: 'REAL',
      failed: true,
      error: err.name === 'AbortError' ? 'Resolution request timed out' : (err.message || 'Network error')
    };
  }
}
