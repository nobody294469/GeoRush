import { CandidateLocation, Location } from '../types/game';
import { loadGoogleMapsApi } from './googleMapsLoader';
import { devTelemetry } from './telemetry';

/**
 * PHASE 2B: Street View Resolution Engine
 * 
 * Performs runtime resolution using StreetViewService with strict official outdoor filters.
 * 
 * Resolution Request:
 * - sources: [GOOGLE, OUTDOOR] (Intersection of official Google collection and outdoor)
 * - preference: NEAREST
 * - radius: 50m
 * 
 * Crucially, when StreetViewService returns a valid panorama, the actual `location.latLng`
 * returned by the API is set as the canonical target coordinate for the round.
 */
export async function resolveCandidateLocation(
  candidate: CandidateLocation,
  apiKey: string,
  apiMode: 'MOCK' | 'REAL'
): Promise<Location | null> {
  // 1. MOCK Mode Resolution
  if (apiMode === 'MOCK' || !apiKey) {
    return convertCandidateToLocation(candidate, candidate.latitude, candidate.longitude);
  }

  // 2. REAL API Mode Resolution via StreetViewService
  try {
    const google = await loadGoogleMapsApi(apiKey);
    const service = new google.maps.StreetViewService();

    devTelemetry.trackServiceRequest('StreetViewService.getPanorama');

    return new Promise<Location | null>((resolve) => {
      service.getPanorama(
        {
          location: { lat: candidate.latitude, lng: candidate.longitude },
          radius: 50,
          preference: google.maps.StreetViewPreference.NEAREST,
          sources: [
            google.maps.StreetViewSource.GOOGLE,
            google.maps.StreetViewSource.OUTDOOR
          ]
        },
        (data, status) => {
          if (
            status === google.maps.StreetViewStatus.OK &&
            data &&
            data.location &&
            data.location.latLng
          ) {
            const actualLat = data.location.latLng.lat();
            const actualLng = data.location.latLng.lng();
            const panoId = data.location.pano || '';

            devTelemetry.trackRealApiLoad('StreetViewService Resolution Success');

            const resolvedLocation = convertCandidateToLocation(
              candidate,
              actualLat,
              actualLng,
              panoId,
              data.location.description || undefined
            );

            resolve(resolvedLocation);
          } else {
            console.warn(
              `StreetViewService lookup failed for candidate ${candidate.id} (${candidate.country}) with status: ${status}`
            );
            // Signal lookup failure so caller can pick a fallback candidate
            resolve(null);
          }
        }
      );
    });
  } catch (err) {
    console.error('Failed to initialize Google Maps StreetViewService:', err);
    return null;
  }
}

/**
 * Helper to convert CandidateLocation + resolved coordinates into full game Location object.
 */
function convertCandidateToLocation(
  candidate: CandidateLocation,
  actualLat: number,
  actualLng: number,
  panoId?: string,
  streetDescription?: string
): Location {
  const nodeId = `${candidate.id}-node-1`;

  return {
    id: candidate.id,
    candidateId: candidate.id,
    panoId,
    name: streetDescription || `${candidate.environment.toUpperCase()} • ${candidate.country}`,
    city: candidate.region,
    country: candidate.country,
    countryCode: candidate.countryCode,
    continent: candidate.continent,
    environment: candidate.environment,
    lat: actualLat,          // Actual resolved coordinate used for scoring
    lng: actualLng,          // Actual resolved coordinate used for scoring
    originalLat: candidate.latitude,
    originalLng: candidate.longitude,
    heading: 0,
    pitch: 0,
    zoom: 1,
    description: `Location in ${candidate.region}, ${candidate.country} (${candidate.environment} environment).`,
    hints: [
      `Continent: ${candidate.continent}`,
      `Environment: ${candidate.environment}`,
      `Difficulty: ${candidate.difficulty}`
    ],
    initialNodeId: nodeId,
    nodes: {
      [nodeId]: {
        id: nodeId,
        lat: actualLat,
        lng: actualLng,
        heading: 0,
        pitch: 0,
        description: streetDescription || candidate.country,
        connectedNodeIds: []
      }
    }
  };
}
