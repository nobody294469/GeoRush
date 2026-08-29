import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../hooks/useAudio';
import { GameMode, TimeLimitRule, GAME_MODE_PRESETS } from '../../types/game';
import { 
  Play, 
  Clock, 
  Compass, 
  Flame, 
  AlertCircle, 
  X, 
  Users, 
  Map as MapIcon, 
  MapPin,
  Shield,
  ChevronDown, 
  User, 
  Check, 
  Volume2, 
  VolumeX, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight,
  Trophy,
  ArrowLeft,
  KeyRound,
  Gamepad2,
  ShieldCheck,
  BookOpen,
  Settings,
  Keyboard,
  Radio,
  Mountain,
  Swords,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { MapRegistry } from '../../game/mapRegistry';
import { MultiplayerConnectModal } from '../multiplayer/MultiplayerConnectModal';
import { DailyChallengeModal } from './DailyChallengeModal';
import { AchievementsModal } from '../profile/AchievementsModal';
import { LevelDetailsModal } from '../profile/LevelDetailsModal';
import { FieldGuideModal } from '../guide/FieldGuideModal';
import { SettingsModal } from '../settings/SettingsModal';
import { ShortcutsLegend } from '../common/ShortcutsLegend';
import { ExpeditionLogo } from '../common/ExpeditionLogo';
import { 
  RankInsignia, 
  MedalInsignia, 
  DailyChronometerInsignia, 
  FieldAtlasInsignia 
} from '../common/ExpeditionInsignia';
import { getActiveWallpaper } from '../../data/wallpapers';

export const StartScreen: React.FC = () => {
  const { 
    startGame, 
    settings, 
    isLoadingLocations, 
    locationError, 
    clearLocationError,
    playerName,
    updatePlayerName,
    dailyInfo,
    progression
  } = useGame();
  
  const { soundEnabled, toggleSound, ambientEnabled } = useAudio();
  
  // Navigation state: 'home' | 'solo' | 'multiplayer'
  const [screenView, setScreenView] = useState<'home' | 'solo' | 'multiplayer'>('home');

  // Solo game configuration
  const [gameType, setGameType] = useState<'classic' | 'country_streak' | 'time_attack'>('classic');
  const [selectedMapId, setSelectedMapId] = useState<string>(settings.mapId || 'world');
  const maps = MapRegistry.getInstance().getAllMaps();

  const [selectedMode, setSelectedMode] = useState<GameMode>(settings.gameMode || 'normal');
  const [timeLimit, setTimeLimit] = useState<TimeLimitRule>(settings.rules.timeLimitSeconds);
  
  // Common Multiplayer Lobby Settings (Applies across all 4 game modes)
  const [selectedMpGameType, setSelectedMpGameType] = useState<'duels' | 'classic' | 'country_streak' | 'time_attack'>('duels');
  const [mpMapId, setMpMapId] = useState<string>('world');
  const [mpTimeLimit, setMpTimeLimit] = useState<number>(60);
  const [mpGameMode, setMpGameMode] = useState<'normal' | 'pro'>('normal');
  const [mpJoinCodeInput, setMpJoinCodeInput] = useState<string>('');

  const [multiplayerSettings, setMultiplayerSettings] = useState<{
    timeLimitSeconds?: number;
    mapId?: string;
    gameMode?: 'normal' | 'pro';
  }>({});

  // Modals state
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState(false);
  const [multiplayerModalMode, setMultiplayerModalMode] = useState<'create' | 'join'>('create');
  const [multiplayerGameType, setMultiplayerGameType] = useState<'classic' | 'duels' | 'country_streak' | 'time_attack'>('duels');
  const [quickRoomCode, setQuickRoomCode] = useState('');
  
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isFieldGuideModalOpen, setIsFieldGuideModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);

  // Dynamic Wallpaper State
  const [currentWallpaperInfo, setCurrentWallpaperInfo] = useState(() => getActiveWallpaper());

  useEffect(() => {
    const updateWallpaper = () => {
      setCurrentWallpaperInfo(getActiveWallpaper());
    };
    window.addEventListener('georush_wallpaper_changed', updateWallpaper);
    window.addEventListener('storage', updateWallpaper);
    return () => {
      window.removeEventListener('georush_wallpaper_changed', updateWallpaper);
      window.removeEventListener('storage', updateWallpaper);
    };
  }, []);

  const handleStartSolo = () => {
    if (isLoadingLocations) return;
    const preset = GAME_MODE_PRESETS[selectedMode];
    startGame({
      gameMode: selectedMode,
      modeId: gameType,
      mapId: gameType === 'country_streak' ? 'world' : selectedMapId,
      maxRounds: gameType === 'country_streak' ? 100 : 5,
      rules: {
        ...preset,
        timeLimitSeconds: gameType === 'time_attack' ? 30 : timeLimit
      }
    });
  };

  const handleOpenMultiplayerModal = (
    mode: 'create' | 'join', 
    code = '', 
    gType: 'classic' | 'duels' | 'country_streak' | 'time_attack' = 'duels',
    customSettings?: {
      timeLimitSeconds?: number;
      mapId?: string;
      gameMode?: 'normal' | 'pro';
    }
  ) => {
    setMultiplayerModalMode(mode);
    setQuickRoomCode(code);
    setMultiplayerGameType(gType);
    setMultiplayerSettings(customSettings || {
      mapId: mpMapId,
      timeLimitSeconds: mpTimeLimit,
      gameMode: mpGameMode
    });
    setIsMultiplayerModalOpen(true);
  };

  const handleQuickJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = quickRoomCode.trim().toUpperCase();
    if (cleanCode.length > 0) {
      handleOpenMultiplayerModal('join', cleanCode);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim() || 'Explorer';
    updatePlayerName(clean);
    setNameInput(clean);
    setIsEditingName(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 flex flex-col justify-between relative selection:bg-emerald-500 selection:text-white">
      
      {/* Immersive Geographic Scenery Wallpaper Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={currentWallpaperInfo.wallpaper.imageUrl}
          alt={currentWallpaperInfo.wallpaper.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter saturate-110 contrast-105 transition-all duration-700"
        />
        {/* Transparent Atmospheric Vignette & Soft Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-slate-900/60 backdrop-blur-[2px]" />
      </div>

      {/* Cartographic Coordinate & Active Scenery Watermark */}
      <div className="fixed bottom-14 left-8 pointer-events-none z-10 hidden xl:flex items-center gap-3 text-[10px] font-mono text-white/70 select-none bg-slate-900/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-xs">
        <span>LAT 46°34′12″ N</span>
        <span>•</span>
        <span>LON 08°02′14″ E</span>
        <span>•</span>
        <span className="font-semibold text-emerald-300">SCENERY: {currentWallpaperInfo.wallpaper.location}</span>
      </div>

      {/* ========================================================================= */}
      {/* 1. FIXED TOP BAR (Expedition Logo, Settings, Sound, Player Name) */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-14 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        
        {/* Left: App Brand & Name */}
        <div 
          onClick={() => setScreenView('home')} 
          className="cursor-pointer group"
          title="Return to Main Menu"
        >
          <ExpeditionLogo size="sm" />
        </div>

        {/* Right Controls: Player Name, Wallpaper Pill, Sound Toggle, Settings */}
        <div className="flex items-center gap-2">
          
          {/* Player Name */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-700 text-xs font-medium shadow-xs">
            <User className="w-3.5 h-3.5 text-slate-500" />
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-24 px-1.5 py-0.5 bg-white rounded-md text-xs font-semibold text-slate-900 border border-emerald-500 focus:outline-none"
                  maxLength={20}
                  autoFocus
                />
                <button type="submit" className="p-0.5 text-emerald-600 hover:text-emerald-700 cursor-pointer">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNameInput(playerName);
                  setIsEditingName(true);
                }}
                className="font-semibold text-slate-800 hover:text-emerald-600 transition-colors cursor-pointer max-w-[120px] truncate"
                title="Click to edit player display name"
              >
                {playerName}
              </button>
            )}
          </div>

          {/* Quick Wallpaper Switcher Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs cursor-pointer transition-all"
            title={`Active Wallpaper: ${currentWallpaperInfo.wallpaper.name} (Click to change)`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline max-w-[110px] truncate">{currentWallpaperInfo.wallpaper.name}</span>
            {currentWallpaperInfo.isDailyAuto && (
              <span className="text-[9px] bg-emerald-200/70 text-emerald-900 font-mono px-1 py-0.2 rounded font-bold">
                DAILY
              </span>
            )}
          </button>

          {/* Master Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-xs ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
            }`}
            title={soundEnabled ? 'Mute Game Sound' : 'Enable Game Sound'}
            aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Settings Modal Button */}
          <button
            type="button"
            id="home-settings-btn"
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-xs transition-all cursor-pointer shadow-xs"
            title="Open Audio, Scenery & Game Settings"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Settings</span>
            {ambientEnabled && soundEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Ambient Sound Active" />
            )}
          </button>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CENTER CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="pt-16 pb-6 min-h-screen flex items-center justify-center px-3 sm:px-6 w-full max-w-5xl mx-auto relative z-10">
        <div className="w-full space-y-3.5">

          {/* Location Resolution Error Banner */}
          {locationError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left flex items-start justify-between gap-3 text-rose-900 shadow-sm animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                    Location Resolution Notice
                  </h4>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {locationError}
                  </p>
                </div>
              </div>
              <button
                onClick={clearLocationError}
                className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 1: HOME SCREEN (Left Side: Solo/Multi/Code; Right Side: Badges + Daily + Guide) */}
          {/* ========================================================================= */}
          {screenView === 'home' && (
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
              
              {/* LEFT SIDE (7 COLS): Play Solo, Multiplayer, and Join With Code */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-2.5 text-left">
                
                {/* 1. Play Solo Card (Field Expedition Card) */}
                <div 
                  onClick={() => setScreenView('solo')}
                  className="bg-white/95 backdrop-blur-md border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2.5 group relative overflow-hidden flex-1"
                >
                  {/* Subtle Cartographic Accent Top Right */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50/80 to-transparent rounded-bl-full pointer-events-none" />

                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold tracking-wide">
                        <Compass className="w-3 h-3 text-emerald-600" />
                        <span>Solo Reconnaissance</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Play Solo Expedition
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                        Drop into global street panoramas across Classic 5-round scoring, rapid 30s Time Attack, or continuous Country Streaks.
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all shrink-0 shadow-xs">
                      <Mountain className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800 relative z-10">
                    <span className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      <span>Classic 5-Round</span> • <span>Time Attack</span> • <span>Streak</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span>Configure Match</span>
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* 2. Multiplayer Card (Tactical Radar Card) */}
                <div 
                  onClick={() => setScreenView('multiplayer')}
                  className="bg-white/95 backdrop-blur-md border border-slate-200 hover:border-teal-500 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2.5 group relative overflow-hidden flex-1"
                >
                  {/* Subtle Cartographic Accent Top Right */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-50/80 to-transparent rounded-bl-full pointer-events-none" />

                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-semibold tracking-wide">
                        <Radio className="w-3 h-3 text-teal-600" />
                        <span>Live Synchronized Arena</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        Multiplayer & 1v1 Duels
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                        Host custom lobbies or battle friends in real-time synchronized rounds with live health damage, speed bonuses, and identical drops.
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-all shrink-0 shadow-xs">
                      <Swords className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:text-teal-800 relative z-10">
                    <span className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      <span>1v1 Duel Mode</span> • <span>Group Lobbies</span> • <span>Custom Seeds</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span>Host or Join</span>
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* 3. Already Have a Code? (Compact Field Pass) */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                      <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">Have a room code?</h4>
                      <p className="text-[10px] text-slate-500">Enter a 6-character room key to jump in</p>
                    </div>
                  </div>

                  <form onSubmit={handleQuickJoinSubmit} className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="ROOM CODE"
                      value={quickRoomCode}
                      onChange={(e) => setQuickRoomCode(e.target.value.toUpperCase())}
                      className="w-full sm:w-28 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold tracking-wider text-slate-900 placeholder-slate-400 uppercase focus:outline-none transition-colors text-center"
                    />
                    <button
                      type="submit"
                      disabled={!quickRoomCode.trim()}
                      className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-emerald-600 disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
                    >
                      <span>Join</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </form>
                </div>

              </div>

              {/* RIGHT SIDE (5 COLS): Circular Medals (Top) + Daily Challenge + Explorer Field Guide */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-2.5 text-left">
                
                {/* BESPOKE EXPLORER MEDALS BAR (Level Insignia, Honors Medal, Streak / Shortcuts) */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-2 sm:p-2.5 shadow-2xs flex items-center justify-around gap-2">
                  
                  {/* Rank & Level Insignia */}
                  <button
                    type="button"
                    onClick={() => setIsLevelModalOpen(true)}
                    className="flex flex-col items-center gap-0.5 group cursor-pointer"
                    title="Player Rank & Level Progression"
                  >
                    <div className="transform group-hover:scale-105 transition-transform">
                      <RankInsignia level={progression.level} className="w-9 h-9" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 font-mono">
                      {progression.progressPercent}% XP
                    </span>
                  </button>

                  <div className="w-px h-7 bg-slate-200" />

                  {/* Honors & Achievements Medal */}
                  <button
                    type="button"
                    onClick={() => setIsAchievementsModalOpen(true)}
                    className="flex flex-col items-center gap-0.5 group cursor-pointer"
                    title="Explorer Milestones & Cartographer Honors"
                  >
                    <div className="transform group-hover:scale-105 transition-transform">
                      <MedalInsignia className="w-9 h-9" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 font-mono">
                      {Object.keys(progression.unlockedAchievements).length} Badges
                    </span>
                  </button>

                  <div className="w-px h-7 bg-slate-200" />

                  {/* Daily Streak or Shortcuts Badge */}
                  {dailyInfo.currentStreak > 0 ? (
                    <div className="flex flex-col items-center gap-0.5" title="Active Daily Streak">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
                        <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
                      </div>
                      <span className="text-[10px] font-bold text-rose-600 font-mono">
                        {dailyInfo.currentStreak}d Streak
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsShortcutsOpen(true)}
                      className="flex flex-col items-center gap-0.5 group cursor-pointer"
                      title="View Keyboard Shortcuts"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <Keyboard className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 font-mono">
                        Keys
                      </span>
                    </button>
                  )}

                </div>

                {/* Daily Challenge Card (with Daily Chronometer Insignia) */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 hover:border-amber-400 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between space-y-2 transition-all flex-1">
                  <div className="flex items-start gap-3">
                    <DailyChronometerInsignia className="w-9 h-9 shrink-0" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                          Daily Expedition
                        </span>
                        {dailyInfo.isCompletedToday ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200">
                            <Sparkles className="w-3 h-3 text-amber-600" /> Today's Seed
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        Global Daily Recon
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Compete on today's unified 5-round seed and advance your daily winning streak.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDailyModalOpen(true)}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950 stroke-none" />
                    <span>{dailyInfo.isCompletedToday ? "View Today's Scores" : 'Play Daily Challenge'}</span>
                  </button>
                </div>

                {/* Explorer Field Guide Card (with Field Atlas Insignia) */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 hover:border-emerald-400 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between space-y-2 transition-all flex-1">
                  <div className="flex items-start gap-3">
                    <FieldAtlasInsignia className="w-9 h-9 shrink-0" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                          Cartography Almanac
                        </span>
                        <span className="text-[9px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          Bollards • Plates
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        Explorer Field Guide
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Master country identification with road bollards, driving sides, scripts, and camera clues.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFieldGuideModalOpen(true)}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Browse Field Guide & Meta</span>
                  </button>
                </div>

              </div>

            </main>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: SOLO CONFIGURATION SCREEN */}
          {/* ========================================================================= */}
          {screenView === 'solo' && (
            <main className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg text-left max-w-3xl mx-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setScreenView('home')}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Back to Main Menu"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Mountain className="w-4.5 h-4.5 text-emerald-600" />
                    Solo Reconnaissance Match
                  </h3>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 hidden sm:inline-block">
                  Custom Match
                </span>
              </div>

              <div className="space-y-3">
                
                {/* 1. Game Mode Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5 text-emerald-600" /> 1. Select Game Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    
                    {/* Classic Mode */}
                    <button
                      type="button"
                      onClick={() => setGameType('classic')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        gameType === 'classic'
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/30 text-slate-900'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <p className="font-bold text-xs uppercase tracking-wide text-slate-900">
                        Classic Mode
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        5 rounds of standard distance scoring (up to 5,000 pts/round).
                      </p>
                    </button>

                    {/* Time Attack */}
                    <button
                      type="button"
                      onClick={() => setGameType('time_attack')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        gameType === 'time_attack'
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/30 text-slate-900'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <p className="font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 text-slate-900">
                        <Clock className="w-3.5 h-3.5 text-sky-600" /> Time Attack
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        30s strict timer with rapid speed deduction multipliers.
                      </p>
                    </button>

                    {/* Country Streak */}
                    <button
                      type="button"
                      onClick={() => {
                        setGameType('country_streak');
                        setSelectedMapId('world');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        gameType === 'country_streak'
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/30 text-slate-900'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <p className="font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 text-slate-900">
                        <Flame className="w-3.5 h-3.5 text-rose-600" /> Country Streak
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Identify consecutive countries accurately until you miss.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Map Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MapIcon className="w-3.5 h-3.5 text-emerald-600" /> 2. Select Territory
                    </label>
                    {gameType === 'country_streak' && (
                      <span className="text-[10px] font-mono text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        WORLD MAP FIXED
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={gameType === 'country_streak' ? 'world' : selectedMapId}
                      onChange={(e) => setSelectedMapId(e.target.value)}
                      disabled={gameType === 'country_streak'}
                      className={`w-full appearance-none border text-slate-900 py-2 px-3 rounded-xl font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        gameType === 'country_streak'
                          ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-2xs'
                      }`}
                    >
                      {maps.map(map => (
                        <option key={map.id} value={map.id} className="bg-white text-slate-900">
                          {map.id === 'world' ? '🌍 ' : ''}
                          {map.id === 'india' ? '🇮🇳 ' : ''}
                          {map.id === 'asia' ? '🌏 ' : ''}
                          {map.id === 'europe' ? '🇪🇺 ' : ''}
                          {map.id === 'north_america' ? '🌎 ' : ''}
                          {map.id === 'south_america' ? '🌎 ' : ''}
                          {map.id === 'africa' ? '🌍 ' : ''}
                          {map.id === 'oceania' ? '🌏 ' : ''}
                          {map.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* 3. Movement Rules Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 3. Movement Rules
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    {/* Normal Mode */}
                    <button
                      type="button"
                      onClick={() => setSelectedMode('normal')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMode === 'normal'
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/30 text-slate-900'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs uppercase tracking-wide text-slate-900">
                          Normal Mode
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[9px] font-bold">
                          FREE MOVE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Move along roads, pan 360°, and zoom freely.
                      </p>
                    </button>

                    {/* Pro Mode */}
                    <button
                      type="button"
                      onClick={() => setSelectedMode('pro')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMode === 'pro'
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500/30 text-slate-900'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs uppercase tracking-wide text-slate-900">
                          Pro Mode
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[9px] font-bold border border-amber-200">
                          NMPZ
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        No Move, Pan, or Zoom. Pure deduction.
                      </p>
                    </button>

                  </div>
                </div>

                {/* 4. Round Time Limit */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" /> 4. Round Time Limit
                    </label>
                    {gameType === 'time_attack' && (
                      <span className="text-[10px] font-mono text-sky-800 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        FIXED 30S
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {([
                      { value: 0, label: 'Unlimited' },
                      { value: 30, label: '30s' },
                      { value: 60, label: '1m' },
                      { value: 120, label: '2m' },
                      { value: 180, label: '3m' }
                    ] as const).map(option => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={gameType === 'time_attack'}
                        onClick={() => setTimeLimit(option.value as TimeLimitRule)}
                        className={`py-1.5 px-1 rounded-lg text-xs font-semibold font-mono transition-all text-center cursor-pointer ${
                          gameType === 'time_attack'
                            ? option.value === 30
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : timeLimit === option.value
                            ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Launch Action Bar */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setScreenView('home')}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleStartSolo}
                  disabled={isLoadingLocations}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isLoadingLocations
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  {isLoadingLocations ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      <span>Resolving Panoramas...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white stroke-none" />
                      <span>Launch Match</span>
                    </>
                  )}
                </button>
              </div>

            </main>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: MULTIPLAYER ARENA SCREEN */}
          {/* ========================================================================= */}
          {screenView === 'multiplayer' && (
            <main className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg text-left max-w-4xl mx-auto">
              
              {/* Top Navigation & Title */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setScreenView('home')}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Back to Main Menu"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                      <Users className="w-4.5 h-4.5 text-teal-600" />
                      Multiplayer Arena
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200">
                    Live Matchmaking
                  </span>
                </div>
              </div>

              {/* ================================================================= */}
              {/* 1. SELECT GAME MODE (4 Available Game Modes at Top) */}
              {/* ================================================================= */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5 text-teal-600" /> 1. Select Game Mode
                  </label>
                  <span className="text-[10px] text-slate-500">Pick a game format</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  
                  {/* Mode 1: 1v1 Duels */}
                  <button
                    type="button"
                    onClick={() => setSelectedMpGameType('duels')}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative border ${
                      selectedMpGameType === 'duels'
                        ? 'bg-teal-50/80 border-teal-600 shadow-xs ring-1 ring-teal-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          selectedMpGameType === 'duels'
                            ? 'bg-teal-600 text-white'
                            : 'bg-teal-100 text-teal-700'
                        }`}>
                          <Swords className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-slate-900 leading-tight">
                          1v1 Duels
                        </span>
                      </div>
                      {selectedMpGameType === 'duels' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                      6000 HP battle. Damage health bar until knockout.
                    </p>
                  </button>

                  {/* Mode 2: Classic Group Battle */}
                  <button
                    type="button"
                    onClick={() => setSelectedMpGameType('classic')}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative border ${
                      selectedMpGameType === 'classic'
                        ? 'bg-amber-50/80 border-amber-600 shadow-xs ring-1 ring-amber-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          selectedMpGameType === 'classic'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          <Trophy className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-slate-900 leading-tight">
                          Classic Battle
                        </span>
                      </div>
                      {selectedMpGameType === 'classic' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                      5-round point race for up to 8 players.
                    </p>
                  </button>

                  {/* Mode 3: Country Streak */}
                  <button
                    type="button"
                    onClick={() => setSelectedMpGameType('country_streak')}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative border ${
                      selectedMpGameType === 'country_streak'
                        ? 'bg-rose-50/80 border-rose-600 shadow-xs ring-1 ring-rose-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          selectedMpGameType === 'country_streak'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          <Flame className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-slate-900 leading-tight">
                          Country Streak
                        </span>
                      </div>
                      {selectedMpGameType === 'country_streak' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                      Survival knockout. Guess nation or get eliminated.
                    </p>
                  </button>

                  {/* Mode 4: Time Attack */}
                  <button
                    type="button"
                    onClick={() => setSelectedMpGameType('time_attack')}
                    className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative border ${
                      selectedMpGameType === 'time_attack'
                        ? 'bg-sky-50/80 border-sky-600 shadow-xs ring-1 ring-sky-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          selectedMpGameType === 'time_attack'
                            ? 'bg-sky-600 text-white'
                            : 'bg-sky-100 text-sky-700'
                        }`}>
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-slate-900 leading-tight">
                          Blitz Attack
                        </span>
                      </div>
                      {selectedMpGameType === 'time_attack' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                      Rapid 30s rounds with speed multiplier bonuses.
                    </p>
                  </button>

                </div>
              </div>

              {/* ================================================================= */}
              {/* 2. MATCH SETTINGS (Time, Map, Mode) */}
              {/* ================================================================= */}
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3 sm:p-3.5 space-y-2.5 text-slate-900 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-teal-600" /> 2. Match Settings
                  </label>
                  <span className="text-[10px] text-slate-400">Configure parameters</span>
                </div>

                {/* 3-Column Settings Grid: Territory / Map, Time Per Round, Movement Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  
                  {/* Setting A: Map Territory */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-teal-600" /> Map Territory
                    </label>
                    <div className="relative">
                      <select
                        value={mpMapId}
                        onChange={(e) => setMpMapId(e.target.value)}
                        disabled={selectedMpGameType === 'country_streak'}
                        className="w-full bg-white border border-slate-200 hover:border-teal-400 text-slate-800 text-xs font-bold rounded-lg py-1.5 px-2 pr-7 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {selectedMpGameType === 'country_streak' ? (
                          <option value="world">🌍 World Explorer (Streak)</option>
                        ) : (
                          maps.map(map => (
                            <option key={map.id} value={map.id} className="bg-white text-slate-900">
                              {map.id === 'world' ? '🌍 ' : ''}
                              {map.id === 'india' ? '🇮🇳 ' : ''}
                              {map.id === 'asia' ? '🌏 ' : ''}
                              {map.id === 'europe' ? '🇪🇺 ' : ''}
                              {map.id === 'north_america' ? '🌎 ' : ''}
                              {map.id === 'south_america' ? '🌎 ' : ''}
                              {map.id === 'africa' ? '🌍 ' : ''}
                              {map.id === 'oceania' ? '🌏 ' : ''}
                              {map.name}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Setting B: Time Per Round */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-600" /> Time Per Round
                    </label>
                    {selectedMpGameType === 'time_attack' ? (
                      <div className="bg-white py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-bold text-sky-700 flex items-center justify-between shadow-2xs h-[30px]">
                        <span>30s Fixed (Blitz)</span>
                        <Zap className="w-3 h-3 text-sky-500" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs h-[30px] items-center">
                        {[30, 60, 90, 0].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setMpTimeLimit(sec)}
                            className={`h-full rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                              mpTimeLimit === sec
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {sec === 0 ? '∞' : `${sec}s`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Setting C: Movement Rules (Normal vs Pro) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-teal-600" /> Movement Mode
                    </label>
                    <div className="grid grid-cols-2 gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs h-[30px] items-center">
                      <button
                        type="button"
                        onClick={() => setMpGameMode('normal')}
                        className={`h-full rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                          mpGameMode === 'normal'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setMpGameMode('pro')}
                        className={`h-full rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                          mpGameMode === 'pro'
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Pro (No Move)
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* ================================================================= */}
              {/* 3. CREATE ROOM & JOIN ROOM (At Bottom - Unified Compact Row) */}
              {/* ================================================================= */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1 items-stretch">
                
                {/* Secondary Action: Join with Code (5 Columns on Desktop) */}
                <div className="sm:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-2 sm:px-3 flex items-center justify-between gap-2 text-slate-900 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-slate-600 shrink-0">
                    <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-[11px] font-bold hidden xl:inline">Code:</span>
                  </div>
                  <input
                    type="text"
                    placeholder="ROOM CODE"
                    value={mpJoinCodeInput}
                    maxLength={8}
                    onChange={(e) => setMpJoinCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && mpJoinCodeInput.trim()) {
                        handleOpenMultiplayerModal('join', mpJoinCodeInput.trim());
                      }
                    }}
                    className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 font-mono font-bold text-xs uppercase px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-full min-w-0 tracking-wider text-center"
                  />
                  <button
                    type="button"
                    disabled={!mpJoinCodeInput.trim()}
                    onClick={() => handleOpenMultiplayerModal('join', mpJoinCodeInput.trim())}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    <span>Join</span>
                  </button>
                </div>

                {/* Primary CTA: Create Room with Selected Mode (7 Columns on Desktop) */}
                <button
                  type="button"
                  onClick={() => handleOpenMultiplayerModal(
                    'create', 
                    '', 
                    selectedMpGameType, 
                    { 
                      mapId: selectedMpGameType === 'country_streak' ? 'world' : mpMapId, 
                      timeLimitSeconds: selectedMpGameType === 'time_attack' ? 30 : mpTimeLimit, 
                      gameMode: mpGameMode 
                    }
                  )}
                  className="sm:col-span-7 py-2.5 sm:py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer group"
                >
                  <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>
                    Create Room • {
                      selectedMpGameType === 'duels' ? '1v1 Duels' :
                      selectedMpGameType === 'classic' ? 'Classic Battle' :
                      selectedMpGameType === 'country_streak' ? 'Country Streak' :
                      'Blitz Attack'
                    }
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

              </div>

            </main>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FIXED BOTTOM BAR (Shortcuts / Useful Info) */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-slate-200/90 h-12 px-4 sm:px-8 flex items-center justify-between text-xs text-slate-500 shadow-xs">
        
        {/* Left: Quick Shortcuts Reminder */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Shortcuts:</span>
          </button>
          
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
            <span className="hidden md:inline"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-800">Space</kbd> Guess / Next</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden lg:inline"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-800">R</kbd> Reset POV</span>
            <span className="hidden lg:inline">•</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-800">M</kbd> Toggle Map</span>
          </div>
        </div>

        {/* Right: Useful Info & Status */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="hidden sm:inline">360° Street View Panoramas</span>
          <span className="hidden sm:inline">•</span>
          <span className="font-semibold text-emerald-700">100% Free Geography Recon</span>
        </div>
      </footer>

      {/* Daily Challenge Modal Popup */}
      <DailyChallengeModal
        isOpen={isDailyModalOpen}
        onClose={() => setIsDailyModalOpen(false)}
      />

      {/* Multiplayer Connect Modal */}
      <MultiplayerConnectModal
        isOpen={isMultiplayerModalOpen}
        initialMode={multiplayerModalMode}
        initialRoomCode={quickRoomCode}
        initialGameType={multiplayerGameType}
        initialSettings={multiplayerSettings}
        onClose={() => setIsMultiplayerModalOpen(false)}
      />

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        progression={progression}
      />

      {/* Level & XP Details Modal */}
      <LevelDetailsModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        progression={progression}
      />

      {/* Explorer Field Guide Modal */}
      <FieldGuideModal
        isOpen={isFieldGuideModalOpen}
        onClose={() => setIsFieldGuideModalOpen(false)}
      />

      {/* Game & Audio Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Keyboard Shortcuts Legend Modal */}
      <ShortcutsLegend
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

    </div>
  );
};
