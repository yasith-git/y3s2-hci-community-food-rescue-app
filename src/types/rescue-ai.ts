/**
 * RescueAI Core Domain Types & Data Contracts
 * Community Food Rescue App - Explainable Intelligent Food Rescue Engine
 * Engine Version: rescue-ai-v1
 */

import { FoodCategory, StorageCondition, DonationStatus, QuantityUnit } from './donation';

export const RESCUE_AI_ENGINE_VERSION = 'rescue-ai-v1';

export type RescueUrgencyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type OrganizationMatchLabel = 'BEST FIT' | 'SUITABLE' | 'POSSIBLE' | 'NOT ELIGIBLE';

export type VolunteerRouteMatchLabel =
  | 'EXCELLENT MATCH'
  | 'GOOD MATCH'
  | 'POSSIBLE MATCH'
  | 'DESTINATION PENDING'
  | 'NOT SUITABLE';

export type RescueRiskLevel = 'NORMAL' | 'WATCH' | 'AT RISK' | 'URGENT';

/**
 * AI Smart Donation Photo Analysis Suggestions
 */
export interface DonationPhotoAnalysisResult {
  suggestedName?: string;
  suggestedCategory?: FoodCategory;
  suggestedUnit?: QuantityUnit;
  suggestedDescription?: string;
  confidenceNotice?: string;
}

/**
 * Common Structured Explanation Pattern
 */
export interface ExplainableInsight {
  summary: string;
  reasons: string[];
  warnings: string[];
  attention?: string[];
  generatedAt: string;
  engineVersion: string;
}

/**
 * Urgency Insight
 */
export interface RescueUrgencyInsight extends ExplainableInsight {
  urgencyLevel: RescueUrgencyLevel;
  urgencyScore: number; // 0 - 100
  timeRemainingMinutes?: number;
}

/**
 * Organization Candidate (Consumed via Adapter)
 */
export interface OrganizationCandidate {
  id: string;
  name: string;
  isVerified: boolean;
  isActive: boolean;
  serviceAreaKm?: number;
  latitude?: number;
  longitude?: number;
  acceptedCategories: FoodCategory[];
  supportedStorage: StorageCondition[];
  maxCapacityPortions?: number;
  currentWorkloadPortions?: number;
  hasAvailableCommunityPoint: boolean;
  distanceKm?: number;
}

/**
 * Organization Match Result
 */
export interface OrganizationMatchResult extends ExplainableInsight {
  organizationId: string;
  organizationName: string;
  isEligible: boolean;
  label: OrganizationMatchLabel;
  score: number; // 0 - 100
  distanceKm?: number;
}

/**
 * Volunteer Route Candidate (Consumed via Adapter)
 */
export interface VolunteerRouteCandidate {
  id: string;
  volunteerId: string;
  volunteerName?: string;
  isAvailable: boolean;
  routeOriginLat: number;
  routeOriginLng: number;
  routeDestinationLat: number;
  routeDestinationLng: number;
  pickupTimeWindowStart?: string;
  pickupTimeWindowEnd?: string;
  maxDetourKm: number;
  calculatedPickupDistanceKm?: number;
  calculatedAdditionalDetourKm?: number;
  calculatedEtaMinutes?: number;
}

/**
 * Volunteer Route Match Result
 */
export interface VolunteerRouteMatchResult extends ExplainableInsight {
  routeId: string;
  volunteerId: string;
  isEligible: boolean;
  label: VolunteerRouteMatchLabel;
  score: number; // 0 - 100
  pickupDistanceKm?: number;
  detourKm?: number;
  etaMinutes?: number;
}

/**
 * Rescue Risk Assessment
 */
export interface RescueRiskAssessment extends ExplainableInsight {
  riskLevel: RescueRiskLevel;
  riskScore: number; // 0 - 100
  recommendedAction?: string;
}

/**
 * Input Data Context for Urgency Engine
 */
export interface DonationUrgencyContext {
  id: string;
  category: FoodCategory;
  storageCondition: StorageCondition;
  pickupStartAt: string;
  pickupDeadlineAt: string;
  status: DonationStatus;
  isReserved: boolean;
  isVolunteerAssigned: boolean;
  createdAt: string;
}

/**
 * Database/Cache DTO for RescueAI Insights
 */
export interface RescueAIInsightRow {
  id?: string;
  donation_id: string;
  urgency_score: number | null;
  urgency_level: RescueUrgencyLevel;
  summary: string | null;
  reasons: string[];
  warnings: string[];
  input_hash: string;
  engine_version: string;
  provider_name: string | null;
  model_name: string | null;
  generated_at: string;
  expires_at: string | null;
}
