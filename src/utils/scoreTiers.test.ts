import { test } from 'node:test';
import assert from 'node:assert';
import { getScoreTier, getScoreTierStyles } from './scoreTiers';

test('Phase 12B - Score Tiers Unit Tests', async (t) => {
  await t.test('Standard 5000 max score tier classification', () => {
    // Master Tier (>= 4800 / 96%)
    assert.strictEqual(getScoreTier(5000, 5000), 'master');
    assert.strictEqual(getScoreTier(4900, 5000), 'master');
    assert.strictEqual(getScoreTier(4800, 5000), 'master');

    // Good Tier (4000 - 4799 / 80% - 95.9%)
    assert.strictEqual(getScoreTier(4799, 5000), 'good');
    assert.strictEqual(getScoreTier(4500, 5000), 'good');
    assert.strictEqual(getScoreTier(4000, 5000), 'good');

    // Warm Tier (2500 - 3999 / 50% - 79.9%)
    assert.strictEqual(getScoreTier(3999, 5000), 'warm');
    assert.strictEqual(getScoreTier(3000, 5000), 'warm');
    assert.strictEqual(getScoreTier(2500, 5000), 'warm');

    // Neutral Tier (< 2500 / < 50%)
    assert.strictEqual(getScoreTier(2499, 5000), 'neutral');
    assert.strictEqual(getScoreTier(1000, 5000), 'neutral');
    assert.strictEqual(getScoreTier(0, 5000), 'neutral');
  });

  await t.test('Time Attack 7500 max score tier classification', () => {
    // Master Tier (>= 7200 / 96%)
    assert.strictEqual(getScoreTier(7500, 7500), 'master');
    assert.strictEqual(getScoreTier(7200, 7500), 'master');

    // Good Tier (6000 - 7199 / 80% - 95.9%)
    assert.strictEqual(getScoreTier(7199, 7500), 'good');
    assert.strictEqual(getScoreTier(6000, 7500), 'good');

    // Warm Tier (3750 - 5999 / 50% - 79.9%)
    assert.strictEqual(getScoreTier(5999, 7500), 'warm');
    assert.strictEqual(getScoreTier(3750, 7500), 'warm');

    // Neutral Tier (< 3750 / < 50%)
    assert.strictEqual(getScoreTier(3749, 7500), 'neutral');
    assert.strictEqual(getScoreTier(0, 7500), 'neutral');
  });

  await t.test('Edge cases and defensive boundaries', () => {
    // Negative score clamped to neutral
    assert.strictEqual(getScoreTier(-50, 5000), 'neutral');

    // Over maximum score capped safely
    assert.strictEqual(getScoreTier(99999, 5000), 'master');

    // Zero max score guarded safely
    assert.strictEqual(getScoreTier(100, 0), 'master');
  });

  await t.test('getScoreTierStyles returns consistent style tokens', () => {
    const masterStyles = getScoreTierStyles('master');
    assert.strictEqual(masterStyles.tier, 'master');
    assert.ok(masterStyles.textColor.includes('emerald'));
    assert.strictEqual(masterStyles.badge, '💎');

    const goodStyles = getScoreTierStyles('good');
    assert.strictEqual(goodStyles.tier, 'good');
    assert.ok(goodStyles.textColor.includes('emerald'));
    assert.strictEqual(goodStyles.badge, '⭐');

    const warmStyles = getScoreTierStyles('warm');
    assert.strictEqual(warmStyles.tier, 'warm');
    assert.ok(warmStyles.textColor.includes('amber'));
    assert.strictEqual(warmStyles.badge, '🎯');

    const neutralStyles = getScoreTierStyles('neutral');
    assert.strictEqual(neutralStyles.tier, 'neutral');
    assert.ok(neutralStyles.textColor.includes('slate'));
    assert.strictEqual(neutralStyles.badge, '📍');
  });
});
