import { devTelemetry } from './telemetry';

let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMapsApi(apiKey: string): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps API can only be loaded in browser environment'));
  }

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.getElementById('google-maps-js-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      devTelemetry.trackMapsJsInit();
      if (window.google && window.google.maps) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps SDK loaded but google.maps is undefined'));
      }
    };

    script.onerror = (err) => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps JavaScript API script. Verify API key and restrictions.'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
