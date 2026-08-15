import React from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Trophy, Flame, RotateCcw, Home, Skull } from 'lucide-react';

export const MultiplayerStreakFinalStandings: React.FC = () => {
  const { gameSession, isHost, playAgain, leaveRoom, room, playerId } = useMultiplayer();

  if (!gameSession || !gameSession.streakState) return null;

  const streakState = gameSession.streakState;
  const winnerId = streakState.winnerPlayerId;
  const winnerPlayer = winnerId ? room?.players.find(p => p.id === winnerId) : null;
  const isWinner = winnerId === playerId;

  let endReasonText = 'Match Completed';
  if (streakState.endReason === 'LAST_SURVIVOR') {
    endReasonText = 'Last Survivor Remaining!';
  } else if (streakState.endReason === 'SAFETY_CAP') {
    endReasonText = 'Safety Cap (100 Rounds) Reached!';
  } else if (streakState.endReason === 'ALL_ELIMINATED') {
    endReasonText = 'All Players Eliminated!';
  }

  // Sorted players by streak
  const sortedPlayers = [...(room?.players || [])].sort((a, b) => {
    const sA = streakState.playerStates[a.id]?.streak || 0;
    const sB = streakState.playerStates[b.id]?.streak || 0;
    return sB - sA;
  });

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-white space-y-6 my-auto animate-in zoom-in-95 duration-200">
        
        {/* Banner */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <Trophy className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
              {endReasonText}
            </p>
            {winnerPlayer ? (
              <h1 className="text-3xl font-black text-white">
                {isWinner ? '🎉 You Won!' : `🏆 ${winnerPlayer.displayName} Wins!`}
              </h1>
            ) : (
              <h1 className="text-3xl font-black text-amber-300">
                🤝 Match Ended in a Draw!
              </h1>
            )}
          </div>
        </div>

        {/* Final Standings Table */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Final Country Streaks</p>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {sortedPlayers.map((p, idx) => {
              const pState = streakState.playerStates[p.id];
              const pStreak = pState?.streak || 0;
              const pEliminated = pState?.isEliminated;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    p.id === winnerId
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-100 ring-2 ring-amber-500/30'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-xs text-slate-400 w-5">#{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">
                        {p.displayName} {p.id === playerId ? '(You)' : ''}
                      </p>
                      {pEliminated && (
                        <p className="text-[10px] text-rose-400 flex items-center gap-1 font-mono">
                          <Skull className="w-3 h-3" /> Eliminated in R{pState?.eliminatedInRound}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-mono font-black text-amber-400 text-base">
                    <Flame className="w-4 h-4 fill-amber-400" />
                    <span>{pStreak}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="pt-2 border-t border-slate-700/80">
          {isHost ? (
            <button
              type="button"
              onClick={playAgain}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Return to Lobby</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={leaveRoom}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm uppercase tracking-wider rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Lobby</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
