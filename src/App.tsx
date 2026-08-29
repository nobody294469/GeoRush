import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { MultiplayerProvider, useMultiplayer } from './context/MultiplayerContext';
import { Navbar } from './components/common/Navbar';
import { PanoramaViewer } from './components/panorama/PanoramaViewer';
import { GuessMap } from './components/map/GuessMap';
import { RoundResultOverlay } from './components/game/RoundResultOverlay';
import { CountryStreakHUD } from './components/game/CountryStreakHUD';
import { GameSummary } from './components/game/GameSummary';
import { StartScreen } from './components/game/StartScreen';
import { MultiplayerLobby } from './components/multiplayer/MultiplayerLobby';
import { MultiplayerGameScreen } from './components/multiplayer/MultiplayerGameScreen';
import { FieldGuideModal } from './components/guide/FieldGuideModal';
import { ShortcutsLegend } from './components/common/ShortcutsLegend';
import { ChallengeInvitationModal } from './components/game/ChallengeInvitationModal';
import { parseChallengeUrlParams, clearChallengeUrlParams, ChallengeDuelData } from './utils/challengeManager';
import { RefreshCw, Globe, BookOpen, Keyboard, Compass } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    gameStatus, 
    selectedGuess, 
    submitGuess, 
    nextRound, 
    resetPOV, 
    isLoadingLocations,
    isStreetViewReady,
    currentRoundIndex,
    restartGame,
    settings,
    startChallengeGame
  } = useGame();

  const [isKeyboardMapExpanded, setIsKeyboardMapExpanded] = useState<boolean>(false);
  const [isFieldGuideOpen, setIsFieldGuideOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [pendingChallenge, setPendingChallenge] = useState<ChallengeDuelData | null>(null);

  // Check URL params on mount for incoming challenge duel
  useEffect(() => {
    const invite = parseChallengeUrlParams();
    if (invite) {
      setPendingChallenge(invite);
    }
  }, []);

  const handleAcceptChallenge = (challenge: ChallengeDuelData) => {
    clearChallengeUrlParams();
    setPendingChallenge(null);
    startChallengeGame(challenge);
  };

  const handleDeclineChallenge = () => {
    clearChallengeUrlParams();
    setPendingChallenge(null);
  };

  // Keyboard Shortcuts Listener (Space = Submit/Advance, M = Toggle Map, R/C = Reset Camera POV, G = Guide, ? = Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: Do not trigger if user is typing in an input or textarea
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

      // Shortcut: R or C = Reset camera POV heading & pitch for current round
      if (e.code === 'KeyR' || e.code === 'KeyC') {
        if (gameStatus === 'PLAYING' && !isLoadingLocations) {
          e.preventDefault();
          resetPOV();
        }
      }

      // Shortcut: M or Tab = Toggle / expand guess map
      if (e.code === 'KeyM') {
        if (gameStatus === 'PLAYING' && !isLoadingLocations) {
          e.preventDefault();
          setIsKeyboardMapExpanded(prev => !prev);
        }
      }

      // Shortcut: Slash or Question Mark = Shortcuts legend
      if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }

      // Shortcut: Escape = Close open modals or collapse map
      if (e.code === 'Escape') {
        setIsFieldGuideOpen(false);
        setIsShortcutsOpen(false);
        setIsKeyboardMapExpanded(false);
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
  }, [gameStatus, selectedGuess, submitGuess, nextRound, resetPOV, isLoadingLocations]);

  if (gameStatus === 'IDLE') {
    return (
      <>
        <StartScreen />
        <ChallengeInvitationModal 
          challenge={pendingChallenge}
          onAccept={handleAcceptChallenge}
          onDecline={handleDeclineChallenge}
        />
        <FieldGuideModal 
          isOpen={isFieldGuideOpen} 
          onClose={() => setIsFieldGuideOpen(false)} 
        />
        <ShortcutsLegend
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
      </>
    );
  }

  if (gameStatus === 'GAME_FINISHED') {
    return (
      <>
        <GameSummary />
        <FieldGuideModal 
          isOpen={isFieldGuideOpen} 
          onClose={() => setIsFieldGuideOpen(false)} 
        />
        <ShortcutsLegend
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
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

        {/* In-Game Floating Speed Controls Bar (Bottom Left) */}
        {gameStatus === 'PLAYING' && (
          <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2">
            <button
              onClick={resetPOV}
              className="px-3 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-700 border border-slate-200 shadow-md flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
              title="Reset starting camera view (Shortcut: R)"
            >
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              <span>Reset POV</span>
              <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono text-slate-500">R</kbd>
            </button>

            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2 rounded-xl bg-white/95 hover:bg-white text-slate-700 border border-slate-200 shadow-md flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
              title="View Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        )}

        {/* Mode-specific HUD / Controls */}
        {settings.modeId === 'country_streak' ? (
          <CountryStreakHUD />
        ) : (
          <>
            {/* Round Result Overlay */}
            <RoundResultOverlay />

            {/* Collapsible Guess Map (Bottom Right Corner) */}
            <div className="absolute bottom-6 right-6 z-30">
              <GuessMap isKeyboardExpanded={isKeyboardMapExpanded} />
            </div>
          </>
        )}
      </div>

      {/* Field Guide Modal */}
      <FieldGuideModal 
        isOpen={isFieldGuideOpen} 
        onClose={() => setIsFieldGuideOpen(false)} 
      />

      {/* Shortcuts Legend */}
      <ShortcutsLegend
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
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
