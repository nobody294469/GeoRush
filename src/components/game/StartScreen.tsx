import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { GameMode, TimeLimitRule, GAME_MODE_PRESETS } from '../../types/game';
import { Play, Activity, Clock, Compass, Flame, AlertCircle, X, Users } from 'lucide-react';
import { MultiplayerConnectModal } from '../multiplayer/MultiplayerConnectModal';

export const StartScreen: React.FC = () => {
  const { startGame, toggleTelemetry, telemetry, settings, isLoadingLocations, locationError, clearLocationError } = useGame();

  const [selectedMode, setSelectedMode] = useState<GameMode>(settings.gameMode || 'normal');
  const [timeLimit, setTimeLimit] = useState<TimeLimitRule>(settings.rules.timeLimitSeconds);
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState(false);

  const handleStart = () => {
    if (isLoadingLocations) return;
    const preset = GAME_MODE_PRESETS[selectedMode];
    startGame({
      gameMode: selectedMode,
      rules: {
        ...preset,
        timeLimitSeconds: timeLimit
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      {/* Main Content Container */}
      <div className="w-full max-w-2xl relative z-10 space-y-8 text-center">
        
        {/* Hero Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            WORLD EXPLORER CHALLENGE
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900">
            GeoWorld <span className="text-teal-600">Explorer</span>
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
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" /> ROUND TIME LIMIT
            </label>

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
                  onClick={() => setTimeLimit(option.value as TimeLimitRule)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer text-center ${
                    timeLimit === option.value
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-900'
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

        {/* Telemetry Button */}
        <button
          onClick={() => toggleTelemetry(true)}
          className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-mono flex items-center justify-center gap-2 transition-colors mx-auto cursor-pointer shadow-xs"
        >
          <Activity className="w-4 h-4 text-teal-600" />
          <span>Google Maps Development Telemetry ({telemetry.quotaUsed}/200 API Calls)</span>
        </button>

      </div>
    </div>
  );
};
