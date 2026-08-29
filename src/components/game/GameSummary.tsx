import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { formatDistance, formatTime } from '../../utils/scoring';
import { MatchSummaryMap } from '../map/MatchSummaryMap';
import { AnimatedScore } from '../common/AnimatedScore';
import { getScoreTier, getScoreTierStyles } from '../../utils/scoreTiers';
import { playSound } from '../../utils/audioSystem';
import { ShareChallengeModal } from './ShareChallengeModal';
import { Trophy, Star, RotateCcw, MapPin, ArrowLeft, Globe, Award, Zap, Sparkles, Calendar, Flame, CheckCircle2, Swords, Share2 } from 'lucide-react';

export const GameSummary: React.FC = () => {
  const { 
    results, 
    totalScore, 
    restartGame, 
    startGame, 
    settings, 
    telemetry, 
    personalBestResult, 
    dailyInfo,
    progression,
    latestMatchXP,
    newlyUnlockedAchievements,
    activeChallenge,
    currentSessionSeed,
    playerName
  } = useGame();

  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  useEffect(() => {
    playSound('victory');
  }, []);

  const isDailyChallenge = settings.modeId === 'daily_challenge';
  const isTimeAttack = settings.modeId === 'time_attack';
  const maxRoundScore = isTimeAttack ? 7500 : 5000;
  const maxTotalScore = settings.maxRounds * maxRoundScore;
  const percentage = Math.round((totalScore / maxTotalScore) * 100);

  const isNewRecord = personalBestResult && (
    personalBestResult.isNewBestOverall ||
    personalBestResult.isNewModeBest ||
    personalBestResult.isNewMapBest
  );

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 bg-cartography-pattern">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 my-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-amber-100 text-amber-600 border border-amber-200 shadow-xs mb-1">
            <Trophy className="w-9 h-9" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {isDailyChallenge ? 'Daily Challenge Complete!' : 'Game Summary'}
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            {isDailyChallenge
              ? `You finished today's 5-round World Challenge`
              : `You completed all ${settings.maxRounds} rounds of GeoRush`}
          </p>

          {/* Daily Challenge Streak Badge */}
          {isDailyChallenge && (
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-black uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{dailyInfo.currentStreak} Day Daily Streak</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Today's Challenge Completed</span>
              </div>
            </div>
          )}

          {/* Personal Best Alert Badge */}
          {isNewRecord && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-black uppercase tracking-wider animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>New Personal Best Record!</span>
            </div>
          )}

          {/* Performance Title Badge */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>{performance.badge} {performance.title}</span>
            </div>
          </div>

          {/* Active Challenge Duel Head-to-Head Card */}
          {activeChallenge && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-emerald-200 text-slate-800 max-w-md mx-auto space-y-2 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-wider">
                <Swords className="w-4 h-4" />
                <span>Duel Match Result</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-200">
                <div className="text-center">
                  <div className="text-[11px] font-bold text-slate-500 truncate">{activeChallenge.challengerName}</div>
                  <div className="text-xl font-mono font-bold text-slate-800">{activeChallenge.challengerScore.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-bold text-emerald-700 truncate">You ({playerName})</div>
                  <div className="text-xl font-mono font-bold text-emerald-700">{totalScore.toLocaleString()}</div>
                </div>
              </div>
              <div className="text-xs font-black uppercase tracking-wider pt-1">
                {totalScore > activeChallenge.challengerScore ? (
                  <span className="text-emerald-700">🏆 Victory! You beat {activeChallenge.challengerName}!</span>
                ) : totalScore < activeChallenge.challengerScore ? (
                  <span className="text-amber-700">⚔️ Defeat! {activeChallenge.challengerName} scored higher.</span>
                ) : (
                  <span className="text-sky-700">🤝 It's an exact tie match!</span>
                )}
              </div>
            </div>
          )}

          {/* Stars Rating */}
          <div className="flex justify-center gap-2 pt-1">
            {[1, 2, 3, 4, 5].map(starNum => (
              <Star
                key={starNum}
                className={`w-7 h-7 ${
                  starNum <= stars
                    ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                    : 'text-slate-200 fill-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Total Score Stat Card with Animated Roll-up */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Score</div>
            <div className="text-3xl font-black text-emerald-700 font-mono mt-1 flex items-baseline justify-center gap-1">
              <AnimatedScore value={totalScore} duration={850} />
              <span className="text-xs text-slate-400 font-normal"> / {maxTotalScore.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Accuracy</div>
            <div className="text-3xl font-black text-slate-900 font-mono mt-1">
              <AnimatedScore value={percentage} duration={850} suffix="%" />
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Time</div>
            <div className="text-3xl font-black text-slate-800 font-mono mt-1">
              {formatTime(results.reduce((acc, r) => acc + r.timeTakenSeconds, 0))}
            </div>
          </div>
        </div>

        {/* XP & Player Progression Card */}
        {latestMatchXP && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 text-slate-900 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                    EXP Earned
                  </span>
                  <span className="text-xs text-emerald-700 font-bold">
                    {progression.title} (Level {progression.level})
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-amber-600 flex items-center gap-1.5">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  +{latestMatchXP.totalXP.toLocaleString()} XP
                </div>
              </div>

              {/* Mini XP Breakdown Tags */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                  Base: +{latestMatchXP.baseScoreXP} XP
                </span>
                {latestMatchXP.accuracyBonusXP > 0 && (
                  <span className="bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-800">
                    Accuracy: +{latestMatchXP.accuracyBonusXP} XP
                  </span>
                )}
                {latestMatchXP.speedBonusXP > 0 && (
                  <span className="bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-800">
                    Speed: +{latestMatchXP.speedBonusXP} XP
                  </span>
                )}
                {latestMatchXP.dailyBonusXP > 0 && (
                  <span className="bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 text-amber-800">
                    Daily: +{latestMatchXP.dailyBonusXP} XP
                  </span>
                )}
              </div>
            </div>

            {/* Level Bar */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
                <span>Level {progression.level} Progress</span>
                <span>{progression.currentLevelXP.toLocaleString()} / {progression.nextLevelXP.toLocaleString()} XP ({progression.progressPercent}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progression.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Newly Unlocked Achievements Notification Banner */}
        {newlyUnlockedAchievements.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800">
              <Trophy className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Achievement Unlocked! ({newlyUnlockedAchievements.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {newlyUnlockedAchievements.map(ach => (
                <div key={ach.id} className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-xs shadow-xs">
                  <div>
                    <div className="font-bold text-slate-900">{ach.title}</div>
                    <div className="text-[11px] text-slate-500">{ach.description}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[10px] shrink-0 border border-amber-200">
                    +{ach.xpReward} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5-Round Interactive Master Summary Map */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              Master Summary Map ({results.length} Rounds)
            </h2>
          </div>

          <MatchSummaryMap
            singlePlayerResults={results}
            apiMode={telemetry.apiMode}
          />
        </div>

        {/* Round by Round Breakdown */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Round Breakdown
          </h2>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200 overflow-hidden shadow-xs">
            {results.map((r, idx) => {
              const tier = getScoreTier(r.score, maxRoundScore);

              return (
                <div key={idx} className="p-4 flex items-center justify-between text-sm hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white text-emerald-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200 shadow-xs">
                      R{r.roundNumber}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{r.location.name}</span>
                        {tier === 'master' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            💎 Bullseye
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{r.location.city ? `${r.location.city}, ` : ''}{r.location.country}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 text-right font-mono">
                    {isTimeAttack && (
                      <>
                        <div>
                          <div className="text-slate-700 font-semibold">{r.timeTakenSeconds}s</div>
                          <div className="text-[10px] text-slate-400 uppercase">time</div>
                        </div>
                        <div>
                          <div className="text-sky-700 font-semibold flex items-center justify-end gap-0.5">
                            <Zap className="w-3 h-3 fill-sky-600 text-sky-600 inline" />
                            {(r.timeMultiplier ?? 1.0).toFixed(3)}x
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase">mult</div>
                        </div>
                      </>
                    )}
                    <div>
                      <div className="text-slate-700 font-semibold">{formatDistance(r.distanceKm)}</div>
                      <div className="text-[10px] text-slate-400 uppercase">distance</div>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-700">
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
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
          {isDailyChallenge ? (
            <button
              onClick={restartGame}
              className="flex-1 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Main Menu (Challenge Recorded)
            </button>
          ) : (
            <>
              <button
                onClick={() => startGame()}
                className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[3]" />
                Play Again
              </button>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                Challenge Friends
              </button>
              <button
                onClick={restartGame}
                className="px-6 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Main Menu
              </button>
            </>
          )}
        </div>

        {/* Share Challenge Modal */}
        <ShareChallengeModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          challengeData={{
            seed: currentSessionSeed || 'EXP-SOLO',
            challengerName: playerName || 'Anonymous Explorer',
            challengerScore: totalScore,
            mapId: settings.mapId || 'world',
            gameMode: settings.gameMode,
            modeId: (settings.modeId === 'time_attack' ? 'time_attack' : 'classic'),
            timeLimit: settings.rules.timeLimitSeconds,
            maxRounds: settings.maxRounds,
            roundScores: results.map(r => r.score),
            createdAt: Date.now()
          }}
          score={totalScore}
          seed={currentSessionSeed}
          challengerName={playerName}
          gameMode={settings.gameMode}
          modeId={settings.modeId === 'time_attack' ? 'time_attack' : 'classic'}
          mapId={settings.mapId}
          timeLimit={settings.rules.timeLimitSeconds}
          maxRounds={settings.maxRounds}
          roundScores={results.map(r => r.score)}
        />

      </div>
    </div>
  );
};
