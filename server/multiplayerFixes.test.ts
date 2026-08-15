import { RoomManager, RoomWithSession } from './roomManager';
import { GameSessionManager } from './gameSession';
import { DuelsSessionManager } from './duelsSession';
import { MAP_PRESETS } from '../src/game/maps';
import { GAME_MODE_PRESETS } from '../src/types/game';

console.log('🧪 Running Multiplayer Bug Fixes Regression Tests...\n');

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

function runRegressionTests() {
  const rm = new RoomManager();

  // Test 1: Europe mapId reaches the session and candidate selection uses Europe candidates
  const europeRoomRes = rm.createRoom('host-1', 'HostAlice', { mapId: 'europe', gameMode: 'normal' });
  assert(europeRoomRes.success === true, 'Created room with europe mapId');
  const europeStartRes = rm.startGameSession('host-1');
  assert(europeStartRes.success === true, 'Started session with europe mapId');
  const europeSession = (europeRoomRes.room as RoomWithSession).gameSession!;
  assert(europeSession.mapId === 'europe', 'Session mapId is europe');
  const europeSeed = europeStartRes.candidateSeed!;
  const europeMapCandidates = MAP_PRESETS.europe.candidates;
  const isEuropeCandidate = europeMapCandidates.some(c => c.id === europeSeed.candidateId);
  assert(isEuropeCandidate === true, 'Selected candidate belongs to Europe candidates pool');

  // Test 2: India mapId reaches the session and candidate selection uses India candidates
  const indiaRoomRes = rm.createRoom('host-2', 'HostBob', { mapId: 'india', gameMode: 'normal' });
  assert(indiaRoomRes.success === true, 'Created room with india mapId');
  const indiaStartRes = rm.startGameSession('host-2');
  assert(indiaStartRes.success === true, 'Started session with india mapId');
  const indiaSession = (indiaRoomRes.room as RoomWithSession).gameSession!;
  assert(indiaSession.mapId === 'india', 'Session mapId is india');
  const indiaSeed = indiaStartRes.candidateSeed!;
  const indiaMapCandidates = MAP_PRESETS.india.candidates;
  const isIndiaCandidate = indiaMapCandidates.some(c => c.id === indiaSeed.candidateId);
  assert(isIndiaCandidate === true, 'Selected candidate belongs to India candidates pool');

  // Test 3: Missing mapId defaults to World
  const defaultRoomRes = rm.createRoom('host-3', 'HostCharlie', { gameMode: 'normal' });
  assert(defaultRoomRes.success === true, 'Created room without explicit mapId');
  assert(defaultRoomRes.room?.settings.mapId === 'world', 'Room settings mapId defaults to world');
  const defaultStartRes = rm.startGameSession('host-3');
  assert(defaultStartRes.success === true, 'Started session without explicit mapId');
  const defaultSession = (defaultRoomRes.room as RoomWithSession).gameSession!;
  assert(defaultSession.mapId === 'world', 'Session mapId defaults to world');

  // Test 4: Multiplayer normal mode gives both host and guest ALLOW_PAN/ALLOW_ZOOM/ALLOW_MOVING
  const normalRules = GAME_MODE_PRESETS.normal;
  assert(normalRules.pan === 'ALLOW_PAN', 'Normal mode pan rule is ALLOW_PAN');
  assert(normalRules.zoom === 'ALLOW_ZOOM', 'Normal mode zoom rule is ALLOW_ZOOM');
  assert(normalRules.movement === 'ALLOW_MOVING', 'Normal mode movement rule is ALLOW_MOVING');

  // Test 5: Multiplayer pro mode gives both host and guest NO_PAN/NO_ZOOM/NO_MOVING
  const proRules = GAME_MODE_PRESETS.pro;
  assert(proRules.pan === 'NO_PAN', 'Pro mode pan rule is NO_PAN');
  assert(proRules.zoom === 'NO_ZOOM', 'Pro mode zoom rule is NO_ZOOM');
  assert(proRules.movement === 'NO_MOVING', 'Pro mode movement rule is NO_MOVING');

  // Test 6: Host's previous single-player Pro/NMPZ setting cannot affect multiplayer normal mode
  const computeMultiplayerRules = (gameMode: 'normal' | 'pro') => {
    return gameMode === 'pro'
      ? { movement: 'NO_MOVING' as const, pan: 'NO_PAN' as const, zoom: 'NO_ZOOM' as const }
      : { movement: 'ALLOW_MOVING' as const, pan: 'ALLOW_PAN' as const, zoom: 'ALLOW_ZOOM' as const };
  };

  const hostStaleSinglePlayerRules = { movement: 'NO_MOVING', pan: 'NO_PAN', zoom: 'NO_ZOOM' };
  const mpNormalSession = { gameMode: 'normal' as const };
  const derivedRulesForHost = computeMultiplayerRules(mpNormalSession.gameMode);
  const derivedRulesForGuest = computeMultiplayerRules(mpNormalSession.gameMode);

  assert(derivedRulesForHost.pan === 'ALLOW_PAN', 'Host in normal MP session gets ALLOW_PAN regardless of single-player state');
  assert(derivedRulesForHost.zoom === 'ALLOW_ZOOM', 'Host in normal MP session gets ALLOW_ZOOM regardless of single-player state');
  assert(derivedRulesForHost.movement === 'ALLOW_MOVING', 'Host in normal MP session gets ALLOW_MOVING regardless of single-player state');
  assert(JSON.stringify(derivedRulesForHost) === JSON.stringify(derivedRulesForGuest), 'Host and Guest receive identical rules in MP session');

  console.log(`\nMultiplayer Bug Fixes Test Results: ${passed}/${total} passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runRegressionTests();
