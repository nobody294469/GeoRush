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
