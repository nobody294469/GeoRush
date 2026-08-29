/**
 * GeoRush — Lightweight Game Audio System (Web Audio API)
 * 
 * Browser-native, zero-dependency synthesizer engine for subtle UI, gameplay,
 * and ambient exploration soundscapes.
 * - Granular preferences (Master sound, UI sound effects, and Background ambient audio)
 * - Volume controls (SFX volume & Ambient volume)
 * - Safe lazy AudioContext with graceful degradation (never throws uncaught errors)
 * - Procedural ambient atmospheric generator (Tranquil, Alpine Breeze, Cosmic Orbit)
 * - Zero external asset downloads
 */

export type SoundEffectType =
  | 'pin'        // Short, quiet confirmation click/tone on pin placement
  | 'submit'     // Pleasant harmonious confirmation sound on guess submission
  | 'countdown'  // Subtle rhythmic tick during final countdown seconds (<= 5s)
  | 'score'      // Ascending score reveal progression
  | 'excellent'  // Sparkling positive chime for high/master tier scores (>= 4000 pts)
  | 'victory'    // Rewarding fanfare progression for game/match completion
  | 'click';     // Crisp tactile button click for UI interactions

export type AmbientPreset = 'tranquil' | 'breeze' | 'cosmic';

export interface AudioSettings {
  masterEnabled: boolean;
  sfxEnabled: boolean;
  sfxVolume: number;        // 0.0 to 1.0
  ambientEnabled: boolean;
  ambientVolume: number;    // 0.0 to 1.0
  ambientPreset: AmbientPreset;
}

export const STORAGE_KEY_SOUND = 'geoworld_sound_enabled';
export const STORAGE_KEY_SFX = 'geoworld_sfx_enabled';
export const STORAGE_KEY_SFX_VOL = 'geoworld_sfx_volume';
export const STORAGE_KEY_AMBIENT = 'geoworld_ambient_enabled';
export const STORAGE_KEY_AMBIENT_VOL = 'geoworld_ambient_volume';
export const STORAGE_KEY_AMBIENT_PRESET = 'geoworld_ambient_preset';

export const SOUND_CHANGE_EVENT = 'geoworld_sound_changed';

let cachedAudioCtx: AudioContext | null = null;
let lastTickedSecond: number | null = null;

// Ambient procedural nodes management
let ambientGainNode: GainNode | null = null;
let ambientOscillators: (OscillatorNode | AudioBufferSourceNode)[] = [];
let ambientLFOs: OscillatorNode[] = [];
let isAmbientPlaying = false;

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
 * Checks if master sound is currently enabled.
 * Defaults to true.
 */
export function isSoundEnabled(): boolean {
  const storage = getStorage();
  if (!storage) return true;
  try {
    const val = storage.getItem(STORAGE_KEY_SOUND);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Checks if UI Sound Effects are enabled.
 * Defaults to true.
 */
export function isSfxEnabled(): boolean {
  const storage = getStorage();
  if (!storage) return true;
  try {
    const val = storage.getItem(STORAGE_KEY_SFX);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Gets SFX volume (0.0 to 1.0). Defaults to 0.8.
 */
export function getSfxVolume(): number {
  const storage = getStorage();
  if (!storage) return 0.8;
  try {
    const val = storage.getItem(STORAGE_KEY_SFX_VOL);
    if (val === null) return 0.8;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0.8 : Math.max(0, Math.min(1, parsed));
  } catch {
    return 0.8;
  }
}

/**
 * Checks if Background Ambient Audio is enabled.
 * Defaults to false for peaceful opt-in exploration.
 */
export function isAmbientEnabled(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const val = storage.getItem(STORAGE_KEY_AMBIENT);
    if (val === null) return false;
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Gets Ambient volume (0.0 to 1.0). Defaults to 0.4.
 */
export function getAmbientVolume(): number {
  const storage = getStorage();
  if (!storage) return 0.4;
  try {
    const val = storage.getItem(STORAGE_KEY_AMBIENT_VOL);
    if (val === null) return 0.4;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0.4 : Math.max(0, Math.min(1, parsed));
  } catch {
    return 0.4;
  }
}

/**
 * Gets current Ambient theme preset. Defaults to 'tranquil'.
 */
export function getAmbientPreset(): AmbientPreset {
  const storage = getStorage();
  if (!storage) return 'tranquil';
  try {
    const val = storage.getItem(STORAGE_KEY_AMBIENT_PRESET);
    if (val === 'breeze' || val === 'cosmic' || val === 'tranquil') {
      return val;
    }
    return 'tranquil';
  } catch {
    return 'tranquil';
  }
}

/**
 * Returns current snapshot of all audio settings.
 */
export function getAudioSettings(): AudioSettings {
  return {
    masterEnabled: isSoundEnabled(),
    sfxEnabled: isSfxEnabled(),
    sfxVolume: getSfxVolume(),
    ambientEnabled: isAmbientEnabled(),
    ambientVolume: getAmbientVolume(),
    ambientPreset: getAmbientPreset(),
  };
}

function broadcastAudioChange(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(
        new CustomEvent(SOUND_CHANGE_EVENT, { detail: getAudioSettings() })
      );
    } catch {
      // Safe fallback
    }
  }
}

/**
 * Updates master sound switch.
 */
export function setSoundEnabled(enabled: boolean): boolean {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY_SOUND, enabled ? 'true' : 'false');
    } catch {
      // Safe fallback
    }
  }
  updateAmbientPlayback();
  broadcastAudioChange();
  return enabled;
}

