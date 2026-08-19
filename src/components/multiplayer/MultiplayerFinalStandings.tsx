import React from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Trophy, Crown, RefreshCw, LogOut, Swords, Heart, ShieldAlert, Zap, Globe } from 'lucide-react';
import { DuelRoundResult, DuelPlayerState } from '../../shared/types/multiplayer';
import { MatchSummaryMap } from '../map/MatchSummaryMap';
import { AnimatedScore } from '../common/AnimatedScore';
import { getScoreTier, getScoreTierStyles } from '../../utils/scoreTiers';

export const MultiplayerFinalStandings: React.FC = () => {
  const { gameSession, playerId, isHost, playAgain, leaveRoom, room } = useMultiplayer();

  if (!gameSession) return null;

  const isDuels = gameSession.gameType === 'duels';
  const isTimeAttack = gameSession.gameType === 'time_attack';
  const duelState = gameSession.duelState;

  // Classic / Time Attack Mode values
  const standings = gameSession.standings;
  const classicWinner = standings[0];
  const isIClassicWinner = classicWinner?.playerId === playerId;

  // Duels Mode values
  const matchWinnerId = duelState?.matchWinnerId;
  const isDraw = duelState?.isDraw;
  const endReason = duelState?.endReason;

  const isIWinner = matchWinnerId === playerId;
  const isOpponentWinner = matchWinnerId && matchWinnerId !== playerId;

  const duelPlayers = (Object.values(duelState?.playerStates || {}) as DuelPlayerState[]);
  const myState = playerId && duelState?.playerStates ? duelState.playerStates[playerId] : undefined;
  const opponentState = duelPlayers.find(p => p.playerId !== playerId);

  const roundResults = (gameSession.roundResults || []) as DuelRoundResult[];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-8 text-center my-6">
        
        {isDuels ? (
          /* DUELS FINAL SCREEN */
          <>
            {/* Winner Banner */}
            <div className="space-y-3">
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 mb-2 animate-bounce ${
                  isIWinner
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : isDraw
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                }`}
              >
                {isIWinner ? <Trophy className="w-8 h-8" /> : isDraw ? <Swords className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
              </div>

              <span className="text-xs font-extrabold tracking-widest text-amber-400 uppercase block">
                DUEL COMPLETE
              </span>

              <h1 className="text-3xl sm:text-4xl font-black text-white">
                {isIWinner
                  ? '🏆 YOU WIN THE DUEL!'
                  : isOpponentWinner
                  ? `💀 ${opponentState?.displayName || 'OPPONENT'} WINS!`
                  : '🤝 MATCH DRAW!'}
              </h1>

              <p className="text-xs text-slate-400 font-mono">
                {endReason === 'KNOCKOUT' && 'Match concluded by Knockout (0 HP)'}
                {endReason === 'MAX_ROUNDS' && `Match concluded at ${gameSession.maxRounds}-round cap`}
                {endReason === 'FORFEIT' && 'Match concluded due to opponent disconnection'}
                {!endReason && `Total Rounds Played: ${gameSession.currentRound}`}
              </p>
            </div>

            {/* Final Player Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {/* YOU */}
              <div
                className={`p-4 rounded-xl border ${
                  isIWinner
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-100'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    {myState?.displayName || 'YOU'} {isIWinner && <Crown className="w-4 h-4 text-amber-400 inline" />}
                  </span>
                  <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1">
                    <Swords className="w-3.5 h-3.5 inline" /> {(myState?.damageMultiplier ?? 1.0).toFixed(1)}×
                  </span>
                </div>

                <div className="flex items-center gap-2 text-rose-400 font-mono font-black text-lg">
                  <Heart className="w-5 h-5 fill-rose-500/30 text-rose-500 shrink-0" />
                  <span>{myState?.hp ?? 0} HP</span>
                  <span className="text-xs text-slate-500 font-normal">/ 6000</span>
                </div>

                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${Math.max(0, Math.min(100, ((myState?.hp ?? 0) / 6000) * 100))}%` }}
                  />
                </div>
              </div>

              {/* OPPONENT */}
              <div
                className={`p-4 rounded-xl border ${
                  isOpponentWinner
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-100'
                    : 'bg-slate-800/60 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-cyan-400 flex items-center gap-1.5">
                    {opponentState?.displayName || 'OPPONENT'} {isOpponentWinner && <Crown className="w-4 h-4 text-amber-400 inline" />}
                  </span>
                  <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1">
                    <Swords className="w-3.5 h-3.5 inline" /> {(opponentState?.damageMultiplier ?? 1.0).toFixed(1)}×
                  </span>
                </div>

                <div className="flex items-center gap-2 text-rose-400 font-mono font-black text-lg">
                  <Heart className="w-5 h-5 fill-rose-500/30 text-rose-500 shrink-0" />
                  <span>{opponentState?.hp ?? 0} HP</span>
                  <span className="text-xs text-slate-500 font-normal">/ 6000</span>
                </div>

                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-cyan-500 h-full"
                    style={{ width: `${Math.max(0, Math.min(100, ((opponentState?.hp ?? 0) / 6000) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Duel Master Match Summary Map */}
            {roundResults.length > 0 && (
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-400" />
                    Match Summary Map ({roundResults.length} Rounds)
                  </h2>
                </div>
                <MatchSummaryMap multiplayerRoundResults={roundResults} />
              </div>
            )}

            {/* Round History */}
            <div className="space-y-2 text-left">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Match Round History</h2>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {roundResults.map((r, idx) => {
                  const winnerName = r.roundWinnerId
                    ? duelPlayers.find(p => p.playerId === r.roundWinnerId)?.displayName || 'Winner'
                    : 'Tie Round';
                  const isIWinRound = r.roundWinnerId === playerId;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold">R{r.roundIndex}</span>
                        <span className="text-slate-300 font-sans truncate max-w-[150px]">
                          {r.targetLocation?.locationName || r.targetLocation?.country}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`font-sans font-bold px-2 py-0.5 rounded text-[10px] ${
                            isIWinRound
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : r.roundWinnerId
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {winnerName}
                        </span>
                        <span className="text-rose-400 font-bold">{r.damageDealt} DMG</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* CLASSIC / TIME ATTACK FINAL SCREEN */
          <>
            {/* Winner Banner */}
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 mb-2 animate-bounce">
                {isTimeAttack ? <Zap className="w-8 h-8 fill-amber-400" /> : <Trophy className="w-8 h-8" />}
              </div>
              <span className="text-xs font-extrabold tracking-widest text-amber-400 uppercase">
                {isTimeAttack ? '⚡ Time Attack Complete' : 'Match Complete'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white">
                {isIClassicWinner
                  ? '🎉 You Won the Match!'
                  : classicWinner
                  ? `${classicWinner.displayName} Wins!`
                  : 'Game Over'}
              </h1>
              <p className="text-sm text-slate-400">
                Final standings after {gameSession.maxRounds} {isTimeAttack ? 'speed' : ''} rounds
              </p>
            </div>

            {/* Match Summary Map for Multiplayer Classic & Time Attack */}
            {gameSession.roundResults && gameSession.roundResults.length > 0 && (
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-400" />
                    Interactive Match Summary Map ({gameSession.roundResults.length} Rounds)
                  </h2>
                </div>
                <MatchSummaryMap multiplayerRoundResults={gameSession.roundResults} />
              </div>
            )}

            {/* Podium / Leaderboard Table */}
            <div className="space-y-3 text-left">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Leaderboard</h2>
              <div className="space-y-2">
                {standings.map((p, idx) => {
                  const maxPossible = gameSession.maxRounds * (isTimeAttack ? 7500 : 5000);
                  const tier = getScoreTier(p.totalScore, maxPossible);
                  const tierStyle = getScoreTierStyles(tier);

                  return (
                    <div
                      key={p.playerId}
                      className={`flex items-center justify-between p-4 rounded-xl border transition ${
                        idx === 0
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-100 shadow-lg ring-1 ring-amber-400/30'
                          : 'bg-slate-800/60 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
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
                        <div>
                          <div className="font-bold text-sm flex items-center gap-1.5">
                            {p.displayName} {p.playerId === playerId ? '(You)' : ''}
                            {idx === 0 && <Crown className="w-4 h-4 text-amber-400" />}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Round Scores: {p.roundScores.map(s => Math.round(s || 0)).join(' | ')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-black text-lg ${tierStyle.textColor}`}>
                          <AnimatedScore value={p.totalScore} duration={800} />
                        </span>
                        <span className="text-xs text-slate-400 ml-1">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-slate-800 pt-6">
          <button
            onClick={leaveRoom}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Leave Room
          </button>

          {isHost ? (
            <button
              onClick={playAgain}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold text-base transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" /> Play Again
            </button>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Waiting for host to restart game or return to lobby...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

