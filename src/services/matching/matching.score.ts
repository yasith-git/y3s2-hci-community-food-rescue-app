/**
 * Deterministic Matching Score Calculator
 * Scores candidate food rescues against an active volunteer journey.
 */

import { Donation } from '../../types/donation';
import {
  VolunteerRoute,
  RouteMatch,
  MatchFitCategory,
  MatchConfidence,
} from '../../types/route';
import { formatTimeWindow } from '../../utils/dateTime';

export interface ScoreBreakdown {
  detourScore: number; // Max 40 points
  timeFitScore: number; // Max 30 points
  urgencyScore: number; // Max 20 points
  corridorDistanceScore: number; // Max 10 points
  totalScore: number; // Max 100 points
  fitCategory: MatchFitCategory;
}

/**
 * Computes deterministic score based on:
 * 1. Detour (shorter detour = higher score)
 * 2. Time fit (larger overlap with volunteer's schedule = higher score)
 * 3. Urgency (food closer to deadline gets a boost to prioritize rescue)
 * 4. Corridor alignment (pickup right on the route = higher score)
 */
export function calculateMatchScore(
  detourMinutes: number,
  maxAllowedDetourMinutes: number,
  overlapMinutes: number,
  hoursUntilExpiry: number,
  perpendicularDistanceKm: number
): ScoreBreakdown {
  // 1. Detour Score (0 - 40 pts)
  // Linear scale: 0 detour = 40 pts; maxDetour = 5 pts
  const detourRatio = Math.min(1, Math.max(0, detourMinutes / Math.max(1, maxAllowedDetourMinutes)));
  const detourScore = Math.round(40 * (1 - detourRatio * 0.85));

  // 2. Time Fit Score (0 - 30 pts)
  // Overlap >= 60 min gets full 30 pts; 15 min gets 15 pts
  const timeFitScore = Math.round(Math.min(30, Math.max(5, (overlapMinutes / 60) * 30)));

  // 3. Urgency Score (0 - 20 pts)
  // Expiring in < 2 hours = 20 pts; 2-4 hours = 15 pts; 4-8 hours = 10 pts; > 8 hours = 5 pts
  let urgencyScore = 5;
  if (hoursUntilExpiry <= 2) {
    urgencyScore = 20;
  } else if (hoursUntilExpiry <= 4) {
    urgencyScore = 15;
  } else if (hoursUntilExpiry <= 8) {
    urgencyScore = 10;
  }

  // 4. Corridor Distance Score (0 - 10 pts)
  // < 1 km = 10 pts; 1-3 km = 7 pts; 3-5 km = 4 pts; > 5 km = 1 pt
  let corridorDistanceScore = 1;
  if (perpendicularDistanceKm <= 1.0) {
    corridorDistanceScore = 10;
  } else if (perpendicularDistanceKm <= 3.0) {
    corridorDistanceScore = 7;
  } else if (perpendicularDistanceKm <= 5.0) {
    corridorDistanceScore = 4;
  }

  const totalScore = Math.min(100, Math.max(0, detourScore + timeFitScore + urgencyScore + corridorDistanceScore));

  let fitCategory: MatchFitCategory = 'POSSIBLE';
  if (totalScore >= 75) {
    fitCategory = 'EXCELLENT';
  } else if (totalScore >= 50) {
    fitCategory = 'GOOD';
  }

  return {
    detourScore,
    timeFitScore,
    urgencyScore,
    corridorDistanceScore,
    totalScore,
    fitCategory,
  };
}

/**
 * Builds human-friendly, transparent match explanations for the volunteer UI.
 */
export function buildMatchExplanation(
  donation: Donation,
  route: VolunteerRoute,
  detourMinutes: number,
  perpendicularDistanceKm: number,
  fitCategory: MatchFitCategory,
  hoursUntilExpiry: number
): RouteMatch['explanation'] {
  const badges: string[] = [];

  let headline = 'Fits your journey';
  if (fitCategory === 'EXCELLENT') {
    headline = 'Excellent route match';
    badges.push('⭐ Top Match');
  } else if (fitCategory === 'GOOD') {
    headline = 'Good route fit';
  } else {
    headline = 'Possible match with minor detour';
  }

  if (hoursUntilExpiry <= 2) {
    badges.push('🔥 Urgent Rescue');
  }

  if (perpendicularDistanceKm <= 1.0) {
    badges.push('📍 Right on your route');
  }

  const detourText = `+${detourMinutes} min estimated detour`;
  const pickupTimeStr = formatTimeWindow(donation.pickup.pickupStartAt, donation.pickup.pickupDeadlineAt);
  const timingText = `Pickup window: ${pickupTimeStr}`;
  const distanceText = `${perpendicularDistanceKm.toFixed(1)} km from your planned route`;

  return {
    headline,
    detourText,
    timingText,
    distanceText,
    badges,
  };
}
