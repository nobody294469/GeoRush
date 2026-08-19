import { test } from 'node:test';
import assert from 'node:assert';
import {
  isSoundEnabled,
  setSoundEnabled,
  toggleSound,
  getAudioContext,
  playSound,
  playCountdownTick,
  resetCountdownAudio,
  STORAGE_KEY_SOUND,
  SOUND_CHANGE_EVENT
} from './audioSystem';

// In-memory mock localStorage for Node test runner
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

test('Phase 12D - Audio System & Sound Feedback Unit Tests', async (t) => {
  mockStorage.clear();

  await t.test('Sound Preference Persistence & Defaults', () => {
    mockStorage.clear();

    // Default preference is true
    assert.strictEqual(isSoundEnabled(), true);

    // Explicitly disable sound
    const res1 = setSoundEnabled(false);
    assert.strictEqual(res1, false);
    assert.strictEqual(isSoundEnabled(), false);
    assert.strictEqual(mockStorage.getItem(STORAGE_KEY_SOUND), 'false');

    // Explicitly enable sound
    const res2 = setSoundEnabled(true);
    assert.strictEqual(res2, true);
    assert.strictEqual(isSoundEnabled(), true);
    assert.strictEqual(mockStorage.getItem(STORAGE_KEY_SOUND), 'true');

    // Toggle sound
    const toggled1 = toggleSound();
    assert.strictEqual(toggled1, false);
    assert.strictEqual(isSoundEnabled(), false);

    const toggled2 = toggleSound();
    assert.strictEqual(toggled2, true);
    assert.strictEqual(isSoundEnabled(), true);
  });

  await t.test('Graceful Failure in Non-Browser / Unavailable Audio Environment', () => {
    // In Node test runner without native browser AudioContext, playSound must execute without throwing
    assert.doesNotThrow(() => {
      playSound('pin');
      playSound('submit');
      playSound('countdown');
      playSound('score');
      playSound('excellent');
      playSound('victory');
    });
  });

  await t.test('Sound Disabled Prevents Node Creation / Safe Exit', () => {
    setSoundEnabled(false);
    assert.strictEqual(isSoundEnabled(), false);

    assert.doesNotThrow(() => {
      playSound('pin');
      playSound('submit');
      playSound('victory');
    });

    // Re-enable for subsequent tests
    setSoundEnabled(true);
  });

  await t.test('Countdown Tick Anti-Duplication Guard', () => {
    resetCountdownAudio();

    // Track mock calls with a mock AudioContext
    let playCallCount = 0;
    class MockAudioContext {
      currentTime = 0;
      state = 'running';
      createOscillator() {
        return {
          type: 'sine',
          frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: () => {},
          start: () => { playCallCount++; },
          stop: () => {}
        };
      }
      createGain() {
        return {
          gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: () => {}
        };
      }
      createBiquadFilter() {
        return {
          type: 'lowpass',
          frequency: { setValueAtTime: () => {} },
          connect: () => {}
        };
      }
      get destination() { return {}; }
      async resume() {}
    }

    (globalThis as any).window = {
      AudioContext: MockAudioContext,
      localStorage: mockStorage,
      dispatchEvent: () => true
    };

    setSoundEnabled(true);

    // First tick for second 5
    playCountdownTick(5);
    const countAfterFirst = playCallCount;
    assert.ok(countAfterFirst > 0);

    // Duplicate render for second 5 (e.g. React re-render)
    playCountdownTick(5);
    playCountdownTick(4.8); // Still rounds to 5
    assert.strictEqual(playCallCount, countAfterFirst, 'Duplicate call for same second should be ignored');

    // Next second (4) should play
    playCountdownTick(4);
    assert.ok(playCallCount > countAfterFirst, 'New second should trigger countdown tick');
    const countAfterFour = playCallCount;

    // Resetting audio clears the deduplication guard
    resetCountdownAudio();
    playCountdownTick(4);
    assert.ok(playCallCount > countAfterFour, 'After reset, second 4 can trigger tick again');

    // Seconds > 5 or <= 0 do not trigger ticks
    const countBeforeOutRange = playCallCount;
    playCountdownTick(10);
    playCountdownTick(0);
    playCountdownTick(-1);
    assert.strictEqual(playCallCount, countBeforeOutRange);
  });

  await t.test('AudioContext Singleton Management', () => {
    const ctx1 = getAudioContext();
    const ctx2 = getAudioContext();
    assert.strictEqual(ctx1, ctx2, 'getAudioContext should return the same singleton instance');
  });
});
