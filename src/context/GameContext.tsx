import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameStatus, 
  Location, 
  LocationNode, 
  RoundResult, 
  GameSettings, 
  GameRules,
  TelemetryData 
} from '../types/game';
import { MOCK_LOCATIONS } from '../data/mockLocations';
import { devTelemetry } from '../utils/telemetry';
import { WORLD_MAP, MAP_PRESETS, MapDefinition } from '../game/maps';
import { CLASSIC_MODE, GAME_MODE_DEFINITIONS, GameModeDefinition } from '../game/modes';
import { DEFAULT_RULES } from '../game/rulesets';
import { resolveSessionLocations } from '../game/locationEngine';
import { calculateTimeAttackScore } from '../utils/scoring';
import { 
  getPlayerName, 
  setPlayerName as savePlayerNameToStorage, 
  recordCompletedMatch, 
  getPlayerStats, 
  PersonalBestResult 
} from '../utils/playerProfile';
import { playSound, playCountdownTick, resetCountdownAudio } from '../utils/audioSystem';

interface GameContextType {
  gameStatus: GameStatus;
  currentRoundIndex: number;
  locations: Location[];
  currentLocation: Location | null;
  currentNode: LocationNode | null;
  selectedGuess: { lat: number; lng: number } | null;
  results: RoundResult[];
  totalScore: number;
  roundStartTime: number;
  timeRemaining: number | null;
  isStreetViewReady: boolean;
  isLoadingLocations: boolean;
  locationError: string | null;
  settings: GameSettings;
  telemetry: TelemetryData;
  isTelemetryOpen: boolean;
  activeMap: MapDefinition;
  activeMode: GameModeDefinition;
  streak: number;
  bestStreak: number;
  streakResult: {
    isCorrect: boolean;
    targetCountry: string;
    targetCountryCode: string;
    guessedCountry: string;
    guessedCountryCode: string;
  } | null;
  playerName: string;
  personalBestResult: PersonalBestResult | null;
  
  // Action Handlers
  startGame: (customSettings?: Partial<GameSettings>) => void;
  moveToNode: (nodeId: string) => void;
  placeGuess: (lat: number, lng: number) => void;
  clearGuess: () => void;
  submitGuess: () => void;
  submitCountryGuess: (code: string, name: string) => void;
  nextRound: () => void;
  nextStreakRound: () => void;
  restartGame: () => void;
  resetPOV: () => void;
  resetPovCount: number;
  setStreetViewReady: (ready: boolean) => void;
  updateRules: (newRules: Partial<GameRules>) => void;
  updatePlayerName: (name: string) => void;
  toggleTelemetry: (open?: boolean) => void;
  clearLocationError: () => void;
}

const defaultRules: GameRules = DEFAULT_RULES;

