import { WORLD_MAP, MAP_PRESETS } from './maps';
import { CLASSIC_MODE, GAME_MODE_DEFINITIONS } from './modes';
import { DEFAULT_RULES, RULESET_PRESETS, getRulesetForMode } from './rulesets';
import { resolveSessionLocations } from './locationEngine';
import { MOCK_LOCATIONS } from '../data/mockLocations';
import { GAMEPLAY_CANDIDATE_LOCATIONS } from '../data/gameplayLocations';

console.log('🧪 Running Phase 4A Architecture Foundation Tests...\n');

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

async function runPhase4ATests() {
  // Test 1: WORLD_MAP definition lightweight reference
  assert(WORLD_MAP.id === 'world', 'WORLD_MAP has id "world"');
  assert(WORLD_MAP.candidates === GAMEPLAY_CANDIDATE_LOCATIONS, 'WORLD_MAP references existing candidate array without duplication');
  assert(WORLD_MAP.candidates.length === 221, 'Candidate count matches 221 candidate seeds');
  assert(MAP_PRESETS['world'] === WORLD_MAP, 'MAP_PRESETS registry contains WORLD_MAP');

  // Test 2: CLASSIC_MODE definition
  assert(CLASSIC_MODE.id === 'classic', 'CLASSIC_MODE has id "classic"');
  assert(CLASSIC_MODE.defaultMaxRounds === 5, 'CLASSIC_MODE defaults to 5 rounds');
  assert(CLASSIC_MODE.defaultMap === WORLD_MAP, 'CLASSIC_MODE default map is WORLD_MAP');
  assert(GAME_MODE_DEFINITIONS['classic'] === CLASSIC_MODE, 'GAME_MODE_DEFINITIONS registry contains CLASSIC_MODE');

  // Test 3: Scoring calculation via CLASSIC_MODE
  const perfectScore = CLASSIC_MODE.calculateScore(0, WORLD_MAP.scaleFactor);
  assert(perfectScore === 5000, 'CLASSIC_MODE calculateScore returns 5000 for 0km distance');

  const zeroDistance = CLASSIC_MODE.calculateDistance(10, 10, 10, 10);
  assert(zeroDistance === 0, 'CLASSIC_MODE calculateDistance returns 0 for identical coordinates');

  // Test 4: Rulesets
  assert(DEFAULT_RULES.movement === 'ALLOW_MOVING', 'DEFAULT_RULES allows movement');
  const proRules = getRulesetForMode('pro', 60);
  assert(proRules.movement === 'NO_MOVING', 'pro ruleset prohibits movement');
  assert(proRules.timeLimitSeconds === 60, 'pro ruleset reflects requested 60s time limit');

  // Test 5: LocationEngine MOCK Mode Invariant
  const usedIds = new Set<string>();
  const mockResult = await resolveSessionLocations({
    map: WORLD_MAP,
    count: 5,
    usedCandidateIds: usedIds,
    apiMode: 'MOCK',
    mockLocations: MOCK_LOCATIONS
  });

  assert(mockResult.locations.length === 5, 'LocationEngine returns 5 mock locations in MOCK mode');
  assert(!mockResult.error, 'No error returned in MOCK mode');

  console.log(`\nPhase 4A Test Results: ${passed}/${total} passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runPhase4ATests();
