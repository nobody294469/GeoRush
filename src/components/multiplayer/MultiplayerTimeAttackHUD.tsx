import React, { useEffect, useState } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Compass } from '../common/Compass';
import { playCountdownTick, resetCountdownAudio } from '../../utils/audioSystem';
import { Zap, Clock, Shield, CheckCircle2, User } from 'lucide-react';

interface MultiplayerTimeAttackHUDProps {
  timeLeft: number | null;
}

export const MultiplayerTimeAttackHUD: React.FC<MultiplayerTimeAttackHUDProps> = ({ timeLeft }) => {
  const { gameSession, room, playerId } = useMultiplayer();
  const [liveMultiplier, setLiveMultiplier] = useState<number>(1.5);

  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 5 && timeLeft > 0) {
      playCountdownTick(timeLeft);
    }
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      resetCountdownAudio();
    };
  }, []);

  useEffect(() => {
    if (!gameSession?.roundStartedAt) return;

    const updateMultiplier = () => {
      const now = Date.now();
      const elapsedSeconds = Math.max(0, (now - gameSession.roundStartedAt!) / 1000);

      const elapsedClamped = Math.min(30, Math.max(0, elapsedSeconds));
      const rawMult = 1.5 - (elapsedClamped / 60);
      const mult = Math.max(1.0, Math.min(1.5, rawMult));

      setLiveMultiplier(mult);
    };

    updateMultiplier();
    const interval = setInterval(updateMultiplier, 200);
    return () => clearInterval(interval);
  }, [gameSession?.roundStartedAt]);

  if (!gameSession) return null;

  const submittedCount = gameSession.submittedPlayerIds?.length || 0;
  const totalPlayers = room?.players?.length || 1;

  // Multiplier color badge style
  const isMaxSpeed = liveMultiplier >= 1.45;
  const isMediumSpeed = liveMultiplier >= 1.2 && liveMultiplier < 1.45;

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row items-start justify-between gap-4 pointer-events-none">
      
      {/* Top Left: Game Info & Speed Multiplier */}
      <div className="pointer-events-auto bg-slate-900/90 border border-slate-800 text-slate-100 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-3 min-w-[260px] sm:min-w-[300px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-amber-400" /> Time Attack
            </span>
            <span className="text-sm font-extrabold text-white">
              Round {gameSession.currentRound} / {gameSession.maxRounds}
            </span>
          </div>
          <span className="text-xs font-mono bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-lg text-slate-300">
            {room?.code}
          </span>
        </div>

        {/* Live Multiplier Gauge & Timer */}
        <div className="flex items-center justify-between gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg flex items-center gap-1 font-mono font-black text-sm transition-colors ${
                isMaxSpeed
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : isMediumSpeed
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{liveMultiplier.toFixed(2)}x</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Speed Bonus</span>
              <span className="text-[11px] font-bold text-slate-200">
                {isMaxSpeed ? '🔥 Max Multiplier' : isMediumSpeed ? '⚡ Fast Bonus' : '⏱️ Base Multiplier'}
              </span>
            </div>
          </div>

          {/* Timer Badge */}
          {timeLeft !== null && (
            <div
              className={`px-3 py-1.5 rounded-xl border shadow-md flex items-center gap-1.5 font-mono font-black text-base transition ${
                timeLeft <= 10
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-cyan-400'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
          )}
        </div>

        {/* Player Submissions List */}
        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
          {room?.players.map(p => {
            const isMe = p.id === playerId;
            const hasSubmitted = gameSession.submittedPlayerIds?.includes(p.id) ?? false;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/40 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {hasSubmitted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className={`truncate ${isMe ? 'font-bold text-emerald-400' : 'text-slate-200'}`}>
                    {p.displayName} {isMe ? '(You)' : ''}
                  </span>
                </div>
                <span className={`text-[10px] font-mono ${hasSubmitted ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasSubmitted ? 'Submitted' : 'Guessing...'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Right: Mode & Compass */}
      <div className="pointer-events-auto flex items-center gap-2">
        <span className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl shadow-xl backdrop-blur-md">
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="capitalize">{gameSession.gameMode}</span>
        </span>
        <Compass heading={0} />
      </div>

    </div>
  );
};
