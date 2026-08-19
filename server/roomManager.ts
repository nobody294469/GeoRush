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
import { AbstractBaseSession } from './baseSession';
import { GameSessionManager } from './gameSession';
import { DuelsSessionManager } from './duelsSession';
import { StreakSessionManager } from './streakSession';
import { TimeAttackSessionManager } from './timeAttackSession';
import { getModeStrategy, validateRoomSettings } from '../src/game/modeRegistry';
import { resolveCandidateOnServer } from './serverStreetViewResolver';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 unambiguous characters

export interface RoomWithSession extends Room {
  gameSession?: AbstractBaseSession;
}

export function toPublicRoom(room: RoomWithSession | Room): Room {
  const { gameSession, ...publicRoom } = room as RoomWithSession;
  return {
    code: publicRoom.code,
    hostPlayerId: publicRoom.hostPlayerId,
    players: publicRoom.players.map(p => ({
      id: p.id,
      displayName: p.displayName,
      isHost: p.isHost,
      status: p.status,
      joinedAt: p.joinedAt
    })),
    state: publicRoom.state,
    settings: {
      maxRounds: publicRoom.settings.maxRounds,
      timeLimitSeconds: publicRoom.settings.timeLimitSeconds,
      gameMode: publicRoom.settings.gameMode,
      mapId: publicRoom.settings.mapId,
      gameType: publicRoom.settings.gameType
    },
    createdAt: publicRoom.createdAt
  };
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
    return validateRoomSettings(customSettings);
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

    const modeStrategy = getModeStrategy(room.settings.gameType);

    if (modeStrategy.minPlayers === modeStrategy.maxPlayers) {
      if (room.players.length !== modeStrategy.minPlayers) {
        return { success: false, error: `${modeStrategy.name} mode requires exactly ${modeStrategy.minPlayers} connected players.` };
      }
    } else {
      if (room.players.length < modeStrategy.minPlayers) {
        return { success: false, error: `${modeStrategy.name} mode requires at least ${modeStrategy.minPlayers} connected player(s).` };
      }

      if (room.players.length > modeStrategy.maxPlayers) {
        return { success: false, error: `${modeStrategy.name} mode allows at most ${modeStrategy.maxPlayers} players.` };
      }
    }

    let session: AbstractBaseSession;

    if (room.settings.gameType === 'time_attack') {
      session = new TimeAttackSessionManager(
        room.code,
        room.settings.maxRounds,
        30,
        room.settings.gameMode,
        room.settings.mapId
      );
    } else if (room.settings.gameType === 'duels') {
      session = new DuelsSessionManager(
        room.code,
        room.settings.maxRounds,
        room.settings.timeLimitSeconds,
        room.settings.gameMode,
        room.settings.mapId
      );
    } else if (room.settings.gameType === 'country_streak') {
      session = new StreakSessionManager(
        room.code,
        room.settings.maxRounds,
        room.settings.timeLimitSeconds,
        room.settings.gameMode,
        'world'
      );
    } else {
      session = new GameSessionManager(
        room.code,
        room.settings.maxRounds,
        room.settings.timeLimitSeconds,
        room.settings.gameMode,
        room.settings.mapId
      );
    }

    const candidateSeed = session.initSession(room.players);
    room.gameSession = session;
    room.state = 'ROUND_LOADING';

    return { success: true, room, candidateSeed };

  }

  /**
   * Handles target resolution failure by selecting a new candidate seed up to a retry limit.
   */
  public handleTargetResolutionFailure(hostPlayerId: string, payload: TargetResolutionResult): {
    success: boolean;
    room?: RoomWithSession;
    candidateSeed?: CandidateSeed;
    error?: string;
  } {
    const code = this.playerToRoom.get(hostPlayerId);
    if (!code) return { success: false, error: 'Player not in a room.' };

    const room = this.rooms.get(code);
    if (!room || !room.gameSession) return { success: false, error: 'Game session not active.' };

    if (room.hostPlayerId !== hostPlayerId) {
      return { success: false, error: 'Only the host can resolve targets.' };
    }

    room.gameSession.usedCandidateIds.add(payload.candidateId);
    room.gameSession.resolutionAttempts = (room.gameSession.resolutionAttempts || 0) + 1;

    if (room.gameSession.resolutionAttempts >= 3) {
      return { success: false, room, error: 'Target resolution failed after maximum retry attempts.' };
    }

    const candidateSeed = room.gameSession.selectNextCandidateSeed();
    return { success: true, room, candidateSeed };
  }

  /**
   * Resolves target on server and activates round for room.
   * Retries up to 5 times if ZERO_RESULTS or resolution fails.
   */
  public async resolveAndActivateCurrentRound(
    roomCode: string,
    onTimerExpire?: () => void
  ): Promise<{
    success: boolean;
    room?: RoomWithSession;
    activeTarget?: ActiveRoundTarget;
    session?: MultiplayerGameSession;
    error?: string;
  }> {
    const room = this.rooms.get(roomCode);
    if (!room || !room.gameSession) {
      return { success: false, error: 'Active game session not found.' };
    }

    const session = room.gameSession;
    let candidateSeed = session.pendingCandidateSeed || session.selectNextCandidateSeed();
    let attempts = 0;
    const maxRetries = 5;

    while (attempts < maxRetries) {
      attempts++;
      const resolution = await resolveCandidateOnServer(candidateSeed);

      if (!resolution.failed && resolution.panoId) {
        const activeRes = session.activateRoundFromResolution(resolution, onTimerExpire, room.players);
        room.state = 'ROUND_ACTIVE';
        return {
          success: true,
          room,
          activeTarget: activeRes.activeTarget,
          session: session.toPublicSession(room.players)
        };
      }

      session.usedCandidateIds.add(candidateSeed.candidateId);
      try {
        candidateSeed = session.selectNextCandidateSeed();
      } catch (e: any) {
        return { success: false, error: e.message || 'No more candidates available.' };
      }
    }

    room.state = 'LOBBY';
    room.gameSession = undefined;
    return { success: false, error: 'Target resolution failed after maximum retry attempts.' };
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
    longitude: number,
    countryCode?: string
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

    const res = room.gameSession.submitGuess(playerId, player.displayName, latitude, longitude, countryCode);
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
    room.state = session.roundState;

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

  /**
   * Converts a room (with internal session) to a clean, serializable public Room object.
   */
  public toPublicRoom(room: RoomWithSession | Room): Room {
    return toPublicRoom(room);
  }
}

