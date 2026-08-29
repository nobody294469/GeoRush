import { useState, useEffect, useCallback } from 'react';
import { 
  getAudioSettings,
  isSoundEnabled, 
  setSoundEnabled, 
  toggleSound, 
  isSfxEnabled,
  setSfxEnabled,
  getSfxVolume,
  setSfxVolume,
  isAmbientEnabled,
  setAmbientEnabled,
  toggleAmbient,
  getAmbientVolume,
  setAmbientVolume,
  getAmbientPreset,
  setAmbientPreset,
  isAmbientCurrentlyPlaying,
  playSound, 
  playCountdownTick, 
  resetCountdownAudio, 
  SoundEffectType, 
  AmbientPreset,
  AudioSettings,
  SOUND_CHANGE_EVENT 
} from '../utils/audioSystem';

export function useAudio() {
  const [settings, setSettings] = useState<AudioSettings>(() => getAudioSettings());
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(() => isAmbientCurrentlyPlaying());

  useEffect(() => {
    const handleSoundChange = (e: Event) => {
      const customEvent = e as CustomEvent<AudioSettings>;
      if (customEvent.detail && typeof customEvent.detail.masterEnabled === 'boolean') {
        setSettings(customEvent.detail);
      } else {
        setSettings(getAudioSettings());
      }
      setIsAmbientPlaying(isAmbientCurrentlyPlaying());
    };

    window.addEventListener(SOUND_CHANGE_EVENT, handleSoundChange);
    return () => {
      window.removeEventListener(SOUND_CHANGE_EVENT, handleSoundChange);
    };
  }, []);

  const handleToggleMaster = useCallback(() => {
    const next = toggleSound();
    setSettings(getAudioSettings());
    return next;
  }, []);

  const handleSetMaster = useCallback((enabled: boolean) => {
    const next = setSoundEnabled(enabled);
    setSettings(getAudioSettings());
    return next;
  }, []);

  const handleSetSfxEnabled = useCallback((enabled: boolean) => {
    const next = setSfxEnabled(enabled);
    setSettings(getAudioSettings());
    return next;
  }, []);

  const handleSetSfxVolume = useCallback((volume: number) => {
    const next = setSfxVolume(volume);
    setSettings(getAudioSettings());
    return next;
  }, []);

  const handleToggleAmbient = useCallback(() => {
    const next = toggleAmbient();
    setSettings(getAudioSettings());
    return next;
  }, []);

  const handleSetAmbientEnabled = useCallback((enabled: boolean) => {
    const next = setAmbientEnabled(enabled);
    setSettings(getAudioSettings());
    return next;
  }, []);

  const handleSetAmbientVolume = useCallback((volume: number) => {
    const next = setAmbientVolume(volume);
    setSettings(getAudioSettings());
    return next;
  }, []);

  const handleSetAmbientPreset = useCallback((preset: AmbientPreset) => {
    const next = setAmbientPreset(preset);
    setSettings(getAudioSettings());
    return next;
  }, []);

  const play = useCallback((type: SoundEffectType, force = false) => {
    playSound(type, force);
  }, []);

  const tickCountdown = useCallback((seconds: number) => {
    playCountdownTick(seconds);
  }, []);

  const resetCountdown = useCallback(() => {
    resetCountdownAudio();
  }, []);

  return {
    // Master
    soundEnabled: settings.masterEnabled,
    toggleSound: handleToggleMaster,
    setSoundEnabled: handleSetMaster,

    // SFX
    sfxEnabled: settings.sfxEnabled,
    sfxVolume: settings.sfxVolume,
    setSfxEnabled: handleSetSfxEnabled,
    setSfxVolume: handleSetSfxVolume,

    // Ambient
    ambientEnabled: settings.ambientEnabled,
    ambientVolume: settings.ambientVolume,
    ambientPreset: settings.ambientPreset,
    isAmbientPlaying,
    toggleAmbient: handleToggleAmbient,
    setAmbientEnabled: handleSetAmbientEnabled,
    setAmbientVolume: handleSetAmbientVolume,
    setAmbientPreset: handleSetAmbientPreset,

    // All settings object
    settings,

    // Player triggers
    playSound: play,
    playCountdownTick: tickCountdown,
    resetCountdownAudio: resetCountdown
  };
}
