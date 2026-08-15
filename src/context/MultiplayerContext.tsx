import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Room,
  RoomSettings,
  MultiplayerGameSession,
  ActiveRoundTarget,
  RoundResult,
  TargetResolutionResult,
  ClientToServerEvents,
  ServerToClientEvents
} from '../shared/types/multiplayer';
import { resolveCandidateLocation } from '../utils/streetViewResolver';
import { CandidateLocation } from '../types/game';

interface MultiplayerContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  room: Room | null;
  playerId: string | null;
  isHost: boolean;
  gameSession: MultiplayerGameSession | null;
  activeTarget: ActiveRoundTarget | null;
  currentRoundResult: RoundResult | null;
  myLastGuess: { distanceKm: number; score: number } | null;
  hasSubmittedGuess: boolean;
  isResolvingTarget: boolean;
  error: string | null;

  createRoom: (displayName: string, settings?: Partial<RoomSettings>) => Promise<boolean>;
  joinRoom: (roomCode: string, displayName: string) => Promise<boolean>;
  leaveRoom: () => Promise<boolean>;
  updateSettings: (settings: Partial<RoomSettings>) => Promise<boolean>;
  startGame: () => Promise<boolean>;
  submitGuess: (latitude: number, longitude: number, countryCode?: string) => Promise<{ success: boolean; distanceKm?: number; score?: number; error?: string }>;
  nextRound: () => Promise<boolean>;
  playAgain: () => Promise<boolean>;
  clearError: () => void;
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameSession, setGameSession] = useState<MultiplayerGameSession | null>(null);
  const [activeTarget, setActiveTarget] = useState<ActiveRoundTarget | null>(null);
  const [currentRoundResult, setCurrentRoundResult] = useState<RoundResult | null>(null);
  const [myLastGuess, setMyLastGuess] = useState<{ distanceKm: number; score: number } | null>(null);
  const [hasSubmittedGuess, setHasSubmittedGuess] = useState(false);
  const [isResolvingTarget, setIsResolvingTarget] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const isHost = Boolean(room && playerId && room.hostPlayerId === playerId);

  const clearError = useCallback(() => setError(null), []);

  // Socket initialization
  useEffect(() => {
    const s: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      setPlayerId(s.id || null);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('room:updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
    });

    s.on('room:closed', ({ reason }) => {
      setRoom(null);
      setGameSession(null);
      setActiveTarget(null);
      setCurrentRoundResult(null);
      setError(`Room closed: ${reason}`);
    });

    s.on('game:resolve_target_request', async ({ roundIndex, candidateSeed }) => {
      setIsResolvingTarget(true);
      try {
        const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
        const apiMode = apiKey ? 'REAL' : 'MOCK';

        const candLocation: CandidateLocation = {
          id: candidateSeed.candidateId,
          latitude: candidateSeed.latitude,
          longitude: candidateSeed.longitude,
          country: candidateSeed.country,
          countryCode: 'XX',
          region: 'Unknown',
          continent: 'Unknown',
          environment: 'urban',
          difficulty: 'medium',
          verificationStatus: 'verified'
        };

        const resolved = await resolveCandidateLocation(candLocation, apiKey, apiMode);

        if (apiMode === 'REAL' && !resolved) {
          throw new Error('Target resolution failed in REAL mode.');
        }

        const targetResult: TargetResolutionResult = {
          roundIndex,
          candidateId: candidateSeed.candidateId,
          apiMode,
          panoId: resolved?.panoId || '',
          resolvedLat: resolved?.lat ?? candidateSeed.latitude,
          resolvedLng: resolved?.lng ?? candidateSeed.longitude,
          country: resolved?.country || candidateSeed.country,
          locationName: resolved?.name || candidateSeed.locationName,
          heading: resolved?.heading ?? candidateSeed.heading,
          pitch: resolved?.pitch ?? candidateSeed.pitch
        };

        s.emit('game:resolve_target_response', targetResult);
      } catch (err: any) {
        console.error('Host target resolution failed:', err);
        s.emit('game:resolve_target_response', {
          roundIndex,
          candidateId: candidateSeed.candidateId,
          resolvedLat: candidateSeed.latitude,
          resolvedLng: candidateSeed.longitude,
          country: candidateSeed.country,
          locationName: candidateSeed.locationName,
          heading: candidateSeed.heading,
          pitch: candidateSeed.pitch,
          failed: true,
          error: err.message
        });
      } finally {
        setIsResolvingTarget(false);
      }
    });

    s.on('game:round_started', ({ session, activeTarget: target }) => {
      setGameSession(session);
      setActiveTarget(target);
      setCurrentRoundResult(null);
      setHasSubmittedGuess(false);
      setMyLastGuess(null);
    });

    s.on('game:guess_submitted', ({ playerId: pId }) => {
      if (pId === s.id) {
        setHasSubmittedGuess(true);
      }
    });

    s.on('game:round_ended', ({ session, roundResult }) => {
      setGameSession(session);
      setCurrentRoundResult(roundResult);
      setHasSubmittedGuess(false);
    });

    s.on('game:finished', ({ session }) => {
      setGameSession(session);
    });

    s.on('error', ({ message }) => {
      setError(message);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const createRoom = useCallback(async (displayName: string, settings?: Partial<RoomSettings>): Promise<boolean> => {
    if (!socketRef.current) return false;
    return new Promise((resolve) => {
      socketRef.current!.emit('room:create', { displayName, settings }, (res) => {
        if (res.success && res.room && res.playerId) {
          setRoom(res.room);
          setPlayerId(res.playerId);
          setError(null);
          resolve(true);
        } else {
          setError(res.error || 'Failed to create room.');
          resolve(false);
        }
      });
    });
  }, []);

  const joinRoom = useCallback(async (roomCode: string, displayName: string): Promise<boolean> => {
    if (!socketRef.current) return false;
    return new Promise((resolve) => {
      socketRef.current!.emit('room:join', { roomCode, displayName }, (res) => {
        if (res.success && res.room && res.playerId) {
          setRoom(res.room);
          setPlayerId(res.playerId);
          setError(null);
          resolve(true);
        } else {
          setError(res.error || 'Failed to join room.');
          resolve(false);
        }
      });
    });
  }, []);

  const leaveRoom = useCallback(async (): Promise<boolean> => {
    if (!socketRef.current) return false;
    return new Promise((resolve) => {
      socketRef.current!.emit('room:leave', (res) => {
        setRoom(null);
        setGameSession(null);
        setActiveTarget(null);
        setCurrentRoundResult(null);
        setMyLastGuess(null);
        setHasSubmittedGuess(false);
        resolve(res ? res.success : true);
      });
    });
  }, []);

  const updateSettings = useCallback(async (settings: Partial<RoomSettings>): Promise<boolean> => {
    if (!socketRef.current) return false;
    return new Promise((resolve) => {
      socketRef.current!.emit('room:update_settings', { settings }, (res) => {
        if (res.success && res.room) {
          setRoom(res.room);
          setError(null);
          resolve(true);
        } else {
          setError(res.error || 'Failed to update settings.');
          resolve(false);
        }
      });
    });
  }, []);

  const startGame = useCallback(async (): Promise<boolean> => {
    if (!socketRef.current) return false;
    return new Promise((resolve) => {
      socketRef.current!.emit('game:start', (res) => {
        if (res.success && res.room) {
          setRoom(res.room);
          setError(null);
          resolve(true);
        } else {
          setError(res.error || 'Failed to start game.');
          resolve(false);
        }
      });
    });
  }, []);

  const submitGuess = useCallback(async (latitude: number, longitude: number, countryCode?: string) => {
    if (!socketRef.current || !activeTarget) {
      return { success: false, error: 'No active round.' };
    }
    return new Promise<{ success: boolean; distanceKm?: number; score?: number; error?: string }>((resolve) => {
      socketRef.current!.emit('game:submit_guess', {
        roundIndex: activeTarget.roundIndex,
        latitude,
        longitude,
        countryCode
      }, (res) => {
        if (res.success) {
          setHasSubmittedGuess(true);
          if (res.distanceKm !== undefined && res.score !== undefined) {
            setMyLastGuess({ distanceKm: res.distanceKm, score: res.score });
          }
        } else {
          setError(res.error || 'Failed to submit guess.');
        }
        resolve(res);
      });
    });
  }, [activeTarget]);

  const nextRound = useCallback(async (): Promise<boolean> => {
    if (!socketRef.current) return false;
    return new Promise((resolve) => {
      socketRef.current!.emit('game:next_round', (res) => {
        if (res.success && res.room) {
          setRoom(res.room);
          setError(null);
          resolve(true);
        } else {
          setError(res.error || 'Failed to trigger next round.');
          resolve(false);
        }
      });
    });
  }, []);

  const playAgain = useCallback(async (): Promise<boolean> => {
    if (!socketRef.current) return false;
    return new Promise((resolve) => {
      socketRef.current!.emit('game:play_again', (res) => {
        if (res.success && res.room) {
          setRoom(res.room);
          setGameSession(null);
          setActiveTarget(null);
          setCurrentRoundResult(null);
          setMyLastGuess(null);
          setHasSubmittedGuess(false);
          setError(null);
          resolve(true);
        } else {
          setError(res.error || 'Failed to reset room.');
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <MultiplayerContext.Provider
      value={{
        socket,
        isConnected,
        room,
        playerId,
        isHost,
        gameSession,
        activeTarget,
        currentRoundResult,
        myLastGuess,
        hasSubmittedGuess,
        isResolvingTarget,
        error,
        createRoom,
        joinRoom,
        leaveRoom,
        updateSettings,
        startGame,
        submitGuess,
        nextRound,
        playAgain,
        clearError
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
};

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};
