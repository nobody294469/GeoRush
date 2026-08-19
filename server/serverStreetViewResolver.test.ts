import { resolveCandidateOnServer, isDummyKey } from './serverStreetViewResolver';
import { CandidateSeed } from '../src/shared/types/multiplayer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

export async function runServerResolverTests() {
  console.log('🧪 Running Phase 11B.2 & 11B.10 Server Street View Resolver Unit Tests...\n');

  // --- Test 0: isDummyKey unit testing ---
  {
    console.log('--- Test 0: isDummyKey Validation ---');
    // Genuine-looking Google API key with random substrings (previously blacklisted patterns)
    const validGoogleKeyWithSubstrings = 'AIzaSyA_sample_key_with_algxng_and_v2yu';
    assert(isDummyKey(validGoogleKeyWithSubstrings) === false, 'Valid AIzaSy key with random substrings is NOT dummy');

    const standardValidGoogleKey = 'AIzaSyB1234567890abcdefghijklmnopqrstuv';
    assert(isDummyKey(standardValidGoogleKey) === false, 'Standard AIzaSy key is NOT dummy');

    // Generic placeholders
    assert(isDummyKey('your_api_key') === true, '"your_api_key" placeholder is classified as dummy');
    assert(isDummyKey('AIzaSy_MY_API_KEY_HERE') === true, 'Contains "my_api_key" classified as dummy');
    assert(isDummyKey('PLACEHOLDER') === true, '"PLACEHOLDER" is classified as dummy');
    assert(isDummyKey('dummy_key_value') === true, '"dummy" is classified as dummy');
    assert(isDummyKey('fake_key_value') === true, '"fake" is classified as dummy');

    // Empty and malformed keys
    assert(isDummyKey('') === true, 'Empty key is classified as dummy');
    assert(isDummyKey('   ') === true, 'Whitespace key is classified as dummy');
    assert(isDummyKey('short') === true, 'Short key without AIzaSy prefix is classified as dummy');
    assert(isDummyKey('AIzaSy_too_short') === true, 'Short key under 20 characters is classified as dummy');
    assert(isDummyKey('some_random_string_that_does_not_start_with_aizasy') === true, 'Key not starting with AIzaSy is classified as dummy');
  }

  const testCandidate: CandidateSeed = {
    candidateId: 'test_cand_101',
    latitude: 48.8584,
    longitude: 2.2945,
    country: 'France',
    countryCode: 'FR',
    locationName: 'Eiffel Tower',
    heading: 90,
    pitch: 0
  };

  const validTestApiKey = 'AIzaSyA1234567890BCDEFGHIJKLMNOPQRSTU';

  // --- Test 1: MOCK Mode Resolution ---
  {
    console.log('--- Test 1: MOCK Mode Resolution ---');
    const result = await resolveCandidateOnServer(testCandidate, { mockMode: true });

    assert(result.apiMode === 'MOCK', 'apiMode is MOCK');
    assert(result.failed === false, 'resolution did not fail');
    assert(result.panoId === 'mock_pano_test_cand_101', 'panoId generated from candidateId');
    assert(result.resolvedLat === testCandidate.latitude, 'resolvedLat matches candidate');
    assert(result.resolvedLng === testCandidate.longitude, 'resolvedLng matches candidate');
    assert(result.country === 'France', 'country matches');
  }

  // --- Test 2: REAL Mode - Simulated Successful Metadata REST Response ---
  {
    console.log('--- Test 2: REAL Mode - Successful API Mock Response ---');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      assert(urlStr.includes('maps.googleapis.com/maps/api/streetview/metadata'), 'URL calls Google StreetView Metadata API');
      assert(urlStr.includes(`key=${validTestApiKey}`), 'URL includes API key');

      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          status: 'OK',
          pano_id: 'real_google_pano_xyz_999',
          location: {
            lat: 48.8585,
            lng: 2.2946
          },
          date: '2023-08'
        })
      } as Response;
    }) as typeof fetch;

    try {
      const result = await resolveCandidateOnServer(testCandidate, {
        apiKey: validTestApiKey,
        mockMode: false
      });

      assert(result.apiMode === 'REAL', 'apiMode is REAL');
      assert(result.failed === false, 'failed is false');
      assert(result.panoId === 'real_google_pano_xyz_999', 'panoId parsed from API JSON');
      assert(result.resolvedLat === 48.8585, 'snapped lat parsed from API JSON');
      assert(result.resolvedLng === 2.2946, 'snapped lng parsed from API JSON');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  // --- Test 3: REAL Mode - ZERO_RESULTS Response ---
  {
    console.log('--- Test 3: REAL Mode - ZERO_RESULTS Handling ---');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          status: 'ZERO_RESULTS'
        })
      } as Response;
    }) as typeof fetch;

    try {
      const result = await resolveCandidateOnServer(testCandidate, {
        apiKey: validTestApiKey,
        mockMode: false
      });

      assert(result.apiMode === 'REAL', 'apiMode is REAL');
      assert(result.failed === true, 'failed is true');
      assert(result.error === 'ZERO_RESULTS', 'error indicates ZERO_RESULTS');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  // --- Test 4: REAL Mode - Network Timeout / Error ---
  {
    console.log('--- Test 4: REAL Mode - Network Error Handling ---');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error('Connection refused');
    }) as typeof fetch;

    try {
      const result = await resolveCandidateOnServer(testCandidate, {
        apiKey: validTestApiKey,
        mockMode: false
      });

      assert(result.apiMode === 'REAL', 'apiMode is REAL');
      assert(result.failed === true, 'failed is true');
      assert(result.error === 'Connection refused', 'error message captured');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  console.log('\n🎉 All Server Street View Resolver Unit Tests Passed!\n');
}

runServerResolverTests();
