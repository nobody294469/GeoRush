import React, { useEffect, useState } from 'react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { RealPanoramaViewer } from '../panorama/RealPanoramaViewer';
import { MockPanoramaViewer } from '../panorama/MockPanoramaViewer';
import { MultiplayerGuessMap } from './MultiplayerGuessMap';
import { MultiplayerRoundResults } from './MultiplayerRoundResults';
import { MultiplayerFinalStandings } from './MultiplayerFinalStandings';
import { Compass } from '../common/Compass';
import { Clock, Shield, Users, MapPin, Heart, Swords, Flame } from 'lucide-react';
import { DuelPlayerState } from '../../shared/types/multiplayer';

export const MultiplayerGameScreen: React.FC = () => {
  const { gameSession, activeTarget, room, playerId } = useMultiplayer();

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  // Timer countdown hook
  useEffect(() => {
    if (!gameSession?.roundEndsAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const remainingSec = Math.max(0, Math.ceil((gameSession.roundEndsAt! - Date.now()) / 1000));
      setTimeLeft(remainingSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [gameSession?.roundEndsAt]);

  if (!gameSession) return null;

  if (gameSession.roundState === 'ROUND_RESULTS') {
    return <MultiplayerRoundResults />;
  }

  if (gameSession.roundState === 'GAME_FINISHED') {
    return <MultiplayerFinalStandings />;
  }

  const isDuels = gameSession.gameType === 'duels' && gameSession.duelState;

  // For Duels HUD
  let myDuelState = isDuels && playerId ? gameSession.duelState?.playerStates[playerId] : undefined;
  let opponentDuelState = isDuels
    ? (Object.values(gameSession.duelState?.playerStates || {}) as DuelPlayerState[]).find(p => p.playerId !== playerId)
    : undefined;

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden select-none">
      
      {/* Top HUD Bar */}
      {isDuels ? (
        /* DUELS HUD */
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          {/* YOU CARD */}
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md flex items-center gap-3 min-w-[140px] sm:min-w-[180px]">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span className="text-emerald-400 truncate max-w-[90px] sm:max-w-[120px]">
                  {myDuelState?.displayName || 'YOU'}
                </span>
                <span className="text-amber-400 font-extrabold flex items-center gap-0.5">
                  <Swords className="w-3 h-3 inline" /> {(myDuelState?.damageMultiplier ?? 1.0).toFixed(1)}×
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-400">
                <Heart className="w-4 h-4 fill-rose-500/30 text-rose-500 shrink-0" />
                <span className="text-base sm:text-lg font-mono">{myDuelState?.hp ?? 6000}</span>
                <span className="text-[10px] text-slate-500 font-normal">/ 6000</span>
              </div>
              {/* HP Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${Math.max(0, Math.min(100, ((myDuelState?.hp ?? 6000) / 6000) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* CENTER MATCH BADGE */}
          <div className="pointer-events-auto flex flex-col items-center gap-1">
            <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 text-center">
              <span className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-widest">
                Round {gameSession.currentRound}
              </span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                Cap {gameSession.maxRounds}
              </span>
            </div>

            {/* Timer if set */}
            {timeLeft !== null && (
              <div
                className={`px-3 py-1 rounded-lg border shadow-lg backdrop-blur-md flex items-center gap-1 font-mono font-bold text-xs ${
                  timeLeft <= 10
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                    : 'bg-slate-900/90 border-slate-800 text-cyan-400'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            )}
          </div>

          {/* OPPONENT CARD */}
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md flex items-center gap-3 min-w-[140px] sm:min-w-[180px]">
            <div className="flex-1 text-right">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span className="text-amber-400 font-extrabold flex items-center gap-0.5">
                  <Swords className="w-3 h-3 inline" /> {(opponentDuelState?.damageMultiplier ?? 1.0).toFixed(1)}×
                </span>
                <span className="text-cyan-400 truncate max-w-[90px] sm:max-w-[120px]">
                  {opponentDuelState?.displayName || 'OPPONENT'}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-xs font-black text-rose-400">
                <span className="text-[10px] text-slate-500 font-normal">6000 /</span>
                <span className="text-base sm:text-lg font-mono">{opponentDuelState?.hp ?? 6000}</span>
                <Heart className="w-4 h-4 fill-rose-500/30 text-rose-500 shrink-0" />
              </div>
              {/* HP Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-rose-500 h-full transition-all duration-500 ml-auto"
                  style={{ width: `${Math.max(0, Math.min(100, ((opponentDuelState?.hp ?? 6000) / 6000) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CLASSIC HUD */
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Round Badge */}
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-800 text-slate-100 px-4 py-2 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Multiplayer</span>
              <span className="text-sm font-extrabold text-emerald-400">
                Round {gameSession.currentRound} / {gameSession.maxRounds}
              </span>
            </div>
            <span className="text-xs font-mono bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-lg text-slate-300">
              {room?.code}
            </span>
          </div>

          {/* Timer Badge */}
          {timeLeft !== null && (
            <div
              className={`pointer-events-auto px-5 py-2 rounded-xl border shadow-xl backdrop-blur-md flex items-center gap-2 font-mono font-black text-lg transition ${
                timeLeft <= 10
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                  : 'bg-slate-900/90 border-slate-800 text-cyan-400'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>{timeLeft}s</span>
            </div>
          )}

          {/* Mode & Compass */}
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl shadow-xl backdrop-blur-md">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="capitalize">{gameSession.gameMode}</span>
            </span>

            <Compass heading={0} />
          </div>
        </div>
      )}

      {/* Main Panorama Canvas */}
      <div className="w-full h-full">
        {activeTarget?.panoId && apiKey ? (
          <RealPanoramaViewer
            apiKey={apiKey}
            panoId={activeTarget.panoId}
            initialHeading={activeTarget.initialHeading}
            initialPitch={activeTarget.initialPitch}
            className="w-full h-full"
          />
        ) : (
          <MockPanoramaViewer className="w-full h-full" />
        )}
      </div>

      {/* Interactive Guess Map Overlay */}
      <MultiplayerGuessMap />

    </div>
  );
};
