/**
 * RescueAI Urgency Engine (Deterministic Layer 1)
 * Calculates prioritized rescue logistics urgency with transparent, documented weighting.
 * 
 * IMPORTANT CLARIFICATION:
 * Urgency score estimates rescue/logistics priority to avoid surplus food waste.
 * It does NOT represent food safety, quality, or edibility certification.
 * 
 * Engine Version: rescue-ai-v1
 */

import {
  RescueUrgencyInsight,
  RescueUrgencyLevel,
  DonationUrgencyContext,
  RESCUE_AI_ENGINE_VERSION,
} from '../../../types/rescue-ai';

/**
 * Factor Weights (Total Max = 100):
 * 1. Remaining Pickup Window: up to 50 pts
 *    - <= 0 mins: 0 pts (Treated as Expired/Terminal)
 *    - <= 60 mins: 50 pts
 *    - <= 120 mins: 35 pts
 *    - <= 240 mins: 20 pts
 *    - > 240 mins: 5 pts
 * 2. Perishability by Canonical Food Category: up to 25 pts
 *    - Prepared Meals, Rice & Curry, Bakery: 25 pts
 *    - Dairy, Fruit, Vegetables: 15 pts
 *    - Packaged Food, Beverages, Other: 5 pts
 * 3. Temperature Sensitivity by Storage Condition: up to 15 pts
 *    - Warm / Heated: 15 pts
 *    - Refrigerated, Frozen: 10 pts
 *    - Room Temperature: 0 pts
 * 4. Lifecycle Unassigned Friction: up to 10 pts
 *    - Not reserved and not assigned: 10 pts
 *    - Reserved but no volunteer: 5 pts
 *    - Volunteer assigned: 0 pts
 */

export function calculateDonationUrgency(context: DonationUrgencyContext): RescueUrgencyInsight {
  const now = new Date().getTime();
  const deadline = new Date(context.pickupDeadlineAt).getTime();
  const diffMs = deadline - now;
  const timeRemainingMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  const reasons: string[] = [];
  const warnings: string[] = [];
  const attention: string[] = [];

  // Terminal / non-actionable states
  if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(context.status) || timeRemainingMinutes <= 0) {
    const isPastDeadline = timeRemainingMinutes <= 0;
    return {
      urgencyLevel: 'LOW',
      urgencyScore: 0,
      timeRemainingMinutes,
      summary: isPastDeadline
        ? 'Pickup deadline has passed. Listing is expired and no longer actionable.'
        : `Donation is in ${context.status.toLowerCase()} state. No active rescue required.`,
      reasons: isPastDeadline ? ['Pickup window has expired.'] : [`Status is ${context.status}`],
      warnings: [],
      attention: [],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  let score = 0;

  // 1. Time factor
  if (timeRemainingMinutes <= 60) {
    score += 50;
    reasons.push(`Short remaining pickup window (${timeRemainingMinutes}m remaining)`);
  } else if (timeRemainingMinutes <= 120) {
    score += 35;
    reasons.push(`Pickup window closes in under 2 hours (${timeRemainingMinutes}m remaining)`);
  } else if (timeRemainingMinutes <= 240) {
    score += 20;
    reasons.push(`Active pickup window (~${Math.round(timeRemainingMinutes / 60)}h remaining)`);
  } else {
    score += 5;
    reasons.push(`Generous pickup window (~${Math.round(timeRemainingMinutes / 60)}h remaining)`);
  }

  // 2. Category Perishability (Using Canonical Types)
  if (['Prepared Meals', 'Rice & Curry', 'Bakery'].includes(context.category)) {
    score += 25;
    reasons.push(`Perishable food category (${context.category})`);
  } else if (['Dairy', 'Fruit', 'Vegetables'].includes(context.category)) {
    score += 15;
    reasons.push(`Fresh produce requiring timely rescue (${context.category})`);
  } else {
    score += 5;
    reasons.push(`Shelf-stable / packaged items (${context.category})`);
  }

  // 3. Storage Condition (Using Canonical Types)
  if (context.storageCondition === 'Warm / Heated') {
    score += 15;
    reasons.push('Requires continuous thermal maintenance (Warm / Heated)');
  } else if (['Refrigerated', 'Frozen'].includes(context.storageCondition)) {
    score += 10;
    reasons.push(`Requires cold chain logistics (${context.storageCondition})`);
  }

  // 4. Lifecycle Assignment Friction
  if (!context.isReserved && !context.isVolunteerAssigned) {
    score += 10;
    attention.push('No community organization has reserved this donation yet.');
  } else if (context.isReserved && !context.isVolunteerAssigned) {
    score += 5;
    attention.push('Reserved by community center, awaiting volunteer assignment.');
  }

  // Determine Level
  let urgencyLevel: RescueUrgencyLevel = 'LOW';
  if (score >= 75 || timeRemainingMinutes <= 60) {
    urgencyLevel = 'HIGH';
    if (score >= 85 && timeRemainingMinutes <= 45) {
      urgencyLevel = 'CRITICAL';
    }
  } else if (score >= 45) {
    urgencyLevel = 'MODERATE';
  } else {
    urgencyLevel = 'LOW';
  }

  const summary =
    urgencyLevel === 'CRITICAL' || urgencyLevel === 'HIGH'
      ? 'Time-sensitive rescue recommended due to short remaining window and perishable food.'
      : urgencyLevel === 'MODERATE'
      ? 'Standard priority rescue. Adequate time available for coordination.'
      : 'Flexible rescue with extended collection timeline.';

  return {
    urgencyLevel,
    urgencyScore: Math.min(100, Math.max(0, score)),
    timeRemainingMinutes,
    summary,
    reasons,
    warnings,
    attention,
    generatedAt: new Date().toISOString(),
    engineVersion: RESCUE_AI_ENGINE_VERSION,
  };
}
