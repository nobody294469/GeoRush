import { calculateHaversineDistance, calculateGeoScore, formatDistance } from './scoring';

function runTests() {
  console.log('🧪 Running Scoring Engine Unit Tests...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // Test 1: Zero distance = 5000 points
  const distZero = calculateHaversineDistance(35.6595, 139.7004, 35.6595, 139.7004);
  assert(distZero === 0, 'Zero distance calculates to 0 km');
  assert(calculateGeoScore(distZero) === 5000, 'Zero distance gives perfect 5000 points');

  // Test 2: Very close (< 25 meters) = 5000 points
  const scoreClose = calculateGeoScore(0.015); // 15 meters
  assert(scoreClose === 5000, 'Under 25m threshold gives 5000 points');

  // Test 3: Tokyo (Shibuya) to Tokyo Tower (~3 km)
  const distTokyoLocal = calculateHaversineDistance(35.6595, 139.7004, 35.6586, 139.7454);
  assert(distTokyoLocal > 3.5 && distTokyoLocal < 4.5, `Local distance ~4km (actual: ${distTokyoLocal.toFixed(2)}km)`);
  const scoreLocal = calculateGeoScore(distTokyoLocal);
  assert(scoreLocal >= 4980, `Local guess (~4km) gives >4980 points (actual: ${scoreLocal})`);

  // Test 4: Tokyo to Osaka (~400 km)
  const distTokyoOsaka = calculateHaversineDistance(35.6595, 139.7004, 34.6937, 135.5023);
  const scoreTokyoOsaka = calculateGeoScore(distTokyoOsaka);
  assert(scoreTokyoOsaka >= 3700 && scoreTokyoOsaka <= 3900, `Medium distance (~400km) score in expected range (actual: ${scoreTokyoOsaka})`);

  // Test 5: Tokyo to Paris (~9700 km)
  const distTokyoParis = calculateHaversineDistance(35.6595, 139.7004, 48.8566, 2.3522);
  const scoreTokyoParis = calculateGeoScore(distTokyoParis);
  assert(scoreTokyoParis >= 0 && scoreTokyoParis <= 20, `Intercontinental guess (~9700km) score low (actual: ${scoreTokyoParis})`);

  // Test 6: Formatting
  assert(formatDistance(0.015) === '15 m', 'Format <1km as meters');
  assert(formatDistance(12.34) === '12.3 km', 'Format >1km as kilometers with decimal');

  console.log(`\nResults: ${passed}/${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
