import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Music, 
  Sliders, 
  Compass, 
  Check, 
  Wind, 
  Waves, 
  Orbit,
  Image as ImageIcon
} from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';
import { AmbientPreset, SoundEffectType } from '../../utils/audioSystem';
import { WALLPAPER_PRESETS, WALLPAPER_STORAGE_KEY, getDailyWallpaper } from '../../data/wallpapers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    soundEnabled,
    toggleSound,
    sfxEnabled,
    sfxVolume,
    setSfxEnabled,
    setSfxVolume,
    ambientEnabled,
    ambientVolume,
    ambientPreset,
    isAmbientPlaying,
    setAmbientEnabled,
    setAmbientVolume,
    setAmbientPreset,
    playSound
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'appearance' | 'audio' | 'gameplay'>('appearance');
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>(() => {
    return localStorage.getItem(WALLPAPER_STORAGE_KEY) || 'daily_auto';
  });

  const handleWallpaperChange = (id: string) => {
    setSelectedWallpaper(id);
    localStorage.setItem(WALLPAPER_STORAGE_KEY, id);
    window.dispatchEvent(new Event('georush_wallpaper_changed'));
    playSound('click');
  };

  if (!isOpen) return null;

  const presets: {
    id: AmbientPreset;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'tranquil',
      title: 'Tranquil Horizon',
      description: 'Warm calming harmonic pad with gentle acoustic resonance',
      icon: <Waves className="w-4 h-4" />,
      color: 'from-teal-500/20 to-emerald-500/20 text-teal-700 border-teal-200'
    },
    {
      id: 'breeze',
      title: 'Alpine Breeze',
      description: 'Soft sweeping ambient wind and atmospheric mountain air',
      icon: <Wind className="w-4 h-4" />,
      color: 'from-sky-500/20 to-blue-500/20 text-sky-700 border-sky-200'
    },
    {
      id: 'cosmic',
      title: 'Cosmic Orbit',
      description: 'Deep spatial drone with celestial shimmering overtones',
      icon: <Orbit className="w-4 h-4" />,
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-700 border-indigo-200'
    }
  ];

  const testSounds: { id: SoundEffectType; label: string }[] = [
    { id: 'pin', label: '📍 Pin Drop' },
    { id: 'submit', label: '✨ Submit Guess' },
    { id: 'score', label: '📈 Score Count' },
    { id: 'excellent', label: '🌟 Master Tier' },
    { id: 'victory', label: '🏆 Victory Fanfare' }
  ];

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div 
        id="settings-modal-backdrop"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="settings-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl flex flex-col max-h-[85vh] sm:max-h-[80vh] text-slate-900 overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs shrink-0">
                <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Game Settings
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Audio atmosphere & experience preferences
                </p>
              </div>
            </div>

            <button
              id="settings-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl sm:rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 sm:px-6 pt-2.5 border-b border-slate-100 flex items-center gap-1 sm:gap-2 bg-white shrink-0 overflow-x-auto custom-scrollbar">
            <button
              id="tab-appearance-settings"
              onClick={() => setActiveTab('appearance')}
              className={`pb-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'appearance'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Scenery & Atmosphere</span>
            </button>
            <button
              id="tab-audio-settings"
              onClick={() => setActiveTab('audio')}
              className={`pb-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'audio'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Audio & Ambience</span>
            </button>
            <button
              id="tab-gameplay-settings"
              onClick={() => setActiveTab('gameplay')}
              className={`pb-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'gameplay'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Controls & Info</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0 custom-scrollbar">
            {/* SCENERY & WALLPAPER TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" /> Geographic Scenery Wallpaper
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose a global scenery backdrop or allow GeoRush to automatically cycle every day.
                  </p>
                </div>

                {/* Daily Auto Rotation Card */}
                <button
                  type="button"
                  onClick={() => handleWallpaperChange('daily_auto')}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                    selectedWallpaper === 'daily_auto'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-300 shrink-0">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>Daily Scenery Rotation</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                          TODAY'S SEED
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Today: <span className="font-semibold text-slate-800">{getDailyWallpaper().name}</span> ({getDailyWallpaper().location})
                      </p>
                    </div>
                  </div>
                  {selectedWallpaper === 'daily_auto' && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
                </button>

                {/* Preset Wallpapers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-1 pt-1">
                  {WALLPAPER_PRESETS.map((wp) => {
                    const isSelected = selectedWallpaper === wp.id;
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => handleWallpaperChange(wp.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 relative overflow-hidden group shadow-xs ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={wp.imageUrl}
                          alt={wp.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-200 group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{wp.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{wp.location}</p>
                          <span className="inline-block mt-1 text-[9px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded font-semibold">
                            {wp.category}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                
                {/* Master Audio Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      soundEnabled ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Master Sound</h3>
                      <p className="text-xs text-slate-500">Enable or mute all game audio</p>
                    </div>
                  </div>

                  <button
                    id="toggle-master-sound"
                    type="button"
                    onClick={toggleSound}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      soundEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* UI Sound Effects Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        UI & Game Sound Effects
                      </span>
                    </div>

                    <button
                      id="toggle-sfx"
                      type="button"
                      disabled={!soundEnabled}
                      onClick={() => setSfxEnabled(!sfxEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed ${
                        sfxEnabled && soundEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          sfxEnabled && soundEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">
                    Audio feedback for pin drops, timer countdowns, scoring reveals, and victories.
                  </p>

                  {/* SFX Volume Slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Sound Effects Volume</span>
                      <span className="font-mono font-bold text-slate-900">
                        {Math.round(sfxVolume * 100)}%
                      </span>
                    </div>
                    <input
                      id="slider-sfx-volume"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      disabled={!soundEnabled || !sfxEnabled}
                      value={sfxVolume}
                      onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Sound FX Preview Triggers */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Sound Previews
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {testSounds.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          disabled={!soundEnabled || !sfxEnabled}
                          onClick={() => playSound(s.id, true)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Background Ambient Soundscapes Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Music className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Background Ambient Atmosphere
                      </span>
                    </div>

                    <button
                      id="toggle-ambient"
                      type="button"
                      disabled={!soundEnabled}
                      onClick={() => setAmbientEnabled(!ambientEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed ${
                        ambientEnabled && soundEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          ambientEnabled && soundEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600">
                    Subtle, procedural ambient soundscapes designed to deepen immersion during exploration without distraction.
                  </p>

                  {/* Ambient Volume Slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>Ambient Atmosphere Volume</span>
                      <span className="font-mono font-bold text-slate-900">
                        {Math.round(ambientVolume * 100)}%
                      </span>
                    </div>
                    <input
                      id="slider-ambient-volume"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      disabled={!soundEnabled || !ambientEnabled}
                      value={ambientVolume}
                      onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Ambient Themes Selector */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Soundscape Theme
                      </span>
                      {isAmbientPlaying && ambientEnabled && soundEnabled && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Playing Live
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {presets.map((preset) => {
                        const isSelected = ambientPreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            disabled={!soundEnabled}
                            onClick={() => setAmbientPreset(preset.id)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 shadow-xs ring-1 ring-emerald-500/50'
                                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <div className="flex items-center justify-between">
                              <div className={`p-1.5 rounded-xl border bg-slate-50 ${isSelected ? 'border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                                {preset.icon}
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{preset.title}</div>
                              <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                                {preset.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'gameplay' && (
              <div className="space-y-4">
                
                {/* Pro Keyboard Guide */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pro Navigation Keyboard Controls
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-slate-700">Submit / Next Round</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200 font-mono text-[10px] font-bold text-slate-800">Space</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-slate-700">Toggle Map Size</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200 font-mono text-[10px] font-bold text-slate-800">M / Tab</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-slate-700">Reset Street Compass</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200 font-mono text-[10px] font-bold text-slate-800">R / C</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-slate-700">Clear Pin / Close</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200 font-mono text-[10px] font-bold text-slate-800">Esc</kbd>
                    </div>
                  </div>
                </div>

                {/* About & Web Audio Synthesis */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-emerald-900">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Native Web Audio API Synthesis</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    All game sound effects and ambient soundscapes are synthesized directly in your browser using real-time Web Audio oscillators. No bulky MP3 downloads, zero latency, and works completely offline!
                  </p>
                </div>

              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[11px] sm:text-xs text-slate-500">
              Preferences are automatically saved to your browser.
            </span>
            <button
              id="settings-done-btn"
              type="button"
              onClick={onClose}
              className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
