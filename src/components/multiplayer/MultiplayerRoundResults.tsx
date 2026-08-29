import React, { useEffect } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { MultiplayerResultMap } from './MultiplayerResultMap';
import { AnimatedScore } from '../common/AnimatedScore';
import { getScoreTier, getScoreTierStyles } from '../../utils/scoreTiers';
import { playSound } from '../../utils/audioSystem';
import { ArrowRight, Trophy, MapPin, Heart, Swords, Zap } from 'lucide-react';
import { DuelRoundResult } from '../../shared/types/multiplayer';

export const MultiplayerRoundResults: React.FC = () => {
  const { currentRoundResult, gameSession, playerId, isHost, nextRound, isResolvingTarget, error, clearError } = useMultiplayer();

  if (!currentRoundResult || !gameSession) return null;

  const isDuels = gameSession.gameType === 'duels';
  const isTimeAttack = gameSession.gameType === 'time_attack';
  const duelResult = isDuels ? (currentRoundResult as DuelRoundResult) : undefined;
  const matchFinished = gameSession.duelState?.matchFinished || gameSession.currentRound >= gameSession.maxRounds;

  // Extract guesses for Duels (You vs Opponent)
  const myGuess = currentRoundResult.guesses.find(g => g.playerId === playerId);
  const opponentGuess = currentRoundResult.guesses.find(g => g.playerId !== playerId);

  const isRoundWinner = duelResult?.roundWinnerId === playerId;
  const isRoundLoser = duelResult?.roundWinnerId && duelResult.roundWinnerId !== playerId;
  const isTie = duelResult && duelResult.roundWinnerId === null;

  const myState = duelResult?.playerStatesAfter && playerId ? duelResult.playerStatesAfter[playerId] : undefined;
  const opponentId = opponentGuess?.playerId;
  const opponentState = duelResult?.playerStatesAfter && opponentId ? duelResult.playerStatesAfter[opponentId] : undefined;

  useEffect(() => {
    if (isRoundWinner || (myGuess && myGuess.score >= 4000)) {
      playSound('excellent');
    } else {
      playSound('score');
    }
  }, [currentRoundResult.roundIndex]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase flex items-center gap-1.5">
              {isDuels && <Swords className="w-4 h-4 text-amber-600" />}
              {isDuels ? `Duel Round ${currentRoundResult.roundIndex} Result` : `Round ${currentRoundResult.roundIndex} of ${gameSession.maxRounds} Results`}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
              <MapPin className="w-6 h-6 text-emerald-600 shrink-0" />
              {currentRoundResult.targetLocation.locationName || currentRoundResult.targetLocation.country}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Country: <span className="text-slate-800 font-medium">{currentRoundResult.targetLocation.country}</span>
            </p>
          </div>

          {isHost ? (
            <button
              onClick={nextRound}
              disabled={isResolvingTarget}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider transition shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              {isResolvingTarget ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing Next Round...
                </>
              ) : (
                <>
                  {matchFinished ? 'View Match Summary' : 'Next Round'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Waiting for host to proceed...
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-xs text-rose-800 hover:text-rose-950 underline font-bold cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Result Map (7 cols) */}
          <div className="lg:col-span-7 bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden min-h-[350px] shadow-inner">
            <MultiplayerResultMap roundResult={currentRoundResult} />
          </div>

          {/* Duels or Classic Panel (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            {isDuels && duelResult ? (
              /* DUELS ROUND SUMMARY PANEL */
              <div className="space-y-4">
                {/* Round Outcome Banner */}
                <div
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 ${
                    isRoundWinner
                      ? 'bg-emerald-100 border-emerald-200 text-emerald-900'
                      : isRoundLoser
                      ? 'bg-rose-100 border-rose-200 text-rose-900'
                      : 'bg-amber-100 border-amber-200 text-amber-900'
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-widest">
                    {isRoundWinner ? '🏆 YOU WON THE ROUND!' : isRoundLoser ? '💥 OPPONENT WON THE ROUND' : '🤝 TIE ROUND'}
                  </span>
                  <span className="text-lg font-black font-mono">
                    {duelResult.damageDealt > 0 ? `${duelResult.damageDealt} DAMAGE DEALT` : '0 DAMAGE DEALT'}
                  </span>
                </div>

                {/* Score vs Score Comparison */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Your Score</span>
                    <span className="text-xl font-mono font-black text-emerald-700">
                      <AnimatedScore value={myGuess?.score ?? 0} duration={600} />
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {myGuess?.timedOut ? 'Timed Out' : `${Math.round(myGuess?.distanceKm ?? 0)} km`}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {opponentGuess?.displayName || 'Opponent'} Score
                    </span>
                    <span className="text-xl font-mono font-black text-cyan-700">
                      <AnimatedScore value={opponentGuess?.score ?? 0} duration={600} />
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {opponentGuess?.timedOut ? 'Timed Out' : `${Math.round(opponentGuess?.distanceKm ?? 0)} km`}
                    </span>
                  </div>
                </div>

                {/* Score Difference */}
                <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center flex items-center justify-between text-xs px-4 shadow-xs">
                  <span className="text-slate-500 font-medium">Score Difference:</span>
                  <span className="font-mono font-bold text-slate-800">{duelResult.damageBase} pts</span>
                </div>

                {/* Player Health & Multipliers After Round */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  {/* YOU */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-700">{myGuess?.displayName || 'YOU'}</span>
                      <span className="font-mono text-rose-700 font-bold flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-rose-500/30 inline" /> {myState?.hp ?? 6000} / 6000
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, ((myState?.hp ?? 6000) / 6000) * 100))}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Multiplier: <strong className="text-amber-700">{(myState?.damageMultiplier ?? 1.0).toFixed(1)}×</strong></span>
                      {isRoundWinner && <span className="text-emerald-700 font-semibold">+0.5× Boost!</span>}
                      {isTie && <span className="text-amber-700 font-semibold">+0.5× Tie Boost!</span>}
                    </div>
                  </div>

                  {/* OPPONENT */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-700">{opponentGuess?.displayName || 'OPPONENT'}</span>
                      <span className="font-mono text-rose-700 font-bold flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-rose-500/30 inline" /> {opponentState?.hp ?? 6000} / 6000
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-600 h-full transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, ((opponentState?.hp ?? 6000) / 6000) * 100))}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Multiplier: <strong className="text-amber-700">{(opponentState?.damageMultiplier ?? 1.0).toFixed(1)}×</strong></span>
                      {isRoundLoser && <span className="text-emerald-700 font-semibold">+0.5× Boost!</span>}
                      {isTie && <span className="text-amber-700 font-semibold">+0.5× Tie Boost!</span>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* CLASSIC / TIME ATTACK LEADERBOARD PANEL */
              <div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  {isTimeAttack ? (
                    <>
                      <Zap className="w-4 h-4 text-amber-600 fill-amber-500" /> Time Attack Leaderboard
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 text-amber-600" /> Round Leaderboard
                    </>
                  )}
                </h2>

                <div className="space-y-2">
                  {currentRoundResult.guesses.map((guess, idx) => {
                    const playerStanding = gameSession.standings.find(s => s.playerId === guess.playerId);
                    const baseScore = guess.baseScore ?? Math.round(guess.score);
                    const multiplier = guess.timeMultiplier ?? 1.0;
                    const maxScore = isTimeAttack ? 7500 : 5000;
                    const tier = getScoreTier(guess.score, maxScore);
                    const tierStyle = getScoreTierStyles(tier);

                    return (
                      <div
                        key={guess.playerId}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-800'
                                : idx === 2
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              {guess.displayName}
                              {isTimeAttack && !guess.timedOut && (
                                <span className="bg-amber-100 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-0.5">
                                  <Zap className="w-3 h-3 fill-current inline text-amber-600" />
                                  {multiplier.toFixed(2)}x
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {guess.timedOut ? 'Timed Out' : `${Math.round(guess.distanceKm)} km away`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-mono font-black text-sm ${tierStyle.textColor}`}>
                            <AnimatedScore value={guess.score} duration={650} prefix="+" /> pts
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {isTimeAttack && !guess.timedOut && (
                              <span className="text-slate-400 mr-2">Base: {Math.round(baseScore)}</span>
                            )}
                            Total: {playerStanding?.totalScore || 0} pts
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3 flex items-center justify-between">
              <span>Mode: {gameSession.gameMode.toUpperCase()}</span>
              <span>Type: {(gameSession.gameType || 'classic').toUpperCase()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
