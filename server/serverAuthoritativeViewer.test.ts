import { AbstractBaseSession } from './baseSession';
import { TargetResolutionResult, CandidateSeed } from '../src/shared/types/multiplayer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

class TestGameSession extends AbstractBaseSession {
  public gameType: any = 'classic';
  public initSession(): CandidateSeed {
    return {
      candidateId: 'test-seed',
      latitude: 0,
      longitude: 0,
      country: 'Test'
    };
  }
  public endRound() { return { success: true } as any; }
  public prepareNextRound() { return { success: true } as any; }
  public toPublicSession(): any { return {}; }
  public onRoundStarted() {}
  public onRoundEnded() {}
  public calculateScoreAndDistance() {
    return { distanceKm: 0, score: 5000 };
  }
}

export function runServerAuthoritativeViewerTests() {
  console.log('🧪 Running Phase 11B.6 Server-Authoritative Panorama Mode Tests...\n');

  // Test 1: MOCK resolution propagates apiMode: 'MOCK'
  const mockSession = new TestGameSession('TEST01', 5, 60, 'normal', 'world');
  const mockResolution: TargetResolutionResult = {
    roundIndex: 1,
    candidateId: 'cand-001',
    apiMode: 'MOCK',
    panoId: 'mock_pano_cand-001',
    resolvedLat: 48.8584,
    resolvedLng: 2.2945,
    country: 'France',
    countryCode: 'FR'
  };

  const mockActivateRes = mockSession.activateRoundFromResolution(mockResolution);
  assert(mockActivateRes.success === true, 'MOCK round activation succeeded');
  assert(mockActivateRes.activeTarget?.apiMode === 'MOCK', 'activeTarget.apiMode is MOCK');
  assert(mockActivateRes.activeTarget?.panoId === 'mock_pano_cand-001', 'activeTarget.panoId matches mock pano ID');
  assert((mockActivateRes.activeTarget as any).resolvedLat === undefined, 'activeTarget hides resolvedLat');
  assert((mockActivateRes.activeTarget as any).country === undefined, 'activeTarget hides country');

  // Simulate MultiplayerGameScreen logic for MOCK target
  const apiKey = 'AIzaSyFakeKey';
  const mockTarget = mockActivateRes.activeTarget;
  const isServerRealMock = mockTarget?.apiMode === 'REAL';
  const isSyntheticPanoMock = mockTarget?.panoId?.startsWith('mock_pano_') ?? false;
  const isRealModeMock = Boolean(apiKey && isServerRealMock && mockTarget?.panoId && !isSyntheticPanoMock);

  assert(isRealModeMock === false, 'isRealMode evaluates to FALSE for MOCK activeTarget (routes to MockPanoramaViewer)');

  // Test 2: REAL resolution propagates apiMode: 'REAL'
  const realSession = new TestGameSession('TEST02', 5, 60, 'normal', 'world');
  const realResolution: TargetResolutionResult = {
    roundIndex: 1,
    candidateId: 'cand-002',
    apiMode: 'REAL',
    panoId: 'CAoSLEFGMVFpcE11S1pVRXpldDFN',
    resolvedLat: 35.6595,
    resolvedLng: 139.7004,
    country: 'Japan',
    countryCode: 'JP'
  };

  const realActivateRes = realSession.activateRoundFromResolution(realResolution);
  assert(realActivateRes.success === true, 'REAL round activation succeeded');
  assert(realActivateRes.activeTarget?.apiMode === 'REAL', 'activeTarget.apiMode is REAL');
  assert(realActivateRes.activeTarget?.panoId === 'CAoSLEFGMVFpcE11S1pVRXpldDFN', 'activeTarget.panoId matches real Google pano ID');
  assert((realActivateRes.activeTarget as any).resolvedLat === undefined, 'activeTarget hides resolvedLat');
  assert((realActivateRes.activeTarget as any).country === undefined, 'activeTarget hides country');

  // Simulate MultiplayerGameScreen logic for REAL target with API key
  const realTarget = realActivateRes.activeTarget;
  const isServerReal = realTarget?.apiMode === 'REAL';
  const isSyntheticPanoReal = realTarget?.panoId?.startsWith('mock_pano_') ?? false;
  const isRealModeReal = Boolean(apiKey && isServerReal && realTarget?.panoId && !isSyntheticPanoReal);

  assert(isRealModeReal === true, 'isRealMode evaluates to TRUE for REAL activeTarget with API key (routes to RealPanoramaViewer)');

  // Simulate MultiplayerGameScreen logic for REAL target WITHOUT API key
  const emptyApiKey = '';
  const noKeyIsRealMode = Boolean(emptyApiKey && isServerReal && realTarget?.panoId && !isSyntheticPanoReal);
  assert(noKeyIsRealMode === false, 'isRealMode evaluates to FALSE for REAL activeTarget WITHOUT API key (fallback to MockPanoramaViewer)');

  console.log('\n🎉 All Phase 11B.6 Server-Authoritative Panorama Mode Tests Passed!\n');
}

runServerAuthoritativeViewerTests();
