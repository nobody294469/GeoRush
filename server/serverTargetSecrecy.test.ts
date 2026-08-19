import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { RoomManager, toPublicRoom } from './roomManager';
import { setupSocketHandlers } from './socketHandlers';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomActionResponse,
  GameType,
  ActiveRoundTarget,
  MultiplayerGameSession
} from '../src/shared/types/multiplayer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

export async function runServerTargetSecrecyTests() {
  console.log('🧪 Running Phase 11B.2 Server Target Secrecy Security Verification Tests...\n');

  const gameTypes: GameType[] = ['classic', 'duels', 'country_streak', 'time_attack'];

  for (const gType of gameTypes) {
    console.log(`\n--- Verifying Target Secrecy for Mode: ${gType.toUpperCase()} ---`);

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

    // Create room
    await new Promise<void>((resolve) => {
      hostClient.emit('room:create', { displayName: 'HostA', settings: { gameType: gType } }, (res: RoomActionResponse) => {
        assert(res.success === true, `Created ${gType} room`);
        roomCode = res.room!.code;
        resolve();
      });
    });

    // Join room
    await new Promise<void>((resolve) => {
      guestClient.emit('room:join', { roomCode, displayName: 'GuestB' }, (res: RoomActionResponse) => {
        assert(res.success === true, `Guest joined ${gType} room`);
        resolve();
      });
    });

    // Set up round_started listener on host and guest
    let receivedRoundStartOnHost: { session: MultiplayerGameSession; activeTarget: ActiveRoundTarget } | null = null;
    let receivedRoundStartOnGuest: { session: MultiplayerGameSession; activeTarget: ActiveRoundTarget } | null = null;

    hostClient.on('game:round_started', (payload) => {
      receivedRoundStartOnHost = payload;
    });

    guestClient.on('game:round_started', (payload) => {
      receivedRoundStartOnGuest = payload;
    });

    // Host starts game
    await new Promise<void>((resolve) => {
      hostClient.emit('game:start', (res) => {
        if (!res.success) {
          console.error('game:start failed:', res);
        }
        assert(res.success === true, `game:start succeeded for ${gType}`);
        resolve();
      });
    });

    // Wait briefly for socket broadcast
    await new Promise((r) => setTimeout(r, 100));

    assert(!!receivedRoundStartOnHost, 'Host received game:round_started');
    assert(!!receivedRoundStartOnGuest, 'Guest received game:round_started');

    // VERIFY ACTIVE TARGET SECRECY & SERVER-AUTHORITATIVE APIMODE
    const activeTarget = receivedRoundStartOnHost!.activeTarget as any;
    const guestActiveTarget = receivedRoundStartOnGuest!.activeTarget as any;

    assert(typeof activeTarget.roundIndex === 'number', 'activeTarget has roundIndex');
    assert(typeof activeTarget.panoId === 'string', 'activeTarget has panoId');
    assert(activeTarget.apiMode === 'MOCK' || activeTarget.apiMode === 'REAL', `activeTarget has valid apiMode (${activeTarget.apiMode})`);
    assert(activeTarget.apiMode === guestActiveTarget.apiMode, 'Host and Guest received IDENTICAL apiMode');
    assert(JSON.stringify(activeTarget) === JSON.stringify(guestActiveTarget), 'Host and Guest received IDENTICAL activeTarget payload');

    // CRITICAL SECURITY ASSERTS: Check that coordinates and target metadata are NOT leaked in activeTarget
    assert(activeTarget.latitude === undefined, 'SECURITY PASS: activeTarget.latitude is UNDEFINED');
    assert(activeTarget.longitude === undefined, 'SECURITY PASS: activeTarget.longitude is UNDEFINED');
    assert(activeTarget.resolvedLat === undefined, 'SECURITY PASS: activeTarget.resolvedLat is UNDEFINED');
    assert(activeTarget.resolvedLng === undefined, 'SECURITY PASS: activeTarget.resolvedLng is UNDEFINED');
    assert(activeTarget.country === undefined, 'SECURITY PASS: activeTarget.country is UNDEFINED');
    assert(activeTarget.countryCode === undefined, 'SECURITY PASS: activeTarget.countryCode is UNDEFINED');
    assert(activeTarget.locationName === undefined, 'SECURITY PASS: activeTarget.locationName is UNDEFINED');
    assert(activeTarget.candidateId === undefined, 'SECURITY PASS: activeTarget.candidateId is UNDEFINED');

    // VERIFY SESSION SECRECY
    const session = receivedRoundStartOnHost!.session as any;
    assert(session.secretTarget === undefined, 'SECURITY PASS: session.secretTarget is UNDEFINED in broadcast');

    // VERIFY SUBMIT GUESS AND END ROUND STILL WORK NATIVELY
    await new Promise<void>((resolve) => {
      hostClient.emit('game:submit_guess', { roundIndex: 1, latitude: 10, longitude: 10, countryCode: 'FR' }, (res) => {
        assert(res.success === true, 'Host submit_guess succeeded');
        resolve();
      });
    });

    const roundEndedPromise = new Promise<void>((resolve) => {
      guestClient.on('game:round_ended', ({ roundResult }) => {
        assert(!!roundResult, 'game:round_ended contains roundResult');
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      guestClient.emit('game:submit_guess', { roundIndex: 1, latitude: 10, longitude: 10, countryCode: 'FR' }, (res) => {
        assert(res.success === true, 'Guest submit_guess succeeded');
        resolve();
      });
    });

    await roundEndedPromise;

    hostClient.disconnect();
    guestClient.disconnect();
    httpServer.close();
  }

  console.log('\n🎉 All Server Target Secrecy Security Verification Tests Passed!\n');
}

runServerTargetSecrecyTests().then(() => {
  console.log('Done target secrecy tests');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
