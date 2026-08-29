import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { CountrySelector } from '../common/CountrySelector';
import { Trophy, Flame, Send, Globe } from 'lucide-react';
import { getFlagEmoji } from '../../data/countryList';

export const CountryStreakHUD: React.FC = () => {
  const {
    streak,
    bestStreak,
    currentRoundIndex,
    submitCountryGuess,
    gameStatus,
    isLoadingLocations,
    currentLocation,
    nextStreakRound,
    restartGame,
    streakResult
  } = useGame();

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const handleSelectCountry = (code: string, name: string) => {
    setSelectedCode(code);
    setSelectedName(name);
  };

  const handleSubmit = () => {
    if (!selectedCode || !selectedName) return;
    submitCountryGuess(selectedCode, selectedName);
  };

  // Round Result Modal overlay
  if (gameStatus === 'ROUND_RESULT' && streakResult) {
    const { isCorrect, targetCountry, targetCountryCode, guessedCountry, guessedCountryCode } = streakResult;

    return (
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-slate-900 text-center space-y-6 animate-in zoom-in-95 duration-200">
          {isCorrect ? (
            <div className="space-y-2">
              <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <Flame className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black text-emerald-700 uppercase tracking-wide">
                Correct Country!
              </h2>
              <div className="text-3xl font-bold flex items-center justify-center gap-2 pt-2 text-slate-900">
                <span>{getFlagEmoji(targetCountryCode)}</span>
                <span>{targetCountry}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-16 h-16 bg-rose-100 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <Globe className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black text-rose-700 uppercase tracking-wide">
                Streak Broken!
              </h2>
              <div className="space-y-1 pt-2">
                <p className="text-xs text-slate-500 uppercase font-mono tracking-wider">Correct Location</p>
                <div className="text-xl font-bold flex items-center justify-center gap-2 text-slate-900">
                  <span>{getFlagEmoji(targetCountryCode)}</span>
                  <span>{targetCountry}</span>
                </div>
              </div>
              {guessedCountry && (
                <div className="space-y-1 pt-1">
                  <p className="text-xs text-slate-500 uppercase font-mono tracking-wider">You Guessed</p>
                  <div className="text-base text-slate-700 flex items-center justify-center gap-2">
                    <span>{getFlagEmoji(guessedCountryCode)}</span>
                    <span>{guessedCountry}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Streak Stats */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-mono font-bold">Achieved Streak</p>
              <p className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
                <span>{streak}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-mono font-bold">Best Streak</p>
              <p className="text-2xl font-black text-teal-700 flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5 text-teal-600" />
                <span>{bestStreak}</span>
              </p>
            </div>
          </div>

          <div className="pt-2">
            {isCorrect ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedCode(null);
                  setSelectedName(null);
                  nextStreakRound();
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider rounded-2xl shadow-md transition-colors cursor-pointer"
              >
                Next Location
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedCode(null);
                  setSelectedName(null);
                  restartGame();
                }}
                className="w-full py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-black uppercase tracking-wider rounded-2xl shadow-md transition-colors cursor-pointer"
              >
                Play Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active Gameplay HUD
  return (
    <div className="absolute top-16 left-4 right-4 sm:right-auto z-30 space-y-3 pointer-events-auto max-w-sm">
      {/* Streak Header Card */}
      <div className="bg-white/95 border border-slate-200 rounded-2xl p-3 shadow-lg backdrop-blur-md text-slate-900 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-600">
            <Flame className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-mono font-bold">Current Streak</p>
            <p className="text-lg font-black text-amber-600">{streak}</p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-600">
            <Trophy className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-mono font-bold">Best Streak</p>
            <p className="text-lg font-black text-teal-700">{bestStreak}</p>
          </div>
        </div>
      </div>

      {/* Country Selector Card */}
      <div className="space-y-2">
        <CountrySelector
          onSelectCountry={handleSelectCountry}
          selectedCountryCode={selectedCode}
          disabled={isLoadingLocations}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedCode || isLoadingLocations}
          className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
            selectedCode && !isLoadingLocations
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Submit Country Answer</span>
        </button>
      </div>
    </div>
  );
};
