import { calculateTimeAttackScore } from '../utils/scoring';
import { getModeStrategy, isModeRegistered } from './modeRegistry';
import { MapRegistry } from './mapRegistry';
import { GAME_MODE_PRESETS } from '../types/game';

console.log('🧪 Running Phase 10C Single-Player Time Attack Integration Tests...\n');

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

export function runTimeAttackSinglePlayerTests() {
  // Test 1: Mode registration
  assert(isModeRegistered('time_attack'), 'time_attack is registered in ModeRegistry');
  const strategy = getModeStrategy('time_attack');
  assert(strategy?.id === 'time_attack', 'getModeStrategy("time_attack") returns valid strategy');

  // Test 2: Rulesets and presets
  const normalPreset = GAME_MODE_PRESETS['normal'];
  const proPreset = GAME_MODE_PRESETS['pro'];
  assert(normalPreset.movement === 'ALLOW_MOVING', 'Normal preset allows movement');
  assert(proPreset.movement === 'NO_MOVING', 'Pro preset forbids movement');

  // Test 3: Supported maps
  const maps = MapRegistry.getInstance().getAllMaps();
  assert(maps.length >= 8, 'At least 8 maps are available for Time Attack');
  const mapIds = maps.map(m => m.id);
  assert(mapIds.includes('world'), 'World map available');
  assert(mapIds.includes('india'), 'India map available');
  assert(mapIds.includes('asia'), 'Asia map available');
  assert(mapIds.includes('europe'), 'Europe map available');

  // Test 4: Single player round sequence scoring
  const r1 = calculateTimeAttackScore(0.01, 3.0, 1.0, true);
  assert(r1.baseScore === 5000, 'R1 base score is 5000');
  assert(r1.timeMultiplier === 1.45, 'R1 multiplier at 3s is 1.45x');
  assert(r1.finalScore === 7250, 'R1 final score is 7,250');

  const r2 = calculateTimeAttackScore(15, 12.0, 1.0, true);
  assert(r2.timeMultiplier === 1.3, 'R2 multiplier at 12s is 1.30x');

  const r3 = calculateTimeAttackScore(100, 30.0, 1.0, true);
  assert(r3.timeMultiplier === 1.0, 'R3 timeout with pin multiplier is 1.0x');

  const r4 = calculateTimeAttackScore(null, 30.0, 1.0, false);
  assert(r4.baseScore === 0 && r4.finalScore === 0, 'R4 timeout without pin gives 0 pts');

  const matchTotal = r1.finalScore + r2.finalScore + r3.finalScore + r4.finalScore;
  assert(matchTotal > 0 && matchTotal <= 37500, '5-round match score bounded by [0, 37500]');

  // Test 5: Clamping bounds
  const instant = calculateTimeAttackScore(0, 0, 1.0, true);
  assert(instant.timeMultiplier === 1.5 && instant.finalScore === 7500, '0s elapsed yields 7,500 max score');

  const overdue = calculateTimeAttackScore(0, 45, 1.0, true);
  assert(overdue.timeMultiplier === 1.0 && overdue.finalScore === 5000, '>30s elapsed clamps multiplier to 1.0x');

  console.log(`\n🎉 Single-Player Time Attack Test Suite Complete: ${passed}/${total} passed.\n`);
}

// Execute tests if executed directly
runTimeAttackSinglePlayerTests();
