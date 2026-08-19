import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { RoomManager } from './roomManager';
import { setupSocketHandlers } from './socketHandlers';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomActionResponse,
  Room
} from '../src/shared/types/multiplayer';

console.log('🧪 Running Phase 4B Socket Handlers Integration Tests...\n');

let passed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runSocketHandlerTests() {
  const httpServer = createServer();
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer);
  const roomManager = new RoomManager();
  setupSocketHandlers(io, roomManager);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const port = (httpServer.address() as any).port;

  let client1: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let client2: ClientSocket<ServerToClientEvents, ClientToServerEvents>;

  client1 = ioClient(`http://localhost:${port}`);
  client2 = ioClient(`http://localhost:${port}`);

  await Promise.all([
    new Promise<void>((res) => client1.on('connect', () => res())),
    new Promise<void>((res) => client2.on('connect', () => res()))
  ]);

  assert(client1.connected === true, 'Client 1 connected to Socket.IO server');
  assert(client2.connected === true, 'Client 2 connected to Socket.IO server');

  let createdRoomCode = '';

  // 1. Test room creation via socket event
  await new Promise<void>((resolve) => {
    client1.emit('room:create', { displayName: 'HostAlice', settings: { gameMode: 'pro' } }, (res: RoomActionResponse) => {
      assert(res.success === true, 'Client 1 room:create response succeeds');
      assert(!!res.room, 'Room returned in creation response');
      assert(res.room?.settings.gameMode === 'pro', 'Room created with pro mode');
      createdRoomCode = res.room!.code;
      resolve();
    });
  });

  // Listen for room:player_joined on client1
  const playerJoinedPromise = new Promise<void>((resolve) => {
    client1.on('room:player_joined', (player) => {
      assert(player.displayName === 'PlayerBob', 'Client 1 received room:player_joined event for PlayerBob');
      resolve();
    });
  });

  // 2. Test room join via socket event on client 2
  await new Promise<void>((resolve) => {
    client2.emit('room:join', { roomCode: createdRoomCode, displayName: 'PlayerBob' }, (res: RoomActionResponse) => {
      assert(res.success === true, 'Client 2 room:join response succeeds');
      assert(res.room?.players.length === 2, 'Room now has 2 players');
      resolve();
    });
  });

  await playerJoinedPromise;

  // 3. Test settings update by host (client1) and broadcast to client2
  const settingsUpdatePromise = new Promise<void>((resolve) => {
    client2.on('room:updated', (updatedRoom: Room) => {
      if (updatedRoom.settings.timeLimitSeconds === 60) {
        assert(updatedRoom.settings.timeLimitSeconds === 60, 'Client 2 received room:updated event with 60s time limit');
        resolve();
      }
    });
  });

  await new Promise<void>((resolve) => {
    client1.emit('room:update_settings', { settings: { timeLimitSeconds: 60 } }, (res: RoomActionResponse) => {
      assert(res.success === true, 'Client 1 settings update succeeds');
      resolve();
    });
  });

  await settingsUpdatePromise;

  // 4. Test client leave event
  const playerLeftPromise = new Promise<void>((resolve) => {
    client1.on('room:player_left', (payload) => {
      assert(payload.playerId === client2.id, 'Client 1 received room:player_left event when Client 2 leaves');
      resolve();
    });
  });

  await new Promise<void>((resolve) => {
    client2.emit('room:leave', (res) => {
      assert(res.success === true, 'Client 2 leave room succeeds');
      resolve();
    });
  });

  await playerLeftPromise;

  // 5. Test Country Streak Socket Answer Integration & Submission Contract
  {
    const csClient1: ClientSocket<ServerToClientEvents, ClientToServerEvents> = ioClient(`http://localhost:${port}`);
    const csClient2: ClientSocket<ServerToClientEvents, ClientToServerEvents> = ioClient(`http://localhost:${port}`);

    await Promise.all([
      new Promise<void>((res) => csClient1.on('connect', () => res())),
      new Promise<void>((res) => csClient2.on('connect', () => res()))
    ]);

    let csRoomCode = '';
    await new Promise<void>((resolve) => {
      csClient1.emit('room:create', { displayName: 'HostA', settings: { gameType: 'country_streak' } }, (res: RoomActionResponse) => {
        assert(res.success === true, 'HostA created country_streak room via socket');
        csRoomCode = res.room!.code;
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      csClient2.emit('room:join', { roomCode: csRoomCode, displayName: 'GuestB' }, (res: RoomActionResponse) => {
        assert(res.success === true, 'GuestB joined country_streak room via socket');
        resolve();
      });
    });

    // Start game
    await new Promise<void>((resolve) => {
      csClient1.emit('game:start', (res: RoomActionResponse) => {
        assert(res.success === true, 'HostA started country_streak game via socket');
        resolve();
      });
    });

    // Both players listen for game:finished
    const finishedPromise = new Promise<any>((resolve) => {
      csClient1.on('game:finished', ({ session }) => {
        resolve(session);
      });
    });

    // Submit guesses over socket payload: Player A submits correct countryCode, Player B submits wrong countryCode
    const currentSession = roomManager.getRoom(csRoomCode)?.gameSession as any;
    const targetCountryCode = currentSession?.secretTarget?.countryCode || 'AU';
    const wrongCountryCode = targetCountryCode === 'US' ? 'FR' : 'US';

    await new Promise<void>((resolve) => {
      csClient1.emit('game:submit_guess', {
        roundIndex: 1,
        latitude: 0,
        longitude: 0,
        countryCode: targetCountryCode
      }, (res) => {
        assert(res.success === true, `Player A submit_guess with countryCode: ${targetCountryCode} succeeded`);
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      csClient2.emit('game:submit_guess', {
        roundIndex: 1,
        latitude: 0,
        longitude: 0,
        countryCode: wrongCountryCode
      }, (res) => {
        assert(res.success === true, `Player B submit_guess with countryCode: ${wrongCountryCode} succeeded`);
        resolve();
      });
    });

    const finalSession = await finishedPromise;
    assert(finalSession.streakState !== undefined, 'StreakState exists on finished session');
    const playerAState = finalSession.streakState!.playerStates[csClient1.id!];
    const playerBState = finalSession.streakState!.playerStates[csClient2.id!];

    assert(playerAState.isEliminated === false, 'Player A is NOT eliminated');
    assert(playerAState.streak === 1, 'Player A streak is 1');
    assert(playerBState.isEliminated === true, 'Player B IS eliminated');
    assert(finalSession.streakState!.isDraw === false, 'Match is NOT a draw');
    assert(finalSession.streakState!.endReason === 'LAST_SURVIVOR', 'End reason is LAST_SURVIVOR');
    assert(finalSession.streakState!.winnerPlayerId === csClient1.id, 'Player A is winner');

    // Test Host Return to Lobby action via playAgain socket event
    const lobbyUpdatedPromise = new Promise<void>((resolve) => {
      csClient2.on('room:updated', (room) => {
        if (room.state === 'LOBBY') {
          assert(room.state === 'LOBBY', 'Room returned to LOBBY state after host playAgain');
          resolve();
        }
      });
    });

    await new Promise<void>((resolve) => {
      csClient1.emit('game:play_again', (res) => {
        assert(res.success === true, 'Host playAgain socket request succeeded');
        resolve();
      });
    });

    await lobbyUpdatedPromise;

    // Test Guest Back to Lobby action via leaveRoom socket event
    await new Promise<void>((resolve) => {
      csClient2.emit('room:leave', (res) => {
        assert(res.success === true, 'Guest leaveRoom socket request succeeded');
        resolve();
      });
    });

    csClient1.disconnect();
    csClient2.disconnect();
  }

  // Cleanup connections and server
  client1.disconnect();
  client2.disconnect();
  io.close();
  httpServer.close();

  console.log(`\nSocket Handlers Integration Test Results: ${passed}/${total} passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runSocketHandlerTests().catch((err) => {
  console.error('Socket handler integration test failed:', err);
  process.exit(1);
});
