import { test } from 'node:test';
import assert from 'node:assert';
import {
  getPlayerName,
  setPlayerName,
  getPlayerId,
  getPlayerStats,
  savePlayerStats,
  recordCompletedMatch,
  resetPlayerStats,
  STORAGE_KEY_NAME,
  STORAGE_KEY_ID,
  STORAGE_KEY_STATS,
  STORAGE_KEY_RECORDED_MATCHES
} from './playerProfile';

// Setup in-memory localStorage mock for Node test environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const mockStorage = new MockLocalStorage();
(globalThis as any).localStorage = mockStorage;

test('Phase 12C - Player Profile & Local Stats Unit Tests', async (t) => {
  // Reset mock storage before each test
  mockStorage.clear();

  await t.test('Player Identity & Display Name', () => {
    mockStorage.clear();

    // Default name
    assert.strictEqual(getPlayerName(), 'Explorer');

    // Custom name persistence
    const saved = setPlayerName('AtlasMaster');
    assert.strictEqual(saved, 'AtlasMaster');
    assert.strictEqual(getPlayerName(), 'AtlasMaster');
    assert.strictEqual(mockStorage.getItem(STORAGE_KEY_NAME), 'AtlasMaster');

    // Sanitizes and truncates long names
    const longName = 'VeryLongPlayerNameThatExceedsLimit';
    const trimmed = setPlayerName(longName);
    assert.ok(trimmed.length <= 24);
    assert.strictEqual(getPlayerName(), trimmed);

    // Fallback on whitespace / empty
    const fallback = setPlayerName('   ');
    assert.strictEqual(fallback, 'Explorer');
    assert.strictEqual(getPlayerName(), 'Explorer');

    // Player ID generation and stability
    const id1 = getPlayerId();
    assert.match(id1, /^geo_/);
    const id2 = getPlayerId();
    assert.strictEqual(id2, id1);
    assert.strictEqual(mockStorage.getItem(STORAGE_KEY_ID), id1);
  });

  await t.test('Player Stats & Legacy Migration', () => {
    mockStorage.clear();

    // Clean defaults
    const stats = getPlayerStats();
    assert.strictEqual(stats.version, 1);
    assert.strictEqual(stats.totalGamesPlayed, 0);
    assert.strictEqual(stats.bestOverallScore, 0);
    assert.strictEqual(stats.longestCountryStreak, 0);
    assert.strictEqual(stats.duelsWins, 0);

    // Migrates legacy country_streak_best
    mockStorage.setItem('country_streak_best', '14');
    const migrated = getPlayerStats();
    assert.strictEqual(migrated.longestCountryStreak, 14);

    // Save and retrieve custom stats
    migrated.totalGamesPlayed = 7;
    migrated.bestOverallScore = 24800;
    savePlayerStats(migrated);

    const retrieved = getPlayerStats();
    assert.strictEqual(retrieved.totalGamesPlayed, 7);
    assert.strictEqual(retrieved.bestOverallScore, 24800);

    // Reset stats
    resetPlayerStats();
    const fresh = getPlayerStats();
    assert.strictEqual(fresh.totalGamesPlayed, 0);
  });

  await t.test('Match Recording & Personal Best Detection (Classic Mode)', () => {
    mockStorage.clear();

    const result1 = recordCompletedMatch({
      matchId: 'classic_match_001',
      mode: 'classic',
      score: 23400,
      mapId: 'world'
    });

    assert.strictEqual(result1.isNewBestOverall, true);
    assert.strictEqual(result1.isNewModeBest, true);
    assert.strictEqual(result1.isNewMapBest, true);
    assert.strictEqual(result1.currentStats.totalGamesPlayed, 1);
    assert.strictEqual(result1.currentStats.classicGamesPlayed, 1);
    assert.strictEqual(result1.currentStats.bestOverallScore, 23400);
    assert.strictEqual(result1.currentStats.bestClassicScore, 23400);
    assert.strictEqual(result1.currentStats.bestScoreByMap.world, 23400);

    // Second match with lower score
    const result2 = recordCompletedMatch({
      matchId: 'classic_match_002',
      mode: 'classic',
      score: 21000,
      mapId: 'world'
    });

    assert.strictEqual(result2.isNewBestOverall, false);
    assert.strictEqual(result2.isNewModeBest, false);
    assert.strictEqual(result2.isNewMapBest, false);
    assert.strictEqual(result2.currentStats.totalGamesPlayed, 2);
    assert.strictEqual(result2.currentStats.bestOverallScore, 23400);
  });

  await t.test('Match Recording Idempotency', () => {
    mockStorage.clear();

    const first = recordCompletedMatch({
      matchId: 'duplicate_test_id_100',
      mode: 'classic',
      score: 22500,
      mapId: 'world'
    });
    assert.strictEqual(first.currentStats.totalGamesPlayed, 1);
    assert.strictEqual(first.alreadyRecorded, false);

    // Attempting to re-record the exact same match ID
    const second = recordCompletedMatch({
      matchId: 'duplicate_test_id_100',
      mode: 'classic',
      score: 22500,
      mapId: 'world'
    });

    assert.strictEqual(second.alreadyRecorded, true);
    assert.strictEqual(second.currentStats.totalGamesPlayed, 1);
    assert.strictEqual(second.isNewBestOverall, false);
  });

  await t.test('Country Streak and Duels Outcomes Tracking', () => {
    mockStorage.clear();

    // Streak match
    const streakResult1 = recordCompletedMatch({
      matchId: 'streak_m_1',
      mode: 'country_streak',
      streak: 8
    });
    assert.strictEqual(streakResult1.isNewStreakBest, true);
    assert.strictEqual(streakResult1.currentStats.longestCountryStreak, 8);
    assert.strictEqual(streakResult1.currentStats.countryStreakGamesPlayed, 1);

    const streakResult2 = recordCompletedMatch({
      matchId: 'streak_m_2',
      mode: 'country_streak',
      streak: 5
    });
    assert.strictEqual(streakResult2.isNewStreakBest, false);
    assert.strictEqual(streakResult2.currentStats.longestCountryStreak, 8);
    assert.strictEqual(streakResult2.currentStats.countryStreakGamesPlayed, 2);

    // Duels match (Win)
    const duelWin = recordCompletedMatch({
      matchId: 'duel_m_1',
      mode: 'duels',
      duelWon: true,
      duelLost: false
    });
    assert.strictEqual(duelWin.currentStats.duelsGamesPlayed, 1);
    assert.strictEqual(duelWin.currentStats.duelsWins, 1);
    assert.strictEqual(duelWin.currentStats.duelsLosses, 0);

    // Duels match (Loss)
    const duelLoss = recordCompletedMatch({
      matchId: 'duel_m_2',
      mode: 'duels',
      duelWon: false,
      duelLost: true
    });
    assert.strictEqual(duelLoss.currentStats.duelsGamesPlayed, 2);
    assert.strictEqual(duelLoss.currentStats.duelsWins, 1);
    assert.strictEqual(duelLoss.currentStats.duelsLosses, 1);
  });
});
