/**
 * GeoRush — Lightweight Game Audio System (Web Audio API)
 * 
 * Browser-native, zero-dependency synthesizer engine for subtle UI and gameplay audio feedback.
 * - Namespaced localStorage sound preference ('geoworld_sound_enabled')
 * - Safe lazy AudioContext with graceful degradation (never throws uncaught errors)
 * - Anti-duplication countdown tick guard for React re-renders
 * - Zero external asset downloads
 */

export type SoundEffectType =
  | 'pin'        // Short, quiet confirmation click/tone on pin placement
  | 'submit'     // Pleasant harmonious confirmation sound on guess submission
  | 'countdown'  // Subtle rhythmic tick during final countdown seconds (<= 5s)
  | 'score'      // Ascending score reveal progression
  | 'excellent'  // Sparkling positive chime for high/master tier scores (>= 4000 pts)
  | 'victory';   // Rewarding fanfare progression for game/match completion

export const STORAGE_KEY_SOUND = 'geoworld_sound_enabled';
export const SOUND_CHANGE_EVENT = 'geoworld_sound_changed';

let cachedAudioCtx: AudioContext | null = null;
let lastTickedSecond: number | null = null;

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

/**
 * Checks if sound is currently enabled in localStorage.
 * Defaults to true if no preference is stored.
 */
export function isSoundEnabled(): boolean {
  const storage = getStorage();
  if (!storage) {
    return true;
  }
  try {
    const val = storage.getItem(STORAGE_KEY_SOUND);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Updates the sound enabled preference and dispatches a change event.
 */
export function setSoundEnabled(enabled: boolean): boolean {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY_SOUND, enabled ? 'true' : 'false');
    } catch {
      // Ignore localStorage quotas / sandbox restrictions safely
    }
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new CustomEvent(SOUND_CHANGE_EVENT, { detail: { enabled } }));
    } catch {
      // Safe fallback
    }
  }
  return enabled;
}

/**
 * Toggles current sound setting and returns the new value.
 */
export function toggleSound(): boolean {
  const current = isSoundEnabled();
  return setSoundEnabled(!current);
}

/**
 * Lazily retrieves or initializes a shared AudioContext.
 * Returns null if Web Audio API is unsupported in the current environment.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!cachedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        cachedAudioCtx = new AudioCtxClass();
      }
    }

    if (cachedAudioCtx && cachedAudioCtx.state === 'suspended') {
      cachedAudioCtx.resume().catch(() => {
        // Autoplay policy may suspend until first user interaction; fail silently
      });
    }

    return cachedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Synthesizes and plays a requested sound effect safely.
 * Returns immediately without throwing if audio is disabled, blocked, or unavailable.
 */
export function playSound(type: SoundEffectType): void {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    switch (type) {
      case 'pin': {
        // Pin placement: Subtle, soft 45ms tactile pitch drop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.045);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }

      case 'submit': {
        // Guess submission: Crisp dual-tone confirmation chime (F#5 + C#6)
        const notes = [740, 1108];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.02);

          gain.gain.setValueAtTime(0.09, now + idx * 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.02);
          osc.stop(now + idx * 0.02 + 0.13);
        });
        break;
      }

      case 'countdown': {
        // Time Attack countdown: Soft, precise 30ms rhythmic tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.035);
        break;
      }

      case 'score': {
        // Score reveal: Gentle ascending 3-note arpeggio (C5 -> E5 -> G5)
        const arpeggio = [523.25, 659.25, 783.99];
        arpeggio.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + i * 0.06;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.08, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.19);
        });
        break;
      }

      case 'excellent': {
        // Master/High Score: Sparkling 4-tone chord with harmonic shimmer
        const chord = [523.25, 659.25, 783.99, 1046.5];
        chord.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + i * 0.04;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.08, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.36);
        });
        break;
      }

      case 'victory': {
        // Match victory / Game completion: Triumphant fanfare progression
        const notes = [
          { freq: 392.00, start: 0, dur: 0.12 },    // G4
          { freq: 523.25, start: 0.10, dur: 0.14 }, // C5
          { freq: 659.25, start: 0.22, dur: 0.16 }, // E5
          { freq: 783.99, start: 0.36, dur: 0.38 }  // G5 (sustained)
        ];

        notes.forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteTime = now + start;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.10, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + dur + 0.02);
        });
        break;
      }
    }
  } catch {
    // Fail gracefully without throwing errors
  }
}

/**
 * Plays the countdown tick once per discrete second to prevent duplicate ticks during React re-renders.
 */
export function playCountdownTick(secondsRemaining: number): void {
  if (secondsRemaining <= 0 || secondsRemaining > 5) return;
  const rounded = Math.ceil(secondsRemaining);
  if (lastTickedSecond === rounded) return;
  lastTickedSecond = rounded;
  playSound('countdown');
}

/**
 * Resets the countdown tick tracker when a round ends or unmounts.
 */
export function resetCountdownAudio(): void {
  lastTickedSecond = null;
}
