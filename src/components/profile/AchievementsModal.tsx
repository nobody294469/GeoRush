import React, { useState } from 'react';
import { 
  X, 
  Trophy, 
  CheckCircle2, 
  Lock, 
  Target, 
  Crosshair, 
  Sparkles, 
  Flag, 
  Flame, 
  Zap, 
  Calendar, 
  Sun, 
  Globe, 
  Swords, 
  Award, 
  Crown,
  Compass,
  Star
} from 'lucide-react';
import { PlayerProgression, getAllAchievementsWithStatus } from '../../utils/progression';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  progression: PlayerProgression;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  progression
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');

  if (!isOpen) return null;

  const achievements = getAllAchievementsWithStatus(progression);
  const totalUnlocked = achievements.filter(a => !!a.unlockedAt).length;
  const completionPercent = Math.round((totalUnlocked / achievements.length) * 100);

  const filtered = achievements.filter(a => {
    if (activeTab === 'unlocked') return !!a.unlockedAt;
    if (activeTab === 'locked') return !a.unlockedAt;
    return true;
  });

  const getIcon = (iconName: string, isUnlocked: boolean) => {
    const props = { className: `w-5 h-5 ${isUnlocked ? 'text-amber-600' : 'text-slate-400'}` };
    switch (iconName) {
      case 'Target': return <Target {...props} />;
      case 'Crosshair': return <Crosshair {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Flag': return <Flag {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Calendar': return <Calendar {...props} />;
      case 'Sun': return <Sun {...props} />;
      case 'Globe': return <Globe {...props} />;
      case 'Swords': return <Swords {...props} />;
      case 'Award': return <Award {...props} />;
      case 'Crown': return <Crown {...props} />;
      case 'Trophy': return <Trophy {...props} />;
      default: return <Compass {...props} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-left space-y-5 overflow-hidden max-h-[90vh] flex flex-col text-slate-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 shrink-0 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Achievements
            </div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              Explorer Milestones
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Complete special in-game objectives to earn bonus XP and prestige badges.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Total Completion
            </span>
            <span className="text-amber-700 font-black font-mono">
              {totalUnlocked} / {achievements.length} Unlocked ({completionPercent}%)
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-slate-100 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All ({achievements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unlocked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'unlocked'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Unlocked ({totalUnlocked})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('locked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'locked'
                ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Locked ({achievements.length - totalUnlocked})
          </button>
        </div>

        {/* Scrollable Achievements List */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          {filtered.map(ach => {
            const isUnlocked = !!ach.unlockedAt;

            return (
              <div 
                key={ach.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  isUnlocked 
                    ? 'bg-amber-50/70 border-amber-200 shadow-xs' 
                    : 'bg-slate-50 border-slate-200 opacity-80'
                }`}
              >
                {/* Icon Badge */}
                <div className={`p-2.5 rounded-2xl shrink-0 border ${
                  isUnlocked 
                    ? 'bg-amber-100 border-amber-200 text-amber-700' 
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {getIcon(ach.iconName, isUnlocked)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm font-black tracking-tight ${
                      isUnlocked ? 'text-slate-900' : 'text-slate-700'
                    }`}>
                      {ach.title}
                    </h4>

                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Achieved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                        Locked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {ach.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                      +{ach.xpReward} XP Reward
                    </span>

                    {ach.target && ach.target > 1 && !isUnlocked && (
                      <span className="font-mono text-slate-500 font-bold">
                        {ach.currentValue || 0} / {ach.target}
                      </span>
                    )}
                  </div>

                  {/* Mini Progress bar for multi-step achievements if not unlocked */}
                  {ach.target && ach.target > 1 && !isUnlocked && (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${ach.progress || 0}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
