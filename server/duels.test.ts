import { DuelsSessionManager } from './duelsSession';
import { RoomManager } from './roomManager';
import { RoomPlayer, CandidateSeed, TargetResolutionResult } from '../src/shared/types/multiplayer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runDuelsEngineTests() {
  console.log('🧪 Running Phase 5A Duels Engine Unit & State Tests...\n');

  const p1: RoomPlayer = { id: 'p1', displayName: 'Player 1', isHost: true, status: 'CONNECTED', joinedAt: Date.now() };
  const p2: RoomPlayer = { id: 'p2', displayName: 'Player 2', isHost: false, status: 'CONNECTED', joinedAt: Date.now() };
  const players = [p1, p2];

  // Test 1: Initial state (6000 HP, 1.0x multiplier)
  {
    console.log('--- Test 1: Initial Duels State ---');
    const session = new DuelsSessionManager('ROOM1', 20, 0, 'normal');
    session.initSession(players);

    assert(session.playerHp.get('p1') === 6000, 'Player 1 initial HP is 6000');
    assert(session.playerHp.get('p2') === 6000, 'Player 2 initial HP is 6000');
    assert(session.playerMultipliers.get('p1') === 1.0, 'Player 1 initial multiplier is 1.0x');
    assert(session.playerMultipliers.get('p2') === 1.0, 'Player 2 initial multiplier is 1.0x');
    assert(session.maxRounds === 20, 'Max rounds defaults to 20 cap');
  }

  // Test 2: Normal round damage & multiplier progression
  {
    console.log('--- Test 2: Round Damage & Winner Multiplier Increase ---');
    const session = new DuelsSessionManager('ROOM2', 20, 0, 'normal');
    session.initSession(players);

    // Set target
    const res: TargetResolutionResult = {
      roundIndex: 1,
      candidateId: 'cand1',
      resolvedLat: 40.0,
      resolvedLng: -74.0,
      country: 'USA'
    };
    session.activateRoundFromHostResolution(res);

    // Player 1 guesses exact location (0 km, 5000 pts)
    session.submitGuess('p1', 'Player 1', 40.0, -74.0);
    // Player 2 guesses far away (lower score)
    session.submitGuess('p2', 'Player 2', 45.0, -74.0);

    const { session: pubSession, roundResult } = session.endRound(players);

    assert(roundResult.guesses[0].score > roundResult.guesses[1].score, 'Player 1 scored higher than Player 2');
    const scoreDiff = roundResult.guesses[0].score - roundResult.guesses[1].score;
    const expectedDamage = Math.round(scoreDiff * 1.0); // winner multiplier was 1.0

    assert(session.playerHp.get('p2') === 6000 - expectedDamage, `Player 2 HP reduced by exact damage (${expectedDamage})`);
    assert(session.playerHp.get('p1') === 6000, 'Player 1 HP unchanged');
    assert(session.playerMultipliers.get('p1') === 1.5, 'Winner Player 1 multiplier increased to 1.5x');
    assert(session.playerMultipliers.get('p2') === 1.0, 'Loser Player 2 multiplier remains 1.0x');
  }

  // Test 3: Multiplier progression across multiple rounds
  {
    console.log('--- Test 3: Repeated Winner Multiplier Progression ---');
    const session = new DuelsSessionManager('ROOM3', 20, 0, 'normal');
    session.initSession(players);

    const targetRes: TargetResolutionResult = { roundIndex: 1, candidateId: 'c1', resolvedLat: 0, resolvedLng: 0, country: 'Equator' };

    // Round 1: P1 wins
    session.activateRoundFromHostResolution(targetRes);
    session.submitGuess('p1', 'P1', 0, 0); // 5000
    session.submitGuess('p2', 'P2', 10, 0);
    session.endRound(players);
    assert(session.playerMultipliers.get('p1') === 1.5, 'P1 mult becomes 1.5x after 1st win');

    // Round 2: P1 wins again
    session.prepareNextRound(players);
    session.activateRoundFromHostResolution({ ...targetRes, roundIndex: 2 });
    session.submitGuess('p1', 'P1', 0, 0); // 5000
    session.submitGuess('p2', 'P2', 5, 0);
    session.endRound(players);
    assert(session.playerMultipliers.get('p1') === 2.0, 'P1 mult becomes 2.0x after 2nd win');
  }

  // Test 4: Tie round (0 damage, both get +0.5x multiplier)
  {
    console.log('--- Test 4: Tie Round Mechanics ---');
    const session = new DuelsSessionManager('ROOM4', 20, 0, 'normal');
    session.initSession(players);

    session.activateRoundFromHostResolution({ roundIndex: 1, candidateId: 'c1', resolvedLat: 10, resolvedLng: 10, country: 'Test' });
    session.submitGuess('p1', 'P1', 10, 10);
    session.submitGuess('p2', 'P2', 10, 10);

    const { roundResult } = session.endRound(players);

    assert(roundResult.guesses[0].score === roundResult.guesses[1].score, 'Scores are identical');
    assert(session.playerHp.get('p1') === 6000, 'Player 1 HP unchanged on tie');
    assert(session.playerHp.get('p2') === 6000, 'Player 2 HP unchanged on tie');
    assert(session.playerMultipliers.get('p1') === 1.5, 'Player 1 receives +0.5x multiplier on tie');
    assert(session.playerMultipliers.get('p2') === 1.5, 'Player 2 receives +0.5x multiplier on tie');
  }

  // Test 5: Timeout handling
  {
    console.log('--- Test 5: Single & Both Players Timeout ---');
    // Subtest A: P1 submits, P2 times out
    const sessionA = new DuelsSessionManager('ROOM5A', 20, 0, 'normal');
    sessionA.initSession(players);
    sessionA.activateRoundFromHostResolution({ roundIndex: 1, candidateId: 'c1', resolvedLat: 0, resolvedLng: 0, country: 'Test' });
    sessionA.submitGuess('p1', 'P1', 0, 0); // 5000 pts
    // P2 submits nothing -> time expires
    const resA = sessionA.endRound(players);
    const p2Guess = resA.roundResult.guesses.find(g => g.playerId === 'p2')!;
    assert(p2Guess.score === 0, 'Timed out player gets 0 score');
    assert(p2Guess.timedOut === true, 'Timed out flag set for non-submitting player');
    assert(sessionA.playerHp.get('p2')! < 6000, 'Timed out player received damage');

    // Subtest B: Both time out
    const sessionB = new DuelsSessionManager('ROOM5B', 20, 0, 'normal');
    sessionB.initSession(players);
    sessionB.activateRoundFromHostResolution({ roundIndex: 1, candidateId: 'c1', resolvedLat: 0, resolvedLng: 0, country: 'Test' });
    const resB = sessionB.endRound(players);
    assert(sessionB.playerHp.get('p1') === 6000, 'P1 HP intact when both timeout');
    assert(sessionB.playerHp.get('p2') === 6000, 'P2 HP intact when both timeout');
    assert(sessionB.playerMultipliers.get('p1') === 1.5, 'P1 mult +0.5x on double timeout');
    assert(sessionB.playerMultipliers.get('p2') === 1.5, 'P2 mult +0.5x on double timeout');
  }

  // Test 6: Zero HP Knockout & Match Termination
  {
    console.log('--- Test 6: Zero HP Knockout & Termination ---');
    const session = new DuelsSessionManager('ROOM6', 20, 0, 'normal');
    session.initSession(players);

    // Artificially give P2 low HP (100 HP) and P1 multiplier 2.0x
    session.playerHp.set('p2', 100);
    session.playerMultipliers.set('p1', 2.0);

    session.activateRoundFromHostResolution({ roundIndex: 1, candidateId: 'c1', resolvedLat: 0, resolvedLng: 0, country: 'Test' });
    session.submitGuess('p1', 'P1', 0, 0); // 5000
    session.submitGuess('p2', 'P2', 80, 0); // 0 score
    session.endRound(players);

    assert(session.playerHp.get('p2') === 0, 'Player 2 HP clamped to 0');
    assert(session.matchFinished === true, 'Match marked as finished on 0 HP');
    assert(session.matchWinnerId === 'p1', 'Player 1 declared match winner');
    assert(session.endReason === 'KNOCKOUT', 'End reason recorded as KNOCKOUT');
    assert(session.roundState === 'GAME_FINISHED', 'Round state updated to GAME_FINISHED');
  }

  // Test 7: 20-Round Cap & Higher HP Win / Draw
  {
    console.log('--- Test 7: 20-Round Cap & Draw Mechanics ---');
    const session = new DuelsSessionManager('ROOM7', 20, 0, 'normal');
    session.initSession(players);

    // Simulate round 20 ending with P1: 4000 HP, P2: 2500 HP
    session.currentRound = 20;
    session.playerHp.set('p1', 4000);
    session.playerHp.set('p2', 2500);

    session.activateRoundFromHostResolution({ roundIndex: 20, candidateId: 'c20', resolvedLat: 0, resolvedLng: 0, country: 'Test' });
    session.submitGuess('p1', 'P1', 0, 0);
    session.submitGuess('p2', 'P2', 0, 0); // tie round
    session.endRound(players);

    assert(session.matchFinished === true, 'Match finished at round 20');
    assert(session.matchWinnerId === 'p1', 'Higher HP player (P1: 4000 vs P2: 2500) wins after round 20');
    assert(session.endReason === 'MAX_ROUNDS', 'End reason is MAX_ROUNDS');

    // Test Draw at round 20 when HP is equal
    const sessionDraw = new DuelsSessionManager('ROOM7D', 20, 0, 'normal');
    sessionDraw.initSession(players);
    sessionDraw.currentRound = 20;
    sessionDraw.playerHp.set('p1', 3000);
    sessionDraw.playerHp.set('p2', 3000);
    sessionDraw.activateRoundFromHostResolution({ roundIndex: 20, candidateId: 'c20', resolvedLat: 0, resolvedLng: 0, country: 'Test' });
    sessionDraw.submitGuess('p1', 'P1', 0, 0);
    sessionDraw.submitGuess('p2', 'P2', 0, 0);
    sessionDraw.endRound(players);

    assert(sessionDraw.matchFinished === true, 'Match finished at round 20');
    assert(sessionDraw.isDraw === true, 'Match declared as draw when HP is equal');
    assert(sessionDraw.matchWinnerId === null, 'Match winner is null on draw');
  }

  // Test 8: Input Rejections (Duplicate, Late, Forged)
  {
    console.log('--- Test 8: Security & Edge Case Input Rejections ---');
    const session = new DuelsSessionManager('ROOM8', 20, 0, 'normal');
    session.initSession(players);

    // Attempt guess before round activated
    const errNotActive = session.submitGuess('p1', 'P1', 0, 0);
    assert(errNotActive.success === false, 'Guess rejected when round is not active');

    session.activateRoundFromHostResolution({ roundIndex: 1, candidateId: 'c1', resolvedLat: 10, resolvedLng: 10, country: 'Test' });

    // Submit valid guess
    const validGuess = session.submitGuess('p1', 'P1', 10, 10);
    assert(validGuess.success === true, 'First guess accepted');

    // Attempt duplicate guess
    const dupGuess = session.submitGuess('p1', 'P1', 10, 10);
    assert(dupGuess.success === false, 'Duplicate guess rejected');

    session.submitGuess('p2', 'P2', 20, 20);
    session.endRound(players);

    // Attempt guess after round ended
    const lateGuess = session.submitGuess('p1', 'P1', 10, 10);
    assert(lateGuess.success === false, 'Late guess after round ended rejected');
  }

  // Test 9: RoomManager & Classic Multiplayer Regression
  {
    console.log('--- Test 9: RoomManager Integration & Classic Mode Regression ---');
    const roomMgr = new RoomManager();

    // Create Duels Room
    const createRes = roomMgr.createRoom('p1', 'Player 1', { gameType: 'duels' });
    assert(createRes.success === true, 'Duels room creation succeeded');
    const code = createRes.room!.code;

    // Try starting Duels with 1 player -> should fail
    const startFail = roomMgr.startGameSession('p1');
    assert(startFail.success === false, 'Duels start fails with only 1 player');
    assert(startFail.error?.includes('requires exactly 2') === true, 'Error message specifies 2 players required');

    // Join second player
    const joinRes = roomMgr.joinRoom('p2', code, 'Player 2');
    assert(joinRes.success === true, 'Second player joined room');

    // Start Duels with 2 players -> should succeed
    const startSucc = roomMgr.startGameSession('p1');
    assert(startSucc.success === true, 'Duels session started with 2 players');
    assert(startSucc.room?.gameSession?.gameType === 'duels', 'Session type verified as duels');

    // Classic mode room test
    const classicRes = roomMgr.createRoom('c1', 'Classic Host', { gameType: 'classic', maxRounds: 5 });
    assert(classicRes.success === true, 'Classic room created successfully');
    const startClassic = roomMgr.startGameSession('c1');
    assert(startClassic.success === true, 'Classic game started successfully');
    assert(startClassic.room?.gameSession?.maxRounds === 5, 'Classic max rounds is 5');
  }

  // Test 10: Active Duels game:round_started payload contains both playerStates
  {
    console.log('--- Test 10: game:round_started Payload Verification ---');
    const roomMgr = new RoomManager();
    const createRes = roomMgr.createRoom('p1', 'Player 1', { gameType: 'duels' });
    const code = createRes.room!.code;
    roomMgr.joinRoom('p2', code, 'Player 2');
    roomMgr.startGameSession('p1');

    const targetRes = roomMgr.activateTargetFromHost('p1', {
      roundIndex: 1,
      candidateId: 'c1',
      resolvedLat: 48.8566,
      resolvedLng: 2.3522,
      country: 'France'
    }, () => {});

    assert(targetRes.success === true, 'Target activation succeeded');
    assert(targetRes.session !== undefined, 'Session returned in target activation');
    assert(targetRes.session?.duelState !== undefined, 'duelState defined in active round session');
    assert(targetRes.session?.duelState?.playerStates !== undefined, 'playerStates object defined');

    const playerStates = targetRes.session!.duelState!.playerStates;
    const playerIds = Object.keys(playerStates);
    assert(playerIds.length === 2, `playerStates contains exactly 2 players (actual: ${playerIds.length})`);
    assert(playerStates['p1']?.displayName === 'Player 1', 'Player 1 state correctly populated');
    assert(playerStates['p1']?.hp === 6000, 'Player 1 initial HP is 6000');
    assert(playerStates['p1']?.damageMultiplier === 1.0, 'Player 1 initial multiplier is 1.0');
    assert(playerStates['p2']?.displayName === 'Player 2', 'Player 2 state correctly populated');
    assert(playerStates['p2']?.hp === 6000, 'Player 2 initial HP is 6000');
    assert(playerStates['p2']?.damageMultiplier === 1.0, 'Player 2 initial multiplier is 1.0');
  }

  console.log('\n🎉 ALL PHASE 5A DUELS ENGINE TESTS PASSED SUCCESSFULLY!\n');
}

runDuelsEngineTests().catch((err) => {
  console.error('Fatal error in duels.test.ts:', err);
  process.exit(1);
});
