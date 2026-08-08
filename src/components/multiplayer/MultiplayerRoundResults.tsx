import React from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { MultiplayerResultMap } from './MultiplayerResultMap';
import { Award, ArrowRight, Trophy, MapPin, Navigation, Clock, Heart, Swords, ShieldAlert } from 'lucide-react';
import { DuelRoundResult } from '../../shared/types/multiplayer';

export const MultiplayerRoundResults: React.FC = () => {
  const { currentRoundResult, gameSession, playerId, isHost, nextRound, isResolvingTarget, error, clearError } = useMultiplayer();

  if (!currentRoundResult || !gameSession) return null;

  const isDuels = gameSession.gameType === 'duels';
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
              {isDuels && <Swords className="w-4 h-4 text-amber-400" />}
              {isDuels ? `Duel Round ${currentRoundResult.roundIndex} Result` : `Round ${currentRoundResult.roundIndex} of ${gameSession.maxRounds} Results`}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2 mt-0.5">
              <MapPin className="w-6 h-6 text-emerald-400 shrink-0" />
              {currentRoundResult.targetLocation.locationName || currentRoundResult.targetLocation.country}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Country: <span className="text-slate-200 font-medium">{currentRoundResult.targetLocation.country}</span>
            </p>
          </div>

          {isHost ? (
            <button
              onClick={nextRound}
              disabled={isResolvingTarget}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 text-slate-950 font-extrabold text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              {isResolvingTarget ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Waiting for host to proceed...
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-xs text-rose-300 hover:text-white underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Result Map (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden min-h-[350px] shadow-inner">
            <MultiplayerResultMap roundResult={currentRoundResult} />
          </div>

          {/* Duels or Classic Panel (5 cols) */}
          <div className="lg:col-span-5 bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 space-y-4 flex flex-col justify-between">
            {isDuels && duelResult ? (
              /* DUELS ROUND SUMMARY PANEL */
              <div className="space-y-4">
                {/* Round Outcome Banner */}
                <div
                  className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 ${
                    isRoundWinner
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : isRoundLoser
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <span className="text-xs font-extrabold uppercase tracking-widest">
                    {isRoundWinner ? '🏆 YOU WON THE ROUND!' : isRoundLoser ? '💥 OPPONENT WON THE ROUND' : '🤝 TIE ROUND'}
                  </span>
                  <span className="text-lg font-black font-mono">
                    {duelResult.damageDealt > 0 ? `${duelResult.damageDealt} DAMAGE DEALT` : '0 DAMAGE DEALT'}
                  </span>
                </div>

                {/* Score vs Score Comparison */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Score</span>
                    <span className="text-xl font-mono font-black text-emerald-400">
                      {Math.round(myGuess?.score ?? 0)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {myGuess?.timedOut ? 'Timed Out' : `${Math.round(myGuess?.distanceKm ?? 0)} km`}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-700/70 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {opponentGuess?.displayName || 'Opponent'} Score
                    </span>
                    <span className="text-xl font-mono font-black text-cyan-400">
                      {Math.round(opponentGuess?.score ?? 0)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {opponentGuess?.timedOut ? 'Timed Out' : `${Math.round(opponentGuess?.distanceKm ?? 0)} km`}
                    </span>
                  </div>
                </div>

                {/* Score Difference */}
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-2.5 text-center flex items-center justify-between text-xs px-4">
                  <span className="text-slate-400 font-medium">Score Difference:</span>
                  <span className="font-mono font-bold text-slate-200">{duelResult.damageBase} pts</span>
                </div>

                {/* Player Health & Multipliers After Round */}
                <div className="space-y-3 pt-2 border-t border-slate-700/50">
                  {/* YOU */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">{myGuess?.displayName || 'YOU'}</span>
                      <span className="font-mono text-rose-400 font-bold flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-rose-500/30 inline" /> {myState?.hp ?? 6000} / 6000
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, ((myState?.hp ?? 6000) / 6000) * 100))}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Multiplier: <strong className="text-amber-400">{(myState?.damageMultiplier ?? 1.0).toFixed(1)}×</strong></span>
                      {isRoundWinner && <span className="text-emerald-400 font-semibold">+0.5× Boost!</span>}
                      {isTie && <span className="text-amber-300 font-semibold">+0.5× Tie Boost!</span>}
                    </div>
                  </div>

                  {/* OPPONENT */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400">{opponentGuess?.displayName || 'OPPONENT'}</span>
                      <span className="font-mono text-rose-400 font-bold flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-rose-500/30 inline" /> {opponentState?.hp ?? 6000} / 6000
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, ((opponentState?.hp ?? 6000) / 6000) * 100))}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Multiplier: <strong className="text-amber-400">{(opponentState?.damageMultiplier ?? 1.0).toFixed(1)}×</strong></span>
                      {isRoundLoser && <span className="text-emerald-400 font-semibold">+0.5× Boost!</span>}
                      {isTie && <span className="text-amber-300 font-semibold">+0.5× Tie Boost!</span>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* CLASSIC LEADERBOARD PANEL */
              <div>
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Trophy className="w-4 h-4 text-amber-400" /> Round Leaderboard
                </h2>

                <div className="space-y-2">
                  {currentRoundResult.guesses.map((guess, idx) => {
                    const playerStanding = gameSession.standings.find(s => s.playerId === guess.playerId);
                    return (
                      <div
                        key={guess.playerId}
                        className="flex items-center justify-between p-3 bg-slate-800/80 border border-slate-700/70 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black ${
                              idx === 0
                                ? 'bg-amber-400 text-slate-950'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-100">{guess.displayName}</span>
                            <span className="text-[11px] text-slate-400">
                              {guess.timedOut ? 'Timed Out' : `${Math.round(guess.distanceKm)} km away`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-black text-emerald-400 text-sm">
                            +{Math.round(guess.score)} pts
                          </span>
                          <div className="text-[10px] text-slate-400">
                            Total: {playerStanding?.totalScore || 0} pts
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-400 border-t border-slate-700/50 pt-3 flex items-center justify-between">
              <span>Mode: {gameSession.gameMode.toUpperCase()}</span>
              <span>Type: {(gameSession.gameType || 'classic').toUpperCase()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
