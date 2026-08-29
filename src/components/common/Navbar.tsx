import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../hooks/useAudio';
import { RotateCcw, Trophy, Clock, Volume2, VolumeX, Settings } from 'lucide-react';
import { SettingsModal } from '../settings/SettingsModal';
import { ExpeditionLogo } from './ExpeditionLogo';

export const Navbar: React.FC = () => {
  const { 
    gameStatus, 
    currentRoundIndex, 
    settings, 
    totalScore, 
    timeRemaining, 
    isStreetViewReady, 
    restartGame 
  } = useGame();

  const { soundEnabled, toggleSound, ambientEnabled } = useAudio();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const rules = settings.rules;
  const isProMode = settings.gameMode === 'pro' || (rules.movement === 'NO_MOVING' && rules.pan === 'NO_PAN' && rules.zoom === 'NO_ZOOM');

  // Format seconds to mm:ss
  const formatTime = (secs: number | null) => {
    if (secs === null) return '∞';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? `${m}:` : ''}${s < 10 && m > 0 ? '0' : ''}${s}s`;
  };

  const isTimeLow = timeRemaining !== null && timeRemaining <= 10;

  return (
    <header className="h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between z-40 relative select-none shadow-xs text-slate-900">
      
      {/* Left: Branding & Mode Badge */}
      <div 
        className="flex items-center gap-3 cursor-pointer group" 
        onClick={restartGame}
        title="Return to Main Menu"
      >
        <ExpeditionLogo size="sm" showSubtitle={false} />
        {isProMode ? (
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-semibold tracking-wider">
            NMPZ PRO
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-semibold tracking-wider">
            {settings.modeId === 'time_attack' ? 'TIME ATTACK' : 'CLASSIC'}
          </span>
        )}
      </div>

      {/* Middle: Tactical Game Progress & Timer Pill */}
      {gameStatus !== 'IDLE' && (
        <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 border border-slate-200 px-3 sm:px-5 py-1.5 rounded-full shadow-xs">
          
          {/* Round Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Round</span>
            <span className="text-emerald-700 font-mono font-black text-sm">{currentRoundIndex + 1}</span>
            <span className="text-slate-400 font-mono text-xs">/ {settings.maxRounds}</span>
          </div>

          <div className="w-px h-4 bg-slate-200" />

          {/* Countdown Timer */}
          {timeRemaining !== null && (
            <>
              <div className={`flex items-center gap-1.5 text-xs font-bold font-mono transition-colors ${
                isTimeLow ? 'text-rose-600 animate-pulse' : 'text-slate-800'
              }`}>
                <Clock className={`w-3.5 h-3.5 ${isTimeLow ? 'text-rose-600' : 'text-emerald-600'}`} />
                <span className="text-sm font-mono tracking-tight">{formatTime(timeRemaining)}</span>
                {settings.modeId === 'time_attack' && (
                  <span className="hidden md:inline px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[9px] font-mono font-bold border border-sky-200">
                    ⚡ {(Math.max(1.0, Math.min(1.5, 1.5 - ((30 - timeRemaining) / 60)))).toFixed(2)}x
                  </span>
                )}
                {!isStreetViewReady && <span className="text-[9px] text-slate-400 font-sans">(Paused)</span>}
              </div>
              <div className="w-px h-4 bg-slate-200" />
            </>
          )}

          {/* Total Score */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Score</span>
            <span className="text-amber-600 font-mono font-black text-sm tabular-nums">
              {totalScore.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Right: Audio & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Master Sound Quick Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
            soundEnabled
              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
              : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
          }`}
          title={soundEnabled ? 'Mute Game Sound' : 'Enable Game Sound'}
          aria-label={soundEnabled ? 'Mute Game Sound' : 'Enable Game Sound'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Audio & Game Settings Modal Button */}
        <button
          id="navbar-settings-btn"
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer relative shadow-xs"
          title="Audio Atmosphere & Game Settings"
          aria-label="Audio Atmosphere & Game Settings"
        >
          <Settings className="w-4 h-4 text-slate-600" />
          {ambientEnabled && soundEnabled && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        {/* Exit / Reset Game button */}
        {gameStatus !== 'IDLE' && (
          <button
            onClick={restartGame}
            className="p-2 rounded-xl bg-white hover:bg-rose-50 hover:border-rose-200 border border-slate-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shadow-xs"
            title="Exit to Main Menu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

    </header>
  );
};
