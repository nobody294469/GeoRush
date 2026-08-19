import React from 'react';
import { useGame } from '../../context/GameContext';
import { formatDistance, formatTime } from '../../utils/scoring';
import { MatchSummaryMap } from '../map/MatchSummaryMap';
import { AnimatedScore } from '../common/AnimatedScore';
import { getScoreTier, getScoreTierStyles } from '../../utils/scoreTiers';
import { Trophy, Star, RotateCcw, MapPin, ArrowLeft, Globe, Award, Zap } from 'lucide-react';

export const GameSummary: React.FC = () => {
  const { results, totalScore, restartGame, startGame, settings, telemetry } = useGame();

  const isTimeAttack = settings.modeId === 'time_attack';
  const maxRoundScore = isTimeAttack ? 7500 : 5000;
  const maxTotalScore = settings.maxRounds * maxRoundScore;
  const percentage = Math.round((totalScore / maxTotalScore) * 100);

  // Calculate star rating (1 to 5 stars)
  const stars = Math.max(1, Math.min(5, Math.ceil((totalScore / maxTotalScore) * 5)));

  // Performance Tier Title
  const getPerformanceTitle = (score: number) => {
    const scale = isTimeAttack ? 1.5 : 1.0;
    if (score >= 22500 * scale) return { title: 'Geography Grandmaster', badge: '🏆' };
    if (score >= 18000 * scale) return { title: 'World Pathfinder', badge: '🧭' };
    if (score >= 12000 * scale) return { title: 'Global Explorer', badge: '🌐' };
    if (score >= 6000 * scale) return { title: 'Curious Navigator', badge: '🗺️' };
    return { title: 'Novice Traveler', badge: '🎒' };
  };

  const performance = getPerformanceTitle(totalScore);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 my-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm mb-2">
            <Trophy className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Game Summary</h1>
          <p className="text-sm text-slate-500 font-medium">
            You completed all {settings.maxRounds} rounds of the World Explorer Challenge
          </p>

          {/* Performance Title Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4 text-teal-600" />
            <span>{performance.badge} {performance.title}</span>
          </div>

          {/* Stars Rating */}
          <div className="flex justify-center gap-2 pt-1">
            {[1, 2, 3, 4, 5].map(starNum => (
              <Star
                key={starNum}
                className={`w-7 h-7 ${
                  starNum <= stars
                    ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                    : 'text-slate-200 fill-slate-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Total Score Stat Card with Animated Roll-up */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Score</div>
            <div className="text-3xl font-black text-teal-600 font-mono mt-1 flex items-baseline justify-center gap-1">
              <AnimatedScore value={totalScore} duration={850} />
              <span className="text-xs text-slate-400 font-normal"> / {maxTotalScore.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Accuracy</div>
            <div className="text-3xl font-black text-teal-700 font-mono mt-1">
              <AnimatedScore value={percentage} duration={850} suffix="%" />
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Time</div>
            <div className="text-3xl font-black text-slate-700 font-mono mt-1">
              {formatTime(results.reduce((acc, r) => acc + r.timeTakenSeconds, 0))}
            </div>
          </div>
        </div>

        {/* 5-Round Interactive Master Summary Map */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-600" />
              Master Summary Map ({results.length} Rounds)
            </h2>
          </div>

          <MatchSummaryMap
            singlePlayerResults={results}
            apiMode={telemetry.apiMode}
          />
        </div>

        {/* Round by Round Breakdown with Visual Score Tiers */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            Round Breakdown
          </h2>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {results.map((r, idx) => {
              const tier = getScoreTier(r.score, maxRoundScore);
              const tierStyle = getScoreTierStyles(tier);

              return (
                <div key={idx} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 font-mono font-bold text-xs flex items-center justify-center border border-teal-200">
                      R{r.roundNumber}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span>{r.location.name}</span>
                        {tier === 'master' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                            💎 High Score
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{r.location.city}, {r.location.country}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right font-mono">
                    {isTimeAttack && (
                      <>
                        <div>
                          <div className="text-slate-700 font-semibold">{r.timeTakenSeconds}s</div>
                          <div className="text-[10px] text-slate-400 uppercase">time</div>
                        </div>
                        <div>
                          <div className="text-sky-700 font-semibold flex items-center justify-end gap-0.5">
                            <Zap className="w-3 h-3 fill-sky-500 inline" />
                            {(r.timeMultiplier ?? 1.0).toFixed(3)}x
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase">multiplier</div>
                        </div>
                      </>
                    )}
                    <div>
                      <div className="text-slate-700 font-semibold">{formatDistance(r.distanceKm)}</div>
                      <div className="text-[10px] text-slate-400 uppercase">distance</div>
                    </div>
                    <div>
                      <div className={`font-bold ${tierStyle.textColor}`}>
                        <AnimatedScore value={r.score} duration={700} prefix="+" />
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">points</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => startGame()}
            className="flex-1 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            Play Again
          </button>
          <button
            onClick={restartGame}
            className="px-6 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Main Menu
          </button>
        </div>

      </div>
    </div>
  );
};
