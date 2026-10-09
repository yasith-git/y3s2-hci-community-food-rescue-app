/**
 * RescueAI Provider Abstraction Interface
 * Decouples mobile application from specific AI backend implementations.
 */

import {
  DonationPhotoAnalysisResult,
  RescueUrgencyInsight,
  OrganizationMatchResult,
  VolunteerRouteMatchResult,
  RescueRiskAssessment,
  DonationUrgencyContext,
  OrganizationCandidate,
  VolunteerRouteCandidate,
} from '../../../types/rescue-ai';
import { FoodCategory, StorageCondition } from '../../../types/donation';

export interface RescueAIProvider {
  name: string;

  /**
   * Suggests food title, category, unit, and description from a donor's photo
   */
  analyzeDonationImage(
    imageUri: string,
    existingContext?: { title?: string; description?: string }
  ): Promise<DonationPhotoAnalysisResult>;

  /**
   * Generates or enhances natural language explanations for urgency
   */
  explainUrgency(
    context: DonationUrgencyContext,
    deterministicInsight: RescueUrgencyInsight
  ): Promise<RescueUrgencyInsight>;

  /**
   * Generates or enhances natural language explanations for organization matching
   */
  explainOrganizationMatch(
    candidate: OrganizationCandidate,
    criteria: { category: FoodCategory; storageCondition: StorageCondition; quantityPortions: number },
    deterministicMatch: OrganizationMatchResult
  ): Promise<OrganizationMatchResult>;

  /**
   * Generates or enhances natural language explanations for volunteer route matching
   */
  explainVolunteerRouteMatch(
    candidate: VolunteerRouteCandidate,
    criteria: { pickupLat: number; pickupLng: number; pickupDeadlineAt: string },
    deterministicMatch: VolunteerRouteMatchResult
  ): Promise<VolunteerRouteMatchResult>;

  /**
   * Summarizes risk conditions for coordinator and donor visibility
   */
  summarizeRisk(
    assessment: RescueRiskAssessment
  ): Promise<RescueRiskAssessment>;
}
