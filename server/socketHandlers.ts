import { Server, Socket } from 'socket.io';
import { RoomManager } from './roomManager';
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
          socket.join(response.room.code);
          if (callback) callback(response);
          io.to(response.room.code).emit('room:updated', response.room);
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
          socket.join(response.room.code);
          if (callback) callback(response);
          io.to(response.room.code).emit('room:updated', response.room);
          const joinedPlayer = response.room.players.find(p => p.id === socket.id);
          if (joinedPlayer) {
            socket.to(response.room.code).emit('room:player_joined', joinedPlayer);
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
            io.to(previousRoomCode).emit('room:updated', updatedRoom);
            io.to(previousRoomCode).emit('room:player_left', { playerId: socket.id, reason: 'Player left room.' });
          }
        }

        if (callback) callback(response);
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to leave room.' });
      }
    });

    // 4. Update Settings
    socket.on('room:update_settings', (payload, callback) => {
      try {
        const response = roomManager.updateSettings(socket.id, payload?.settings || {});

        if (response.success && response.room) {
          if (callback) callback(response);
          io.to(response.room.code).emit('room:updated', response.room);
        } else {
          if (callback) callback(response);
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to update settings.' });
      }
    });

    // 5. Game Start (Host requests game start)
    socket.on('game:start', (callback) => {
      try {
        const res = roomManager.startGameSession(socket.id);
        if (res.success && res.room && res.candidateSeed) {
          io.to(res.room.code).emit('room:updated', res.room);
          if (callback) callback({ success: true, room: res.room });

          // Request host to perform Street View resolution for candidateSeed
          socket.emit('game:resolve_target_request', {
            roundIndex: res.room.gameSession?.currentRound || 1,
            candidateSeed: res.candidateSeed
          });
        } else {
          if (callback) callback({ success: false, error: res.error || 'Could not start game.' });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to start game.' });
      }
    });

    // 6. Host Target Resolution Response
    socket.on('game:resolve_target_response', (payload: TargetResolutionResult, callback) => {
      try {
        const timerExpireHandler = () => {
          const room = roomManager.getPlayerRoom(socket.id);
          if (room && room.gameSession) {
            const endRes = roomManager.endRound(room.code);
            if (endRes.success && endRes.session && endRes.roundResult) {
              io.to(room.code).emit('room:updated', room);
              io.to(room.code).emit('game:round_ended', {
                session: endRes.session,
                roundResult: endRes.roundResult
              });
            }
          }
        };

        const res = roomManager.activateTargetFromHost(socket.id, payload, timerExpireHandler);
        if (res.success && res.room && res.activeTarget && res.session) {
          if (callback) callback({ success: true, room: res.room });
          io.to(res.room.code).emit('room:updated', res.room);
          io.to(res.room.code).emit('game:round_started', {
            session: res.session,
            activeTarget: res.activeTarget
          });
        } else {
          if (callback) callback({ success: false, error: res.error || 'Failed to activate target.' });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Failed to process target resolution.' });
      }
    });

    // 7. Submit Guess
    socket.on('game:submit_guess', (payload, callback) => {
      try {
        const res = roomManager.submitGuess(socket.id, payload.roundIndex, payload.latitude, payload.longitude);
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
            if (endRes.success && endRes.session && endRes.roundResult) {
              io.to(res.room.code).emit('room:updated', res.room);
              io.to(res.room.code).emit('game:round_ended', {
                session: endRes.session,
                roundResult: endRes.roundResult
              });
            }
          }
        } else {
          if (callback) callback({ success: false, error: res.error || 'Failed to submit guess.' });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || 'Error submitting guess.' });
      }
    });

    // 8. Next Round (Host triggers next round)
    socket.on('game:next_round', (callback) => {
      try {
        const res = roomManager.nextRound(socket.id);
        if (res.success && res.room && res.session) {
          if (callback) callback({ success: true, room: res.room });
          io.to(res.room.code).emit('room:updated', res.room);

          if (res.finished) {
            io.to(res.room.code).emit('game:finished', { session: res.session });
          } else if (res.candidateSeed) {
            socket.emit('game:resolve_target_request', {
              roundIndex: res.session.currentRound,
              candidateSeed: res.candidateSeed
            });
          }
        } else {
          if (callback) callback({ success: false, error: res.error || 'Failed to advance to next round.' });
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
          if (callback) callback({ success: true, room: res.room });
          io.to(res.room.code).emit('room:updated', res.room);
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
            io.to(previousRoomCode).emit('room:updated', updatedRoom);
            io.to(previousRoomCode).emit('room:player_left', { playerId: socket.id, reason: 'Player disconnected.' });
            
            // Check if active game session needs to trigger round end if all remaining connected submitted
            if (updatedRoom.gameSession && updatedRoom.gameSession.roundState === 'ROUND_ACTIVE') {
              const allSubmitted = updatedRoom.gameSession.haveAllPlayersSubmitted(updatedRoom.players);
              if (allSubmitted) {
                const endRes = roomManager.endRound(updatedRoom.code);
                if (endRes.success && endRes.session && endRes.roundResult) {
                  io.to(updatedRoom.code).emit('room:updated', updatedRoom);
                  io.to(updatedRoom.code).emit('game:round_ended', {
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

