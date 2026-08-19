import React from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../hooks/useAudio';
import { Globe, RotateCcw, Trophy, Clock, Lock, Volume2, VolumeX } from 'lucide-react';

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

  const { soundEnabled, toggleSound } = useAudio();

  const rules = settings.rules;

  // Format seconds to mm:ss or ss
  const formatTime = (secs: number | null) => {
    if (secs === null) return 'Unlimited';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? `${m}:` : ''}${s < 10 && m > 0 ? '0' : ''}${s}s`;
  };

  const isTimeLow = timeRemaining !== null && timeRemaining <= 10;

  return (
    <header className="h-16 px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between z-40 relative shadow-xs">
      
      {/* Left: Branding */}
      <div className="flex items-center gap-3 cursor-pointer select-none" onClick={restartGame}>
        <div className="p-2 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20 font-bold">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5">
            Geo<span className="text-teal-600">Rush</span>
          </h1>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono tracking-wide">
            {settings.gameMode === 'pro' || (rules.movement === 'NO_MOVING' && rules.pan === 'NO_PAN' && rules.zoom === 'NO_ZOOM') ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">PRO (NMPZ)</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-bold">NORMAL</span>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Game Progress & Timer */}
      {gameStatus !== 'IDLE' && (
        <div className="flex items-center gap-4 bg-slate-50/90 border border-slate-200 px-4 py-1.5 rounded-full shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span className="text-slate-400">ROUND</span>
            <span className="text-teal-600 font-mono text-sm">{currentRoundIndex + 1}</span>
            <span className="text-slate-400">/ {settings.maxRounds}</span>
          </div>

          <div className="w-px h-4 bg-slate-200" />

          {/* Countdown Timer */}
          {timeRemaining !== null && (
            <>
              <div className={`flex items-center gap-1.5 text-xs font-bold font-mono transition-colors ${
                isTimeLow ? 'text-rose-600 animate-pulse' : 'text-slate-700'
              }`}>
                <Clock className={`w-3.5 h-3.5 ${isTimeLow ? 'text-rose-600' : 'text-teal-600'}`} />
                <span className="text-sm">{formatTime(timeRemaining)}</span>
                {settings.modeId === 'time_attack' && (
                  <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-extrabold font-mono border border-sky-300">
                    ⚡ {(Math.max(1.0, Math.min(1.5, 1.5 - ((30 - timeRemaining) / 60)))).toFixed(2)}x
                  </span>
                )}
                {!isStreetViewReady && <span className="text-[10px] font-sans text-slate-400">(Paused)</span>}
              </div>
              <div className="w-px h-4 bg-slate-200" />
            </>
          )}

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-400">SCORE</span>
            <span className="text-amber-600 font-mono text-sm">{totalScore.toLocaleString()}</span>
            <span className="text-slate-400 text-[10px]">PTS</span>
          </div>
        </div>
      )}

      {/* Right: Sound & Controls */}
      <div className="flex items-center gap-2.5">
        {/* Master Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
            soundEnabled
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-teal-700'
              : 'bg-slate-100/60 hover:bg-slate-200/80 border-slate-200 text-slate-400'
          }`}
          title={soundEnabled ? 'Mute Game Sound' : 'Enable Game Sound'}
          aria-label={soundEnabled ? 'Mute Game Sound' : 'Enable Game Sound'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-teal-600" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Exit / Reset Game button */}
        {gameStatus !== 'IDLE' && (
          <button
            onClick={restartGame}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Exit to Main Menu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

    </header>
  );
};
