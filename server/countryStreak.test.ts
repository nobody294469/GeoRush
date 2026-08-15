import { StreakSessionManager } from './streakSession';
import { RoomManager } from './roomManager';
import { RoomPlayer, TargetResolutionResult } from '../src/shared/types/multiplayer';
import { getModeStrategy, STREAK_MODE_STRATEGY } from '../src/game/modeRegistry';
import { selectStreakCandidateLocation, getCountryList } from '../src/data/countryList';
import { GAMEPLAY_CANDIDATE_LOCATIONS } from '../src/data/gameplayLocations';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runCountryStreakTests() {
  console.log('🧪 Running Phase 9A Country Streak Unit & Integration Tests...\n');

  const p1: RoomPlayer = { id: 'p1', displayName: 'Player 1', isHost: true, status: 'CONNECTED', joinedAt: Date.now() };
  const p2: RoomPlayer = { id: 'p2', displayName: 'Player 2', isHost: false, status: 'CONNECTED', joinedAt: Date.now() };
  const p3: RoomPlayer = { id: 'p3', displayName: 'Player 3', isHost: false, status: 'CONNECTED', joinedAt: Date.now() };

  // --- Test 1: Mode Registry & Settings Constraints ---
  {
    console.log('--- Test 1: Mode Registry & Map Enforcement ---');
    const strategy = getModeStrategy('country_streak');
    assert(strategy.id === 'country_streak', 'Strategy ID is country_streak');
    assert(strategy.defaultMaxRounds === 100, 'Default max rounds is 100');
    assert(strategy.maxAllowedRounds === 100, 'Max allowed rounds is 100');

    // Test forcing mapId to 'world' regardless of input
    const valRes = strategy.validateSettings({ mapId: 'europe', timeLimitSeconds: 30, gameMode: 'normal' }, 2);
    assert(valRes.valid === true, 'Settings validation succeeded');
    assert(valRes.settings.mapId === 'world', 'mapId is strictly forced to world');
    assert(valRes.settings.gameType === 'country_streak', 'gameType is forced to country_streak');
  }

  // --- Test 2: Country List & Candidate Selection ---
  {
    console.log('--- Test 2: Country Dataset & Candidate Selection ---');
    const countries = getCountryList();
    assert(countries.length > 10, `Loaded ${countries.length} unique countries`);
    
    // Check candidate selection non-repeat
    const used = new Set<string>();
    const c1 = selectStreakCandidateLocation(0, used);
    used.add(c1.id);
    const c2 = selectStreakCandidateLocation(0, used);
    assert(c1.id !== c2.id, 'Consecutive candidate selections do not repeat');
  }

  // --- Test 3: StreakSessionManager Initialization ---
  {
    console.log('--- Test 3: Session Initialization ---');
    const session = new StreakSessionManager('STREAK1', 100, 0, 'normal', 'world');
    const seed = session.initSession([p1, p2, p3]);

    assert(session.currentRound === 1, 'Current round starts at 1');
    assert(session.playerStreaks.get('p1') === 0, 'Player 1 streak starts at 0');
    assert(session.playerStreaks.get('p2') === 0, 'Player 2 streak starts at 0');
    assert(session.playerStreaks.get('p3') === 0, 'Player 3 streak starts at 0');
    assert(session.eliminatedPlayers.size === 0, 'No players eliminated initially');
    assert(Boolean(seed.candidateId), 'Seed generated with candidateId');
  }

  // --- Test 4: Correct & Incorrect Answer Handling + Elimination ---
  {
    console.log('--- Test 4: Answer Evaluation & Elimination ---');
    const session = new StreakSessionManager('STREAK2', 100, 0, 'normal', 'world');
    session.initSession([p1, p2, p3]);

    const targetCode = 'US';
    const targetRes: TargetResolutionResult = {
      roundIndex: 1,
      candidateId: 'cand_us',
      resolvedLat: 40.0,
      resolvedLng: -74.0,
      country: 'United States',
      countryCode: targetCode
    };
    session.activateRoundFromHostResolution(targetRes);

    // Secret target should not be exposed before endRound
    const pubSessionBefore = session.toPublicSession([p1, p2, p3]);
    assert(((pubSessionBefore.activeTarget as unknown) as Record<string, unknown> | undefined)?.country === undefined, 'Target country hidden during active round');

    // P1 submits correct answer ('US')
    const sub1 = session.submitGuess('p1', 'Player 1', 0, 0, 'US');
    assert(sub1.success === true, 'P1 submission succeeded');

    // P2 submits wrong answer ('FR')
    const sub2 = session.submitGuess('p2', 'Player 2', 0, 0, 'FR');
    assert(sub2.success === true, 'P2 submission succeeded');

    // P3 submits wrong answer ('JP')
    const sub3 = session.submitGuess('p3', 'Player 3', 0, 0, 'JP');
    assert(sub3.success === true, 'P3 submission succeeded');

    // End round
    const { session: endSess, roundResult } = session.endRound([p1, p2, p3]);

    assert(roundResult.targetLocation.countryCode === 'US', 'Target country code revealed in round result');
    assert(session.playerStreaks.get('p1') === 1, 'P1 streak increased to 1');
    assert(session.eliminatedPlayers.has('p2') === true, 'P2 eliminated due to wrong answer');
    assert(session.eliminatedPlayers.has('p3') === true, 'P3 eliminated due to wrong answer');

    // Since P1 is the last survivor among 3 players, match should finish!
    assert(session.matchFinished === true, 'Match finished on last survivor');
    assert(session.winnerPlayerId === 'p1', 'P1 declared winner as last survivor');
    assert(session.endReason === 'LAST_SURVIVOR', 'End reason is LAST_SURVIVOR');
  }

  // --- Test 5: All Eliminated in Same Round (Draw / Highest Streak) ---
  {
    console.log('--- Test 5: All Eliminated in Same Round ---');
    const session = new StreakSessionManager('STREAK3', 100, 0, 'normal', 'world');
    session.initSession([p1, p2]);

    const targetRes: TargetResolutionResult = {
      roundIndex: 1,
      candidateId: 'cand_ca',
      resolvedLat: 45.0,
      resolvedLng: -75.0,
      country: 'Canada',
      countryCode: 'CA'
    };
    session.activateRoundFromHostResolution(targetRes);

    // Both players submit wrong answers
    session.submitGuess('p1', 'Player 1', 0, 0, 'MX');
    session.submitGuess('p2', 'Player 2', 0, 0, 'BR');

    session.endRound([p1, p2]);

    assert(session.matchFinished === true, 'Match finished when all eliminated');
    assert(session.endReason === 'ALL_ELIMINATED', 'End reason is ALL_ELIMINATED');
    assert(session.isDraw === true, 'Match ended in draw when both eliminated at 0 streak');
  }

  // --- Test 6: RoomManager Integration ---
  {
    console.log('--- Test 6: RoomManager Session Lifecycle ---');
    const rm = new RoomManager();
    const createRes = rm.createRoom('host_id', 'Host', {
      gameType: 'country_streak',
      maxRounds: 100,
      timeLimitSeconds: 0,
      gameMode: 'normal',
      mapId: 'world'
    });

    assert(createRes.success === true, 'Room created successfully');
    const room = createRes.room!;
    const hostId = createRes.playerId!;

    const joinRes = rm.joinRoom('guest_id', room.code, 'Guest');
    assert(joinRes.success === true, 'Guest joined room');
    const guestId = joinRes.playerId!;

    // Start game
    const startRes = rm.startGameSession(hostId);
    if (!startRes.success) console.error('Start game error:', startRes.error);
    assert(startRes.success === true, 'Country Streak game started');
    assert(startRes.room?.gameSession?.gameType === 'country_streak', 'Session gameType is country_streak');

    // Host submits candidate resolution
    const candidateSeed = startRes.candidateSeed!;
    const resolveRes = rm.activateTargetFromHost(hostId, {
      roundIndex: 1,
      candidateId: candidateSeed.candidateId,
      resolvedLat: candidateSeed.latitude,
      resolvedLng: candidateSeed.longitude,
      country: candidateSeed.country,
      countryCode: candidateSeed.countryCode
    }, () => {});

    assert(resolveRes.success === true, 'Host resolved location');

    // Host guesses correct country
    const g1 = rm.submitGuess(hostId, 1, 0, 0, candidateSeed.countryCode);
    assert(g1.success === true, 'Host guess submitted');

    // Guest guesses wrong country
    const g2 = rm.submitGuess(guestId, 1, 0, 0, 'ZZ');
    assert(g2.success === true, 'Guest guess submitted');
    if (g2.allSubmitted) {
      rm.endRound(room.code);
    }

    // Since both active players submitted, round auto-completes in RoomManager
    const updatedRoom = rm.getRoom(room.code)!;
    const pubSession = updatedRoom.gameSession!.toPublicSession(updatedRoom.players);
    assert(pubSession.roundState === 'GAME_FINISHED', 'Round auto-completed and game finished');
    assert(pubSession.streakState?.winnerPlayerId === hostId, 'Host won as last survivor');
  }

  console.log('\n✨ All Country Streak tests passed successfully!');
}

runCountryStreakTests().catch(err => {
  console.error(err);
  process.exit(1);
});
