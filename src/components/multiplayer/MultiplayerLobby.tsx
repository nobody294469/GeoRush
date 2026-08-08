import React, { useState } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Users, Copy, Check, Play, Settings, LogOut, Shield, Crown, WifiOff, Clock, Flame, Gamepad2, Swords } from 'lucide-react';

export const MultiplayerLobby: React.FC = () => {
  const { room, playerId, isHost, updateSettings, startGame, leaveRoom, isResolvingTarget, error, clearError } = useMultiplayer();
  const [copied, setCopied] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  if (!room) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSettingsChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">Multiplayer Room</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Lobby <Users className="w-6 h-6 text-emerald-400" />
            </h1>
          </div>

          {/* Room Code Badge */}
          <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 px-4 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Room Code</span>
              <span className="text-2xl font-black font-mono tracking-widest text-emerald-400">{room.code}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 rounded-lg transition duration-150 flex items-center gap-1 text-xs font-medium"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-xs text-rose-300 hover:text-white underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Players List (2 columns) */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                Connected Players
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {room.players.length} / 8
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {room.players.map((p) => {
                const isMe = p.id === playerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                      isMe
                        ? 'bg-slate-800/90 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                          p.isHost ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {p.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                          {p.displayName}
                          {isMe && <span className="text-xs text-emerald-400 font-normal">(You)</span>}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          {p.status === 'CONNECTED' ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                          ) : (
                            <WifiOff className="w-3 h-3 text-rose-400" />
                          )}
                          {p.status === 'CONNECTED' ? 'Ready' : 'Disconnected'}
                        </span>
                      </div>
                    </div>

                    {p.isHost && (
                      <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" /> Host
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Settings (1 column) */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-emerald-400" /> Settings
                </h2>
                {isHost && (
                  <button
                    onClick={() => setIsEditingSettings(!isEditingSettings)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                  >
                    {isEditingSettings ? 'Done' : 'Edit'}
                  </button>
                )}
              </div>

              {/* Game Type (Classic vs Duels) */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" /> Game Type
                </label>
                {isHost && isEditingSettings ? (
                  <select
                    value={room.settings.gameType || 'classic'}
                    onChange={(e) => {
                      const newType = e.target.value as 'classic' | 'duels';
                      handleSettingsChange('gameType', newType);
                      if (newType === 'duels' && room.settings.maxRounds < 10) {
                        handleSettingsChange('maxRounds', 20);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="classic">Classic (Standard Multi-round)</option>
                    <option value="duels">Duels (1v1 Health & Multipliers)</option>
                  </select>
                ) : (
                  <div>
                    <p className="text-lg font-bold text-slate-100 uppercase tracking-wider">
                      {(room.settings.gameType || 'classic') === 'duels' ? '⚔️ Duels (1v1 HP)' : '🏆 Classic'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {(room.settings.gameType || 'classic') === 'duels'
                        ? '2 Players • 6000 HP each • Score difference deals damage'
                        : 'Standard mode • High score wins'}
                    </p>
                  </div>
                )}
              </div>

              {/* Rounds */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Rounds
                </label>
                {isHost && isEditingSettings ? (
                  <select
                    value={room.settings.maxRounds}
                    onChange={(e) => handleSettingsChange('maxRounds', parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {room.settings.gameType === 'duels' ? (
                      [5, 10, 15, 20].map((num) => (
                        <option key={num} value={num}>{num} Rounds (Cap)</option>
                      ))
                    ) : (
                      [1, 3, 5, 7, 10].map((num) => (
                        <option key={num} value={num}>{num} Rounds</option>
                      ))
                    )}
                  </select>
                ) : (
                  <p className="text-lg font-bold text-slate-100">
                    {room.settings.maxRounds} {room.settings.gameType === 'duels' ? 'Rounds Max Cap' : 'Rounds'}
                  </p>
                )}
              </div>

              {/* Time Limit */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Time Limit
                </label>
                {isHost && isEditingSettings ? (
                  <select
                    value={room.settings.timeLimitSeconds}
                    onChange={(e) => handleSettingsChange('timeLimitSeconds', parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={0}>No Limit</option>
                    <option value={30}>30 Seconds</option>
                    <option value={60}>60 Seconds</option>
                    <option value={90}>90 Seconds</option>
                    <option value={120}>120 Seconds</option>
                  </select>
                ) : (
                  <p className="text-lg font-bold text-slate-100">
                    {room.settings.timeLimitSeconds > 0 ? `${room.settings.timeLimitSeconds}s per round` : 'No Limit'}
                  </p>
                )}
              </div>

              {/* Game Mode */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-400" /> Mode
                </label>
                {isHost && isEditingSettings ? (
                  <select
                    value={room.settings.gameMode}
                    onChange={(e) => handleSettingsChange('gameMode', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="normal">Normal (Standard Scoring)</option>
                    <option value="pro">Pro Mode (Strict Penalty)</option>
                  </select>
                ) : (
                  <p className="text-lg font-bold text-slate-100 capitalize">{room.settings.gameMode} Mode</p>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-700/50 pt-3">
              {isHost ? 'You are the host. You control the game settings and start time.' : 'Waiting for the host to start the game...'}
            </div>
          </div>
        </div>

        {/* Duels warning banner if player count != 2 */}
        {room.settings.gameType === 'duels' && room.players.length !== 2 && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl p-3 flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Duels Mode:</strong> Exactly 2 players are required to start a Duel match. (Currently {room.players.length} {room.players.length === 1 ? 'player' : 'players'}).
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-6">
          <button
            onClick={leaveRoom}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Leave Lobby
          </button>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={
                isResolvingTarget ||
                room.players.length === 0 ||
                (room.settings.gameType === 'duels' && room.players.length !== 2)
              }
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold text-base transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isResolvingTarget ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Resolving Street View...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> {room.settings.gameType === 'duels' ? 'Start Duel Match' : 'Start Game'}
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Waiting for host to start...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
