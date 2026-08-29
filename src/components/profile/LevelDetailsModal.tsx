import React from 'react';
import { 
  X, 
  Award, 
  Sparkles, 
  Target, 
  Zap, 
  Flame, 
  Calendar, 
  Trophy
} from 'lucide-react';
import { PlayerProgression } from '../../utils/progression';

interface LevelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  progression: PlayerProgression;
}

export const LevelDetailsModal: React.FC<LevelDetailsModalProps> = ({
  isOpen,
  onClose,
  progression
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-left space-y-5 overflow-hidden max-h-[90vh] flex flex-col text-slate-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 shrink-0 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              Player Progression
            </div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              Level & Rank
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Earn XP across all game modes through accuracy, speed, and streaks.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Overview Card */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 space-y-4 shadow-xs shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-emerald-700 text-[11px] font-bold uppercase tracking-wider font-mono">Current Rank</span>
              <h4 className="text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900">
                {progression.title}
              </h4>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex flex-col items-center justify-center font-black shadow-xs">
              <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-bold">LVL</span>
              <span className="text-2xl leading-none text-emerald-900 font-mono">{progression.level}</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold font-mono">
              <span className="text-slate-600">
                {progression.currentLevelXP.toLocaleString()} / {progression.nextLevelXP.toLocaleString()} XP
              </span>
              <span className="text-emerald-700">
                {progression.progressPercent}% to Level {progression.level + 1}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${progression.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-200">
            <span>Total Lifetime XP</span>
            <span className="font-mono font-black text-emerald-700">{progression.totalXP.toLocaleString()} XP</span>
          </div>
        </div>

        {/* How XP Is Calculated */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">
            How XP is Earned
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="font-black text-slate-900 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                Scoring Ratio
              </div>
              <p className="text-[11px] text-slate-600">
                1 XP per 10 points scored (Up to 2,500 XP / match).
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="font-black text-slate-900 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                Accuracy Bonuses
              </div>
              <p className="text-[11px] text-slate-600">
                +250 XP for &lt;1km, +120 XP for &lt;15km, +60 XP for &lt;50km.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="font-black text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Perfect Rounds
              </div>
              <p className="text-[11px] text-slate-600">
                +150 XP bonus for each flawless 5,000-point round.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="font-black text-slate-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-sky-600" />
                Quick Deduction
              </div>
              <p className="text-[11px] text-slate-600">
                +100 XP when guessing high scores under 8 seconds.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="font-black text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Daily Challenge
              </div>
              <p className="text-[11px] text-slate-600">
                +250 XP flat bonus upon daily challenge completion.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="font-black text-slate-900 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                Country Streaks
              </div>
              <p className="text-[11px] text-slate-600">
                +50 XP per correct country + streak milestone bonuses.
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-slate-200"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