const defaultSettings: GameSettings = {
  maxRounds: CLASSIC_MODE.defaultMaxRounds,
  gameMode: 'normal',
  modeId: CLASSIC_MODE.id,
  rules: defaultRules,
  mapType: 'world',
  mapId: WORLD_MAP.id
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('IDLE');
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [selectedGuess, setSelectedGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [resetPovCount, setResetPovCount] = useState<number>(0);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [isStreetViewReady, setIsStreetViewReady] = useState<boolean>(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData>(devTelemetry.getSnapshot());
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);

  const [playerName, setPlayerNameState] = useState<string>(() => getPlayerName());
  const [personalBestResult, setPersonalBestResult] = useState<PersonalBestResult | null>(null);

  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(() => {
    return getPlayerStats().longestCountryStreak;
  });
  const [streakResult, setStreakResult] = useState<{
    isCorrect: boolean;
    targetCountry: string;
    targetCountryCode: string;
    guessedCountry: string;
    guessedCountryCode: string;
  } | null>(null);

  const sessionIdRef = useRef<string>(`sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const isSubmittingRef = useRef<boolean>(false);
  const usedCandidateIdsRef = useRef<Set<string>>(new Set());

  const activeMap: MapDefinition = (settings.mapId && MAP_PRESETS[settings.mapId]) || WORLD_MAP;
  const activeMode: GameModeDefinition = (settings.modeId && GAME_MODE_DEFINITIONS[settings.modeId]) || CLASSIC_MODE;

  const updatePlayerName = useCallback((name: string) => {
    const saved = savePlayerNameToStorage(name);
    setPlayerNameState(saved);
  }, []);

  // Subscribe to devTelemetry
  useEffect(() => {
    const unsubscribe = devTelemetry.subscribe(updatedData => {
      setTelemetry(updatedData);
    });
    return unsubscribe;
  }, []);

  const currentLocation = locations[currentRoundIndex] || null;
  const currentNode = currentLocation ? currentLocation.nodes[currentNodeId] || currentLocation.nodes[currentLocation.initialNodeId] || null : null;

  const totalScore = results.reduce((acc, r) => acc + r.score, 0);

  const clearLocationError = useCallback(() => {
    setLocationError(null);
  }, []);

  // Start new game session
  const startGame = useCallback(async (customSettings?: Partial<GameSettings>) => {
    const newSettings: GameSettings = {
      ...defaultSettings,
      ...customSettings,
      rules: { ...defaultRules, ...customSettings?.rules }
    };

    if (newSettings.modeId === 'country_streak') {
      newSettings.mapId = 'world';
      setStreak(0);
      setStreakResult(null);
    } else if (newSettings.modeId === 'time_attack') {
      newSettings.maxRounds = 5;
      newSettings.rules.timeLimitSeconds = 30;
    }

    setSettings(newSettings);
    setIsLoadingLocations(true);
    setLocationError(null);

    const mapToUse = (newSettings.mapId && MAP_PRESETS[newSettings.mapId]) || WORLD_MAP;
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

    const sessionResult = await resolveSessionLocations({
      map: mapToUse,
      count: newSettings.modeId === 'country_streak' ? 1 : newSettings.maxRounds,
      usedCandidateIds: usedCandidateIdsRef.current,
      apiMode: telemetry.apiMode,
      apiKey,
      mockLocations: MOCK_LOCATIONS
    });

    if (sessionResult.error) {
      console.error(sessionResult.error);
      setLocationError(sessionResult.error);
      setIsLoadingLocations(false);
      setGameStatus('IDLE');
      return;
    }

    const resolvedList = sessionResult.locations;
    setLocations(resolvedList);
    setCurrentRoundIndex(0);
    setResults([]);
    setSelectedGuess(null);
    setIsStreetViewReady(false);
    isSubmittingRef.current = false;
    setIsLoadingLocations(false);

    if (resolvedList.length > 0) {
      const firstLoc = resolvedList[0];
      setCurrentNodeId(firstLoc.initialNodeId);
      devTelemetry.trackSetPano(firstLoc.panoId || firstLoc.initialNodeId);
      devTelemetry.trackSetPosition(firstLoc.lat, firstLoc.lng);
    }

    setRoundStartTime(Date.now());
    sessionIdRef.current = `sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setPersonalBestResult(null);
    resetCountdownAudio();
    const initialTimeLimit = newSettings.modeId === 'time_attack'
      ? 30
      : (newSettings.rules.timeLimitSeconds > 0 ? newSettings.rules.timeLimitSeconds : null);
    setTimeRemaining(initialTimeLimit);
    setGameStatus('PLAYING');
  }, [telemetry.apiMode]);

  // Single player Country Streak guess submission
  const submitCountryGuess = useCallback((code: string, name: string) => {
    if (isSubmittingRef.current || gameStatus !== 'PLAYING' || !currentLocation) return;
    isSubmittingRef.current = true;
    playSound('submit');

    const targetCode = (currentLocation.countryCode || '').toUpperCase();
    const targetCountry = currentLocation.country || 'Unknown';
    const userCode = code.toUpperCase();

    const isCorrect = userCode.length > 0 && userCode === targetCode;

    let newStreak = streak;
    if (isCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
    } else {
      // Streak broken: record completed match for Country Streak
      const pb = recordCompletedMatch({
        matchId: sessionIdRef.current,
        mode: 'country_streak',
        streak: streak
      });
      setPersonalBestResult(pb);
      setBestStreak(pb.currentStats.longestCountryStreak);
    }

    setStreakResult({
      isCorrect,
      targetCountry,
      targetCountryCode: targetCode,
      guessedCountry: name,
      guessedCountryCode: userCode
    });

    setGameStatus('ROUND_RESULT');
    setIsStreetViewReady(false);
  }, [currentLocation, gameStatus, streak, bestStreak]);

  // Single player Country Streak next round transition
  const nextStreakRound = useCallback(async () => {
    if (!streakResult) return;
    resetCountdownAudio();

    if (streakResult.isCorrect && streak < 100) {
      setIsLoadingLocations(true);
      setLocationError(null);

      const mapToUse = WORLD_MAP;
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

      const sessionResult = await resolveSessionLocations({
        map: mapToUse,
        count: 1,
        usedCandidateIds: usedCandidateIdsRef.current,
        apiMode: telemetry.apiMode,
        apiKey,
        mockLocations: MOCK_LOCATIONS
      });

      if (sessionResult.error || sessionResult.locations.length === 0) {
        setLocationError(sessionResult.error || 'Failed to resolve next location.');
        setIsLoadingLocations(false);
        setGameStatus('GAME_FINISHED');
        return;
      }

      const nextLoc = sessionResult.locations[0];
      setLocations(prev => [...prev, nextLoc]);
      setCurrentRoundIndex(prev => prev + 1);
      setCurrentNodeId(nextLoc.initialNodeId);
      setSelectedGuess(null);
      setIsStreetViewReady(false);
      isSubmittingRef.current = false;
      setIsLoadingLocations(false);
      setStreakResult(null);
      setGameStatus('PLAYING');
    } else {
      setGameStatus('GAME_FINISHED');
    }
  }, [streakResult, streak, telemetry.apiMode]);

  // Update game rules from options/start screen
  const updateRules = useCallback((newRules: Partial<GameRules>) => {
    setSettings(prev => ({
      ...prev,
      rules: { ...prev.rules, ...newRules }
    }));
  }, []);

  // Move to connected node in current panorama location
  const moveToNode = useCallback((nodeId: string) => {
    if (settings.rules.movement === 'NO_MOVING') return;
    if (!currentLocation || !currentLocation.nodes[nodeId]) return;
    setCurrentNodeId(nodeId);
    const targetNode = currentLocation.nodes[nodeId];
    devTelemetry.trackSetPano(nodeId);
    devTelemetry.trackSetPosition(targetNode.lat, targetNode.lng);
  }, [currentLocation, settings.rules.movement]);

  // Place guess pin on guess map
  const placeGuess = useCallback((lat: number, lng: number) => {
    if (gameStatus !== 'PLAYING') return;
    setSelectedGuess({ lat, lng });
    playSound('pin');
  }, [gameStatus]);

  const clearGuess = useCallback(() => {
    setSelectedGuess(null);
  }, []);

  const resetPOV = useCallback(() => {
    setResetPovCount(prev => prev + 1);
  }, []);

  // Signal street view panorama ready state
  const setStreetViewReady = useCallback((ready: boolean) => {
    setIsStreetViewReady(ready);
    if (ready) {
      setRoundStartTime(Date.now());
    }
  }, []);

  // Submit current guess and compute results
  const submitGuess = useCallback(() => {
    if (isSubmittingRef.current || gameStatus !== 'PLAYING' || !currentLocation || !currentNode) return;
    isSubmittingRef.current = true;
    playSound('submit');
    resetCountdownAudio();

    const elapsedMs = Math.max(0, Date.now() - roundStartTime);
    const elapsedTimeSeconds = elapsedMs / 1000;
    const timeTaken = Math.round(elapsedTimeSeconds);
    
    // If no pin placed (e.g. timeout), give 0 points with max distance
    const guessToUse = selectedGuess || { lat: 0, lng: 0 };
    const distanceKm = selectedGuess 
      ? activeMode.calculateDistance(currentNode.lat, currentNode.lng, guessToUse.lat, guessToUse.lng)
      : 20000;
    
    let score = 0;
    let baseScore: number | undefined;
    let timeMultiplier: number | undefined;
    let hasPinnedLocation: boolean | undefined;

    if (settings.modeId === 'time_attack') {
      const taResult = calculateTimeAttackScore(
        selectedGuess ? distanceKm : null,
        elapsedTimeSeconds,
        activeMap.scaleFactor,
        !!selectedGuess
      );
      score = taResult.finalScore;
      baseScore = taResult.baseScore;
      timeMultiplier = taResult.timeMultiplier;
      hasPinnedLocation = taResult.hasPinnedLocation;
    } else {
      score = selectedGuess ? activeMode.calculateScore(distanceKm, activeMap.scaleFactor) : 0;
    }

    const result: RoundResult = {
      roundNumber: currentRoundIndex + 1,
      location: currentLocation,
      nodeUsed: currentNode,
      guess: {
        lat: guessToUse.lat,
        lng: guessToUse.lng,
        timestamp: Date.now()
      },
      distanceKm,
      score,
      timeTakenSeconds: timeTaken,
      baseScore,
      timeMultiplier,
      hasPinnedLocation
    };

    setResults(prev => [...prev, result]);
    setGameStatus('ROUND_RESULT');
    setIsStreetViewReady(false);
  }, [selectedGuess, currentLocation, currentNode, roundStartTime, currentRoundIndex, gameStatus, settings.modeId, activeMode, activeMap]);

  // Timer countdown effect (paused while StreetView is loading or in non-PLAYING state)
  useEffect(() => {
    const effectiveTimeLimit = settings.modeId === 'time_attack' ? 30 : settings.rules.timeLimitSeconds;
    if (gameStatus !== 'PLAYING' || !isStreetViewReady || !effectiveTimeLimit || effectiveTimeLimit <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null) return null;
        if (prev <= 6 && prev > 1) {
          playCountdownTick(prev - 1);
        }
        if (prev <= 1) {
          clearInterval(interval);
          resetCountdownAudio();
          // Timeout reached: trigger auto-submit
          setTimeout(() => {
            submitGuess();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [gameStatus, isStreetViewReady, settings.modeId, settings.rules.timeLimitSeconds, submitGuess]);

  // Next round transition
  const nextRound = useCallback(() => {
    resetCountdownAudio();
    if (currentRoundIndex < settings.maxRounds - 1) {
      const nextIdx = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIdx);
      const nextLoc = locations[nextIdx];
      if (nextLoc) {
        setCurrentNodeId(nextLoc.initialNodeId);
        devTelemetry.trackSetPano(nextLoc.initialNodeId);
        devTelemetry.trackSetPosition(nextLoc.lat, nextLoc.lng);
      }
      setSelectedGuess(null);
      setIsStreetViewReady(false);
      isSubmittingRef.current = false;
      setRoundStartTime(Date.now());
      const limit = settings.modeId === 'time_attack' 
        ? 30 
        : (settings.rules.timeLimitSeconds > 0 ? settings.rules.timeLimitSeconds : null);
      setTimeRemaining(limit);
      setGameStatus('PLAYING');
    } else {
      const finalScore = results.reduce((acc, r) => acc + r.score, 0);
      const pb = recordCompletedMatch({
        matchId: sessionIdRef.current,
        mode: settings.modeId === 'time_attack' ? 'time_attack' : 'classic',
        score: finalScore,
        mapId: settings.mapId
      });
      setPersonalBestResult(pb);
      setGameStatus('GAME_FINISHED');
    }
  }, [currentRoundIndex, settings.maxRounds, locations, settings.rules.timeLimitSeconds, settings.modeId, results, settings.mapId]);

  const restartGame = useCallback(() => {
    resetCountdownAudio();
    setGameStatus('IDLE');
    setSelectedGuess(null);
    setIsStreetViewReady(false);
    isSubmittingRef.current = false;
    setResults([]);
    setTimeRemaining(null);
    setPersonalBestResult(null);
  }, []);

  const toggleTelemetry = useCallback((open?: boolean) => {
    setIsTelemetryOpen(prev => (open !== undefined ? open : !prev));
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameStatus,
        currentRoundIndex,
        locations,
        currentLocation,
        currentNode,
        selectedGuess,
        results,
        totalScore,
        roundStartTime,
        timeRemaining,
        isStreetViewReady,
        isLoadingLocations,
        locationError,
        settings,
        telemetry,
        isTelemetryOpen,
        activeMap,
        activeMode,
        streak,
        bestStreak,
        streakResult,
        playerName,
        personalBestResult,
        startGame,
        moveToNode,
        placeGuess,
        clearGuess,
        submitGuess,
        submitCountryGuess,
        nextRound,
        nextStreakRound,
        restartGame,
        resetPOV,
        resetPovCount,
        setStreetViewReady,
        updateRules,
        updatePlayerName,
        toggleTelemetry,
        clearLocationError
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
};
