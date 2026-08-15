import React, { useState } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { CountrySelector } from '../common/CountrySelector';
import { Flame, Send, Skull, CheckCircle2, Clock } from 'lucide-react';

interface MultiplayerStreakHUDProps {
  timeLeft: number | null;
}

export const MultiplayerStreakHUD: React.FC<MultiplayerStreakHUDProps> = ({ timeLeft }) => {
  const { gameSession, submitGuess, playerId, room } = useMultiplayer();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!gameSession || !gameSession.streakState) return null;

  const streakState = gameSession.streakState;
  const myState = playerId ? streakState.playerStates[playerId] : undefined;
  const isEliminated = myState?.isEliminated || false;
  const hasSubmitted = playerId ? (gameSession.submittedPlayerIds?.includes(playerId) ?? false) : false;

  const handleSelectCountry = (code: string, name: string) => {
    setSelectedCode(code);
    setSelectedName(name);
  };

  const handleSubmit = async () => {
    if (!selectedCode || isSubmitting || hasSubmitted || isEliminated) return;
    setIsSubmitting(true);
    try {
      await submitGuess(0, 0, selectedCode);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row items-start justify-between gap-4 pointer-events-none">
      
      {/* Top Left: Match Status & Player Streaks */}
      <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md text-white space-y-3 min-w-[240px] max-w-sm">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> Country Streak
            </p>
            <p className="text-sm font-black text-white">
              Round {gameSession.currentRound} / {gameSession.maxRounds}
            </p>
          </div>
          {timeLeft !== null && (
            <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs flex items-center gap-1 ${
              timeLeft <= 10 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse' : 'bg-slate-800 border-slate-700 text-cyan-400'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* Players List with Streaks & Status */}
        <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
          {room?.players.map(p => {
            const pState = streakState.playerStates[p.id];
            const pStreak = pState?.streak || 0;
            const pEliminated = pState?.isEliminated || false;
            const pSubmitted = gameSession.submittedPlayerIds?.includes(p.id) ?? false;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                  pEliminated
                    ? 'bg-rose-950/40 text-rose-400/70 border border-rose-900/30 line-through'
                    : 'bg-slate-800/60 text-slate-200 border border-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {pEliminated ? (
                    <Skull className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  ) : pSubmitted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                  )}
                  <span className="truncate">{p.displayName} {p.id === playerId ? '(You)' : ''}</span>
                </div>

                <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
                  <Flame className="w-3 h-3 fill-amber-400" />
                  <span>{pStreak}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Right / Center: Country Answer Input */}
      <div className="pointer-events-auto w-full md:w-auto max-w-sm space-y-2">
        {isEliminated ? (
          <div className="p-4 bg-rose-950/90 border border-rose-800/80 rounded-2xl shadow-2xl backdrop-blur-md text-white text-center space-y-1">
            <Skull className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="font-bold text-rose-300">You Are Eliminated</p>
            <p className="text-xs text-rose-400/80">Spectating remaining active players...</p>
          </div>
        ) : hasSubmitted ? (
          <div className="p-4 bg-emerald-950/90 border border-emerald-800/80 rounded-2xl shadow-2xl backdrop-blur-md text-white text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-emerald-300">Answer Submitted!</p>
            <p className="text-xs text-emerald-400/80">
              Guessed: <span className="font-mono font-bold text-white">{selectedName}</span>. Waiting for others...
            </p>
          </div>
        ) : (
          <>
            <CountrySelector
              onSelectCountry={handleSelectCountry}
              selectedCountryCode={selectedCode}
              disabled={isSubmitting}
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedCode || isSubmitting}
              className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                selectedCode && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Country Answer'}</span>
            </button>
          </>
        )}
      </div>

    </div>
  );
};
