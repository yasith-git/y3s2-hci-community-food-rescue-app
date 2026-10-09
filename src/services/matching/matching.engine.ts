/**
 * Smart Route Matching Engine
 * Applies hard constraints, corridor projection, detour calculation, and ranking.
 */

import { Donation, DonationStatus } from '../../types/donation';
import {
  VolunteerRoute,
  RouteMatch,
  DiscoveryFilterState,
  CommunityPointSummary,
} from '../../types/route';
import {
  calculateDistanceKm,
  distancePointToRouteSegment,
  isPointInCorridorBoundingBox,
  estimateDetourMinutesFromDistance,
} from '../location/geospatial.utils';
import { calculateMatchScore, buildMatchExplanation } from './matching.score';

/**
 * Validates whether a donation is operationally discoverable.
 */
export function isDonationDiscoverable(donation: Donation): boolean {
  // Only published / ready for rescue donations
  if (donation.status !== 'PUBLISHED') {
    return false;
  }

  // Pickup deadline must not have passed (with 10 min grace period)
  if (donation.pickup?.pickupDeadlineAt) {
    const deadline = new Date(donation.pickup.pickupDeadlineAt).getTime();
    const now = Date.now() - 10 * 60 * 1000;
    if (deadline <= now) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates time window overlap in minutes between volunteer availability and donation pickup.
 */
export function calculateTimeOverlapMinutes(
  volunteerStart: string,
  volunteerEnd: string,
  pickupStart: string,
  pickupEnd: string
): { hasOverlap: boolean; overlapMinutes: number } {
  const vStart = new Date(volunteerStart).getTime();
  const vEnd = new Date(volunteerEnd).getTime();
  const pStart = new Date(pickupStart).getTime();
  const pEnd = new Date(pickupEnd).getTime();

  // Effective overlapping window
  const overlapStart = Math.max(vStart, pStart);
  const overlapEnd = Math.min(vEnd, pEnd);

  if (overlapStart >= overlapEnd) {
    return { hasOverlap: false, overlapMinutes: 0 };
  }

  const overlapMinutes = Math.round((overlapEnd - overlapStart) / (1000 * 60));
  return { hasOverlap: true, overlapMinutes };
}

/**
 * Primary Matching Pipeline
 * Matches a list of donations against an active volunteer route.
 */
export function matchDonationsAgainstRoute(
  route: VolunteerRoute,
  donations: Donation[],
  communityDestinations?: Record<string, CommunityPointSummary>
): RouteMatch[] {
  const results: RouteMatch[] = [];
  const now = Date.now();

  for (const donation of donations) {
    // 1. Hard Filter: Basic operational eligibility
    if (!isDonationDiscoverable(donation)) {
      continue;
    }

    const pickupLat = donation.pickup?.latitude ?? 6.9271;
    const pickupLon = donation.pickup?.longitude ?? 79.8612;

    // 2. Hard Filter: Time Window Overlap
    const { hasOverlap, overlapMinutes } = calculateTimeOverlapMinutes(
      route.availableFromAt,
      route.availableUntilAt,
      donation.pickup.pickupStartAt,
      donation.pickup.pickupDeadlineAt
    );

    if (!hasOverlap || overlapMinutes < 10) {
      // Must have at least 10 minutes of operational overlap
      continue;
    }

    // 3. Spatial Corridor Projection
    const corridorAnalysis = distancePointToRouteSegment(
      { latitude: pickupLat, longitude: pickupLon },
      route.origin,
      route.destination
    );

    // Filter out if perpendicular distance is > 15 km (too far off corridor)
    if (corridorAnalysis.perpendicularDistanceKm > 15) {
      continue;
    }

    // 4. Detour Estimation
    const communityPoint = communityDestinations ? communityDestinations[donation.id] : undefined;
    
    // Total additional detour travel time
    const estimatedDetourMin = estimateDetourMinutesFromDistance(
      corridorAnalysis.totalDetourDistanceKm,
      route.transportMode
    );

    // 5. Hard Filter: Maximum Allowed Detour
    if (estimatedDetourMin > route.maxDetourMinutes) {
      continue;
    }

    // Distance metrics
    const pickupDistanceKm = calculateDistanceKm(
      route.origin.latitude,
      route.origin.longitude,
      pickupLat,
      pickupLon
    );

    const deadlineTime = new Date(donation.pickup.pickupDeadlineAt).getTime();
    const hoursUntilExpiry = Math.max(0.1, (deadlineTime - now) / (1000 * 60 * 60));

    // 6. Score & Ranking
    const scoreResult = calculateMatchScore(
      estimatedDetourMin,
      route.maxDetourMinutes,
      overlapMinutes,
      hoursUntilExpiry,
      corridorAnalysis.perpendicularDistanceKm
    );

    // 7. Explanations
    const explanation = buildMatchExplanation(
      donation,
      route,
      estimatedDetourMin,
      corridorAnalysis.perpendicularDistanceKm,
      scoreResult.fitCategory,
      hoursUntilExpiry
    );

    results.push({
      donation,
      communityPoint,
      pickupDistanceKm: Number(pickupDistanceKm.toFixed(1)),
      routeDeviationKm: Number(corridorAnalysis.perpendicularDistanceKm.toFixed(1)),
      estimatedDetourMinutes: estimatedDetourMin,
      matchScore: scoreResult.totalScore,
      fitCategory: scoreResult.fitCategory,
      confidence: 'APPROXIMATE', // Transparent geometric confidence
      timingCompatibility: {
        isCompatible: true,
        pickupWindowOverlapMinutes: overlapMinutes,
        hoursUntilPickupDeadline: Number(hoursUntilExpiry.toFixed(1)),
      },
      explanation,
    });
  }

  // Sort descending by matchScore
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Computes simple nearby rescues relative to a single GPS / manual coordinate
 * Used when no active route is set or when user explores "Nearby" tab.
 */
export function findNearbyDonations(
  currentLocation: { latitude: number; longitude: number },
  donations: Donation[],
  maxRadiusKm: number = 10
): RouteMatch[] {
  const results: RouteMatch[] = [];
  const now = Date.now();

  for (const donation of donations) {
    if (!isDonationDiscoverable(donation)) continue;

    const lat = donation.pickup.latitude!;
    const lon = donation.pickup.longitude!;

    const distKm = calculateDistanceKm(
      currentLocation.latitude,
      currentLocation.longitude,
      lat,
      lon
    );

    if (distKm > maxRadiusKm) continue;

    const deadlineTime = new Date(donation.pickup.pickupDeadlineAt).getTime();
    const hoursUntilExpiry = Math.max(0.1, (deadlineTime - now) / (1000 * 60 * 60));
    const estimatedDetourMinutes = Math.round((distKm / 30) * 60 + 4);

    results.push({
      donation,
      pickupDistanceKm: Number(distKm.toFixed(1)),
      routeDeviationKm: Number(distKm.toFixed(1)),
      estimatedDetourMinutes,
      matchScore: Math.round(Math.max(10, 100 - distKm * 8)),
      fitCategory: distKm < 3 ? 'EXCELLENT' : distKm < 7 ? 'GOOD' : 'POSSIBLE',
      confidence: 'APPROXIMATE',
      timingCompatibility: {
        isCompatible: true,
        pickupWindowOverlapMinutes: 60,
        hoursUntilPickupDeadline: Number(hoursUntilExpiry.toFixed(1)),
      },
      explanation: {
        headline: `${distKm.toFixed(1)} km away`,
        detourText: `~${estimatedDetourMinutes} min travel`,
        timingText: `Pickup before ${new Date(donation.pickup.pickupDeadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        distanceText: `${distKm.toFixed(1)} km from your location`,
        badges: distKm < 2 ? ['📍 Very Close'] : [],
      },
    });
  }

  return results.sort((a, b) => a.pickupDistanceKm - b.pickupDistanceKm);
}
