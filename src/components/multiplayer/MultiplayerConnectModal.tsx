import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Users, PlusCircle, LogIn, X, ArrowRight, Swords, Flame, Zap, Trophy, Shield } from 'lucide-react';
import { getPlayerName, setPlayerName } from '../../utils/playerProfile';

export const MultiplayerConnectModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  initialMode?: 'create' | 'join';
  initialRoomCode?: string;
  initialGameType?: 'classic' | 'duels' | 'country_streak' | 'time_attack';
  initialSettings?: {
    timeLimitSeconds?: number;
    mapId?: string;
    gameMode?: 'normal' | 'pro';
    maxRounds?: number;
  };
}> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'create', 
  initialRoomCode = '', 
  initialGameType = 'classic',
  initialSettings
}) => {
  const { createRoom, joinRoom, error, clearError } = useMultiplayer();

  const [mode, setMode] = useState<'create' | 'join'>(initialMode);
  const [selectedGameType, setSelectedGameType] = useState<'classic' | 'duels' | 'country_streak' | 'time_attack'>(initialGameType);
  const [timeLimit, setTimeLimit] = useState<number>(initialSettings?.timeLimitSeconds ?? 60);
  const [selectedMapId, setSelectedMapId] = useState<string>(initialSettings?.mapId ?? 'world');
  const [selectedMovementMode, setSelectedMovementMode] = useState<'normal' | 'pro'>(initialSettings?.gameMode ?? 'normal');
  const [displayName, setDisplayName] = useState(() => getPlayerName(''));
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode, gameType, roomCode, and settings when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (initialRoomCode) setRoomCode(initialRoomCode);
      if (initialGameType) setSelectedGameType(initialGameType);
      if (initialSettings) {
        if (initialSettings.timeLimitSeconds !== undefined) setTimeLimit(initialSettings.timeLimitSeconds);
        if (initialSettings.mapId) setSelectedMapId(initialSettings.mapId);
        if (initialSettings.gameMode) setSelectedMovementMode(initialSettings.gameMode);
      }
    }
  }, [isOpen, initialMode, initialRoomCode, initialGameType, initialSettings]);

  // Sync stored player name if changed externally
  useEffect(() => {
    if (isOpen && !displayName) {
      const stored = getPlayerName('');
      if (stored) setDisplayName(stored);
    }
  }, [isOpen, displayName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = displayName.trim() || 'Explorer';
    if (isSubmitting) return;

    setIsSubmitting(true);
    clearError();
    setPlayerName(cleanName);

    try {
      if (mode === 'create') {
        const success = await createRoom(cleanName, {
          gameType: selectedGameType,
          maxRounds: selectedGameType === 'duels' ? 10 : selectedGameType === 'country_streak' ? 100 : selectedGameType === 'time_attack' ? 5 : 5,
          timeLimitSeconds: selectedGameType === 'time_attack' ? 30 : timeLimit,
          mapId: selectedGameType === 'country_streak' ? 'world' : selectedMapId,
          gameMode: selectedMovementMode
        });
        if (success) onClose();
      } else {
        if (!roomCode.trim()) return;
        const success = await joinRoom(roomCode.trim().toUpperCase(), cleanName);
        if (success) onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 relative text-slate-900 animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            Live Lobby
          </div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            {mode === 'create' ? 'Host Match Lobby' : 'Join Existing Match'}
          </h2>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-2xl">
          <button
            type="button"
            onClick={() => { setMode('create'); clearError(); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'create' 
                ? 'bg-emerald-600 text-white font-black shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Create Room
          </button>
          <button
            type="button"
            onClick={() => { setMode('join'); clearError(); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'join' 
                ? 'bg-emerald-600 text-white font-black shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <LogIn className="w-4 h-4" /> Join Room
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="underline text-[11px] font-bold cursor-pointer">Dismiss</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Explorer Name</label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="e.g. ExplorerOne"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-600 rounded-2xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium transition-all"
            />
          </div>

          {/* Game Mode Selection when Creating */}
          {mode === 'create' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Multiplayer Mode</label>
              <div className="grid grid-cols-2 gap-2">
                
                {/* 1. Duels */}
                <button
                  type="button"
                  onClick={() => setSelectedGameType('duels')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    selectedGameType === 'duels'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                      <Swords className="w-3.5 h-3.5 text-teal-600" /> 1v1 Duels
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 text-[9px] font-bold">HP BATTLE</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    6000 HP each. Score delta deals direct health damage.
                  </p>
                </button>

                {/* 2. Classic */}
                <button
                  type="button"
                  onClick={() => setSelectedGameType('classic')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    selectedGameType === 'classic'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                      <Trophy className="w-3.5 h-3.5 text-amber-600" /> Classic
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">5 ROUNDS</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Standard multi-round point race. Highest score wins.
                  </p>
                </button>

                {/* 3. Country Streak */}
                <button
                  type="button"
                  onClick={() => setSelectedGameType('country_streak')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    selectedGameType === 'country_streak'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                      <Flame className="w-3.5 h-3.5 text-rose-600" /> Country Streak
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">SURVIVAL</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Guess the right nation. Wrong guess eliminates.
                  </p>
                </button>

                {/* 4. Time Attack */}
                <button
                  type="button"
                  onClick={() => setSelectedGameType('time_attack')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    selectedGameType === 'time_attack'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                      <Zap className="w-3.5 h-3.5 text-sky-600" /> Time Attack
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[9px] font-bold">30S FAST</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Rapid 30s timers with speed multipliers.
                  </p>
                </button>

              </div>
            </div>
          )}

          {/* Room Code if Join */}
          {mode === 'join' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Room Code</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. AB12CD"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-2xl p-3 text-sm font-mono font-black tracking-widest text-emerald-700 uppercase placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!displayName.trim() || (mode === 'join' && !roomCode.trim()) || isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'create' ? 'Launch Lobby' : 'Enter Room'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
