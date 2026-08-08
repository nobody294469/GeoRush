import {
  Room,
  RoomPlayer,
  RoomSettings,
  RoomActionResponse,
  PlayerConnectionStatus,
  CandidateSeed,
  TargetResolutionResult,
  ActiveRoundTarget,
  MultiplayerGameSession,
  RoundResult,
  GameType
} from '../src/shared/types/multiplayer';
import { GameSessionManager } from './gameSession';
import { DuelsSessionManager } from './duelsSession';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 unambiguous characters

export interface RoomWithSession extends Room {
  gameSession?: GameSessionManager | DuelsSessionManager;
}

export class RoomManager {
  private rooms: Map<string, RoomWithSession> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  /**
   * Generates a unique 6-character uppercase room code.
   */
  public generateRoomCode(): string {
    let code: string;
    let attempts = 0;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
        code += CODE_CHARS[randomIndex];
      }
      attempts++;
      if (attempts > 1000) {
        throw new Error('Failed to generate a unique room code.');
      }
    } while (this.rooms.has(code));

    return code;
  }

  /**
   * Validates and merges partial room settings.
   */
  public validateSettings(customSettings?: Partial<RoomSettings>): { valid: boolean; settings: RoomSettings; error?: string } {
    const defaultSettings: RoomSettings = {
      maxRounds: 5,
      timeLimitSeconds: 0,
      gameMode: 'normal',
      mapId: 'world',
      gameType: 'classic'
    };

    if (!customSettings) {
      return { valid: true, settings: defaultSettings };
    }

    const merged: RoomSettings = { ...defaultSettings };

    if (customSettings.gameType !== undefined) {
      if (customSettings.gameType !== 'classic' && customSettings.gameType !== 'duels') {
        return { valid: false, settings: defaultSettings, error: 'gameType must be either "classic" or "duels".' };
      }
      merged.gameType = customSettings.gameType;
      if (merged.gameType === 'duels' && customSettings.maxRounds === undefined) {
        merged.maxRounds = 20;
      }
    }

    if (customSettings.maxRounds !== undefined) {
      const maxAllowed = merged.gameType === 'duels' ? 20 : 10;
      if (!Number.isInteger(customSettings.maxRounds) || customSettings.maxRounds < 1 || customSettings.maxRounds > maxAllowed) {
        return { valid: false, settings: defaultSettings, error: `maxRounds must be an integer between 1 and ${maxAllowed}.` };
      }
      merged.maxRounds = customSettings.maxRounds;
    }

    if (customSettings.timeLimitSeconds !== undefined) {
      if (!Number.isInteger(customSettings.timeLimitSeconds) || customSettings.timeLimitSeconds < 0 || customSettings.timeLimitSeconds > 300) {
        return { valid: false, settings: defaultSettings, error: 'timeLimitSeconds must be an integer between 0 and 300 seconds.' };
      }
      merged.timeLimitSeconds = customSettings.timeLimitSeconds;
    }

    if (customSettings.gameMode !== undefined) {
      if (customSettings.gameMode !== 'normal' && customSettings.gameMode !== 'pro') {
        return { valid: false, settings: defaultSettings, error: 'gameMode must be either "normal" or "pro".' };
      }
      merged.gameMode = customSettings.gameMode;
    }

    if (customSettings.mapId !== undefined) {
      if (typeof customSettings.mapId !== 'string' || customSettings.mapId.trim().length === 0) {
        return { valid: false, settings: defaultSettings, error: 'mapId must be a non-empty string.' };
      }
      merged.mapId = customSettings.mapId.trim();
    }

    return { valid: true, settings: merged };
  }

  /**
   * Creates a new room with host player.
   */
  public createRoom(
    playerId: string,
    displayName: string,
    customSettings?: Partial<RoomSettings>
  ): RoomActionResponse {
    const trimmedName = displayName ? displayName.trim() : '';
    if (!trimmedName || trimmedName.length > 20) {
      return { success: false, error: 'Display name must be between 1 and 20 characters.' };
    }

    const settingsResult = this.validateSettings(customSettings);
    if (!settingsResult.valid) {
      return { success: false, error: settingsResult.error };
    }

    // Leave current room if in one
    if (this.playerToRoom.has(playerId)) {
      this.leaveRoom(playerId);
    }

    const roomCode = this.generateRoomCode();
    const hostPlayer: RoomPlayer = {
      id: playerId,
      displayName: trimmedName,
      isHost: true,
      status: 'CONNECTED',
      joinedAt: Date.now()
    };

    const room: RoomWithSession = {
      code: roomCode,
      hostPlayerId: playerId,
      players: [hostPlayer],
      state: 'LOBBY',
      settings: settingsResult.settings,
      createdAt: Date.now()
    };

    this.rooms.set(roomCode, room);
    this.playerToRoom.set(playerId, roomCode);

    return { success: true, room, playerId };
  }

  /**
   * Joins an existing room.
   */
  public joinRoom(
    playerId: string,
    roomCodeInput: string,
    displayName: string
  ): RoomActionResponse {
    const trimmedName = displayName ? displayName.trim() : '';
    if (!trimmedName || trimmedName.length > 20) {
      return { success: false, error: 'Display name must be between 1 and 20 characters.' };
    }

    const code = roomCodeInput ? roomCodeInput.trim().toUpperCase() : '';
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: 'Room not found. Please check the code and try again.' };
    }

    if (room.state !== 'LOBBY') {
      return { success: false, error: 'Cannot join room. Game is already in progress.' };
    }

    // Leave previous room if different
    const currentRoomCode = this.playerToRoom.get(playerId);
    if (currentRoomCode && currentRoomCode !== code) {
      this.leaveRoom(playerId);
    }

    // Check if player already in room
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.displayName = trimmedName;
      existingPlayer.status = 'CONNECTED';
      return { success: true, room, playerId };
    }

    const newPlayer: RoomPlayer = {
      id: playerId,
      displayName: trimmedName,
      isHost: false,
      status: 'CONNECTED',
      joinedAt: Date.now()
    };

    room.players.push(newPlayer);
    this.playerToRoom.set(playerId, code);

    return { success: true, room, playerId };
  }

  /**
   * Leaves current room.
   */
  public leaveRoom(playerId: string): {
    response: RoomActionResponse;
    previousRoomCode?: string;
    updatedRoom?: RoomWithSession;
    wasClosed?: boolean;
  } {
    const code = this.playerToRoom.get(playerId);
    if (!code) {
      return { response: { success: true } };
    }

    const room = this.rooms.get(code);
    this.playerToRoom.delete(playerId);

    if (!room) {
      return { response: { success: true }, previousRoomCode: code, wasClosed: true };
    }

    room.players = room.players.filter(p => p.id !== playerId);

    if (room.players.length === 0) {
      this.rooms.delete(code);
      return { response: { success: true }, previousRoomCode: code, wasClosed: true };
    }

    // Reassign host if host left
    if (room.hostPlayerId === playerId) {
      const nextHost = room.players.find(p => p.status === 'CONNECTED') || room.players[0];
      room.hostPlayerId = nextHost.id;
      room.players.forEach(p => {
        p.isHost = p.id === nextHost.id;
      });
    }

    return { response: { success: true }, previousRoomCode: code, updatedRoom: room, wasClosed: false };
  }

  /**
   * Updates settings for host's room.
   */
  public updateSettings(
    playerId: string,
    settingsUpdate: Partial<RoomSettings>
  ): RoomActionResponse {
    const code = this.playerToRoom.get(playerId);
    if (!code) {
      return { success: false, error: 'You are not in a room.' };
    }

    const room = this.rooms.get(code);
    if (!room) {
      return { success: false, error: 'Room not found.' };
    }

    if (room.hostPlayerId !== playerId) {
      return { success: false, error: 'Only the room host can update settings.' };
    }

    const settingsResult = this.validateSettings({ ...room.settings, ...settingsUpdate });
    if (!settingsResult.valid) {
      return { success: false, error: settingsResult.error };
    }

    room.settings = settingsResult.settings;
    return { success: true, room };
  }

  /**
   * Starts game session for a room (Host only).
   */
  public startGameSession(playerId: string): {
    success: boolean;
    room?: RoomWithSession;
    candidateSeed?: CandidateSeed;
    error?: string;
  } {
    const code = this.playerToRoom.get(playerId);
    if (!code) return { success: false, error: 'Player not in a room.' };

    const room = this.rooms.get(code);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.hostPlayerId !== playerId) {
      return { success: false, error: 'Only the host can start the game.' };
    }

    if (room.state !== 'LOBBY' && room.state !== 'GAME_FINISHED') {
      return { success: false, error: 'Game cannot be started in current state.' };
    }

    if (room.settings.gameType === 'duels') {
      if (room.players.length !== 2) {
        return { success: false, error: 'Duels mode requires exactly 2 connected players.' };
      }
      const session = new DuelsSessionManager(
        room.code,
        room.settings.maxRounds,
        room.settings.timeLimitSeconds,
        room.settings.gameMode
      );
      const candidateSeed = session.initSession(room.players);
      room.gameSession = session;
      room.state = 'ROUND_LOADING';
      return { success: true, room, candidateSeed };
    }

    const session = new GameSessionManager(
      room.code,
      room.settings.maxRounds,
      room.settings.timeLimitSeconds,
      room.settings.gameMode
    );

    const candidateSeed = session.initSession(room.players);
    room.gameSession = session;
    room.state = 'ROUND_LOADING';

    return { success: true, room, candidateSeed };
  }

  /**
   * Locks host-resolved target and begins round.
   */
  public activateTargetFromHost(
    hostPlayerId: string,
    resolution: TargetResolutionResult,
    onTimerExpire: () => void
  ): {
    success: boolean;
    room?: RoomWithSession;
    activeTarget?: ActiveRoundTarget;
    session?: MultiplayerGameSession;
    error?: string;
  } {
    const code = this.playerToRoom.get(hostPlayerId);
    if (!code) return { success: false, error: 'Player not in a room.' };

    const room = this.rooms.get(code);
    if (!room || !room.gameSession) return { success: false, error: 'Active game session not found.' };

    if (room.hostPlayerId !== hostPlayerId) {
      return { success: false, error: 'Only the host can resolve targets.' };
    }

    const { activeTarget, session } = room.gameSession.activateRoundFromHostResolution(resolution, onTimerExpire, room.players);
    room.state = 'ROUND_ACTIVE';

    return { success: true, room, activeTarget, session };
  }

  /**
   * Submits a guess for a player.
   */
  public submitGuess(
    playerId: string,
    roundIndex: number,
    latitude: number,
    longitude: number
  ): {
    success: boolean;
    room?: RoomWithSession;
    session?: MultiplayerGameSession;
    distanceKm?: number;
    score?: number;
    allSubmitted?: boolean;
    error?: string;
  } {
    const code = this.playerToRoom.get(playerId);
    if (!code) return { success: false, error: 'Player not in a room.' };

    const room = this.rooms.get(code);
    if (!room || !room.gameSession) return { success: false, error: 'Game session not active.' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: 'Player not found in room.' };

    if (roundIndex !== room.gameSession.currentRound) {
      return { success: false, error: 'Guess is for a different round.' };
    }

    const res = room.gameSession.submitGuess(playerId, player.displayName, latitude, longitude);
    if (!res.success) {
      return { success: false, error: res.error };
    }

    const allSubmitted = room.gameSession.haveAllPlayersSubmitted(room.players);

    return {
      success: true,
      room,
      session: room.gameSession.toPublicSession(room.players),
      distanceKm: res.distanceKm,
      score: res.score,
      allSubmitted
    };
  }

  /**
   * Ends round authoritatively.
   */
  public endRound(roomCode: string): {
    success: boolean;
    room?: RoomWithSession;
    session?: MultiplayerGameSession;
    roundResult?: RoundResult;
    error?: string;
  } {
    const room = this.rooms.get(roomCode);
    if (!room || !room.gameSession) return { success: false, error: 'Game session not active.' };

    const { session, roundResult } = room.gameSession.endRound(room.players);
    room.state = 'ROUND_RESULTS';

    return { success: true, room, session, roundResult };
  }

  /**
   * Transitions to next round (or finishes game).
   */
  public nextRound(hostPlayerId: string): {
    success: boolean;
    room?: RoomWithSession;
    finished?: boolean;
    candidateSeed?: CandidateSeed;
    session?: MultiplayerGameSession;
    error?: string;
  } {
    const code = this.playerToRoom.get(hostPlayerId);
    if (!code) return { success: false, error: 'Player not in a room.' };

    const room = this.rooms.get(code);
    if (!room || !room.gameSession) return { success: false, error: 'Game session not active.' };

    if (room.hostPlayerId !== hostPlayerId) {
      return { success: false, error: 'Only the host can advance rounds.' };
    }

    const { finished, candidateSeed, session } = room.gameSession.prepareNextRound(room.players);
    room.state = session.roundState;

    return {
      success: true,
      room,
      finished,
      candidateSeed,
      session
    };
  }

  /**
   * Resets room back to lobby after game finishes.
   */
  public resetToLobby(hostPlayerId: string): { success: boolean; room?: RoomWithSession; error?: string } {
    const code = this.playerToRoom.get(hostPlayerId);
    if (!code) return { success: false, error: 'Player not in a room.' };

    const room = this.rooms.get(code);
    if (!room) return { success: false, error: 'Room not found.' };

    if (room.hostPlayerId !== hostPlayerId) {
      return { success: false, error: 'Only the host can reset the game.' };
    }

    room.gameSession = undefined;
    room.state = 'LOBBY';

    return { success: true, room };
  }

  /**
   * Returns a room by code.
   */
  public getRoom(roomCode: string): RoomWithSession | undefined {
    return this.rooms.get(roomCode.trim().toUpperCase());
  }

  /**
   * Returns the room a player belongs to.
   */
  public getPlayerRoom(playerId: string): RoomWithSession | undefined {
    const code = this.playerToRoom.get(playerId);
    return code ? this.rooms.get(code) : undefined;
  }

  /**
   * Returns all active rooms count.
   */
  public getRoomCount(): number {
    return this.rooms.size;
  }
}

