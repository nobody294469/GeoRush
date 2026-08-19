import React, { useState, useEffect } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Users, PlusCircle, LogIn, X, ArrowRight } from 'lucide-react';
import { getPlayerName, setPlayerName } from '../../utils/playerProfile';

export const MultiplayerConnectModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { createRoom, joinRoom, error, clearError } = useMultiplayer();

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [displayName, setDisplayName] = useState(() => getPlayerName(''));
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        const success = await createRoom(cleanName);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Multiplayer</span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            {mode === 'create' ? 'Create Room' : 'Join Room'}
          </h2>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
          <button
            type="button"
            onClick={() => { setMode('create'); clearError(); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'create' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Create Room
          </button>
          <button
            type="button"
            onClick={() => { setMode('join'); clearError(); }}
            className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'join' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" /> Join Room
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="underline text-[11px]">Dismiss</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Display Name</label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="e.g. ExplorerOne"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700/80 focus:border-emerald-500 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Room Code if Join */}
          {mode === 'join' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Room Code</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. AB12CD"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-800/90 border border-slate-700/80 focus:border-emerald-500 rounded-xl p-3 text-sm font-mono font-bold tracking-widest text-emerald-400 uppercase placeholder-slate-500 focus:outline-none"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!displayName.trim() || (mode === 'join' && !roomCode.trim()) || isSubmitting}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 text-slate-950 font-extrabold text-sm transition shadow-lg flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'create' ? 'Create Lobby' : 'Join Room'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
