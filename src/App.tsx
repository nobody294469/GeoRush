import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { MultiplayerProvider, useMultiplayer } from './context/MultiplayerContext';
import { Navbar } from './components/common/Navbar';
import { TelemetryModal } from './components/common/TelemetryModal';
import { PanoramaViewer } from './components/panorama/PanoramaViewer';
import { GuessMap } from './components/map/GuessMap';
import { RoundResultOverlay } from './components/game/RoundResultOverlay';
import { GameSummary } from './components/game/GameSummary';
import { StartScreen } from './components/game/StartScreen';
import { MultiplayerLobby } from './components/multiplayer/MultiplayerLobby';
import { MultiplayerGameScreen } from './components/multiplayer/MultiplayerGameScreen';
import { RefreshCw, Globe } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    gameStatus, 
    selectedGuess, 
    submitGuess, 
    nextRound, 
    resetPOV, 
    isTelemetryOpen, 
    isLoadingLocations,
    isStreetViewReady,
    currentRoundIndex,
    restartGame
  } = useGame();

  const [isKeyboardMapExpanded, setIsKeyboardMapExpanded] = useState<boolean>(false);

  // Keyboard Shortcuts Listener (Space = Submit/Advance, M = Toggle Map, R = Reset Camera POV)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard 1: Do not trigger if user is typing in an input or textarea
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          (activeElement as HTMLElement).isContentEditable)
      ) {
        return;
      }

      // Guard 2: Do not trigger if telemetry modal is open
      if (isTelemetryOpen) return;

      // Shortcut: R = Reset camera POV heading & pitch for current round
      if (e.code === 'KeyR') {
        if (gameStatus === 'PLAYING' && !isLoadingLocations) {
          e.preventDefault();
          resetPOV();
        }
      }

      // Shortcut: M = Toggle / expand guess map
      if (e.code === 'KeyM') {
        if (gameStatus === 'PLAYING' && !isLoadingLocations) {
          e.preventDefault();
          setIsKeyboardMapExpanded(prev => !prev);
        }
      }

      // Shortcut: Space = Submit guess (if pin placed) or Advance after round result
      if (e.code === 'Space') {
        if (gameStatus === 'PLAYING' && selectedGuess && !isLoadingLocations) {
          e.preventDefault();
          submitGuess();
        } else if (gameStatus === 'ROUND_RESULT') {
          e.preventDefault();
          nextRound();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, selectedGuess, submitGuess, nextRound, resetPOV, isTelemetryOpen, isLoadingLocations]);

  if (gameStatus === 'IDLE') {
    return (
      <>
        <StartScreen />
        <TelemetryModal />
      </>
    );
  }

  if (gameStatus === 'GAME_FINISHED') {
    return (
      <>
        <GameSummary />
        <TelemetryModal />
      </>
    );
  }

  const showLoadingOverlay = gameStatus === 'PLAYING' && (!isStreetViewReady || isLoadingLocations);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-slate-950 font-sans select-none relative">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Viewport */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {/* Fullscreen 360 Panorama Viewer */}
        <PanoramaViewer className="absolute inset-0" />

        {/* Unified Round Loading Overlay */}
        {showLoadingOverlay && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center gap-4 text-white animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 shadow-xl flex items-center justify-center text-teal-400">
              <RefreshCw className="w-9 h-9 animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center justify-center gap-2">
                <Globe className="w-5 h-5 text-teal-400" />
                <span>Loading Round {currentRoundIndex + 1}</span>
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                Resolving Street View Panorama & Location Nodes...
              </p>
            </div>
          </div>
        )}

        {/* Round Result Overlay */}
        <RoundResultOverlay />

        {/* Collapsible Guess Map (Bottom Right Corner) */}
        <div className="absolute bottom-6 right-6 z-30">
          <GuessMap isKeyboardExpanded={isKeyboardMapExpanded} />
        </div>
      </div>

      {/* Development Telemetry Modal */}
      <TelemetryModal />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { room } = useMultiplayer();

  if (room) {
    if (room.state === 'LOBBY') {
      return <MultiplayerLobby />;
    }
    return <MultiplayerGameScreen />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <MultiplayerProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </MultiplayerProvider>
  );
}
