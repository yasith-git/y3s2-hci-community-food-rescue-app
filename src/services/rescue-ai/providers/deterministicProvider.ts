/**
 * Deterministic RescueAI Fallback Provider
 * Ensures complete, uninterrupted offline/unconfigured operation.
 * Zero external network calls. 100% reliable.
 */

import { RescueAIProvider } from './aiProvider.interface';
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

export class DeterministicRescueAIProvider implements RescueAIProvider {
  public readonly name = 'Deterministic-RescueAI-Engine';

  async analyzeDonationImage(
    imageUri: string,
    existingContext?: { title?: string; description?: string }
  ): Promise<DonationPhotoAnalysisResult> {
    // When external AI provider is unconfigured, return clear notice rather than fake AI inferences
    return {
      suggestedName: existingContext?.title || undefined,
      suggestedCategory: undefined,
      suggestedUnit: undefined,
      suggestedDescription: existingContext?.description || undefined,
      confidenceNotice:
        'External AI image analysis is not configured on this server. Please enter donation details manually.',
    };
  }

  async explainUrgency(
    context: DonationUrgencyContext,
    deterministicInsight: RescueUrgencyInsight
  ): Promise<RescueUrgencyInsight> {
    return deterministicInsight;
  }

  async explainOrganizationMatch(
    candidate: OrganizationCandidate,
    criteria: { category: FoodCategory; storageCondition: StorageCondition; quantityPortions: number },
    deterministicMatch: OrganizationMatchResult
  ): Promise<OrganizationMatchResult> {
    return deterministicMatch;
  }

  async explainVolunteerRouteMatch(
    candidate: VolunteerRouteCandidate,
    criteria: { pickupLat: number; pickupLng: number; pickupDeadlineAt: string },
    deterministicMatch: VolunteerRouteMatchResult
  ): Promise<VolunteerRouteMatchResult> {
    return deterministicMatch;
  }

  async summarizeRisk(assessment: RescueRiskAssessment): Promise<RescueRiskAssessment> {
    return assessment;
  }
}
