import { TelemetryData } from '../types/game';

type TelemetryListener = (data: TelemetryData) => void;

/**
 * Basic structural validation for Google Maps API keys:
 * - Must be a non-empty string of reasonable length (>= 20 chars)
 * - Standard Google API keys start with 'AIzaSy'
 * - Not a generic placeholder
 */
export function isUsableGoogleMapsKey(key?: string | null): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 20) return false;
  if (!trimmed.startsWith('AIzaSy')) return false;

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('placeholder') ||
    lower.includes('your_api_key') ||
    lower.includes('dummy') ||
    lower.includes('fake')
  ) {
    return false;
  }

  return true;
}

/**
 * Determines the initial API mode automatically from the environment.
 * 
 * Rules:
 * 1. If VITE_MOCK_STREETVIEW === 'true' -> 'MOCK'
 * 2. If no usable Google Maps API key is present -> 'MOCK'
 * 3. Otherwise -> 'REAL'
 */
export function getInitialApiMode(
  customApiKey?: string,
  customMockEnv?: string
): 'REAL' | 'MOCK' {
  let apiKey: string = '';
  if (customApiKey !== undefined) {
    apiKey = customApiKey;
  } else {
    try {
      apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
    } catch {
      apiKey = '';
    }
    if (!apiKey && typeof process !== 'undefined' && process.env) {
      apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    }
  }

  let mockEnv: string = '';
  if (customMockEnv !== undefined) {
    mockEnv = customMockEnv;
  } else {
    try {
      mockEnv = (import.meta as any).env?.VITE_MOCK_STREETVIEW || '';
    } catch {
      mockEnv = '';
    }
    if (!mockEnv && typeof process !== 'undefined' && process.env) {
      mockEnv = process.env.VITE_MOCK_STREETVIEW || '';
    }
  }

  if (mockEnv === 'true') {
    return 'MOCK';
  }

  if (!isUsableGoogleMapsKey(apiKey)) {
    return 'MOCK';
  }

  return 'REAL';
}

class DevelopmentTelemetryStore {
  private data: TelemetryData = {
    apiMode: getInitialApiMode(),
    mapsJsInits: 0,
    panoramaInstances: 0,
    mapInstances: 0,
    setPanoCalls: 0,
    setPositionCalls: 0,
    streetViewServiceRequests: 0,
    quotaSafetyLimit: 200,
    quotaUsed: 0,
    sessionDurationSeconds: 0,
    currentPanoId: 'mock-shibuya-01',
    currentLatLng: { lat: 35.6595, lng: 139.7004 }
  };

  private listeners: Set<TelemetryListener> = new Set();
  private timer: number | null = null;
  private logs: { timestamp: string; event: string; detail?: string }[] = [];

  constructor() {
    this.addLog(`Telemetry Initialized in ${this.data.apiMode} Mode`);
    if (typeof window !== 'undefined') {
      this.timer = window.setInterval(() => {
        this.data.sessionDurationSeconds += 1;
        this.notify();
      }, 1000);
    }
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): TelemetryData {
    return { ...this.data };
  }

  public getLogs() {
    return [...this.logs];
  }

  public trackMapsJsInit() {
    this.data.mapsJsInits += 1;
    this.addLog('Google Maps JS API Script Loaded');
    this.notify();
  }

  public trackPanoramaInstance() {
    this.data.panoramaInstances += 1;
    this.addLog('StreetViewPanorama Instance Created');
    this.notify();
  }

  public trackMapInstance() {
    this.data.mapInstances += 1;
    this.addLog('google.maps.Map Instance Created');
    this.notify();
  }

  public trackRealApiLoad(description: string) {
    if (this.data.apiMode === 'REAL') {
      this.data.quotaUsed += 1;
      this.addLog(`Real API Load Triggered (${description})`, `Estimated Quota Used: ${this.data.quotaUsed}/200`);
      this.notify();
    }
  }

  public trackSetPano(panoId: string) {
    this.data.setPanoCalls += 1;
    this.data.currentPanoId = panoId;
    this.addLog('setPano() called', `PanoID: ${panoId}`);
    this.notify();
  }

  public trackSetPosition(lat: number, lng: number) {
    this.data.setPositionCalls += 1;
    this.data.currentLatLng = { lat, lng };
    this.addLog('setPosition() called', `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    this.notify();
  }

  public trackServiceRequest(type: string) {
    this.data.streetViewServiceRequests += 1;
    this.addLog(`StreetViewService Request (${type})`);
    this.notify();
  }

  public trackError(description: string) {
    this.addLog(`StreetView Error: ${description}`);
    this.notify();
  }

  public setApiMode(mode: 'MOCK' | 'REAL') {
    this.data.apiMode = mode;
    this.addLog(`API Mode set to ${mode}`);
    this.notify();
  }

  private addLog(event: string, detail?: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.unshift({ timestamp, event, detail });
    if (this.logs.length > 50) this.logs.pop();
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.getSnapshot()));
  }
}

export const devTelemetry = new DevelopmentTelemetryStore();
