/**
 * RescueAI Volunteer Route Match Engine (Deterministic Layer 1)
 * Evaluates volunteer route compatibility against real pickup & community drop-off points.
 * Strict Separation: Hard Route & Schedule Eligibility vs Soft Ranking.
 * Engine Version: rescue-ai-v1
 */

import {
  VolunteerRouteCandidate,
  VolunteerRouteMatchResult,
  VolunteerRouteMatchLabel,
  RESCUE_AI_ENGINE_VERSION,
} from '../../../types/rescue-ai';
import { DonationStatus } from '../../../types/donation';

export interface RescueRouteMatchCriteria {
  donationId: string;
  status: DonationStatus;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  pickupStartAt: string;
  pickupDeadlineAt: string;
  isReserved: boolean;
}

export function evaluateVolunteerRouteMatch(
  route: VolunteerRouteCandidate,
  criteria: RescueRouteMatchCriteria
): VolunteerRouteMatchResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const attention: string[] = [];

  const now = new Date().getTime();
  const deadline = new Date(criteria.pickupDeadlineAt).getTime();
  const pickupStart = new Date(criteria.pickupStartAt).getTime();

  // HARD ELIGIBILITY RULE 1: Donation status must be in RESERVED state with a designated community destination for actionable volunteer routing
  // PUBLISHED donations are visible for discovery but NOT actionable for volunteer courier route matching until reserved by a coordinator
  if (criteria.status === 'PUBLISHED' || !criteria.isReserved) {
    return {
      routeId: route.id,
      volunteerId: route.volunteerId,
      isEligible: false,
      label: 'DESTINATION PENDING',
      score: 0,
      summary: 'Donation is published but not yet reserved. Actionable volunteer route matching requires a designated community collection point.',
      reasons: [],
      warnings: ['Awaiting coordinator reservation and drop-off community point designation.'],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  if (criteria.status !== 'RESERVED') {
    return {
      routeId: route.id,
      volunteerId: route.volunteerId,
      isEligible: false,
      label: 'NOT SUITABLE',
      score: 0,
      summary: `Donation is in ${criteria.status} status. Volunteer route matching is only actionable for reserved listings awaiting transport.`,
      reasons: [],
      warnings: [`Donation status is ${criteria.status}.`],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 2: Real pickup and dropoff destination coordinates must be present
  if (
    criteria.pickupLat === undefined ||
    criteria.pickupLng === undefined ||
    criteria.dropoffLat === undefined ||
    criteria.dropoffLng === undefined
  ) {
    return {
      routeId: route.id,
      volunteerId: route.volunteerId,
      isEligible: false,
      label: 'DESTINATION PENDING',
      score: 0,
      summary: 'Drop-off community point or pickup coordinates are not fully resolved. Actionable routing requires exact destination coordinates.',
      reasons: [],
      warnings: ['Geographic pickup or community drop-off coordinates are missing.'],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 3: Pickup deadline must not have passed
  if (deadline <= now) {
    return {
      routeId: route.id,
      volunteerId: route.volunteerId,
      isEligible: false,
      label: 'NOT SUITABLE',
      score: 0,
      summary: 'Donation pickup deadline has passed.',
      reasons: [],
      warnings: ['Pickup deadline has expired.'],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 4: Volunteer must be marked available
  if (!route.isAvailable) {
    return {
      routeId: route.id,
      volunteerId: route.volunteerId,
      isEligible: false,
      label: 'NOT SUITABLE',
      score: 0,
      summary: 'Volunteer is currently marked unavailable or on an active delivery mission.',
      reasons: [],
      warnings: ['Volunteer availability is inactive.'],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 5: Usable volunteer route coordinates must be present
  if (
    route.routeOriginLat === undefined ||
    route.routeDestinationLat === undefined
  ) {
    return {
      routeId: route.id,
      volunteerId: route.volunteerId,
      isEligible: false,
      label: 'NOT SUITABLE',
      score: 0,
      summary: 'Missing volunteer route trajectory coordinates.',
      reasons: [],
      warnings: ['Volunteer commute trajectory is incomplete.'],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 5: Schedule window compatibility (Schedule is a mandatory hard filter, not just bonus points)
  if (route.pickupTimeWindowStart && route.pickupTimeWindowEnd) {
    const volWindowStart = new Date(route.pickupTimeWindowStart).getTime();
    const volWindowEnd = new Date(route.pickupTimeWindowEnd).getTime();

    // Check overlap between volunteer availability window and donation pickup window
    const hasOverlap = volWindowStart <= deadline && volWindowEnd >= pickupStart;
    if (!hasOverlap) {
      return {
        routeId: route.id,
        volunteerId: route.volunteerId,
        isEligible: false,
        label: 'NOT SUITABLE',
        score: 0,
        summary: 'Volunteer commute schedule does not overlap with the required pickup window.',
        reasons: [],
        warnings: ['Schedule mismatch: volunteer commute time does not align with donation window.'],
        generatedAt: new Date().toISOString(),
        engineVersion: RESCUE_AI_ENGINE_VERSION,
      };
    }
  }

  // HARD ELIGIBILITY RULE 6: Detour limit must not exceed volunteer preference
  const detour = route.calculatedAdditionalDetourKm ?? 0;
  if (route.maxDetourKm && detour > route.maxDetourKm) {
    return {
      routeId: route.id,
      volunteerId: route.volunteerId,
      isEligible: false,
      label: 'NOT SUITABLE',
      score: 0,
      summary: `Estimated geometric detour of ${detour.toFixed(1)} km exceeds volunteer preference limit of ${route.maxDetourKm.toFixed(1)} km.`,
      reasons: [],
      warnings: [`Detour exceeds maximum threshold (${detour.toFixed(1)} km > ${route.maxDetourKm.toFixed(1)} km).`],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // ==========================================
  // SOFT RANKING (Only for fully eligible routes)
  // Max Score: 100 points
  // ==========================================
  let score = 50; // Base score for meeting all hard schedule and detour rules

  // 1. Pickup proximity to route corridor (Estimated geometric distance)
  const pickupDist = route.calculatedPickupDistanceKm;
  if (pickupDist !== undefined) {
    if (pickupDist <= 1.0) {
      reasons.push(`Pickup directly along regular route corridor (~${pickupDist.toFixed(1)} km)`);
      score += 25;
    } else if (pickupDist <= 2.5) {
      reasons.push(`Pickup close to route path (~${pickupDist.toFixed(1)} km)`);
      score += 15;
    } else {
      reasons.push(`Accessible pickup location (~${pickupDist.toFixed(1)} km from path)`);
      score += 5;
    }
  }

  // 2. Extra geometric detour impact
  if (detour <= 1.0) {
    reasons.push(`Minimal additional travel (~+${detour.toFixed(1)} km estimated detour)`);
    score += 15;
  } else if (detour <= 2.5) {
    reasons.push(`Manageable detour (~+${detour.toFixed(1)} km estimated detour)`);
    score += 10;
  }

  // 3. Time remaining in window
  const remainingMinutes = Math.max(0, Math.floor((deadline - now) / 60000));
  if (remainingMinutes <= 45) {
    warnings.push(`Pickup window closes soon (${remainingMinutes}m remaining). Prompt pickup recommended.`);
  } else {
    reasons.push('Commute schedule comfortably covers the pickup timeline.');
    score += 10;
  }

  let label: VolunteerRouteMatchLabel = 'POSSIBLE MATCH';
  if (score >= 80) {
    label = 'EXCELLENT MATCH';
  } else if (score >= 65) {
    label = 'GOOD MATCH';
  }

  const summary = `Route meets all mandatory schedule and corridor rules with ${label.toLowerCase()} alignment.`;

  return {
    routeId: route.id,
    volunteerId: route.volunteerId,
    isEligible: true,
    label,
    score: Math.min(100, Math.max(0, score)),
    pickupDistanceKm: pickupDist,
    detourKm: detour,
    etaMinutes: route.calculatedEtaMinutes,
    summary,
    reasons,
    warnings,
    attention,
    generatedAt: new Date().toISOString(),
    engineVersion: RESCUE_AI_ENGINE_VERSION,
  };
}
