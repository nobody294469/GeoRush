import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { formatDistance, getScoreRating } from '../../utils/scoring';
import { AnimatedScore } from '../common/AnimatedScore';
import { getScoreTier, getScoreTierStyles } from '../../utils/scoreTiers';
import { playSound } from '../../utils/audioSystem';
import { MapPin, ArrowRight, Clock, Zap, Sparkles, Compass } from 'lucide-react';

export const RoundResultOverlay: React.FC = () => {
  const { 
    gameStatus, 
    results, 
    nextRound, 
    currentRoundIndex, 
    settings 
  } = useGame();

  const isVisible = gameStatus === 'ROUND_RESULT';
  const currentResult = results[results.length - 1];

  const isTimeAttack = settings.modeId === 'time_attack';
  const maxRoundScore = isTimeAttack ? 7500 : 5000;
  const currentScore = currentResult?.score ?? 0;
  const tier = getScoreTier(currentScore, maxRoundScore);
  const tierStyle = getScoreTierStyles(tier);

  const { title: ratingTitle } = getScoreRating(currentScore);
  const isLastRound = currentRoundIndex >= settings.maxRounds - 1;

  useEffect(() => {
    if (!isVisible || !currentResult) return;

    if (tier === 'master' || currentResult.score >= 4000) {
      playSound('excellent');
    } else {
      playSound('score');
    }
  }, [isVisible, currentResult, tier]);

  if (!isVisible || !currentResult) return null;

  return (
    <div className="absolute inset-x-0 top-6 z-40 flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-6 shadow-2xl shadow-slate-900/15 max-w-lg w-full flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300 text-slate-900">
        
        {/* Rating Header & Big Distance Metric */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                tier === 'master'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : tier === 'good'
                  ? 'bg-teal-100 text-teal-800 border-teal-200'
                  : tier === 'warm'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {ratingTitle}
              </span>
              {tier === 'master' && (
                <span className="text-[10px] font-mono font-bold text-amber-600 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Bullseye
                </span>
              )}
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 flex items-baseline gap-1.5 pt-1">
              <span>{formatDistance(currentResult.distanceKm)}</span>
              <span className="text-slate-500 text-xs font-semibold tracking-normal uppercase">away</span>
            </h2>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {isTimeAttack ? 'Time Attack Score' : 'Round Score'}
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-emerald-600 mt-0.5">
              <AnimatedScore value={currentResult.score} duration={750} prefix="+" />
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              max {isTimeAttack ? '7,500' : '5,000'} pts
            </div>
          </div>
        </div>

        {/* Time Attack Detailed Bonus Breakdown */}
        {isTimeAttack && (
          <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-200 text-center font-mono text-xs">
            <div>
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Base Score</div>
              <div className="font-bold text-slate-800 mt-0.5 font-mono">
                {(currentResult.baseScore ?? currentResult.score).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Time Taken</div>
              <div className="font-bold text-slate-800 mt-0.5 font-mono">
                {currentResult.timeTakenSeconds}s
              </div>
            </div>
            <div>
              <div className="text-[9px] text-sky-700 font-bold uppercase tracking-wider">Speed Bonus</div>
              <div className="font-bold text-sky-700 mt-0.5 font-mono flex items-center justify-center gap-0.5">
                <Zap className="w-3 h-3 fill-sky-600 text-sky-600 inline" />
                {(currentResult.timeMultiplier ?? 1.0).toFixed(3)}x
              </div>
            </div>
          </div>
        )}

        {/* Real Location Reveal Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm truncate">
              <MapPin className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="truncate">{currentResult.location.name}</span>
            </div>
            <span className="text-xs text-slate-500 font-mono font-medium shrink-0">
              {currentResult.location.city ? `${currentResult.location.city}, ` : ''}{currentResult.location.country}
            </span>
          </div>

          {currentResult.location.description && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentResult.location.description}
            </p>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Elapsed: {currentResult.timeTakenSeconds}s
            </span>
            <span>
              Target: {currentResult.nodeUsed.lat.toFixed(4)}°, {currentResult.nodeUsed.lng.toFixed(4)}°
            </span>
          </div>
        </div>

        {/* Next Round Action Button */}
        <button
          onClick={nextRound}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <span>{isLastRound ? 'View Game Final Summary' : 'Next Round'}</span>
          <span className="px-1.5 py-0.5 rounded bg-white/20 text-white font-mono text-[10px] font-bold">Space ↵</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>

      </div>
    </div>
  );
};
