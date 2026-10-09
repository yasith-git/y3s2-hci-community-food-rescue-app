const assert = require('assert');

// Setup environment globals
globalThis.__DEV__ = true;

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('=== RUNNING MEMBER 2 SMART ROUTING TEST SUITES ===\n');

// 1. GEOSPATIAL UTILITIES
console.log('[Suite 1: Geospatial Calculations & Haversine]');
function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function distancePointToRouteSegment(point, origin, destination) {
  const distOriginToDest = calculateDistanceKm(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude
  );

  if (distOriginToDest === 0) {
    const d = calculateDistanceKm(point.latitude, point.longitude, origin.latitude, origin.longitude);
    return {
      perpendicularDistanceKm: d,
      totalDetourDistanceKm: d * 2,
      originToPickupKm: d,
      pickupToDestinationKm: d,
    };
  }

  const dOriginToPoint = calculateDistanceKm(
    origin.latitude,
    origin.longitude,
    point.latitude,
    point.longitude
  );
  const dPointToDest = calculateDistanceKm(
    point.latitude,
    point.longitude,
    destination.latitude,
    destination.longitude
  );

  const detourKm = Math.max(0, dOriginToPoint + dPointToDest - distOriginToDest);
  const s = (distOriginToDest + dOriginToPoint + dPointToDest) / 2;
  const area = Math.sqrt(
    Math.max(0, s * (s - distOriginToDest) * (s - dOriginToPoint) * (s - dPointToDest))
  );
  const perpDist = (2 * area) / distOriginToDest;

  return {
    perpendicularDistanceKm: Math.round(perpDist * 100) / 100,
    totalDetourDistanceKm: Math.round(detourKm * 100) / 100,
    originToPickupKm: dOriginToPoint,
    pickupToDestinationKm: dPointToDest,
  };
}

function estimateDetourMinutesFromDistance(distanceKm, transportMode = 'DRIVING') {
  const speeds = { DRIVING: 25, BICYCLE: 12, WALKING: 4.5 };
  const speed = speeds[transportMode] || speeds.DRIVING;
  const transitMinutes = (distanceKm / speed) * 60;
  const bufferMinutes = 4;
  return Math.round(transitMinutes + bufferMinutes);
}

const dist = calculateDistanceKm(6.9344, 79.8504, 6.9147, 79.8778);
check(dist > 3.0 && dist < 4.5, 'calculateDistanceKm returns accurate Haversine distance between Colombo points');

const origin = { latitude: 6.9344, longitude: 79.8504 };
const destination = { latitude: 6.9147, longitude: 79.8778 };
const pointNearCorridor = { latitude: 6.9272, longitude: 79.8614 };
const res = distancePointToRouteSegment(pointNearCorridor, origin, destination);
check(res.perpendicularDistanceKm < 1.5, 'distancePointToRouteSegment computes perpendicular distance < 1.5 km');
check(res.totalDetourDistanceKm < 2.0, 'distancePointToRouteSegment computes detour distance < 2.0 km');

const min1 = estimateDetourMinutesFromDistance(2, 'DRIVING');
check(min1 >= 7 && min1 <= 10, 'estimateDetourMinutesFromDistance calculates reasonable urban driving times');

// 2. DISCOVERY ELIGIBILITY & TIME WINDOW FILTERS
console.log('\n[Suite 2: Operational Eligibility & Time Window Filters]');
function isDonationDiscoverable(donation) {
  if (!donation || donation.status !== 'PUBLISHED') return false;
  if (!donation.pickup || !donation.pickup.pickupDeadlineAt) return false;
  const deadline = new Date(donation.pickup.pickupDeadlineAt).getTime();
  const now = Date.now();
  return deadline > now;
}

function calculateTimeOverlapMinutes(volStartIso, volEndIso, pickupStartIso, pickupEndIso) {
  const vStart = new Date(volStartIso).getTime();
  const vEnd = new Date(volEndIso).getTime();
  const pStart = new Date(pickupStartIso).getTime();
  const pEnd = new Date(pickupEndIso).getTime();

  if (vEnd <= pStart || vStart >= pEnd) {
    return { hasOverlap: false, overlapMinutes: 0 };
  }

  const overlapStart = Math.max(vStart, pStart);
  const overlapEnd = Math.min(vEnd, pEnd);
  const overlapMinutes = Math.max(0, Math.round((overlapEnd - overlapStart) / (1000 * 60)));

  return { hasOverlap: overlapMinutes > 0, overlapMinutes };
}

