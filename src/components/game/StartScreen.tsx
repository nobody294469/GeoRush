import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../hooks/useAudio';
import { GameMode, TimeLimitRule, GAME_MODE_PRESETS } from '../../types/game';
import { Play, Clock, Compass, Flame, AlertCircle, X, Users, Map as MapIcon, ChevronDown, User, Check, Volume2, VolumeX } from 'lucide-react';
import { MapRegistry } from '../../game/mapRegistry';
import { MultiplayerConnectModal } from '../multiplayer/MultiplayerConnectModal';

export const StartScreen: React.FC = () => {
  const { 
    startGame, 
    settings, 
    isLoadingLocations, 
    locationError, 
    clearLocationError,
    playerName,
    updatePlayerName
  } = useGame();
  
  const { soundEnabled, toggleSound } = useAudio();
  
  const [gameType, setGameType] = useState<'classic' | 'country_streak' | 'time_attack'>('classic');
  const [selectedMapId, setSelectedMapId] = useState<string>(settings.mapId || 'world');
  const maps = MapRegistry.getInstance().getAllMaps();

  const [selectedMode, setSelectedMode] = useState<GameMode>(settings.gameMode || 'normal');
  const [timeLimit, setTimeLimit] = useState<TimeLimitRule>(settings.rules.timeLimitSeconds);
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  const handleStart = () => {
    if (isLoadingLocations) return;
    const preset = GAME_MODE_PRESETS[selectedMode];
    startGame({
      gameMode: selectedMode,
      modeId: gameType,
      mapId: gameType === 'country_streak' ? 'world' : selectedMapId,
      maxRounds: gameType === 'country_streak' ? 100 : 5,
      rules: {
        ...preset,
        timeLimitSeconds: gameType === 'time_attack' ? 30 : timeLimit
      }
    });
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim() || 'Explorer';
    updatePlayerName(clean);
    setNameInput(clean);
    setIsEditingName(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      {/* Main Content Container */}
      <div className="w-full max-w-2xl relative z-10 space-y-8 text-center">
        
        {/* Hero Title & Player Profile Chip */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              GEORUSH CHALLENGE
            </div>

            {/* Persistent Display Name Chip */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs">
              <User className="w-3.5 h-3.5 text-teal-600" />
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-24 px-1.5 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-900 border border-teal-500 focus:outline-none"
                    maxLength={24}
                    autoFocus
                  />
                  <button type="submit" className="p-0.5 text-teal-600 hover:text-teal-700">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(playerName);
                    setIsEditingName(true);
                  }}
                  className="inline-flex items-center gap-1 text-slate-800 hover:text-teal-600 transition-colors cursor-pointer"
                >
                  <span className="font-bold">{playerName}</span>
                  <span className="text-[10px] text-slate-400 font-normal underline">edit</span>
                </button>
              )}
            </div>

            {/* Sound Toggle Chip */}
            <button
              type="button"
              onClick={toggleSound}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-xs transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-white border-slate-200 text-slate-700 hover:text-teal-700 hover:border-teal-300'
                  : 'bg-slate-100/80 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Sound Effects Enabled (Click to Mute)' : 'Sound Effects Muted (Click to Unmute)'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Sound On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900">
            Geo<span className="text-teal-600">Rush</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Test your geographic intuition across interactive Street View panoramas and high-precision world maps.
          </p>
        </div>

        {/* Location Resolution Error Banner */}
        {locationError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left flex items-start justify-between gap-3 text-rose-800 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-900 uppercase tracking-wide">
                  Location Resolution Error
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {locationError}
                </p>
              </div>
            </div>
            <button
              onClick={clearLocationError}
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Game Mode Selector Box */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-6 text-left shadow-xl">
          
          {/* Game Type Selection (Classic vs Time Attack vs Country Streak) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" /> GAME TYPE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setGameType('classic')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  gameType === 'classic'
                    ? 'bg-teal-50 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className={`font-black text-xs uppercase tracking-wide ${
                  gameType === 'classic' ? 'text-teal-900' : 'text-slate-700'
                }`}>
                  📍 CLASSIC MODE
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Standard geographic scoring
                </p>
              </button>

              <button
                type="button"
                onClick={() => setGameType('time_attack')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  gameType === 'time_attack'
                    ? 'bg-sky-50 border-sky-500 shadow-sm ring-2 ring-sky-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className={`font-black text-xs uppercase tracking-wide flex items-center gap-1 ${
                  gameType === 'time_attack' ? 'text-sky-900' : 'text-slate-700'
                }`}>
                  <Clock className="w-3.5 h-3.5 text-sky-600" /> TIME ATTACK
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  30s timer with 1.0x-1.5x speed multiplier
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGameType('country_streak');
                  setSelectedMapId('world');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  gameType === 'country_streak'
                    ? 'bg-amber-50 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className={`font-black text-xs uppercase tracking-wide flex items-center gap-1 ${
                  gameType === 'country_streak' ? 'text-amber-900' : 'text-slate-700'
                }`}>
                  <Flame className="w-3.5 h-3.5 text-amber-600" /> COUNTRY STREAK
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Identify countries for a streak
                </p>
              </button>
            </div>
          </div>

          {/* Map Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-teal-600" /> MAP
              </label>
              {gameType === 'country_streak' && (
                <span className="text-[11px] font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  WORLD MAP REQUIRED
                </span>
              )}
            </div>
            <div className="relative">
              <select
                value={gameType === 'country_streak' ? 'world' : selectedMapId}
                onChange={(e) => setSelectedMapId(e.target.value)}
                disabled={gameType === 'country_streak'}
                className={`w-full appearance-none border text-slate-700 py-3 px-4 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                  gameType === 'country_streak'
                    ? 'bg-slate-100 border-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-slate-50 border-slate-200 cursor-pointer'
                }`}
              >
                {maps.map(map => (
                  <option key={map.id} value={map.id}>
                    {map.id === 'world' ? '🌍 ' : ''}
                    {map.id === 'india' ? '🇮🇳 ' : ''}
                    {map.id === 'asia' ? '🌏 ' : ''}
                    {map.id === 'europe' ? '🇪🇺 ' : ''}
                    {map.id === 'north_america' ? '🌎 ' : ''}
                    {map.id === 'south_america' ? '🌎 ' : ''}
                    {map.id === 'africa' ? '🌍 ' : ''}
                    {map.id === 'oceania' ? '🌏 ' : ''}
                    {map.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Game Mode Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-600" /> GAME MODE
              </label>
              <span className="text-[11px] font-mono text-slate-400">5 ROUNDS • SINGLE PLAYER</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Normal Mode Option */}
              <button
                type="button"
                onClick={() => setSelectedMode('normal')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  selectedMode === 'normal'
                    ? 'bg-teal-50/70 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-black text-sm uppercase tracking-wide ${
                    selectedMode === 'normal' ? 'text-teal-900' : 'text-slate-700'
                  }`}>
                    NORMAL MODE
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold uppercase tracking-wider">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Full exploration allowed. Move along roads, pan 360°, and zoom into details.
                </p>
              </button>

              {/* Pro Mode Option */}
              <button
                type="button"
                onClick={() => setSelectedMode('pro')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  selectedMode === 'pro'
                    ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-black text-sm uppercase tracking-wide flex items-center gap-1.5 ${
                    selectedMode === 'pro' ? 'text-amber-900' : 'text-slate-700'
                  }`}>
                    <Flame className="w-4 h-4 text-amber-600" /> PRO MODE
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                    NMPZ
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2.5">
                  No Move, Pan, or Zoom. Test raw geographic recognition from a single static view.
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">NO MOVE</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">NO PAN</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">NO ZOOM</span>
                </div>
              </button>

            </div>
          </div>

          {/* Time Limit Selection */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" /> ROUND TIME LIMIT
              </label>
              {gameType === 'time_attack' && (
                <span className="text-[11px] font-mono text-sky-800 font-bold bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                  FIXED 30S COUNTDOWN (1.0x - 1.5x MULTIPLIER)
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {([
                { value: 0, label: 'Unlimited' },
                { value: 30, label: '30s' },
                { value: 60, label: '1m' },
                { value: 120, label: '2m' },
                { value: 180, label: '3m' }
              ] as const).map(option => (
                <button
                  key={option.value}
                  type="button"
                  disabled={gameType === 'time_attack'}
                  onClick={() => setTimeLimit(option.value as TimeLimitRule)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all text-center ${
                    gameType === 'time_attack'
                      ? option.value === 30
                        ? 'bg-sky-600 text-white shadow-sm font-black'
                        : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                      : timeLimit === option.value
                      ? 'bg-teal-600 text-white shadow-sm cursor-pointer'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 cursor-pointer'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Play Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleStart}
              disabled={isLoadingLocations}
              className={`flex-1 w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg flex items-center justify-center gap-3 transition-all transform ${
                isLoadingLocations
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-80'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isLoadingLocations ? (
                <>
                  <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>RESOLVING...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-white stroke-none" />
                  <span>SINGLE PLAYER</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsMultiplayerModalOpen(true)}
              className="flex-1 w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <Users className="w-6 h-6" />
              <span>MULTIPLAYER</span>
            </button>
          </div>

        </div>

        <MultiplayerConnectModal
          isOpen={isMultiplayerModalOpen}
          onClose={() => setIsMultiplayerModalOpen(false)}
        />

      </div>
    </div>
  );
};
