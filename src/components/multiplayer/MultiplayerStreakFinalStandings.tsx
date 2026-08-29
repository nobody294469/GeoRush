import React, { useEffect } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Trophy, Flame, RotateCcw, Home, Skull } from 'lucide-react';
import { recordCompletedMatch } from '../../utils/playerProfile';
import { playSound } from '../../utils/audioSystem';

export const MultiplayerStreakFinalStandings: React.FC = () => {
  const { gameSession, isHost, playAgain, leaveRoom, room, playerId } = useMultiplayer();

  if (!gameSession || !gameSession.streakState) return null;

  useEffect(() => {
    playSound('victory');
  }, []);

  const streakState = gameSession.streakState;
  const winnerId = streakState.winnerPlayerId;
  const winnerPlayer = winnerId ? room?.players.find(p => p.id === winnerId) : null;
  const isWinner = winnerId === playerId;

  // Idempotently record completed match statistics for the local player
  useEffect(() => {
    if (!gameSession || !playerId || !streakState) return;
    const myState = streakState.playerStates[playerId];
    const myStreak = myState ? myState.streak : 0;
    const matchId = `mp_streak_${room?.code || 'room'}_${gameSession.currentRound}`;

    recordCompletedMatch({
      matchId,
      mode: 'country_streak',
      streak: myStreak
    });
  }, [gameSession, playerId, streakState, room]);

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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-slate-900 space-y-6 my-auto animate-in zoom-in-95 duration-200">
        
        {/* Banner */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-xs">
            <Trophy className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest font-mono">
              {endReasonText}
            </p>
            {winnerPlayer ? (
              <h1 className="text-3xl font-black text-slate-900">
                {isWinner ? '🎉 You Won!' : `🏆 ${winnerPlayer.displayName} Wins!`}
              </h1>
            ) : (
              <h1 className="text-3xl font-black text-amber-800">
                🤝 Match Ended in a Draw!
              </h1>
            )}
          </div>
        </div>

        {/* Final Standings Table */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Final Country Streaks</p>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {sortedPlayers.map((p, idx) => {
              const pState = streakState.playerStates[p.id];
              const pStreak = pState?.streak || 0;
              const pEliminated = pState?.isEliminated;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    p.id === winnerId
                      ? 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-xs text-slate-400 w-5">#{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate text-slate-900">
                        {p.displayName} {p.id === playerId ? '(You)' : ''}
                      </p>
                      {pEliminated && (
                        <p className="text-[10px] text-rose-600 flex items-center gap-1 font-mono">
                          <Skull className="w-3 h-3" /> Eliminated in R{pState?.eliminatedInRound}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-mono font-black text-amber-700 text-base">
                    <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{pStreak}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="pt-2 border-t border-slate-100">
          {isHost ? (
            <button
              type="button"
              onClick={playAgain}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-600/20 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Return to Lobby</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={leaveRoom}
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm uppercase tracking-wider rounded-2xl border border-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
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
