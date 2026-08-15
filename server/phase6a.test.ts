import { getModeStrategy, isModeRegistered, getRegisteredModes, validateRoomSettings } from '../src/game/modeRegistry';
import { RoomManager } from './roomManager';
import { GameSessionManager } from './gameSession';
import { DuelsSessionManager } from './duelsSession';
import { RoomPlayer, TargetResolutionResult } from '../src/shared/types/multiplayer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('--- Running Phase 6A Architecture Test Suite ---');

// 1. Classic is registered
assert(isModeRegistered('classic'), 'Classic mode must be registered.');

// 2. Duels is registered
assert(isModeRegistered('duels'), 'Duels mode must be registered.');

// 3. Country Streak is registered in Phase 9A
assert(isModeRegistered('country_streak'), 'Country Streak mode must be registered.');
assert(!isModeRegistered('battle_royale'), 'Battle Royale must NOT be registered yet.');
assert(!isModeRegistered('team_duels'), 'Team Duels must NOT be registered yet.');
assert(getRegisteredModes().length === 4, 'Exactly 4 modes (classic, duels, country_streak, time_attack) must be registered.');

// 4. Classic validation works
const classicValidation = validateRoomSettings({ gameType: 'classic', maxRounds: 5, timeLimitSeconds: 60 });
assert(classicValidation.valid === true, 'Classic settings should be valid.');
assert(classicValidation.settings.maxRounds === 5, 'Classic maxRounds should be 5.');

const classicInvalidRounds = validateRoomSettings({ gameType: 'classic', maxRounds: 15 });
assert(classicInvalidRounds.valid === false, 'Classic should reject maxRounds > 10.');

// 5. Duels validation and player count checks
const duelsValidation = validateRoomSettings({ gameType: 'duels', maxRounds: 20 });
assert(duelsValidation.valid === true, 'Duels settings should be valid.');

const roomMgr = new RoomManager();
const createRes = roomMgr.createRoom('player1', 'Player 1');
assert(createRes.success === true, 'createRoom should succeed');
const roomCode = createRes.room!.code;

roomMgr.updateSettings('player1', { gameType: 'duels' });

// Try starting Duels with 1 player -> should fail
const startWith1Player = roomMgr.startGameSession('player1');
assert(startWith1Player.success === false, 'Duels start with 1 player must fail.');

roomMgr.joinRoom('player2', roomCode, 'Player 2');

// 6 & 7. Correct session engine creation
const startDuels = roomMgr.startGameSession('player1');
if (!startDuels.success) {
  console.error('startDuels failed:', startDuels.error);
}
assert(startDuels.success === true, `Duels start with 2 players must succeed: ${startDuels.error}`);
const duelsRoom = roomMgr.getRoom(roomCode)!;
assert(duelsRoom.gameSession instanceof DuelsSessionManager, 'Duels session engine must be DuelsSessionManager.');

// Test Classic session engine creation
const roomMgr2 = new RoomManager();
const createRes2 = roomMgr2.createRoom('p1', 'P1');
assert(createRes2.success === true, 'createRoom 2 should succeed');
const roomCode2 = createRes2.room!.code;
const startClassic = roomMgr2.startGameSession('p1');
assert(startClassic.success === true, 'Classic start with 1 player must succeed.');
const classicRoom = roomMgr2.getRoom(roomCode2)!;
assert(classicRoom.gameSession instanceof GameSessionManager, 'Classic session engine must be GameSessionManager.');

// 8. Active-round public session does NOT leak actual target coordinates (SECURITY INVARIANT)
const session = classicRoom.gameSession!;
const resolution: TargetResolutionResult = {
  roundIndex: 1,
  candidateId: 'cand_1',
  panoId: 'pano_secret_123',
  resolvedLat: 48.8584,
  resolvedLng: 2.2945,
  country: 'France',
  locationName: 'Eiffel Tower',
  heading: 90,
  pitch: 0
};
const activateRes = session.activateRoundFromHostResolution(resolution);
const publicSession = activateRes.session;

assert(publicSession.activeTarget?.panoId === 'pano_secret_123', 'Active target panoId must be present.');
assert((publicSession.activeTarget as any).latitude === undefined, 'Active target MUST NOT expose latitude.');
assert((publicSession.activeTarget as any).longitude === undefined, 'Active target MUST NOT expose longitude.');
assert((publicSession.activeTarget as any).country === undefined, 'Active target MUST NOT expose country.');
assert((publicSession.activeTarget as any).locationName === undefined, 'Active target MUST NOT expose locationName.');

// Verify secret target remains stored on server
assert(session.secretTarget?.latitude === 48.8584, 'Secret target latitude must be stored server-side.');
assert(session.secretTarget?.country === 'France', 'Secret target country must be stored server-side.');

// 9. Host-assisted target resolution works
assert(session.roundState === 'ROUND_ACTIVE', 'Round must be active after resolution.');

// 10. Duels public state contains populated playerStates
const duelsSession = duelsRoom.gameSession as DuelsSessionManager;
const duelsResolution: TargetResolutionResult = {
  roundIndex: 1,
  candidateId: 'cand_duel_1',
  panoId: 'pano_duel_123',
  resolvedLat: 35.6762,
  resolvedLng: 139.6503,
  country: 'Japan',
  locationName: 'Tokyo',
  heading: 0,
  pitch: 0
};
const duelsActivateRes = duelsSession.activateRoundFromHostResolution(duelsResolution, undefined, duelsRoom.players);
const duelsPublicSession = duelsActivateRes.session;

