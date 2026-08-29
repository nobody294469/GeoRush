import React, { useState } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { CountrySelector } from '../common/CountrySelector';
import { playSound } from '../../utils/audioSystem';
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
    playSound('submit');
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
      <div className="pointer-events-auto bg-white border border-slate-200 rounded-3xl p-3 sm:p-4 shadow-xl backdrop-blur-md text-slate-900 space-y-3 min-w-[240px] max-w-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Country Streak
            </p>
            <p className="text-sm font-black text-slate-900">
              Round {gameSession.currentRound} / {gameSession.maxRounds}
            </p>
          </div>
          {timeLeft !== null && (
            <div className={`px-2.5 py-1 rounded-xl border font-mono font-bold text-xs flex items-center gap-1 ${
              timeLeft <= 10 ? 'bg-rose-100 border-rose-200 text-rose-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-700'
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
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium ${
                  pEliminated
                    ? 'bg-rose-50 text-rose-500 border border-rose-200 line-through'
                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {pEliminated ? (
                    <Skull className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  ) : pSubmitted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                  )}
                  <span className="truncate">{p.displayName} {p.id === playerId ? '(You)' : ''}</span>
                </div>

                <div className="flex items-center gap-1 font-mono font-bold text-amber-700">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
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
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl shadow-xl backdrop-blur-md text-slate-900 text-center space-y-1">
            <Skull className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="font-bold text-rose-800">You Are Eliminated</p>
            <p className="text-xs text-rose-600">Spectating remaining active players...</p>
          </div>
        ) : hasSubmitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-xl backdrop-blur-md text-slate-900 text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold text-emerald-800">Answer Submitted!</p>
            <p className="text-xs text-emerald-700">
              Guessed: <span className="font-mono font-bold text-slate-900">{selectedName}</span>. Waiting for others...
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
              className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                selectedCode && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
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