/**
 * Updates UI SFX switch.
 */
export function setSfxEnabled(enabled: boolean): boolean {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY_SFX, enabled ? 'true' : 'false');
    } catch {
      // Safe fallback
    }
  }
  broadcastAudioChange();
  return enabled;
}

/**
 * Updates UI SFX volume (0.0 to 1.0).
 */
export function setSfxVolume(volume: number): number {
  const clamped = Math.max(0, Math.min(1, volume));
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY_SFX_VOL, clamped.toFixed(2));
    } catch {
      // Safe fallback
    }
  }
  broadcastAudioChange();
  return clamped;
}

/**
 * Updates background ambient switch.
 */
export function setAmbientEnabled(enabled: boolean): boolean {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY_AMBIENT, enabled ? 'true' : 'false');
    } catch {
      // Safe fallback
    }
  }
  updateAmbientPlayback();
  broadcastAudioChange();
  return enabled;
}

/**
 * Updates background ambient volume (0.0 to 1.0).
 */
export function setAmbientVolume(volume: number): number {
  const clamped = Math.max(0, Math.min(1, volume));
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY_AMBIENT_VOL, clamped.toFixed(2));
    } catch {
      // Safe fallback
    }
  }
  if (ambientGainNode && cachedAudioCtx && isAmbientPlaying) {
    const now = cachedAudioCtx.currentTime;
    ambientGainNode.gain.cancelScheduledValues(now);
    ambientGainNode.gain.linearRampToValueAtTime(clamped * 0.15, now + 0.1);
  }
  broadcastAudioChange();
  return clamped;
}

/**
 * Updates ambient preset theme.
 */
export function setAmbientPreset(preset: AmbientPreset): AmbientPreset {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY_AMBIENT_PRESET, preset);
    } catch {
      // Safe fallback
    }
  }
  if (isAmbientPlaying) {
    stopAmbientSoundscape();
    startAmbientSoundscape();
  }
  broadcastAudioChange();
  return preset;
}

/**
 * Toggles master sound setting and returns the new value.
 */
export function toggleSound(): boolean {
  const current = isSoundEnabled();
  return setSoundEnabled(!current);
}

/**
 * Toggles ambient sound setting and returns the new value.
 */
export function toggleAmbient(): boolean {
  const current = isAmbientEnabled();
  return setAmbientEnabled(!current);
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
        // Autoplay policy may suspend until user interaction; fail silently
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
export function playSound(type: SoundEffectType, forceOverride = false): void {
  if (!forceOverride) {
    if (!isSoundEnabled() || !isSfxEnabled()) return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const volumeMultiplier = getSfxVolume();

    switch (type) {
      case 'click': {
        // Crisp tactile UI navigation tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.025);

        gain.gain.setValueAtTime(0.04 * volumeMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }

      case 'pin': {
        // Pin placement: Subtle, soft 45ms tactile pitch drop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.045);

        gain.gain.setValueAtTime(0.08 * volumeMultiplier, now);
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

          gain.gain.setValueAtTime(0.10 * volumeMultiplier, now + idx * 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.14);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.02);
          osc.stop(now + idx * 0.02 + 0.15);
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

        gain.gain.setValueAtTime(0.07 * volumeMultiplier, now);
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

          gain.gain.setValueAtTime(0.09 * volumeMultiplier, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.20);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.21);
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

          gain.gain.setValueAtTime(0.09 * volumeMultiplier, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(start);
          osc.stop(start + 0.40);
        });
        break;
      }

      case 'victory': {
        // Match victory / Game completion: Triumphant fanfare progression
        const notes = [
          { freq: 392.00, start: 0, dur: 0.14 },    // G4
          { freq: 523.25, start: 0.12, dur: 0.16 }, // C5
          { freq: 659.25, start: 0.26, dur: 0.18 }, // E5
          { freq: 783.99, start: 0.42, dur: 0.45 }  // G5 (sustained)
        ];

        notes.forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteTime = now + start;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.11 * volumeMultiplier, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + dur + 0.03);
        });
        break;
      }
    }
  } catch {
    // Fail gracefully without throwing errors
  }
}