assert(duelsPublicSession.duelState !== undefined, 'Duels state must exist in public session.');
assert(duelsPublicSession.duelState?.playerStates['player1'] !== undefined, 'player1 must exist in duelState.playerStates.');
assert(duelsPublicSession.duelState?.playerStates['player1'].hp === 6000, 'player1 HP must start at 6000.');
assert(duelsPublicSession.duelState?.playerStates['player2'] !== undefined, 'player2 must exist in duelState.playerStates.');
assert(duelsPublicSession.duelState?.playerStates['player2'].hp === 6000, 'player2 HP must start at 6000.');

// 11. Existing Classic multiplayer flow remains functional
const guessRes = session.submitGuess('p1', 'P1', 48.8, 2.2);
assert(guessRes.success === true, 'Guess submission in Classic must succeed.');
assert(guessRes.score > 0, 'Score should be calculated.');
const endRoundRes = session.endRound(classicRoom.players);
assert(endRoundRes.roundResult.targetLocation.latitude === 48.8584, 'Round result target location revealed AFTER round ends.');

// 12. Existing Duels flow remains functional
duelsSession.submitGuess('player1', 'Player 1', 35.6, 139.6);
duelsSession.submitGuess('player2', 'Player 2', 30.0, 100.0);
const duelsEndRound = duelsSession.endRound(duelsRoom.players);
assert(duelsEndRound.roundResult.guesses.length === 2, 'Duels end round must process both guesses.');
assert(duelsEndRound.session.duelState?.playerStates['player2'].hp < 6000, 'Player 2 should take damage for worse guess.');

// 13. Target Resolution Failure Retry Mechanics
const retryRoomMgr = new RoomManager();
const retryCreate = retryRoomMgr.createRoom('retryHost', 'Retry Host');
const retryRoomCode = retryCreate.room!.code;
const retryStart = retryRoomMgr.startGameSession('retryHost');
const retryRoomWithSession = retryRoomMgr.getRoom(retryRoomCode)!;
const retrySession = retryRoomWithSession.gameSession!;
const initialCandidate = retrySession.pendingCandidateSeed;

// Simulation: Host tries to resolve and fails in REAL mode
const failedResolution: TargetResolutionResult = {
  roundIndex: 1,
  candidateId: initialCandidate!.candidateId,
  failed: true,
  error: 'ZERO_RESULTS'
};

const handleFailRes = retryRoomMgr.handleTargetResolutionFailure('retryHost', failedResolution);
assert(handleFailRes.success === true, 'handleTargetResolutionFailure should succeed and provide replacement candidate');
assert(retrySession.resolutionAttempts === 1, 'Resolution attempts should increment to 1');
assert(handleFailRes.candidateSeed!.candidateId !== initialCandidate!.candidateId, 'Replacement candidate should be different from failed candidate');

// Simulation: Host tries to resolve the replacement and fails again
const failedResolution2: TargetResolutionResult = {
  roundIndex: 1,
  candidateId: handleFailRes.candidateSeed!.candidateId,
  failed: true,
  error: 'ZERO_RESULTS'
};
const handleFailRes2 = retryRoomMgr.handleTargetResolutionFailure('retryHost', failedResolution2);
assert(handleFailRes2.success === true, 'handleTargetResolutionFailure should succeed for 2nd retry');
assert(retrySession.resolutionAttempts === 2, 'Resolution attempts should increment to 2');

// Simulation: Host tries 3rd time and fails -> max retries
const failedResolution3: TargetResolutionResult = {
  roundIndex: 1,
  candidateId: handleFailRes2.candidateSeed!.candidateId,
  failed: true,
  error: 'ZERO_RESULTS'
};
const handleFailRes3 = retryRoomMgr.handleTargetResolutionFailure('retryHost', failedResolution3);
assert(handleFailRes3.success === false, 'handleTargetResolutionFailure should fail after max retries');
assert(handleFailRes3.error!.includes('maximum retry attempts'), 'Should return correct max retries error');

// 14. REAL mode reject empty panoId
const realEmptyPanoRes: TargetResolutionResult = {
  roundIndex: 1,
  candidateId: 'test_123',
  apiMode: 'REAL',
  panoId: '',
  resolvedLat: 10,
  resolvedLng: 10
};
const realEmptyActivate = retrySession.activateRoundFromHostResolution(realEmptyPanoRes);
assert(realEmptyActivate.success === false, 'activateRoundFromHostResolution must fail if REAL mode and empty panoId');

// 15. MOCK mode allows empty panoId
const mockEmptyPanoRes: TargetResolutionResult = {
  roundIndex: 1,
  candidateId: 'test_123',
  apiMode: 'MOCK',
  panoId: '',
  resolvedLat: 10,
  resolvedLng: 10
};
const mockEmptyActivate = retrySession.activateRoundFromHostResolution(mockEmptyPanoRes);
assert(mockEmptyActivate.success === true, 'activateRoundFromHostResolution must succeed if MOCK mode and empty panoId');
assert(mockEmptyActivate.activeTarget!.mockLocationId !== undefined, 'mockLocationId must be populated in MOCK mode');
assert(mockEmptyActivate.activeTarget!.mockLocationId === retrySession.pendingCandidateSeed?.candidateId, 'mockLocationId must match pending candidate');

console.log('✅ ALL Phase 6A Architecture Tests Passed Successfully!');
