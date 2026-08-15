import { calculateTimeAttackScore, calculateGeoScore } from '../utils/scoring';
import { TIME_ATTACK_MODE, GAME_MODE_DEFINITIONS } from './modes';
import {
  TIME_ATTACK_MODE_STRATEGY,
  getModeStrategy,
  isModeRegistered,
  validateRoomSettings,
  getRegisteredModes
} from './modeRegistry';
import { MAP_PRESETS } from './maps';

console.log('🧪 Running Phase 10B Time Attack Core Foundation Tests...\n');

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

function runTimeAttackFoundationTests() {
  // Test 1: 0 seconds -> 1.5x multiplier
  const score0s = calculateTimeAttackScore(0, 0);
  assert(score0s.timeMultiplier === 1.5, '0s elapsed yields 1.5x multiplier');

  // Test 2: 5 seconds -> ~1.4167x multiplier (1.5 - 5/60 = 1.4166666...)
  const score5s = calculateTimeAttackScore(0, 5);
  assert(Math.abs(score5s.timeMultiplier - (1.5 - 5/60)) < 0.0001, '5s elapsed yields ~1.4167x multiplier');

  // Test 3: 10 seconds -> ~1.3333x multiplier (1.5 - 10/60 = 1.3333333...)
  const score10s = calculateTimeAttackScore(0, 10);
  assert(Math.abs(score10s.timeMultiplier - (1.5 - 10/60)) < 0.0001, '10s elapsed yields ~1.3333x multiplier');

  // Test 4: 15 seconds -> 1.25x multiplier
  const score15s = calculateTimeAttackScore(0, 15);
  assert(score15s.timeMultiplier === 1.25, '15s elapsed yields 1.25x multiplier');

  // Test 5: 20 seconds -> ~1.1667x multiplier
  const score20s = calculateTimeAttackScore(0, 20);
  assert(Math.abs(score20s.timeMultiplier - (1.5 - 20/60)) < 0.0001, '20s elapsed yields ~1.1667x multiplier');

  // Test 6: 25 seconds -> ~1.0833x multiplier
  const score25s = calculateTimeAttackScore(0, 25);
  assert(Math.abs(score25s.timeMultiplier - (1.5 - 25/60)) < 0.0001, '25s elapsed yields ~1.0833x multiplier');

  // Test 7: 30 seconds -> 1.0x multiplier
  const score30s = calculateTimeAttackScore(0, 30);
  assert(score30s.timeMultiplier === 1.0, '30s elapsed yields 1.0x multiplier');

  // Test 8: elapsed time > 30 seconds clamps to 30
  const scoreOverTime = calculateTimeAttackScore(0, 45);
  assert(scoreOverTime.clampedTimeSeconds === 30, '45s elapsed clamps to 30s');
  assert(scoreOverTime.timeMultiplier === 1.0, '45s elapsed yields 1.0x multiplier');

  // Test 9: negative elapsed time clamps to 0
  const scoreNegativeTime = calculateTimeAttackScore(0, -5);
  assert(scoreNegativeTime.clampedTimeSeconds === 0, 'Negative time clamps to 0s');
  assert(scoreNegativeTime.timeMultiplier === 1.5, 'Negative time yields 1.5x multiplier');

  // Test 10: perfect geographic score at 0 seconds
  const perfect0s = calculateTimeAttackScore(0, 0);
  assert(perfect0s.baseScore === 5000, 'Perfect geo score base is 5000');
  assert(perfect0s.finalScore === 7500, 'Perfect geo score at 0s yields 7500 final score');

  // Test 11: perfect geographic score at 30 seconds
  const perfect30s = calculateTimeAttackScore(0, 30);
  assert(perfect30s.baseScore === 5000, 'Perfect geo score base is 5000');
  assert(perfect30s.finalScore === 5000, 'Perfect geo score at 30s yields 5000 final score');

  // Test 12: poor geographic score + fast submission
  const base6000km = calculateGeoScore(6000, 1491.6); // ~89
  const poorFast = calculateTimeAttackScore(6000, 1);
  assert(poorFast.baseScore === base6000km, 'Base score for 6000km is preserved');
  assert(poorFast.finalScore === Math.round(base6000km * (1.5 - 1/60)), 'Poor score + fast submission applies time multiplier correctly');
  assert(poorFast.finalScore < 200, 'Poor score + fast submission remains low (< 200)');

  // Test 13: no-pin timeout returns 0
  const noPinTimeout = calculateTimeAttackScore(null, 30, 1491.6, false);
  assert(noPinTimeout.baseScore === 0, 'No-pin timeout base score is 0');
  assert(noPinTimeout.finalScore === 0, 'No-pin timeout final score is 0');
  assert(!noPinTimeout.hasPinnedLocation, 'hasPinnedLocation is false');

  // Test 14: pinned timeout uses geographic score * 1.0
  const pinnedTimeout = calculateTimeAttackScore(25, 30, 1491.6, true);
  const geo25km = calculateGeoScore(25, 1491.6);
  assert(pinnedTimeout.baseScore === geo25km, 'Pinned timeout base score matches geo score');
  assert(pinnedTimeout.timeMultiplier === 1.0, 'Pinned timeout multiplier is 1.0');
  assert(pinnedTimeout.finalScore === geo25km, 'Pinned timeout final score equals base score * 1.0');

  // Test 15: Time Attack mode is registered
  assert(TIME_ATTACK_MODE.id === 'time_attack', 'TIME_ATTACK_MODE has id "time_attack"');
  assert(GAME_MODE_DEFINITIONS['time_attack'] === TIME_ATTACK_MODE, 'GAME_MODE_DEFINITIONS contains TIME_ATTACK_MODE');
  assert(isModeRegistered('time_attack'), 'modeRegistry registers "time_attack"');
  assert(getModeStrategy('time_attack') === TIME_ATTACK_MODE_STRATEGY, 'getModeStrategy("time_attack") returns strategy');

  // Test 16: All 8 maps are accepted in validation
  const allMapIds = ['world', 'asia', 'europe', 'north_america', 'south_america', 'africa', 'oceania', 'india'];
  assert(allMapIds.length === 8, '8 map presets exist');
  for (const mapId of allMapIds) {
    assert(mapId in MAP_PRESETS, `Map preset "${mapId}" exists in MAP_PRESETS`);
    const valResult = validateRoomSettings({ gameType: 'time_attack', mapId });
    assert(valResult.valid && valResult.settings.mapId === mapId, `Room validation accepts map "${mapId}" for Time Attack`);
  }

  // Test 17: Normal rules are accepted
  const normalVal = validateRoomSettings({ gameType: 'time_attack', gameMode: 'normal' });
  assert(normalVal.valid && normalVal.settings.gameMode === 'normal', 'Validation accepts "normal" mode');

  // Test 18: Pro rules are accepted
  const proVal = validateRoomSettings({ gameType: 'time_attack', gameMode: 'pro' });
  assert(proVal.valid && proVal.settings.gameMode === 'pro', 'Validation accepts "pro" mode');

  // Test 19: Existing modes remain unchanged
  assert(isModeRegistered('classic'), 'Classic mode remains registered');
  assert(isModeRegistered('duels'), 'Duels mode remains registered');
  assert(isModeRegistered('country_streak'), 'Country Streak mode remains registered');
  const allModes = getRegisteredModes();
  assert(allModes.length === 4, 'Total registered modes count is 4 (classic, duels, country_streak, time_attack)');

  console.log(`\nTime Attack Foundation Test Results: ${passed}/${total} passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTimeAttackFoundationTests();