/**
 * Ambient Procedural Soundscape Generator
 */
export function startAmbientSoundscape(): void {
  if (isAmbientPlaying) return;
  if (!isSoundEnabled() || !isAmbientEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const preset = getAmbientPreset();
    const targetVolume = getAmbientVolume() * 0.15;
    const now = ctx.currentTime;

    // Master ambient gain node with smooth fade in
    ambientGainNode = ctx.createGain();
    ambientGainNode.gain.setValueAtTime(0.001, now);
    ambientGainNode.gain.linearRampToValueAtTime(targetVolume, now + 1.2);
    ambientGainNode.connect(ctx.destination);

    ambientOscillators = [];
    ambientLFOs = [];

    if (preset === 'breeze') {
      // Alpine Breeze: Calming soft filtered white/pink noise wind with sweeping resonance
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);

      // Gentle LFO sweeping the breeze frequency
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.18, now); // ~5.5s cycle
      lfoGain.gain.setValueAtTime(140, now);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      whiteNoise.connect(filter);
      filter.connect(ambientGainNode);

      whiteNoise.start(now);
      lfo.start(now);

      ambientOscillators.push(whiteNoise);
      ambientLFOs.push(lfo);
    } else if (preset === 'cosmic') {
      // Cosmic Orbit: Deep tranquil spatial drone with subtle sub-harmonics
      const chordFrequencies = [73.42, 110.00, 164.81, 220.00]; // D2, A2, E3, A3
      chordFrequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320 + idx * 80, now);

        // Slow individual note vibrato
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.08 + idx * 0.03, now);
        lfoGain.gain.setValueAtTime(1.5, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        noteGain.gain.setValueAtTime(0.22 / chordFrequencies.length, now);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(ambientGainNode!);

        osc.start(now);
        lfo.start(now);

        ambientOscillators.push(osc);
        ambientLFOs.push(lfo);
      });
    } else {
      // Tranquil Horizon (Default): Warm harmonic exploration pad (F major / D minor warm chord)
      const frequencies = [146.83, 174.61, 220.00, 261.63]; // D3, F3, A3, C4
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, now);

        // Subtly detuned chorusing
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.12 + idx * 0.04, now);
        lfoGain.gain.setValueAtTime(0.8, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        noteGain.gain.setValueAtTime(0.24 / frequencies.length, now);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(ambientGainNode!);

        osc.start(now);
        lfo.start(now);

        ambientOscillators.push(osc);
        ambientLFOs.push(lfo);
      });
    }

    isAmbientPlaying = true;
  } catch {
    // Fail gracefully
    isAmbientPlaying = false;
  }
}

export function stopAmbientSoundscape(): void {
  if (!isAmbientPlaying || !ambientGainNode || !cachedAudioCtx) {
    isAmbientPlaying = false;
    return;
  }

  try {
    const ctx = cachedAudioCtx;
    const now = ctx.currentTime;

    // Smooth fade out to prevent clicks
    ambientGainNode.gain.cancelScheduledValues(now);
    ambientGainNode.gain.linearRampToValueAtTime(0.001, now + 0.6);

    setTimeout(() => {
      ambientOscillators.forEach((node) => {
        try {
          node.stop();
          node.disconnect();
        } catch {
          // Ignored
        }
      });
      ambientLFOs.forEach((lfo) => {
        try {
          lfo.stop();
          lfo.disconnect();
        } catch {
          // Ignored
        }
      });
      if (ambientGainNode) {
        try {
          ambientGainNode.disconnect();
        } catch {
          // Ignored
        }
        ambientGainNode = null;
      }
      ambientOscillators = [];
      ambientLFOs = [];
      isAmbientPlaying = false;
    }, 650);
  } catch {
    isAmbientPlaying = false;
  }
}

/**
 * Updates ambient playback state based on master and ambient preferences.
 */
export function updateAmbientPlayback(): void {
  const shouldPlay = isSoundEnabled() && isAmbientEnabled();
  if (shouldPlay && !isAmbientPlaying) {
    startAmbientSoundscape();
  } else if (!shouldPlay && isAmbientPlaying) {
    stopAmbientSoundscape();
  }
}

/**
 * Checks if ambient audio is currently generating and playing.
 */
export function isAmbientCurrentlyPlaying(): boolean {
  return isAmbientPlaying;
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
