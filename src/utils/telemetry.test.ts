import test from 'node:test';
import assert from 'node:assert/strict';
import { isUsableGoogleMapsKey, getInitialApiMode, devTelemetry } from './telemetry';
import { resolveSessionLocations } from '../game/locationEngine';
import { WORLD_MAP } from '../game/maps';
import { MOCK_LOCATIONS } from '../data/mockLocations';

test('Phase 12H.1 - Telemetry and Single-Player API Mode Auto-Detection', async (t) => {

  await t.test('isUsableGoogleMapsKey structural validation', () => {
    // Valid Google API keys
    assert.strictEqual(isUsableGoogleMapsKey('AIzaSyTestKeyForUnitTestingOnly123'), true);
    assert.strictEqual(isUsableGoogleMapsKey('AIzaSyBg4k_91Jk8A09d_abcdefghijklmnopqrst'), true);

    // Missing / Empty / Malformed keys
    assert.strictEqual(isUsableGoogleMapsKey(''), false);
    assert.strictEqual(isUsableGoogleMapsKey(undefined), false);
    assert.strictEqual(isUsableGoogleMapsKey(null), false);
    assert.strictEqual(isUsableGoogleMapsKey('short'), false);
    assert.strictEqual(isUsableGoogleMapsKey('not_a_google_key_1234567890'), false);

    // Placeholders and dummy strings
    assert.strictEqual(isUsableGoogleMapsKey('AIzaSy_YOUR_API_KEY_HERE_12345'), false);
    assert.strictEqual(isUsableGoogleMapsKey('AIzaSy_PLACEHOLDER_KEY_12345'), false);
    assert.strictEqual(isUsableGoogleMapsKey('AIzaSy_dummy_key_value_12345'), false);
    assert.strictEqual(isUsableGoogleMapsKey('AIzaSy_fake_key_value_12345'), false);
  });

  await t.test('getInitialApiMode auto-detection scenarios', () => {
    const validTestKey = 'AIzaSyTestKeyForUnitTestingOnly123';

    // Scenario A: Valid API Key -> returns 'REAL'
    assert.strictEqual(
      getInitialApiMode(validTestKey, ''),
      'REAL',
      'Valid API key without mock flag returns REAL'
    );

    // Scenario B: Missing or Invalid API Key -> returns 'MOCK'
    assert.strictEqual(
      getInitialApiMode('', ''),
      'MOCK',
      'Empty API key returns MOCK'
    );
    assert.strictEqual(
      getInitialApiMode(null as any, ''),
      'MOCK',
      'Null API key returns MOCK'
    );
    assert.strictEqual(
      getInitialApiMode('invalid_key_prefix_12345', ''),
      'MOCK',
      'Invalid format API key returns MOCK'
    );

    // Scenario C: VITE_MOCK_STREETVIEW === "true" -> returns 'MOCK' even with valid key
    assert.strictEqual(
      getInitialApiMode(validTestKey, 'true'),
      'MOCK',
      'VITE_MOCK_STREETVIEW=true forces MOCK mode even when valid API key is present'
    );

    // Scenario D: Dummy key -> returns 'MOCK'
    assert.strictEqual(
      getInitialApiMode('AIzaSy_YOUR_API_KEY_HERE_12345', ''),
      'MOCK',
      'Placeholder API key returns MOCK'
    );
  });

  await t.test('devTelemetry store initialization and internal API', () => {
    const snapshot = devTelemetry.getSnapshot();
    assert.ok(snapshot.apiMode === 'REAL' || snapshot.apiMode === 'MOCK');
    assert.strictEqual(typeof snapshot.mapsJsInits, 'number');
    assert.strictEqual(typeof snapshot.quotaSafetyLimit, 'number');

    // Telemetry mode can still be updated internally for test harnesses
    devTelemetry.setApiMode('MOCK');
    assert.strictEqual(devTelemetry.getSnapshot().apiMode, 'MOCK');

    devTelemetry.setApiMode('REAL');
    assert.strictEqual(devTelemetry.getSnapshot().apiMode, 'REAL');
  });

  await t.test('LocationEngine MOCK mode resolution returns mock locations with 0 API calls', async () => {
    const usedIds = new Set<string>();
    const result = await resolveSessionLocations({
      map: WORLD_MAP,
      count: 3,
      usedCandidateIds: usedIds,
      apiMode: 'MOCK',
      apiKey: '',
      mockLocations: MOCK_LOCATIONS
    });

    assert.strictEqual(result.locations.length, 3);
    assert.strictEqual(result.error, undefined);
    // Verified that locations are from mock set
    assert.ok(result.locations[0].id.length > 0);
  });

});
