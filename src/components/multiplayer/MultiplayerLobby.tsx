import React, { useState } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Users, Copy, Check, Play, Settings, LogOut, Shield, Crown, WifiOff, Clock, Flame, Gamepad2, Swords, MapPin } from 'lucide-react';
import { MAP_PRESETS } from '../../game/maps';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase">Multiplayer Room</span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              Lobby <Users className="w-6 h-6 text-emerald-600" />
            </h1>
          </div>

          {/* Room Code Badge */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 px-4 shadow-xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Room Code</span>
              <span className="text-2xl font-black font-mono tracking-widest text-emerald-700">{room.code}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 active:scale-95 text-slate-700 rounded-xl transition duration-150 flex items-center gap-1 text-xs font-medium cursor-pointer shadow-xs"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-xs text-rose-800 hover:text-rose-950 underline font-bold cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Players List (2 columns) */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Connected Players
                <span className="text-xs font-mono bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
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
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                      isMe
                        ? 'bg-emerald-50/70 border-emerald-200 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          p.isHost ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {p.displayName}
                          {isMe && <span className="text-xs text-emerald-700 font-normal">(You)</span>}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          {p.status === 'CONNECTED' ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                          ) : (
                            <WifiOff className="w-3 h-3 text-rose-500" />
                          )}
                          {p.status === 'CONNECTED' ? 'Ready' : 'Disconnected'}
                        </span>
                      </div>
                    </div>

                    {p.isHost && (
                      <span className="bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-xs">
                        <Crown className="w-3.5 h-3.5 text-amber-600" /> Host
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Settings (1 column) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-emerald-600" /> Settings
                </h2>
                {isHost && (
                  <button
                    onClick={() => setIsEditingSettings(!isEditingSettings)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    {isEditingSettings ? 'Done' : 'Edit'}
                  </button>
                )}
              </div>

              {/* Game Type (Classic vs Duels vs Country Streak) */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-600" /> Game Type
                </label>
                {isHost && isEditingSettings ? (
                  <select
                    value={room.settings.gameType || 'classic'}
                    onChange={(e) => {
                      const newType = e.target.value as 'classic' | 'duels' | 'country_streak' | 'time_attack';
                      handleSettingsChange('gameType', newType);
                      if (newType === 'duels' && room.settings.maxRounds < 10) {
                        handleSettingsChange('maxRounds', 20);
                      } else if (newType === 'country_streak') {
                        handleSettingsChange('mapId', 'world');
                        handleSettingsChange('maxRounds', 100);
                      } else if (newType === 'time_attack') {
                        handleSettingsChange('timeLimitSeconds', 30);
                        if (room.settings.maxRounds > 10) {
                          handleSettingsChange('maxRounds', 5);
                        }
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="classic">Classic (Standard Multi-round)</option>
                    <option value="duels">Duels (1v1 Health & Multipliers)</option>
                    <option value="country_streak">Country Streak (Last Survivor)</option>
                    <option value="time_attack">⚡ Time Attack (Fast 30s + Multiplier)</option>
                  </select>
                ) : (
                  <div>
                    <p className="text-base font-black text-slate-900 uppercase tracking-wider">
                      {(room.settings.gameType || 'classic') === 'duels'
                        ? '⚔️ Duels (1v1 HP)'
                        : room.settings.gameType === 'country_streak'
                        ? '🔥 Country Streak'
                        : room.settings.gameType === 'time_attack'
                        ? '⚡ Time Attack'
                        : '🏆 Classic'}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {(room.settings.gameType || 'classic') === 'duels'
                        ? '2 Players • 6000 HP each • Score difference deals damage'
                        : room.settings.gameType === 'country_streak'
                        ? 'Multiplayer elimination • World map • Last survivor wins'
                        : room.settings.gameType === 'time_attack'
                        ? '30s rounds • Speed multiplier (1.5x → 1.0x) • Pin & submit fast!'
                        : 'Standard mode • High score wins'}
                    </p>
                  </div>
                )}
              </div>

              {/* Rounds */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" /> Rounds
                </label>
                {isHost && isEditingSettings ? (
                  <select
                    value={room.settings.maxRounds}
                    onChange={(e) => handleSettingsChange('maxRounds', parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
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
                  <p className="text-base font-bold text-slate-900">
                    {room.settings.maxRounds} {room.settings.gameType === 'duels' ? 'Rounds Max Cap' : 'Rounds'}
                  </p>
                )}
              </div>

              {/* Time Limit */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-600" /> Time Limit
                </label>
                {isHost && isEditingSettings ? (
                  <select
                    value={room.settings.gameType === 'time_attack' ? 30 : room.settings.timeLimitSeconds}
                    onChange={(e) => handleSettingsChange('timeLimitSeconds', parseInt(e.target.value, 10))}
                    disabled={room.settings.gameType === 'time_attack'}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {room.settings.gameType === 'time_attack' ? (
                      <option value={30}>30 Seconds (Fixed for Time Attack)</option>
                    ) : (
                      <>
                        <option value={0}>No Limit</option>
                        <option value={30}>30 Seconds</option>
                        <option value={60}>60 Seconds</option>
                        <option value={90}>90 Seconds</option>
                        <option value={120}>120 Seconds</option>
                      </>
                    )}
                  </select>
                ) : (
                  <p className="text-base font-bold text-slate-900">
                    {room.settings.gameType === 'time_attack'
                      ? '30s per round (Fixed)'
                      : room.settings.timeLimitSeconds > 0
                      ? `${room.settings.timeLimitSeconds}s per round`
                      : 'No Limit'}
                  </p>
                )}
              </div>

              {/* Map Selection */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Map
                </label>
                {isHost && isEditingSettings ? (
                  <select
                    value={room.settings.gameType === 'country_streak' ? 'world' : (room.settings.mapId || 'world')}
                    onChange={(e) => handleSettingsChange('mapId', e.target.value)}
                    disabled={room.settings.gameType === 'country_streak'}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <option value="world">World</option>
                    <option value="europe">Europe</option>
                    <option value="india">India</option>
                    <option value="asia">Asia</option>
                    <option value="north_america">North America</option>
                    <option value="south_america">South America</option>
                    <option value="africa">Africa</option>
                    <option value="oceania">Oceania</option>
                  </select>
                ) : (
                  <p className="text-base font-bold text-slate-900 capitalize">
                    {room.settings.gameType === 'country_streak'
                      ? 'World Map (Fixed for Streak)'
                      : MAP_PRESETS[room.settings.mapId || 'world']?.name || room.settings.mapId || 'World'}
                  </p>
                )}
              </div>

              {/* Game Mode */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-600" /> Mode
                </label>
                {isHost && isEditingSettings ? (
                  <select
                    value={room.settings.gameMode}
                    onChange={(e) => handleSettingsChange('gameMode', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="normal">Normal (Standard Scoring)</option>
                    <option value="pro">Pro Mode (Strict Penalty)</option>
                  </select>
                ) : (
                  <p className="text-base font-bold text-slate-900 capitalize">{room.settings.gameMode} Mode</p>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3">
              {isHost ? 'You are the host. You control the game settings and start time.' : 'Waiting for the host to start the game...'}
            </div>
          </div>
        </div>

        {/* Duels warning banner if player count != 2 */}
        {room.settings.gameType === 'duels' && room.players.length !== 2 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl p-3 flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Duels Mode:</strong> Exactly 2 players are required to start a Duel match. (Currently {room.players.length} {room.players.length === 1 ? 'player' : 'players'}).
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <button
            onClick={leaveRoom}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
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
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isResolvingTarget ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resolving Street View...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> {room.settings.gameType === 'duels' ? 'Start Duel Match' : 'Start Game'}
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Waiting for host to start...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
