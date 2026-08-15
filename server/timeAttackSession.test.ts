import { TimeAttackSessionManager } from './timeAttackSession';
import { GameSessionManager } from './gameSession';
import { DuelsSessionManager } from './duelsSession';
import { StreakSessionManager } from './streakSession';
import { RoomManager } from './roomManager';
import { RoomPlayer, TargetResolutionResult } from '../src/shared/types/multiplayer';
import { getModeStrategy } from '../src/game/modeRegistry';
import { calculateTimeAttackScore } from '../src/utils/scoring';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

export async function runTimeAttackSessionTests() {
  console.log('🧪 Running Phase 10D.1 Multiplayer Time Attack Server Foundation Tests...\n');

  const p1: RoomPlayer = { id: 'p1', displayName: 'Player 1', isHost: true, status: 'CONNECTED', joinedAt: Date.now() };
  const p2: RoomPlayer = { id: 'p2', displayName: 'Player 2', isHost: false, status: 'CONNECTED', joinedAt: Date.now() };

  // 1. Time Attack session creation
  {
    console.log('--- Test 1: Time Attack session creation ---');
    const session = new TimeAttackSessionManager('TA01', 5, 30, 'normal', 'world');
    assert(session.gameType === 'time_attack', 'gameType is time_attack');
    assert(session.maxRounds === 5, 'maxRounds is 5');
    assert(session.timeLimitSeconds === 30, 'timeLimitSeconds is 30');
  }

  // 2. Exactly 5 rounds
  {
    console.log('--- Test 2: Exactly 5 rounds ---');
    const session = new TimeAttackSessionManager('TA02', 5, 30, 'normal', 'world');
    session.initSession([p1]);
    assert(session.maxRounds === 5, 'Default max rounds is 5');
    
    // Fast forward through rounds
    session.currentRound = 5;
    const prep = session.prepareNextRound([p1]);
    assert(prep.finished === true, 'Round 5 finish triggers finished=true');
    assert(prep.session.roundState === 'GAME_FINISHED', 'roundState is GAME_FINISHED after round 5');
  }

  // 3. 30-second timer
  {
    console.log('--- Test 3: 30-second timer ---');
    const session = new TimeAttackSessionManager('TA03', 5, 60, 'normal', 'world');
    assert(session.timeLimitSeconds === 30, 'timeLimitSeconds forced to 30');
  }

  // 4. mapId propagation
  {
    console.log('--- Test 4: mapId propagation ---');
    const sessionEurope = new TimeAttackSessionManager('TA04', 5, 30, 'normal', 'europe');
    assert(sessionEurope.mapId === 'europe', 'mapId europe propagated');
  }

  // 5. Normal rules
  {
    console.log('--- Test 5: Normal rules ---');
    const sessionNormal = new TimeAttackSessionManager('TA05', 5, 30, 'normal', 'world');
    assert(sessionNormal.gameMode === 'normal', 'gameMode normal set');
  }

  // 6. Pro rules
  {
    console.log('--- Test 6: Pro rules ---');
    const sessionPro = new TimeAttackSessionManager('TA06', 5, 30, 'pro', 'world');
    assert(sessionPro.gameMode === 'pro', 'gameMode pro set');
  }

  // 7. Server-authoritative elapsed time
  {
    console.log('--- Test 7: Server-authoritative elapsed time ---');
    const session = new TimeAttackSessionManager('TA07', 5, 30, 'normal', 'world');
    session.initSession([p1]);
    const targetRes: TargetResolutionResult = {
      roundIndex: 1,
      candidateId: 'cand1',
      resolvedLat: 0.0,
      resolvedLng: 0.0,
      country: 'Equator'
    };
    session.activateRoundFromHostResolution(targetRes);

    // Override roundStartedAt to simulating 10s elapsed on server
    const now = Date.now();
    session.roundStartedAt = now - 10000;

    const res = session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    assert(res.success === true, 'Submission succeeded without client timestamp');
    assert(res.score > 5000, 'Score includes speed multiplier (>5000 for perfect distance)');
  }

  // 8. 0s submission → 1.5x
  {
    console.log('--- Test 8: 0s submission → 1.5x ---');
    const session = new TimeAttackSessionManager('TA08', 5, 30, 'normal', 'world');
    session.initSession([p1]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });
    session.roundStartedAt = Date.now(); // 0s elapsed

    const res = session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    assert(res.score === 7500, `0s elapsed gives 7500 points (5000 * 1.5), got ${res.score}`);
  }

  // 9. 15s submission → 1.25x
  {
    console.log('--- Test 9: 15s submission → 1.25x ---');
    const session = new TimeAttackSessionManager('TA09', 5, 30, 'normal', 'world');
    session.initSession([p1]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });
    session.roundStartedAt = Date.now() - 15000; // 15s elapsed

    const res = session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    assert(res.score === 6250, `15s elapsed gives 6250 points (5000 * 1.25), got ${res.score}`);
  }

  // 10. 30s submission → 1.0x
  {
    console.log('--- Test 10: 30s submission → 1.0x ---');
    const session = new TimeAttackSessionManager('TA10', 5, 30, 'normal', 'world');
    session.initSession([p1]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });
    session.roundStartedAt = Date.now() - 30000; // 30s elapsed

    const res = session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    assert(res.score === 5000, `30s elapsed gives 5000 points (5000 * 1.0), got ${res.score}`);
  }

  // 11. Timeout submission while round active receives 1.0x score
  {
    console.log('--- Test 11: Timeout submission while round active receives 1.0x score ---');
    const session = new TimeAttackSessionManager('TA11', 5, 30, 'normal', 'world');
    session.initSession([p1]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });
    session.roundStartedAt = Date.now() - 32000; // 32s elapsed (timeout auto-submit)

    const res = session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    assert(res.success === true, 'Timeout submission while round active succeeds');
    assert(res.score === 5000, `Timeout submission receives 1.0x base score (5000), got ${res.score}`);
  }

  // 12. Submission after ROUND_RESULTS is rejected
  {
    console.log('--- Test 12: Submission after ROUND_RESULTS is rejected ---');
    const session = new TimeAttackSessionManager('TA12', 5, 30, 'normal', 'world');
    session.initSession([p1]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });
    session.endRound([p1]);

    const res = session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    assert(res.success === false, 'Submission rejected after endRound');
    assert(res.error === 'Round is not active.', 'Error message indicates round not active');
  }

  // 13. Timeout with pin → base score × 1.0
  {
    console.log('--- Test 13: Timeout with pin → base score × 1.0 ---');
    const session = new TimeAttackSessionManager('TA13', 5, 30, 'normal', 'world');
    session.initSession([p1]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });
    session.roundStartedAt = Date.now() - 30000;
    session.submitGuess('p1', 'Player 1', 0.0, 0.0);

    const endRes = session.endRound([p1]);
    const p1Guess = endRes.roundResult.guesses.find(g => g.playerId === 'p1');
    assert(p1Guess?.score === 5000, 'Pinned guess preserved with 1.0x base score');
    assert(p1Guess?.hasPinnedLocation === true, 'hasPinnedLocation is true');
  }

  // 14. Timeout without pin → 0
  {
    console.log('--- Test 14: Timeout without pin → 0 ---');
    const session = new TimeAttackSessionManager('TA14', 5, 30, 'normal', 'world');
    session.initSession([p1, p2]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });

    // p1 submits, p2 times out
    session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    const endRes = session.endRound([p1, p2]);

    const p2Guess = endRes.roundResult.guesses.find(g => g.playerId === 'p2');
    assert(p2Guess?.score === 0, 'Unpinned timeout receives 0 score');
    assert(p2Guess?.baseScore === 0, 'Unpinned timeout receives 0 baseScore');
    assert(p2Guess?.timeMultiplier === 1.0, 'Unpinned timeout has 1.0 multiplier');
    assert(p2Guess?.hasPinnedLocation === false, 'hasPinnedLocation is false for timeout');
    assert(p2Guess?.timedOut === true, 'timedOut is true');
  }

  // 15. Multiple-player submissions
  {
    console.log('--- Test 15: Multiple-player submissions ---');
    const session = new TimeAttackSessionManager('TA15', 5, 30, 'normal', 'world');
    session.initSession([p1, p2]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });

    const now = Date.now();
    session.roundStartedAt = now - 6000; // 6s elapsed (multiplier = 1.40x)
    const res1 = session.submitGuess('p1', 'Player 1', 0.0, 0.0); // 5000 * 1.4 = 7000

    session.roundStartedAt = now - 18000; // 18s elapsed (multiplier = 1.20x)
    const res2 = session.submitGuess('p2', 'Player 2', 0.0, 0.0); // 5000 * 1.2 = 6000

    assert(res1.score === 7000, `p1 got 7000 pts (1.4x), actual: ${res1.score}`);
    assert(res2.score === 6000, `p2 got 6000 pts (1.2x), actual: ${res2.score}`);
  }

  // 16. Round ends when all connected players submit
  {
    console.log('--- Test 16: Round ends when all connected players submit ---');
    const session = new TimeAttackSessionManager('TA16', 5, 30, 'normal', 'world');
    session.initSession([p1, p2]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });

    session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    assert(session.haveAllPlayersSubmitted([p1, p2]) === false, '1 of 2 submitted -> not all submitted');

    session.submitGuess('p2', 'Player 2', 0.0, 0.0);
    assert(session.haveAllPlayersSubmitted([p1, p2]) === true, '2 of 2 submitted -> all submitted');
  }

  // 17. Timer ends round when players remain unsubmitted
  {
    console.log('--- Test 17: Timer ends round when players remain unsubmitted ---');
    const rm = new RoomManager();
    rm.createRoom('p1', 'HostPlayer', { gameType: 'time_attack' });
    rm.joinRoom('p2', 'ROOM_CODE', 'GuestPlayer'); // mock join
    const startRes = rm.startGameSession('p1');
    assert(startRes.success === true, 'RoomManager started time_attack session');
    assert(startRes.room?.gameSession?.gameType === 'time_attack', 'Session type is time_attack');
  }

  // 18. Timer/submission race cannot score twice
  {
    console.log('--- Test 18: Timer/submission race cannot score twice ---');
    const session = new TimeAttackSessionManager('TA18', 5, 30, 'normal', 'world');
    session.initSession([p1]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });

    session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    const end1 = session.endRound([p1]);
    assert(end1.roundResult.guesses.length === 1, 'Round result has 1 guess');

    // Duplicate call to endRound
    const end2 = session.endRound([p1]);
    assert(end2.session.roundState === 'ROUND_RESULTS', 'Second endRound safe');
  }

  // 19. Five rounds reach GAME_FINISHED
  {
    console.log('--- Test 19: Five rounds reach GAME_FINISHED ---');
    const session = new TimeAttackSessionManager('TA19', 5, 30, 'normal', 'world');
    session.initSession([p1, p2]);

    for (let r = 1; r <= 5; r++) {
      session.activateRoundFromHostResolution({
        roundIndex: r, candidateId: `c${r}`, resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
      });
      session.submitGuess('p1', 'Player 1', 0.0, 0.0);
      session.submitGuess('p2', 'Player 2', 0.0, 0.0);
      session.endRound([p1, p2]);
      session.prepareNextRound([p1, p2]);
    }

    assert(session.roundState === 'GAME_FINISHED', 'reaches GAME_FINISHED after round 5');
    assert(session.roundResults.length === 5, '5 round results accumulated');
  }

  // 20. Existing game modes remain unaffected
  {
    console.log('--- Test 20: Existing game modes remain unaffected ---');
    const classicSession = new GameSessionManager('CL01', 5, 0, 'normal', 'world');
    assert(classicSession.gameType === 'classic', 'Classic mode gameType is classic');

    const duelsSession = new DuelsSessionManager('DU01', 5, 0, 'normal', 'world');
    assert(duelsSession.gameType === 'duels', 'Duels mode gameType is duels');

    const streakSession = new StreakSessionManager('ST01', 100, 0, 'normal', 'world');
    assert(streakSession.gameType === 'country_streak', 'Streak mode gameType is country_streak');
  }

  // 21. HUD multiplier formula matches calculateTimeAttackScore exactly
  {
    console.log('--- Test 21: HUD multiplier formula matches calculateTimeAttackScore exactly ---');
    const calculateHudMult = (elapsedSeconds: number) => {
      const elapsedClamped = Math.min(30, Math.max(0, elapsedSeconds));
      const rawMult = 1.5 - (elapsedClamped / 60);
      return Math.max(1.0, Math.min(1.5, rawMult));
    };

    const intervals = [0, 5, 10, 15, 20, 25, 30];
    for (const t of intervals) {
      const hudMult = calculateHudMult(t);
      const scoreRes = calculateTimeAttackScore(0, t, 1491.6, true);
      assert(Math.abs(hudMult - scoreRes.timeMultiplier) < 0.0001, `t=${t}s HUD mult (${hudMult}) matches server (${scoreRes.timeMultiplier})`);
    }
  }

  // 22. Player with selected pin at timeout receives geographic score at 1.0x
  {
    console.log('--- Test 22: Player with selected pin at timeout receives geographic score at 1.0x ---');
    const session = new TimeAttackSessionManager('TA22', 5, 30, 'normal', 'world');
    session.initSession([p1, p2]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });
    session.roundStartedAt = Date.now() - 30000;

    // p1 auto-submits pin at timeout
    const res = session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    assert(res.success === true, 'Timeout auto-submit pin succeeds');
    assert(res.score === 5000, 'Timeout auto-submit pin receives 1.0x score (5000)');

    const endRes = session.endRound([p1, p2]);
    const p1Guess = endRes.roundResult.guesses.find(g => g.playerId === 'p1');
    assert(p1Guess?.timeMultiplier === 1.0, 'timeMultiplier is 1.0');
    assert(p1Guess?.hasPinnedLocation === true, 'hasPinnedLocation is true');
  }

  // 23. Player with no pin at timeout receives 0 score
  {
    console.log('--- Test 23: Player with no pin at timeout receives 0 score ---');
    const session = new TimeAttackSessionManager('TA23', 5, 30, 'normal', 'world');
    session.initSession([p1, p2]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });

    const endRes = session.endRound([p1, p2]);
    const p2Guess = endRes.roundResult.guesses.find(g => g.playerId === 'p2');
    assert(p2Guess?.score === 0, 'No pin timeout receives 0 score');
    assert(p2Guess?.hasPinnedLocation === false, 'hasPinnedLocation is false');
    assert(p2Guess?.timedOut === true, 'timedOut flag is true');
  }

  // 24. Auto-submit / duplicate submit cannot submit twice
  {
    console.log('--- Test 24: Auto-submit / duplicate submit cannot submit twice ---');
    const session = new TimeAttackSessionManager('TA24', 5, 30, 'normal', 'world');
    session.initSession([p1]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });
    session.roundStartedAt = Date.now() - 10000; // 10s elapsed

    // Manual submission
    const res1 = session.submitGuess('p1', 'Player 1', 0.0, 0.0);
    assert(res1.success === true, 'First manual submit succeeds');

    // Subsequent auto-submit attempt on timeout
    session.roundStartedAt = Date.now() - 30000;
    const res2 = session.submitGuess('p1', 'Player 1', 10.0, 10.0);
    assert(res2.success === false, 'Duplicate auto-submit rejected');
    assert(res2.error === 'Guess already submitted for this round.', 'Error indicates duplicate submission');
  }

  // 25. Existing manual submissions still use actual server arrival time
  {
    console.log('--- Test 25: Existing manual submissions still use actual server arrival time ---');
    const session = new TimeAttackSessionManager('TA25', 5, 30, 'normal', 'world');
    session.initSession([p1, p2]);
    session.activateRoundFromHostResolution({
      roundIndex: 1, candidateId: 'c1', resolvedLat: 0.0, resolvedLng: 0.0, country: 'Equator'
    });

    const now = Date.now();
    session.roundStartedAt = now - 6000; // 6s elapsed
    const res1 = session.submitGuess('p1', 'Player 1', 0.0, 0.0);

    // p2 auto-submits at timeout
    session.roundStartedAt = now - 30000; // 30s elapsed
    const res2 = session.submitGuess('p2', 'Player 2', 0.0, 0.0);

    assert(res1.score === 7000, `p1 got 7000 pts (1.4x at 6s), actual: ${res1.score}`);
    assert(res2.score === 5000, `p2 got 5000 pts (1.0x at 30s timeout), actual: ${res2.score}`);
  }

  console.log('\n🎉 All 25 Phase 10D.3 Multiplayer Time Attack Final Polish Tests Passed!\n');
}

// Execute tests if run directly
runTimeAttackSessionTests();
