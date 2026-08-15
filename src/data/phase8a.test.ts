import { GAMEPLAY_CANDIDATE_LOCATIONS } from './gameplayLocations';
import { validateLocationDataset, findDuplicatePanoramas } from './locationValidator';
import { CandidateLocation } from '../types/game';

console.log('🧪 Running Phase 8A Location Architecture Validation Tests...\n');

let allPassed = true;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    allPassed = false;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// 1. Basic Validator logic tests with mock data
const mockCandidates: CandidateLocation[] = [
  { id: '1', latitude: 10, longitude: 10, country: 'Test1', countryCode: 'TE', continent: 'Europe', region: '', environment: 'urban', difficulty: 'easy' },
  { id: '1', latitude: 20, longitude: 20, country: 'Test2', countryCode: 'TE', continent: 'Europe', region: '', environment: 'urban', difficulty: 'easy' }, // duplicate id
  { id: '3', latitude: 91, longitude: 10, country: 'Test3', countryCode: 'TE', continent: 'Europe', region: '', environment: 'urban', difficulty: 'easy' }, // invalid lat
  { id: '4', latitude: 10, longitude: 10, country: 'Test4', countryCode: 'invalid', continent: 'Europe', region: '', environment: 'urban', difficulty: 'easy' }, // invalid countryCode
  { id: '5', latitude: 10, longitude: 10, country: 'Test5', countryCode: 'TE', continent: 'FakeContinent', region: '', environment: 'urban', difficulty: 'easy' }, // invalid continent
  { id: '6', latitude: 10, longitude: 10, country: '', countryCode: 'TE', continent: 'Europe', region: '', environment: 'urban', difficulty: 'easy' }, // missing metadata
  // These two are very close (same coords)
  { id: '7', latitude: 30, longitude: 30, country: 'Test7', countryCode: 'TE', continent: 'Europe', region: '', environment: 'urban', difficulty: 'easy' },
  { id: '8', latitude: 30, longitude: 30.0001, country: 'Test8', countryCode: 'TE', continent: 'Europe', region: '', environment: 'urban', difficulty: 'easy' },
];

const mockReport = validateLocationDataset(mockCandidates, 500); // 500 meters

assert(mockReport.duplicateIds.includes('1'), 'Duplicate candidate IDs are detected.');
assert(mockReport.invalidCoordinates.includes('3'), 'Invalid latitude is detected.');
assert(mockReport.invalidCountryCodes.includes('4'), 'Country code validation works.');
assert(mockReport.suspiciousContinents.includes('5'), 'Suspicious continent is detected.');
assert(mockReport.missingMetadata.includes('6'), 'Missing required metadata is detected.');
assert(mockReport.closePairs.some(p => p.id1 === '7' && p.id2 === '8'), 'Proximity validation works with a configurable threshold.');

// 2. Panorama Duplicate test
const panoResults = [
  { candidateId: 'A', panoId: 'pano1' },
  { candidateId: 'B', panoId: 'pano1' },
  { candidateId: 'C', panoId: 'pano2' },
];
const duplicates = findDuplicatePanoramas(panoResults);
assert(duplicates.length === 1 && duplicates[0].panoId === 'pano1', 'Resolved pano duplicate detection works using mocked/test data.');

// 3. Baseline Validation on Existing Dataset
console.log('\n--- Running Baseline Validation on Existing Dataset ---');
const baselineReport = validateLocationDataset(GAMEPLAY_CANDIDATE_LOCATIONS, 100);

assert(baselineReport.totalCount >= 221, `Existing candidate dataset passes the appropriate baseline validation (Count: ${baselineReport.totalCount}).`);
assert(baselineReport.duplicateIds.length === 0, 'No duplicate IDs in baseline.');
assert(baselineReport.invalidCoordinates.length === 0, 'No invalid coordinates in baseline.');
assert(baselineReport.missingMetadata.length === 0, 'No missing metadata in baseline.');
assert(baselineReport.invalidCountryCodes.length === 0, 'No invalid country codes in baseline.');
assert(baselineReport.suspiciousContinents.length === 0, 'No suspicious continents in baseline.');

console.log('\n--- Baseline Dataset Statistics ---');
console.log(`Total Locations: ${baselineReport.totalCount}`);
console.log(`Countries: ${Object.keys(baselineReport.countryCounts).length}`);
console.log(`Continents: ${Object.keys(baselineReport.continentCounts).length}`);
console.log(`Close Pairs (< 100m): ${baselineReport.closePairs.length}`);
if (baselineReport.closePairs.length > 0) {
  console.log('Sample close pairs:', baselineReport.closePairs.slice(0, 5));
}

console.log('\n--- Finalizing Phase 8A ---');
if (allPassed) {
  console.log('🎉 All Phase 8A tests passed successfully!');
  process.exit(0);
} else {
  console.error('❌ Some Phase 8A tests failed.');
  process.exit(1);
}
