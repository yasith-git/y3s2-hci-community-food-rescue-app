/**
 * RescueAI Organization Match Engine (Deterministic Layer 1)
 * Evaluates verified organization eligibility and compatibility.
 * Strict Separation: Hard Eligibility vs Soft Ranking.
 * Engine Version: rescue-ai-v1
 */

import {
  OrganizationCandidate,
  OrganizationMatchResult,
  OrganizationMatchLabel,
  RESCUE_AI_ENGINE_VERSION,
} from '../../../types/rescue-ai';
import { FoodCategory, StorageCondition, DonationStatus, QuantityUnit } from '../../../types/donation';

export interface DonationOrgMatchCriteria {
  category: FoodCategory;
  storageCondition: StorageCondition;
  quantity?: number;
  quantityUnit?: QuantityUnit | string;
  quantityPortions?: number; // legacy backward compatibility
  pickupDeadlineAt: string;
  status: DonationStatus;
  latitude?: number;
  longitude?: number;
}

export function evaluateOrganizationMatch(
  org: OrganizationCandidate,
  criteria: DonationOrgMatchCriteria
): OrganizationMatchResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const attention: string[] = [];

  const now = new Date().getTime();
  const deadline = new Date(criteria.pickupDeadlineAt).getTime();
  const unit = criteria.quantityUnit || 'portions';
  const quantity = criteria.quantity ?? criteria.quantityPortions ?? 0;
  const isPortionsCompatible = unit.toLowerCase() === 'portions';

  // HARD ELIGIBILITY RULE 1: Donation lifecycle state must be actionable
  if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(criteria.status)) {
    return {
      organizationId: org.id,
      organizationName: org.name,
      isEligible: false,
      label: 'NOT ELIGIBLE',
      score: 0,
      summary: `Donation is in terminal status (${criteria.status}). No new organization matches permitted.`,
      reasons: [],
      warnings: [`Donation status is ${criteria.status}.`],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 2: Pickup deadline must not have passed
  if (deadline <= now) {
    return {
      organizationId: org.id,
      organizationName: org.name,
      isEligible: false,
      label: 'NOT ELIGIBLE',
      score: 0,
      summary: 'Donation pickup deadline has passed.',
      reasons: [],
      warnings: ['Pickup deadline has expired.'],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 3: Organization must be verified
  if (!org.isVerified) {
    return {
      organizationId: org.id,
      organizationName: org.name,
      isEligible: false,
      label: 'NOT ELIGIBLE',
      score: 0,
      summary: 'Organization is not verified by platform administration.',
      reasons: [],
      warnings: ['Organization verification status is not VERIFIED.'],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 4: Organization must be active
  if (!org.isActive) {
    return {
      organizationId: org.id,
      organizationName: org.name,
      isEligible: false,
      label: 'NOT ELIGIBLE',
      score: 0,
      summary: 'Organization is temporarily inactive or paused.',
      reasons: [],
      warnings: ['Organization is currently inactive.'],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 5: Organization must have an active community collection point
  if (!org.hasAvailableCommunityPoint) {
    return {
      organizationId: org.id,
      organizationName: org.name,
      isEligible: false,
      label: 'NOT ELIGIBLE',
      score: 0,
      summary: 'Organization has no active community drop-off point registered.',
      reasons: [],
      warnings: ['No available receiving community point for surplus intake.'],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 6: Storage capability compatibility
  const supportsStorage =
    criteria.storageCondition === 'Room Temperature' ||
    org.supportedStorage.includes(criteria.storageCondition);

  if (!supportsStorage) {
    return {
      organizationId: org.id,
      organizationName: org.name,
      isEligible: false,
      label: 'NOT ELIGIBLE',
      score: 0,
      summary: `Organization cannot accommodate ${criteria.storageCondition} storage requirement.`,
      reasons: [],
      warnings: [`Lacks required storage equipment (${criteria.storageCondition}).`],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 7: Food category compatibility
  const acceptsCategory =
    org.acceptedCategories.length === 0 ||
    org.acceptedCategories.includes(criteria.category);

  if (!acceptsCategory) {
    return {
      organizationId: org.id,
      organizationName: org.name,
      isEligible: false,
      label: 'NOT ELIGIBLE',
      score: 0,
      summary: `Organization does not accept ${criteria.category} food items.`,
      reasons: [],
      warnings: [`Category ${criteria.category} is not in accepted intake list.`],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // HARD ELIGIBILITY RULE 8: Capacity Semantics & Sufficiency Check
  // If capacity metrics are directly comparable ('portions' vs organization capacity in portions/people):
  // -> Enforce strictly as hard filter.
  // If units are not directly comparable (e.g. boxes, packs, kg, loaves, containers):
  // -> Do NOT invent arbitrary conversions (e.g. 1 box = 1 person). Mark compatibility as UNKNOWN / MANUAL REVIEW.
  let isCapacitySufficient = true;
  if (org.maxCapacityPortions) {
    const remainingCapacity = org.maxCapacityPortions - (org.currentWorkloadPortions || 0);

    if (isPortionsCompatible) {
      if (remainingCapacity < quantity) {
        return {
          organizationId: org.id,
          organizationName: org.name,
          isEligible: false,
          label: 'NOT ELIGIBLE',
          score: 0,
          summary: `Insufficient capacity: organization has ${remainingCapacity} portions remaining but donation requires ${quantity} portions.`,
          reasons: [],
          warnings: [`Workload capacity exceeded (${remainingCapacity} portions available vs ${quantity} required).`],
          generatedAt: new Date().toISOString(),
          engineVersion: RESCUE_AI_ENGINE_VERSION,
        };
      }
    } else {
      // Incompatible unit (kg, boxes, trays, packs, etc.) -> flagged for manual review rather than false rejection/conversion
      attention.push(`Capacity unit is non-standard (${quantity} ${unit}). Capacity compatibility requires manual coordinator review.`);
    }
  }

  // HARD ELIGIBILITY RULE 9: Service area boundary check (if geographic coordinates and service radius are configured)
  if (
    org.serviceAreaKm !== undefined &&
    org.distanceKm !== undefined &&
    org.distanceKm > org.serviceAreaKm
  ) {
    return {
      organizationId: org.id,
      organizationName: org.name,
      isEligible: false,
      label: 'NOT ELIGIBLE',
      score: 0,
      summary: `Pickup location (${org.distanceKm.toFixed(1)} km) is outside organization service area boundary (${org.serviceAreaKm} km radius).`,
      reasons: [],
      warnings: [`Distance exceeds service radius limit (${org.distanceKm.toFixed(1)} km > ${org.serviceAreaKm} km).`],
      generatedAt: new Date().toISOString(),
      engineVersion: RESCUE_AI_ENGINE_VERSION,
    };
  }

  // ==========================================
  // SOFT RANKING (Only for fully eligible orgs)
  // Max Score: 100 points
  // ==========================================
  let score = 50; // Base score for passing all 9 hard eligibility checks
  reasons.push('Verified community partner with active community collection point.');
  reasons.push(`Verified equipment for ${criteria.storageCondition} storage.`);

  if (org.acceptedCategories.includes(criteria.category)) {
    reasons.push(`Designated specialty in ${criteria.category} food distribution.`);
    score += 15;
  }

  // Capacity buffer check
  if (org.maxCapacityPortions) {
    const remaining = org.maxCapacityPortions - (org.currentWorkloadPortions || 0);
    reasons.push(`Ample distribution capacity (${remaining} available portions).`);
    score += 15;
  }

  // Proximity bonus
  if (org.distanceKm !== undefined) {
    if (org.distanceKm <= 3.0) {
      reasons.push(`Proximity: Approx. ${org.distanceKm.toFixed(1)} km from pickup point.`);
      score += 20;
    } else if (org.distanceKm <= 8.0) {
      reasons.push(`Within service corridor: Approx. ${org.distanceKm.toFixed(1)} km.`);
      score += 10;
    } else {
      reasons.push(`Accessible distance: Approx. ${org.distanceKm.toFixed(1)} km.`);
      score += 5;
    }
  }

  let label: OrganizationMatchLabel = 'POSSIBLE';
  if (score >= 80) {
    label = 'BEST FIT';
  } else if (score >= 65) {
    label = 'SUITABLE';
  }

  const summary = `Organization meets all 9 mandatory eligibility criteria with ${label.toLowerCase()} operational alignment.`;

  return {
    organizationId: org.id,
    organizationName: org.name,
    isEligible: true,
    label,
    score: Math.min(100, Math.max(0, score)),
    distanceKm: org.distanceKm,
    summary,
    reasons,
    warnings,
    attention,
    generatedAt: new Date().toISOString(),
    engineVersion: RESCUE_AI_ENGINE_VERSION,
  };
}
