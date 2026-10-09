/**
 * RescueAI Risk Detection Engine (Deterministic Layer 1)
 * Evaluates active rescue health to detect stall conditions or impending expiration.
 * Applies ONLY to operational active rescue states.
 * Engine Version: rescue-ai-v1
 */

import {
  RescueRiskAssessment,
  RescueRiskLevel,
  RESCUE_AI_ENGINE_VERSION,
} from '../../../types/rescue-ai';
import { DonationStatus } from '../../../types/donation';

export interface RescueRiskContext {
  id: string;
  status: DonationStatus;
  pickupDeadlineAt: string;
  isReserved: boolean;
  isVolunteerAssigned: boolean;
  isPickedUp: boolean;
  reservedAt?: string;
  assignedAt?: string;
  pickedUpAt?: string;
}

export function detectRescueRisk(context: RescueRiskContext): RescueRiskAssessment {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const attention: string[] = [];

  // Terminal / non-active states do not produce active rescue risk recommendations
  if (['DRAFT', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ISSUE_REPORTED'].includes(context.status)) {
    return {
      riskLevel: 'NORMAL',
      riskScore: 0,
      summary: `Donation is in ${context.status.toLowerCase()} state. No active rescue tracking required.`,
      reasons: [`Status is ${context.status}`],
      warnings: [],
      attention: [],
      recommendedAction: 'No action required.',
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  const now = new Date().getTime();
  const deadline = new Date(context.pickupDeadlineAt).getTime();
  const timeRemainingMinutes = Math.floor((deadline - now) / 60000);

  // If pickup deadline has passed, donation has expired - NOT an active urgent rescue
  if (timeRemainingMinutes <= 0) {
    return {
      riskLevel: 'NORMAL',
      riskScore: 0,
      summary: 'Pickup deadline has passed. Listing is expired and no longer actionable for rescue matching.',
      reasons: ['Pickup deadline has passed.'],
      warnings: ['Listing is expired.'],
      attention: [],
      recommendedAction: 'Mark donation as EXPIRED or contact donor.',
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  let riskScore = 0;
  let recommendedAction = 'Continue normal operational monitoring.';

  // 1. Time-compressed window without assignment
  if (timeRemainingMinutes <= 45 && !context.isVolunteerAssigned) {
    riskScore += 75;
    warnings.push(`Only ${timeRemainingMinutes}m remaining before pickup deadline with no volunteer assigned.`);
    recommendedAction = 'Highlight donation to nearby volunteers along compatible commute routes.';
  } else if (timeRemainingMinutes <= 90 && !context.isReserved) {
    riskScore += 45;
    attention.push(`Pickup window closes in ${timeRemainingMinutes}m without community center reservation.`);
    recommendedAction = 'Broaden coordinator visibility in available community feed.';
  }

  // 2. Reservation Stall: Reserved but no volunteer after 45 minutes
  if (context.isReserved && !context.isVolunteerAssigned && context.reservedAt) {
    const reservationAgeMinutes = Math.floor((now - new Date(context.reservedAt).getTime()) / 60000);
    if (reservationAgeMinutes > 45 && timeRemainingMinutes <= 120) {
      riskScore += 30;
      attention.push(`Reserved ${reservationAgeMinutes}m ago, but volunteer assignment is still pending.`);
      recommendedAction = 'Alert active couriers in the pickup vicinity.';
    }
  }

  // 3. Pickup Delay after Assignment: Volunteer assigned over 40m ago but pickup not started
  if (context.isVolunteerAssigned && !context.isPickedUp && context.assignedAt) {
    const assignmentAgeMinutes = Math.floor((now - new Date(context.assignedAt).getTime()) / 60000);
    if (assignmentAgeMinutes > 40 && timeRemainingMinutes <= 60) {
      riskScore += 35;
      warnings.push(`Volunteer assigned ${assignmentAgeMinutes}m ago but pickup has not started.`);
      recommendedAction = 'Prompt volunteer for ETA confirmation or reassign if needed.';
    }
  }

  // Determine Level for active rescue
  let riskLevel: RescueRiskLevel = 'NORMAL';
  if (riskScore >= 70 || (timeRemainingMinutes <= 30 && !context.isVolunteerAssigned)) {
    riskLevel = 'URGENT';
  } else if (riskScore >= 45) {
    riskLevel = 'AT RISK';
  } else if (riskScore >= 25) {
    riskLevel = 'WATCH';
  }

  const summary =
    riskLevel === 'URGENT'
      ? 'Critical rescue risk: Short remaining window requires urgent volunteer assignment.'
      : riskLevel === 'AT RISK'
      ? 'Elevated risk: Rescue timeline is compressed with missing logistical milestones.'
      : riskLevel === 'WATCH'
      ? 'Moderate risk: Monitor volunteer assignment progress.'
      : 'Rescue progressing within normal operational timelines.';

  return {
    riskLevel,
    riskScore: Math.min(100, riskScore),
    summary,
    reasons,
    warnings,
    attention,
    recommendedAction,
    generatedAt: new Date().toISOString(),
    engineVersion: RESCUE_AI_ENGINE_VERSION,
  };
}
