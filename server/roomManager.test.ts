import { RoomManager } from './roomManager';

console.log('🧪 Running Phase 4B RoomManager Unit Tests...\n');

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

function runRoomManagerTests() {
  const rm = new RoomManager();

  // Test 1: Unique Room Code Generation
  const code1 = rm.generateRoomCode();
  const code2 = rm.generateRoomCode();
  assert(code1.length === 6, 'Generated room code has 6 characters');
  assert(code1 === code1.toUpperCase(), 'Room code is uppercase');
  assert(code1 !== code2, 'Generated room codes are unique');

  // Test 2: Room Creation
  const createRes = rm.createRoom('socket-1', 'Alice', { maxRounds: 5, gameMode: 'normal' });
  assert(createRes.success === true, 'Room creation succeeds');
  assert(!!createRes.room, 'Created room object is returned');
  assert(createRes.room?.hostPlayerId === 'socket-1', 'Creator is assigned as host');
  assert(createRes.room?.players.length === 1, 'Room contains 1 player');
  assert(createRes.room?.players[0].isHost === true, 'Host player isHost flag is true');
  assert(createRes.room?.settings.maxRounds === 5, 'Custom settings applied correctly');

  const roomCode = createRes.room!.code;

  // Test 3: Joining Room
  const joinRes = rm.joinRoom('socket-2', roomCode, 'Bob');
  assert(joinRes.success === true, 'Bob joins room successfully');
  assert(joinRes.room?.players.length === 2, 'Room now has 2 players');
  assert(joinRes.room?.players[1].displayName === 'Bob', 'Second player name is Bob');
  assert(joinRes.room?.players[1].isHost === false, 'Joined player is not host');

  // Test 4: Case-insensitive Room Code Joining
  const joinResLower = rm.joinRoom('socket-3', roomCode.toLowerCase(), 'Charlie');
  assert(joinResLower.success === true, 'Charlie joins using lowercase room code');
  assert(joinResLower.room?.players.length === 3, 'Room now has 3 players');

  // Test 5: Invalid Room Code
  const invalidJoin = rm.joinRoom('socket-4', 'INVALID', 'Dave');
  assert(invalidJoin.success === false, 'Joining with invalid room code fails');
  assert(invalidJoin.error === 'Room not found. Please check the code and try again.', 'Correct error message returned for invalid room code');

  // Test 6: Invalid Display Name
  const invalidNameJoin = rm.joinRoom('socket-4', roomCode, '   ');
  assert(invalidNameJoin.success === false, 'Joining with empty display name fails');

  // Test 7: Host-Only Settings Update by Non-Host Fails
  const nonHostUpdate = rm.updateSettings('socket-2', { maxRounds: 10 });
  assert(nonHostUpdate.success === false, 'Non-host cannot update settings');
  assert(nonHostUpdate.error === 'Only the room host can update settings.', 'Correct error returned for non-host update');

  // Test 8: Host Settings Update Succeeds
  const hostUpdate = rm.updateSettings('socket-1', { maxRounds: 7, gameMode: 'pro' });
  assert(hostUpdate.success === true, 'Host can update settings');
  assert(hostUpdate.room?.settings.maxRounds === 7, 'maxRounds updated to 7');
  assert(hostUpdate.room?.settings.gameMode === 'pro', 'gameMode updated to pro');

  // Test 9: Invalid Settings Validation
  const invalidSettings = rm.updateSettings('socket-1', { maxRounds: 99 });
  assert(invalidSettings.success === false, 'Invalid maxRounds > 10 fails validation');

  // Test 10: Duplicate Player Handling (re-joining with same socket ID updates player)
  const duplicateJoin = rm.joinRoom('socket-2', roomCode, 'BobUpdated');
  assert(duplicateJoin.success === true, 'Re-joining with same socket ID succeeds');
  assert(duplicateJoin.room?.players.length === 3, 'Player count does not increase on duplicate socket join');
  assert(duplicateJoin.room?.players.find(p => p.id === 'socket-2')?.displayName === 'BobUpdated', 'Display name updated on re-join');

  // Test 11: Host Leaving Reassigns Host to Next Player
  const hostLeave = rm.leaveRoom('socket-1');
  assert(hostLeave.response.success === true, 'Host leaves room successfully');
  assert(hostLeave.wasClosed === false, 'Room remains open after host leaves');
  assert(hostLeave.updatedRoom?.players.length === 2, 'Room now has 2 players');
  assert(hostLeave.updatedRoom?.hostPlayerId === 'socket-2', 'Host reassigned to Bob (socket-2)');
  assert(hostLeave.updatedRoom?.players.find(p => p.id === 'socket-2')?.isHost === true, 'Bob isHost flag updated to true');

  // Test 12: Remaining Players Leave and Room Cleans Up
  rm.leaveRoom('socket-2');
  const finalLeave = rm.leaveRoom('socket-3');
  assert(finalLeave.wasClosed === true, 'Room marked as closed when last player leaves');
  assert(rm.getRoom(roomCode) === undefined, 'Room deleted from memory after becoming empty');
  assert(rm.getRoomCount() === 0, 'Total room count is 0');

  console.log(`\nRoomManager Test Results: ${passed}/${total} passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runRoomManagerTests();
