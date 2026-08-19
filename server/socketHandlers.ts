import { Server, Socket } from 'socket.io';
import { RoomManager, toPublicRoom } from './roomManager';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomSettings,
  TargetResolutionResult
} from '../src/shared/types/multiplayer';

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager
) {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    // 1. Create Room
    socket.on('room:create', (payload, callback) => {
      try {
        const response = roomManager.createRoom(
          socket.id,
          payload?.displayName,
          payload?.settings
        );

        if (response.success && response.room) {
          const publicRoom = toPublicRoom(response.room);
          socket.join(publicRoom.code);
          if (callback) callback({ ...response, room: publicRoom });
          io.to(publicRoom.code).emit('room:updated', publicRoom);
        } else {
          if (callback) callback(response);
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to create room.' });
      }
    });

    // 2. Join Room
    socket.on('room:join', (payload, callback) => {
      try {
        const response = roomManager.joinRoom(
          socket.id,
          payload?.roomCode,
          payload?.displayName
        );

        if (response.success && response.room) {
          const publicRoom = toPublicRoom(response.room);
          socket.join(publicRoom.code);
          if (callback) callback({ ...response, room: publicRoom });
          io.to(publicRoom.code).emit('room:updated', publicRoom);
          const joinedPlayer = publicRoom.players.find(p => p.id === socket.id);
          if (joinedPlayer) {
            socket.to(publicRoom.code).emit('room:player_joined', joinedPlayer);
          }
        } else {
          if (callback) callback(response);
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to join room.' });
      }
    });

    // 3. Leave Room
    socket.on('room:leave', (callback) => {
      try {
        const { response, previousRoomCode, updatedRoom, wasClosed } = roomManager.leaveRoom(socket.id);

        if (previousRoomCode) {
          socket.leave(previousRoomCode);
          if (wasClosed) {
            io.to(previousRoomCode).emit('room:closed', { reason: 'All players left the room.' });
          } else if (updatedRoom) {
            const publicRoom = toPublicRoom(updatedRoom);
            io.to(previousRoomCode).emit('room:updated', publicRoom);
            io.to(previousRoomCode).emit('room:player_left', { playerId: socket.id, reason: 'Player left room.' });
          }
        }

        if (callback) {
          callback({
            ...response,
            room: response.room ? toPublicRoom(response.room) : undefined
          });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to leave room.' });
      }
    });

    // 4. Update Settings
    socket.on('room:update_settings', (payload, callback) => {
      try {
        const response = roomManager.updateSettings(socket.id, payload?.settings || {});

        if (response.success && response.room) {
          const publicRoom = toPublicRoom(response.room);
          if (callback) callback({ ...response, room: publicRoom });
          io.to(publicRoom.code).emit('room:updated', publicRoom);
        } else {
          if (callback) callback(response);
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to update settings.' });
      }
    });

    // 5. Game Start (Host requests game start)
    socket.on('game:start', async (callback) => {
      try {
        const startRes = roomManager.startGameSession(socket.id);
        if (!startRes.success || !startRes.room) {
          if (callback) callback({ success: false, error: startRes.error || 'Could not start game.' });
          return;
        }

        const roomCode = startRes.room.code;

        const timerExpireHandler = () => {
          const room = roomManager.getRoom(roomCode);
          if (room && room.gameSession) {
            const endRes = roomManager.endRound(room.code);
            if (endRes.success && endRes.session && endRes.roundResult && endRes.room) {
              const publicRoom = toPublicRoom(endRes.room);
              io.to(publicRoom.code).emit('room:updated', publicRoom);
              io.to(publicRoom.code).emit('game:round_ended', {
                session: endRes.session,
                roundResult: endRes.roundResult
              });
            }
          }
        };

        const resolveRes = await roomManager.resolveAndActivateCurrentRound(roomCode, timerExpireHandler);
        if (resolveRes.success && resolveRes.room && resolveRes.activeTarget && resolveRes.session) {
          const publicRoom = toPublicRoom(resolveRes.room);
          if (callback) callback({ success: true, room: publicRoom });
          io.to(publicRoom.code).emit('room:updated', publicRoom);
          io.to(publicRoom.code).emit('game:round_started', {
            session: resolveRes.session,
            activeTarget: resolveRes.activeTarget
          });
        } else {
          if (callback) callback({ success: false, error: resolveRes.error || 'Failed to resolve target location.' });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to start game.' });
      }
    });

    // 6. Submit Guess
    socket.on('game:submit_guess', (payload, callback) => {
      try {
        const res = roomManager.submitGuess(
          socket.id,
          payload.roundIndex,
          payload.latitude || 0,
          payload.longitude || 0,
          payload.countryCode
        );
        if (res.success && res.room && res.session) {
          if (callback) callback({ success: true, distanceKm: res.distanceKm, score: res.score });

          // Notify room that this player submitted
          io.to(res.room.code).emit('game:guess_submitted', {
            playerId: socket.id,
            submittedCount: res.session.submittedPlayerIds.length,
            totalPlayers: res.room.players.length
          });

          // Check if all players submitted
          if (res.allSubmitted) {
            const endRes = roomManager.endRound(res.room.code);
            if (endRes.success && endRes.session && endRes.roundResult && endRes.room) {
              const publicRoom = toPublicRoom(endRes.room);
              io.to(publicRoom.code).emit('room:updated', publicRoom);
              io.to(publicRoom.code).emit('game:round_ended', {
                session: endRes.session,
                roundResult: endRes.roundResult
              });
              if (endRes.session.roundState === 'GAME_FINISHED') {
                io.to(publicRoom.code).emit('game:finished', { session: endRes.session });
              }
            }
          }
        } else {
          if (callback) callback({ success: false, error: res.error || 'Failed to submit guess.' });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Error submitting guess.' });
      }
    });

    // 7. Next Round (Host triggers next round)
    socket.on('game:next_round', async (callback) => {
      try {
        const res = roomManager.nextRound(socket.id);
        if (!res.success || !res.room || !res.session) {
          if (callback) callback({ success: false, error: res.error || 'Failed to advance to next round.' });
          return;
        }

        const roomCode = res.room.code;
        const publicRoom = toPublicRoom(res.room);

        if (res.finished) {
          if (callback) callback({ success: true, room: publicRoom });
          io.to(publicRoom.code).emit('room:updated', publicRoom);
          io.to(publicRoom.code).emit('game:finished', { session: res.session });
        } else {
          const timerExpireHandler = () => {
            const room = roomManager.getRoom(roomCode);
            if (room && room.gameSession) {
              const endRes = roomManager.endRound(room.code);
              if (endRes.success && endRes.session && endRes.roundResult && endRes.room) {
                const pubRoom = toPublicRoom(endRes.room);
                io.to(pubRoom.code).emit('room:updated', pubRoom);
                io.to(pubRoom.code).emit('game:round_ended', {
                  session: endRes.session,
                  roundResult: endRes.roundResult
                });
              }
            }
          };

          const resolveRes = await roomManager.resolveAndActivateCurrentRound(roomCode, timerExpireHandler);
          if (resolveRes.success && resolveRes.room && resolveRes.activeTarget && resolveRes.session) {
            const activePublicRoom = toPublicRoom(resolveRes.room);
            if (callback) callback({ success: true, room: activePublicRoom });
            io.to(activePublicRoom.code).emit('room:updated', activePublicRoom);
            io.to(activePublicRoom.code).emit('game:round_started', {
              session: resolveRes.session,
              activeTarget: resolveRes.activeTarget
            });
          } else {
            if (callback) callback({ success: false, error: resolveRes.error || 'Failed to resolve target location.' });
          }
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Error advancing to next round.' });
      }
    });

    // 9. Play Again (Host resets room to lobby)
    socket.on('game:play_again', (callback) => {
      try {
        const res = roomManager.resetToLobby(socket.id);
        if (res.success && res.room) {
          const publicRoom = toPublicRoom(res.room);
          if (callback) callback({ success: true, room: publicRoom });
          io.to(publicRoom.code).emit('room:updated', publicRoom);
        } else {
          if (callback) callback({ success: false, error: res.error || 'Failed to reset room.' });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Error resetting room.' });
      }
    });

    // 10. Disconnect Handling
    socket.on('disconnect', () => {
      try {
        const { previousRoomCode, updatedRoom, wasClosed } = roomManager.leaveRoom(socket.id);
        if (previousRoomCode) {
          if (wasClosed) {
            io.to(previousRoomCode).emit('room:closed', { reason: 'All players disconnected.' });
          } else if (updatedRoom) {
            const publicRoom = toPublicRoom(updatedRoom);
            io.to(previousRoomCode).emit('room:updated', publicRoom);
            io.to(previousRoomCode).emit('room:player_left', { playerId: socket.id, reason: 'Player disconnected.' });
            
            // Check if active game session needs to trigger round end if all remaining connected submitted
            if (updatedRoom.gameSession && updatedRoom.gameSession.roundState === 'ROUND_ACTIVE') {
              const allSubmitted = updatedRoom.gameSession.haveAllPlayersSubmitted(updatedRoom.players);
              if (allSubmitted) {
                const endRes = roomManager.endRound(updatedRoom.code);
                if (endRes.success && endRes.session && endRes.roundResult && endRes.room) {
                  const publicEndRoom = toPublicRoom(endRes.room);
                  io.to(publicEndRoom.code).emit('room:updated', publicEndRoom);
                  io.to(publicEndRoom.code).emit('game:round_ended', {
                    session: endRes.session,
                    roundResult: endRes.roundResult
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error handling disconnect for socket ${socket.id}:`, err);
      }
    });
  });
}

