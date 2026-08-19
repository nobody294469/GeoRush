import { useState, useEffect, useCallback } from 'react';
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  toggleSound, 
  playSound, 
  playCountdownTick, 
  resetCountdownAudio, 
  SoundEffectType, 
  SOUND_CHANGE_EVENT 
} from '../utils/audioSystem';

export function useAudio() {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isSoundEnabled());

  useEffect(() => {
    const handleSoundChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.enabled === 'boolean') {
        setSoundEnabledState(customEvent.detail.enabled);
      } else {
        setSoundEnabledState(isSoundEnabled());
      }
    };

    window.addEventListener(SOUND_CHANGE_EVENT, handleSoundChange);
    return () => {
      window.removeEventListener(SOUND_CHANGE_EVENT, handleSoundChange);
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    const next = toggleSound();
    setSoundEnabledState(next);
    return next;
  }, []);

  const handleSetSound = useCallback((enabled: boolean) => {
    const next = setSoundEnabled(enabled);
    setSoundEnabledState(next);
    return next;
  }, []);

  const play = useCallback((type: SoundEffectType) => {
    playSound(type);
  }, []);

  const tickCountdown = useCallback((seconds: number) => {
    playCountdownTick(seconds);
  }, []);

  const resetCountdown = useCallback(() => {
    resetCountdownAudio();
  }, []);

  return {
    soundEnabled,
    toggleSound: handleToggleSound,
    setSoundEnabled: handleSetSound,
    playSound: play,
    playCountdownTick: tickCountdown,
    resetCountdownAudio: resetCountdown
  };
}
