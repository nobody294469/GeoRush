import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { 
  X, 
  Calendar, 
  Sparkles, 
  Play, 
  Clock, 
  Globe, 
  Compass, 
  Trophy, 
  Hourglass, 
  CheckCircle2, 
  Flame 
} from 'lucide-react';
import { getMsUntilNextMidnight, formatCountdown } from '../../utils/dailyChallenge';
import { GAME_MODE_PRESETS } from '../../types/game';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({ isOpen, onClose }) => {
  const { 
    startGame, 
    dailyInfo, 
    isLoadingLocations, 
    refreshDailyInfo 
  } = useGame();

  const [countdown, setCountdown] = useState<string>(() => formatCountdown(getMsUntilNextMidnight()));

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const ms = getMsUntilNextMidnight();
      setCountdown(formatCountdown(ms));

      if (ms < 1500) {
        refreshDailyInfo();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, refreshDailyInfo]);

  if (!isOpen) return null;

  const handleStart = () => {
    if (isLoadingLocations || dailyInfo.isCompletedToday) return;
    onClose();
    startGame({
      gameMode: 'normal',
      modeId: 'daily_challenge',
      mapId: 'world',
      maxRounds: 5,
      rules: {
        ...GAME_MODE_PRESETS['normal'],
        timeLimitSeconds: 120
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-left space-y-5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            Daily Challenge
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Today's Expedition
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {dailyInfo.formattedDate}
          </p>
        </div>

        {/* Brief Match Info */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Rounds</div>
              <div className="text-xs font-black text-slate-900">5 Fixed Rounds</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Timer</div>
              <div className="text-xs font-black text-slate-900">2 Min / Round</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-teal-600 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Map</div>
              <div className="text-xs font-black text-slate-900">World Map</div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Mode</div>
              <div className="text-xs font-black text-slate-900">Normal Mode</div>
            </div>
          </div>
        </div>

        {/* Daily Streak Indicator */}
        {dailyInfo.currentStreak > 0 && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
            <span className="font-bold text-amber-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              Active Daily Streak
            </span>
            <span className="font-black text-amber-900 font-mono">
              {dailyInfo.currentStreak} Day{dailyInfo.currentStreak === 1 ? '' : 's'}
            </span>
          </div>
        )}

        {/* Already Played State vs Ready to Play State */}
        {dailyInfo.isCompletedToday ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Challenge Completed
                </div>
                {dailyInfo.todayRecord && (
                  <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    {dailyInfo.todayRecord.score.toLocaleString()} pts
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                You have already completed today's seed. Come back after midnight for tomorrow's challenge!
              </p>
            </div>

            {/* Countdown Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-amber-500" />
                Resets In
              </div>
              <div className="font-mono text-xl font-black text-slate-900 tracking-wider">
                {countdown}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Refreshes everyday at 12:00 AM (Midnight)
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer border border-slate-200"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-slate-500 leading-relaxed text-center">
              All players worldwide receive the same 5 locations today. You have <strong className="text-slate-800">1 attempt</strong>.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStart}
                disabled={isLoadingLocations}
                className="flex-1 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950 stroke-none" />
                <span>Play Daily Challenge</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
