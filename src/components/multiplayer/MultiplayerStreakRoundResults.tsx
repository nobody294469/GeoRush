import React from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Flame, Skull, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { getFlagEmoji } from '../../data/countryList';

export const MultiplayerStreakRoundResults: React.FC = () => {
  const { gameSession, isHost, nextRound, playerId } = useMultiplayer();

  if (!gameSession || !gameSession.roundResults.length) return null;

  const latestResult = gameSession.roundResults[gameSession.roundResults.length - 1];
  const target = latestResult.targetLocation;
  const streakState = gameSession.streakState;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-slate-900 space-y-6 my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header: Correct Target Country */}
        <div className="text-center space-y-2 border-b border-slate-100 pb-5">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" /> Country Streak • Round {latestResult.roundIndex}
          </p>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 uppercase font-mono">Location Country</p>
            <div className="text-3xl font-black flex items-center justify-center gap-2 text-slate-900">
              <span>{getFlagEmoji(target.countryCode)}</span>
              <span>{target.country}</span>
            </div>
          </div>
        </div>

        {/* Players Results List */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Player Results</p>
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {latestResult.guesses.map(g => {
              const pState = streakState?.playerStates[g.playerId];
              const isEliminatedNow = pState?.eliminatedInRound === latestResult.roundIndex;
              const isLocalPlayer = g.playerId === playerId;

              return (
                <div
                  key={g.playerId}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    g.isCorrectCountry
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  } ${isLocalPlayer ? 'ring-2 ring-emerald-500/50' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {g.isCorrectCountry ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate text-slate-900">
                        {g.displayName} {isLocalPlayer ? '(You)' : ''}
                      </p>
                      <p className="text-xs text-slate-600 flex items-center gap-1 truncate">
                        <span>Guessed:</span>
                        <span>{getFlagEmoji(g.guessedCountryCode)}</span>
                        <span>{g.guessedCountryName || 'No Answer'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 font-mono font-bold text-amber-700 text-sm">
                      <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{pState?.streak || 0} Streak</span>
                    </div>
                    {isEliminatedNow && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md border border-rose-200 inline-flex items-center gap-1 mt-0.5">
                        <Skull className="w-3 h-3" /> ELIMINATED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Host Control Footer */}
        <div className="pt-2 border-t border-slate-100">
          {isHost ? (
            <button
              type="button"
              onClick={nextRound}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-md shadow-emerald-600/20 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Advance to Next Round</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-center py-2 text-xs text-slate-500 font-mono">
              Waiting for host to start next round...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