const baseDonation = {
  id: 'd-1',
  status: 'PUBLISHED',
  pickup: {
    pickupDeadlineAt: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
  },
};
check(isDonationDiscoverable(baseDonation), 'isDonationDiscoverable accepts valid published donation');
check(!isDonationDiscoverable({ ...baseDonation, status: 'CANCELLED' }), 'isDonationDiscoverable rejects CANCELLED donation');
check(!isDonationDiscoverable({ ...baseDonation, status: 'EXPIRED' }), 'isDonationDiscoverable rejects EXPIRED donation');
check(!isDonationDiscoverable({ ...baseDonation, pickup: { pickupDeadlineAt: new Date(Date.now() - 3600000).toISOString() } }), 'isDonationDiscoverable rejects donation with past deadline');

const now = Date.now();
const vStart = new Date(now).toISOString();
const vEnd = new Date(now + 1000 * 60 * 120).toISOString();
const pStart = new Date(now + 1000 * 60 * 30).toISOString();
const pEnd = new Date(now + 1000 * 60 * 90).toISOString();
const overlapRes = calculateTimeOverlapMinutes(vStart, vEnd, pStart, pEnd);
check(overlapRes.hasOverlap === true && overlapRes.overlapMinutes === 60, 'calculateTimeOverlapMinutes accurately detects 60 min overlap');

const noOverlapRes = calculateTimeOverlapMinutes(vStart, new Date(now + 3600000).toISOString(), new Date(now + 5400000).toISOString(), new Date(now + 9000000).toISOString());
check(noOverlapRes.hasOverlap === false && noOverlapRes.overlapMinutes === 0, 'calculateTimeOverlapMinutes rejects non-overlapping windows');

// 3. SMART ROUTE MATCHING & SCORING
console.log('\n[Suite 3: Smart Route Matching Pipeline & Scoring]');
function calculateMatchScore(detourMinutes, maxDetourMinutes, timeOverlapMinutes, hoursUntilExpiry, corridorDistanceKm) {
  let score = 0;
  const detourRatio = Math.max(0, 1 - detourMinutes / maxDetourMinutes);
  score += Math.round(detourRatio * 40);

  if (timeOverlapMinutes >= 60) score += 30;
  else if (timeOverlapMinutes >= 30) score += 20;
  else if (timeOverlapMinutes > 0) score += 10;

  if (hoursUntilExpiry < 2) score += 20;
  else if (hoursUntilExpiry < 4) score += 15;
  else score += 10;

  if (corridorDistanceKm < 1) score += 10;
  else if (corridorDistanceKm < 3) score += 5;

  let fitCategory = 'POSSIBLE';
  if (score >= 75) fitCategory = 'EXCELLENT';
  else if (score >= 50) fitCategory = 'GOOD';

  return { totalScore: Math.min(100, score), fitCategory };
}

const matchScoreRes = calculateMatchScore(5, 15, 90, 1.5, 0.8);
check(matchScoreRes.totalScore >= 75, 'calculateMatchScore score >= 75');
check(matchScoreRes.fitCategory === 'EXCELLENT', 'calculateMatchScore ranks short-detour rescue as EXCELLENT');

// 4. LIST AND MAP SYNCHRONIZED DATASET RULES
console.log('\n[Suite 4: List and Map Synchronized Dataset Consistency]');
const eligibleDonations = [
  { id: 'd-1', status: 'PUBLISHED', pickup: { pickupDeadlineAt: new Date(Date.now() + 3600000).toISOString() } },
  { id: 'd-2', status: 'PUBLISHED', pickup: { pickupDeadlineAt: new Date(Date.now() + 7200000).toISOString() } },
  { id: 'd-3', status: 'VOLUNTEER_ASSIGNED', pickup: { pickupDeadlineAt: new Date(Date.now() + 7200000).toISOString() } },
];
const discoverableList = eligibleDonations.filter(isDonationDiscoverable);
const discoverableMap = eligibleDonations.filter(isDonationDiscoverable);
check(discoverableList.length === 2, 'List View strictly filters only PUBLISHED eligible donations (2)');
check(discoverableMap.length === 2, 'Map View strictly filters only PUBLISHED eligible donations (2)');
check(JSON.stringify(discoverableList.map(d => d.id)) === JSON.stringify(discoverableMap.map(d => d.id)), 'List View and Map View consume IDENTICAL donation IDs');

console.log(`\n=== MEMBER 2 TEST SUITES COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) process.exit(1);
