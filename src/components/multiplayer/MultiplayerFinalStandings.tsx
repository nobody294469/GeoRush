import React, { useEffect } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Trophy, Crown, RefreshCw, LogOut, Swords, Heart, ShieldAlert, Zap, Globe } from 'lucide-react';
import { DuelRoundResult, DuelPlayerState } from '../../shared/types/multiplayer';
import { MatchSummaryMap } from '../map/MatchSummaryMap';
import { AnimatedScore } from '../common/AnimatedScore';
import { getScoreTier, getScoreTierStyles } from '../../utils/scoreTiers';
import { recordCompletedMatch } from '../../utils/playerProfile';
import { playSound } from '../../utils/audioSystem';

export const MultiplayerFinalStandings: React.FC = () => {
  const { gameSession, playerId, isHost, playAgain, leaveRoom, room } = useMultiplayer();

  if (!gameSession) return null;

  useEffect(() => {
    playSound('victory');
  }, []);

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

  // Idempotently record completed match statistics for the local player
  useEffect(() => {
    if (!gameSession || !playerId) return;
    const matchId = `mp_${room?.code || 'room'}_${gameSession.currentRound}_${gameSession.gameType}`;

    if (isDuels) {
      recordCompletedMatch({
        matchId,
        mode: 'duels',
        duelWon: matchWinnerId === playerId,
        duelLost: Boolean(matchWinnerId && matchWinnerId !== playerId)
      });
    } else {
      const myStanding = standings.find(s => s.playerId === playerId);
      const score = myStanding ? myStanding.totalScore : 0;
      recordCompletedMatch({
        matchId,
        mode: isTimeAttack ? 'time_attack' : 'classic',
        score,
        mapId: room?.settings?.mapId || 'world'
      });
    }
  }, [gameSession, playerId, isDuels, isTimeAttack, matchWinnerId, standings, room]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-8 text-center my-6">
        
        {isDuels ? (
          /* DUELS FINAL SCREEN */
          <>
            {/* Winner Banner */}
            <div className="space-y-3">
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-2 mb-2 animate-bounce ${
                  isIWinner
                    ? 'bg-amber-100 border-amber-300 text-amber-600'
                    : isDraw
                    ? 'bg-cyan-100 border-cyan-300 text-cyan-600'
                    : 'bg-rose-100 border-rose-300 text-rose-600'
                }`}
              >
                {isIWinner ? <Trophy className="w-8 h-8" /> : isDraw ? <Swords className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
              </div>

              <span className="text-xs font-bold tracking-widest text-amber-700 uppercase block">
                DUEL COMPLETE
              </span>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
                {isIWinner
                  ? '🏆 YOU WIN THE DUEL!'
                  : isOpponentWinner
                  ? `💀 ${opponentState?.displayName || 'OPPONENT'} WINS!`
                  : '🤝 MATCH DRAW!'}
              </h1>

              <p className="text-xs text-slate-500 font-mono">
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
                className={`p-4 rounded-2xl border ${
                  isIWinner
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-emerald-800 flex items-center gap-1.5">
                    {myState?.displayName || 'YOU'} {isIWinner && <Crown className="w-4 h-4 text-amber-500 inline" />}
                  </span>
                  <span className="text-xs font-black text-amber-700 flex items-center gap-1">
                    <Swords className="w-3.5 h-3.5 inline" /> {(myState?.damageMultiplier ?? 1.0).toFixed(1)}×
                  </span>
                </div>

                <div className="flex items-center gap-2 text-rose-700 font-mono font-black text-lg">
                  <Heart className="w-5 h-5 fill-rose-500/30 text-rose-600 shrink-0" />
                  <span>{myState?.hp ?? 0} HP</span>
                  <span className="text-xs text-slate-400 font-normal">/ 6000</span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-emerald-600 h-full"
                    style={{ width: `${Math.max(0, Math.min(100, ((myState?.hp ?? 0) / 6000) * 100))}%` }}
                  />
                </div>
              </div>

              {/* OPPONENT */}
              <div
                className={`p-4 rounded-2xl border ${
                  isOpponentWinner
                    ? 'bg-cyan-50 border-cyan-200 text-cyan-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-cyan-800 flex items-center gap-1.5">
                    {opponentState?.displayName || 'OPPONENT'} {isOpponentWinner && <Crown className="w-4 h-4 text-amber-500 inline" />}
                  </span>
                  <span className="text-xs font-black text-amber-700 flex items-center gap-1">
                    <Swords className="w-3.5 h-3.5 inline" /> {(opponentState?.damageMultiplier ?? 1.0).toFixed(1)}×
                  </span>
                </div>

                <div className="flex items-center gap-2 text-rose-700 font-mono font-black text-lg">
                  <Heart className="w-5 h-5 fill-rose-500/30 text-rose-600 shrink-0" />
                  <span>{opponentState?.hp ?? 0} HP</span>
                  <span className="text-xs text-slate-400 font-normal">/ 6000</span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-cyan-600 h-full"
                    style={{ width: `${Math.max(0, Math.min(100, ((opponentState?.hp ?? 0) / 6000) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Duel Master Match Summary Map */}
            {roundResults.length > 0 && (
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-600" />
                    Match Summary Map ({roundResults.length} Rounds)
                  </h2>
                </div>
                <MatchSummaryMap multiplayerRoundResults={roundResults} />
              </div>
            )}

            {/* Round History */}
            <div className="space-y-2 text-left">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Match Round History</h2>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {roundResults.map((r, idx) => {
                  const winnerName = r.roundWinnerId
                    ? duelPlayers.find(p => p.playerId === r.roundWinnerId)?.displayName || 'Winner'
                    : 'Tie Round';
                  const isIWinRound = r.roundWinnerId === playerId;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">R{r.roundIndex}</span>
                        <span className="text-slate-800 font-sans truncate max-w-[150px]">
                          {r.targetLocation?.locationName || r.targetLocation?.country}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`font-sans font-bold px-2 py-0.5 rounded text-[10px] ${
                            isIWinRound
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : r.roundWinnerId
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {winnerName}
                        </span>
                        <span className="text-rose-700 font-bold">{r.damageDealt} DMG</span>
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-600 mb-2 animate-bounce">
                {isTimeAttack ? <Zap className="w-8 h-8 fill-amber-500 text-amber-600" /> : <Trophy className="w-8 h-8" />}
              </div>
              <span className="text-xs font-bold tracking-widest text-amber-700 uppercase">
                {isTimeAttack ? '⚡ Time Attack Complete' : 'Match Complete'}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
                {isIClassicWinner
                  ? '🎉 You Won the Match!'
                  : classicWinner
                  ? `${classicWinner.displayName} Wins!`
                  : 'Game Over'}
              </h1>
              <p className="text-sm text-slate-500">
                Final standings after {gameSession.maxRounds} {isTimeAttack ? 'speed' : ''} rounds
              </p>
            </div>

            {/* Match Summary Map for Multiplayer Classic & Time Attack */}
            {gameSession.roundResults && gameSession.roundResults.length > 0 && (
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-600" />
                    Interactive Match Summary Map ({gameSession.roundResults.length} Rounds)
                  </h2>
                </div>
                <MatchSummaryMap multiplayerRoundResults={gameSession.roundResults} />
              </div>
            )}

            {/* Podium / Leaderboard Table */}
            <div className="space-y-3 text-left">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Final Leaderboard</h2>
              <div className="space-y-2">
                {standings.map((p, idx) => {
                  const maxPossible = gameSession.maxRounds * (isTimeAttack ? 7500 : 5000);
                  const tier = getScoreTier(p.totalScore, maxPossible);
                  const tierStyle = getScoreTierStyles(tier);

                  return (
                    <div
                      key={p.playerId}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                        idx === 0
                          ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs ring-1 ring-amber-400/30'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
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
                        <div>
                          <div className="font-bold text-sm flex items-center gap-1.5 text-slate-900">
                            {p.displayName} {p.playerId === playerId ? '(You)' : ''}
                            {idx === 0 && <Crown className="w-4 h-4 text-amber-500" />}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Round Scores: {p.roundScores.map(s => Math.round(s || 0)).join(' | ')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-black text-lg ${tierStyle.textColor}`}>
                          <AnimatedScore value={p.totalScore} duration={800} />
                        </span>
                        <span className="text-xs text-slate-500 ml-1">pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-slate-100 pt-6">
          <button
            onClick={leaveRoom}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
          >
            <LogOut className="w-4 h-4" /> Leave Room
          </button>

          {isHost ? (
            <button
              onClick={playAgain}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm uppercase tracking-wider transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" /> Play Again
            </button>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Waiting for host to restart game or return to lobby...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
