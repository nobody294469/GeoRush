import React from 'react';
import { useGame } from '../../context/GameContext';
import { formatDistance, getScoreRating } from '../../utils/scoring';
import { Trophy, MapPin, ArrowRight, CheckCircle2, Clock, Info } from 'lucide-react';

export const RoundResultOverlay: React.FC = () => {
  const { 
    gameStatus, 
    results, 
    nextRound, 
    currentRoundIndex, 
    settings 
  } = useGame();

  if (gameStatus !== 'ROUND_RESULT') return null;

  const currentResult = results[results.length - 1];
  if (!currentResult) return null;

  const { title: ratingTitle } = getScoreRating(currentResult.score);
  const isLastRound = currentRoundIndex >= settings.maxRounds - 1;

  return (
    <div className="absolute inset-x-0 top-6 z-40 flex justify-center pointer-events-none px-4">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 shadow-2xl max-w-lg w-full flex flex-col gap-4 animate-in fade-in slide-in-from-top duration-300">
        
        {/* Rating & Score Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">
              {ratingTitle}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">
              {formatDistance(currentResult.distanceKm)} <span className="text-slate-500 text-sm font-normal">away</span>
            </h2>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              {settings.modeId === 'time_attack' ? 'Time Attack Score' : 'Round Score'}
            </div>
            <div className="text-2xl font-black text-amber-600 font-mono">
              +{currentResult.score.toLocaleString()} <span className="text-xs text-slate-400">/ {settings.modeId === 'time_attack' ? '7,500' : '5,000'}</span>
            </div>
          </div>
        </div>

        {/* Time Attack Detailed Breakdown */}
        {settings.modeId === 'time_attack' && (
          <div className="grid grid-cols-3 gap-2 bg-sky-50/80 rounded-xl p-3 border border-sky-200 text-center font-mono text-xs">
            <div>
              <div className="text-[10px] text-sky-700 font-semibold uppercase">Base Geo Score</div>
              <div className="font-bold text-slate-800 mt-0.5 font-mono">
                {(currentResult.baseScore ?? currentResult.score).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-sky-700 font-semibold uppercase">Time Taken</div>
              <div className="font-bold text-slate-800 mt-0.5 font-mono">
                {currentResult.timeTakenSeconds}s
              </div>
            </div>
            <div>
              <div className="text-[10px] text-sky-700 font-semibold uppercase">Speed Bonus</div>
              <div className="font-bold text-sky-700 mt-0.5 font-mono">
                ⚡ {(currentResult.timeMultiplier ?? 1.0).toFixed(3)}x
              </div>
            </div>
          </div>
        )}

        {/* Location Details */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>{currentResult.location.name}</span>
            </div>
            <span className="text-xs text-slate-500 font-mono font-medium">
              {currentResult.location.city}, {currentResult.location.country}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            {currentResult.location.description}
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Time: {currentResult.timeTakenSeconds}s
            </span>
            <span className="font-mono">
              Target: {currentResult.nodeUsed.lat.toFixed(4)}°, {currentResult.nodeUsed.lng.toFixed(4)}°
            </span>
          </div>
        </div>

        {/* Next Round Action Button */}
        <button
          onClick={nextRound}
          className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <span>{isLastRound ? 'View Game Final Summary' : 'Next Round'}</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>

      </div>
    </div>
  );
};
