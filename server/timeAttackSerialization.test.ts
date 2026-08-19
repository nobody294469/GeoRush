import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { RoomManager, toPublicRoom } from './roomManager';
import { setupSocketHandlers } from './socketHandlers';
import { TimeAttackSessionManager } from './timeAttackSession';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomActionResponse,
  Room,
  RoomPlayer
} from '../src/shared/types/multiplayer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

export async function runTimeAttackSerializationTests() {
  console.log('🧪 Running Phase 10D.5 Time Attack Serialization & Socket Integration Tests...\n');

  // --- Test 1: Unit Test toPublicRoom strips gameSession and circular handles ---
  {
    console.log('--- Test 1: toPublicRoom unit test ---');
    const roomManager = new RoomManager();
    const createRes = roomManager.createRoom('p1', 'Player 1', { gameType: 'time_attack' });
    assert(createRes.success === true, 'Room creation succeeded');
    const room = createRes.room as any;

    // Start session to attach gameSession with timer
    const startRes = roomManager.startGameSession('p1');
    assert(startRes.success === true, 'Game session started');
    assert(!!room.gameSession, 'room has gameSession');

    // Manually activate round to create timerHandle
    room.gameSession.activateRoundFromHostResolution({
      roundIndex: 1,
      candidateId: 'c1',
      resolvedLat: 10,
      resolvedLng: 20,
      country: 'TestLand'
    }, () => {});

    assert(!!(room.gameSession as any).timerHandle, 'gameSession has active timerHandle');

    // Verify raw JSON.stringify on room directly throws or fails if circular
    let rawStringifyThrew = false;
    try {
      JSON.stringify(room);
    } catch (e: any) {
      rawStringifyThrew = true;
      assert(e.message.includes('circular') || e.message.includes('structure'), 'Raw stringify fails on circular timer');
    }

    // Convert via toPublicRoom
    const publicRoom = toPublicRoom(room);
    assert((publicRoom as any).gameSession === undefined, 'publicRoom has no gameSession property');

    // Verify JSON.stringify succeeds cleanly on publicRoom
    const json = JSON.stringify(publicRoom);
    assert(typeof json === 'string', 'publicRoom JSON.stringify succeeds cleanly');
    const parsed = JSON.parse(json);
    assert(parsed.code === room.code, 'Parsed code matches room code');
    assert(parsed.gameSession === undefined, 'Parsed JSON has no gameSession');
  }

  // --- Test 2: Full Socket.IO Integration for Time Attack Active Round Serialization ---
  {
    console.log('--- Test 2: Full Socket.IO Time Attack Active Round Integration ---');
    const httpServer = createServer();
    const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer);
    const roomManager = new RoomManager();
    setupSocketHandlers(io, roomManager);

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const port = (httpServer.address() as any).port;

    const hostClient: ClientSocket<ServerToClientEvents, ClientToServerEvents> = ioClient(`http://localhost:${port}`);
    const guestClient: ClientSocket<ServerToClientEvents, ClientToServerEvents> = ioClient(`http://localhost:${port}`);

    await Promise.all([
      new Promise<void>((res) => hostClient.on('connect', () => res())),
      new Promise<void>((res) => guestClient.on('connect', () => res()))
    ]);

    let roomCode = '';

    // Create time_attack room
    await new Promise<void>((resolve) => {
      hostClient.emit('room:create', { displayName: 'HostAlice', settings: { gameType: 'time_attack' } }, (res: RoomActionResponse) => {
        assert(res.success === true, 'Host created time_attack room');
        assert((res.room as any)?.gameSession === undefined, 'Creation callback room has no gameSession');
        roomCode = res.room!.code;
        resolve();
      });
    });

    // Join room
    await new Promise<void>((resolve) => {
      guestClient.emit('room:join', { roomCode, displayName: 'GuestBob' }, (res: RoomActionResponse) => {
        assert(res.success === true, 'Guest joined time_attack room');
        assert((res.room as any)?.gameSession === undefined, 'Join callback room has no gameSession');
        resolve();
      });
    });

    // Track received room:updated events on guest
    let receivedUpdatedRooms: Room[] = [];
    guestClient.on('room:updated', (updatedRoom: Room) => {
      receivedUpdatedRooms.push(updatedRoom);
      assert((updatedRoom as any).gameSession === undefined, 'room:updated payload has no raw gameSession');
    });

    // Start game
    await new Promise<void>((resolve) => {
      hostClient.emit('game:start', (res) => {
        assert(res.success === true, 'game:start succeeded');
        assert((res.room as any)?.gameSession === undefined, 'game:start callback room has no raw gameSession');
        resolve();
      });
    });

    // Wait briefly for target resolution and round start
    await new Promise((r) => setTimeout(r, 200));

    // Verify room:updated events were sent without throwing call stack errors
    assert(receivedUpdatedRooms.length > 0, 'Guest received room:updated events during active round start');

    // Both clients submit guesses
    await new Promise<void>((resolve) => {
      hostClient.emit('game:submit_guess', { roundIndex: 1, latitude: 0, longitude: 0 }, (res) => {
        assert(res.success === true, 'Host submit_guess succeeded');
        resolve();
      });
    });

    const roundEndedPromise = new Promise<void>((resolve) => {
      guestClient.on('game:round_ended', ({ session, roundResult }) => {
        assert(session.currentRound === 1, 'game:round_ended session round 1');
        assert(!!roundResult, 'game:round_ended includes roundResult');
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      guestClient.emit('game:submit_guess', { roundIndex: 1, latitude: 0, longitude: 0 }, (res) => {
        assert(res.success === true, 'Guest submit_guess succeeded');
        resolve();
      });
    });

    await roundEndedPromise;

    // Next round request from host
    await new Promise<void>((resolve) => {
      hostClient.emit('game:next_round', (res) => {
        assert(res.success === true, 'game:next_round succeeded');
        assert((res.room as any)?.gameSession === undefined, 'game:next_round callback room has no raw gameSession');
        resolve();
      });
    });

    // Clean up connections
    hostClient.disconnect();
    guestClient.disconnect();
    httpServer.close();
  }

  console.log('\n🎉 All Phase 10D.5 Serialization & Socket Integration Tests Passed!\n');
}

runTimeAttackSerializationTests();
