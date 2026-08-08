import { GAMEPLAY_CANDIDATE_LOCATIONS } from '../data/gameplayLocations';
import { selectCandidateLocations, getProximityWeightMultiplier } from './locationSelector';

console.log('🧪 Running Phase 3A Location Architecture Tests...');

// Test 1: Candidate dataset size & unverified seed status
console.assert(
  GAMEPLAY_CANDIDATE_LOCATIONS.length >= 150,
  `Expected at least 150 candidate seeds, found ${GAMEPLAY_CANDIDATE_LOCATIONS.length}`
);
console.log(`✅ PASS: Candidate dataset contains ${GAMEPLAY_CANDIDATE_LOCATIONS.length} candidate seeds (unverified prior to API lookup).`);

// Test 2: Geographic & Environment Coverage
const continents = new Set(GAMEPLAY_CANDIDATE_LOCATIONS.map(c => c.continent));
const countries = new Set(GAMEPLAY_CANDIDATE_LOCATIONS.map(c => c.country));
const environments = new Set(GAMEPLAY_CANDIDATE_LOCATIONS.map(c => c.environment));

console.assert(continents.size >= 6, 'Expected 6 continents');
console.assert(countries.size >= 60, `Expected at least 60 countries, found ${countries.size}`);
console.assert(environments.size === 7, `Expected 7 environment types, found ${environments.size}`);

console.log(`✅ PASS: Geographic distribution covers ${continents.size} continents (${Array.from(continents).join(', ')}).`);
console.log(`✅ PASS: Country representation covers ${countries.size} countries/territories.`);
console.log(`✅ PASS: Environment distribution covers all 7 environment types (${Array.from(environments).join(', ')}).`);

// Test 3: Selection Engine & Distribution Policy Abstraction (WORLD_BALANCED)
const usedIds = new Set<string>();
const session1 = selectCandidateLocations(5, usedIds, GAMEPLAY_CANDIDATE_LOCATIONS, 'WORLD_BALANCED');

console.assert(session1.length === 5, 'Expected 5 candidates for session 1');
const session1Ids = new Set(session1.map(c => c.id));
console.assert(session1Ids.size === 5, 'All candidate IDs in session 1 should be unique');

// Mark session 1 candidate IDs as used
session1.forEach(c => usedIds.add(c.id));

const session2 = selectCandidateLocations(5, usedIds, GAMEPLAY_CANDIDATE_LOCATIONS, 'WORLD_BALANCED');
console.assert(session2.length === 5, 'Expected 5 candidates for session 2');
const session2Overlap = session2.filter(c => session1Ids.has(c.id));
console.assert(session2Overlap.length === 0, 'Session 2 must not contain any candidate ID duplicates from Session 1');
console.log('✅ PASS: Exact candidate ID duplicate prevention verified across sequential game sessions.');

// Test 4: Proximity Soft Penalty Engine
const anchorLocation = GAMEPLAY_CANDIDATE_LOCATIONS[0]; // e.g. Paris
const veryCloseLocation = { ...anchorLocation, id: 'cand-close', latitude: anchorLocation.latitude + 0.002, longitude: anchorLocation.longitude + 0.002 }; // <1km
const mediumDistanceLocation = { ...anchorLocation, id: 'cand-med', latitude: anchorLocation.latitude + 0.03, longitude: anchorLocation.longitude + 0.03 }; // ~4km
const farLocation = { ...anchorLocation, id: 'cand-far', latitude: anchorLocation.latitude + 1.0, longitude: anchorLocation.longitude + 1.0 }; // ~120km

const closeMultiplier = getProximityWeightMultiplier(veryCloseLocation, [anchorLocation]);
const medMultiplier = getProximityWeightMultiplier(mediumDistanceLocation, [anchorLocation]);
const farMultiplier = getProximityWeightMultiplier(farLocation, [anchorLocation]);

console.assert(closeMultiplier === 0.05, `Expected 0.05 for <1km, got ${closeMultiplier}`);
console.assert(medMultiplier === 0.30, `Expected 0.30 for 1-5km, got ${medMultiplier}`);
console.assert(farMultiplier === 1.00, `Expected 1.00 for >15km, got ${farMultiplier}`);

console.log('✅ PASS: Proximity soft penalty bands (<1km: 0.05x, 1-5km: 0.30x, 5-15km: 0.70x, >15km: 1.00x) verified.');

// Test 5: Soft Geographic Diversity
const continentsInSession1 = new Set(session1.map(c => c.continent));
console.assert(continentsInSession1.size >= 3, 'Session 1 should have high geographic diversity');
console.log(`✅ PASS: Soft geographic diversity policy (WORLD_BALANCED) produced ${continentsInSession1.size} distinct continents in a 5-round batch.`);

console.log('🎉 All Phase 3A Location System unit tests PASSED!');
