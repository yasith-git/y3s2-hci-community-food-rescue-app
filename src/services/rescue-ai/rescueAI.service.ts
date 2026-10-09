/**
 * RescueAI Central Service
 * Orchestrates deterministic rules, external AI backend, caching, and rate limiting.
 * Community Food Rescue App
 */

import { RescueAIProvider } from './providers/aiProvider.interface';
import { DeterministicRescueAIProvider } from './providers/deterministicProvider';
import {
  RescueUrgencyInsight,
  OrganizationMatchResult,
  VolunteerRouteMatchResult,
  RescueRiskAssessment,
  DonationPhotoAnalysisResult,
  DonationUrgencyContext,
  OrganizationCandidate,
  VolunteerRouteCandidate,
  RESCUE_AI_ENGINE_VERSION,
} from '../../types/rescue-ai';
import { FoodCategory, StorageCondition, QuantityUnit } from '../../types/donation';
import { calculateDonationUrgency } from './engines/urgency.engine';
import { evaluateOrganizationMatch } from './engines/organizationMatch.engine';
import { evaluateVolunteerRouteMatch } from './engines/volunteerMatch.engine';
import { detectRescueRisk } from './engines/risk.engine';
import { supabase, isSupabaseConfigured } from '../supabase/client';

class RescueAIService {
  private activeProvider: RescueAIProvider;
  private memoryCache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTtlMs = 5 * 60 * 1000; // 5 minutes cache

  constructor() {
    this.activeProvider = new DeterministicRescueAIProvider();
  }

  /**
   * Set custom AI provider (e.g. Supabase Edge Function AI Bridge)
   */
  public setProvider(provider: RescueAIProvider) {
    this.activeProvider = provider;
  }

  /**
   * Compute input fingerprint hash for caching
   */
  private hashInput(key: string, data: any): string {
    return `${key}_${JSON.stringify(data)}`;
  }

  /**
   * Generates intelligent heuristic suggestions when external AI service is unreachable or unconfigured
   */
  private generateSmartPhotoSuggestions(
    imageUri: string,
    context?: { title?: string; description?: string }
  ): DonationPhotoAnalysisResult {
    const combinedText = `${context?.title || ''} ${context?.description || ''} ${imageUri || ''}`.toLowerCase();

    let suggestedName = context?.title?.trim() || 'Prepared Meal Portions';
    let suggestedCategory: FoodCategory = 'Prepared Meals';
    let suggestedUnit: QuantityUnit = 'portions';
    let suggestedDescription =
      context?.description?.trim() ||
      'Fresh food surplus prepared for immediate community collection.';

    if (
      combinedText.includes('bake') ||
      combinedText.includes('bread') ||
      combinedText.includes('bun') ||
      combinedText.includes('pastry') ||
      combinedText.includes('croissant') ||
      combinedText.includes('cake') ||
      combinedText.includes('bagel') ||
      combinedText.includes('donut') ||
      combinedText.includes('cookie')
    ) {
      suggestedCategory = 'Bakery';
      suggestedUnit = 'items';
      if (!context?.title) suggestedName = 'Fresh Bakery Items';
      if (!context?.description) suggestedDescription = 'Freshly baked surplus goods packed for community rescue.';
    } else if (
      combinedText.includes('curry') ||
      combinedText.includes('biryani') ||
      combinedText.includes('rice') ||
      combinedText.includes('kottu') ||
      combinedText.includes('roti')
    ) {
      suggestedCategory = 'Rice & Curry';
      suggestedUnit = 'portions';
      if (!context?.title) suggestedName = 'Prepared Rice & Curry';
      if (!context?.description) suggestedDescription = 'Warmly prepared rice and curry portions ready for immediate collection.';
    } else if (
      combinedText.includes('veg') ||
      combinedText.includes('salad') ||
      combinedText.includes('carrot') ||
      combinedText.includes('tomato') ||
      combinedText.includes('greens') ||
      combinedText.includes('onion') ||
      combinedText.includes('potato')
    ) {
      suggestedCategory = 'Vegetables';
      suggestedUnit = 'kg';
      if (!context?.title) suggestedName = 'Fresh Vegetables';
      if (!context?.description) suggestedDescription = 'Wholesome fresh vegetables suitable for community pantry distribution.';
    } else if (
      combinedText.includes('fruit') ||
      combinedText.includes('apple') ||
      combinedText.includes('banana') ||
      combinedText.includes('orange') ||
      combinedText.includes('mango') ||
      combinedText.includes('papaya')
    ) {
      suggestedCategory = 'Fruit';
      suggestedUnit = 'kg';
      if (!context?.title) suggestedName = 'Fresh Fruits';
      if (!context?.description) suggestedDescription = 'Nutritious fresh seasonal fruits ready for community sharing.';
    } else if (
      combinedText.includes('milk') ||
      combinedText.includes('cheese') ||
      combinedText.includes('yogurt') ||
      combinedText.includes('curd') ||
      combinedText.includes('butter')
    ) {
      suggestedCategory = 'Dairy';
      suggestedUnit = 'packs';
      if (!context?.title) suggestedName = 'Dairy Products';
      if (!context?.description) suggestedDescription = 'Chilled dairy items stored at recommended temperatures.';
    } else if (
      combinedText.includes('canned') ||
      combinedText.includes('box') ||
      combinedText.includes('tin') ||
      combinedText.includes('biscuit') ||
      combinedText.includes('dry') ||
      combinedText.includes('cereal') ||
      combinedText.includes('pack')
    ) {
      suggestedCategory = 'Packaged Food';
      suggestedUnit = 'packs';
      if (!context?.title) suggestedName = 'Packaged Food Staples';
      if (!context?.description) suggestedDescription = 'Intact packaged pantry items suitable for distribution.';
    } else if (
      combinedText.includes('drink') ||
      combinedText.includes('juice') ||
      combinedText.includes('water') ||
      combinedText.includes('tea') ||
      combinedText.includes('bottle')
    ) {
      suggestedCategory = 'Beverages';
      suggestedUnit = 'containers';
      if (!context?.title) suggestedName = 'Beverages';
      if (!context?.description) suggestedDescription = 'Sealed beverages ready for community distribution.';
    }

    return {
      suggestedName,
      suggestedCategory,
      suggestedUnit,
      suggestedDescription,
      confidenceNotice:
        'RescueAI suggestions generated. Please review and verify safety details before publishing.',
    };
  }

  /**
   * Analyze Food Image for Smart Donation
   */
  public async analyzeDonationPhoto(
    imageUri: string,
    context?: { title?: string; description?: string }
  ): Promise<DonationPhotoAnalysisResult> {
    if (!imageUri) {
      throw new Error('Please provide an image for analysis.');
    }

    // 1. Try edge function if configured
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.functions.invoke('rescue-ai', {
          body: { imageUri, context },
        });
        if (!error && data?.suggestions && data.suggestions.category) {
          return {
            suggestedName: data.suggestions.name,
            suggestedCategory: data.suggestions.category,
            suggestedUnit: data.suggestions.unit,
            suggestedDescription: data.suggestions.description,
            confidenceNotice: 'AI analysis generated. Please verify safety details before posting.',
          };
        }
      }
    } catch (err) {
      // Fallback seamlessly
    }

    // 2. Query active provider
    const providerResult = await this.activeProvider.analyzeDonationImage(imageUri, context);
    if (providerResult && providerResult.suggestedCategory && providerResult.suggestedUnit) {
      return providerResult;
    }

    // 3. Fallback to smart heuristic suggestions so the donor receives actionable details
    return this.generateSmartPhotoSuggestions(imageUri, context);
  }

  /**
   * Calculate Rescue Urgency with caching
   */
  public getDonationUrgency(context: DonationUrgencyContext): RescueUrgencyInsight {
    const cacheKey = this.hashInput('urgency', {
      id: context.id,
      status: context.status,
      deadline: context.pickupDeadlineAt,
      isReserved: context.isReserved,
      isAssigned: context.isVolunteerAssigned,
    });

    const cached = this.memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    const deterministic = calculateDonationUrgency(context);
    this.memoryCache.set(cacheKey, { data: deterministic, timestamp: Date.now() });
    return deterministic;
  }

  /**
   * Evaluate Organization Match
   */
  public evaluateOrganization(
    candidate: OrganizationCandidate,
    criteria: {
      category: FoodCategory;
      storageCondition: StorageCondition;
      quantity?: number;
      quantityUnit?: any;
      quantityPortions?: number;
      pickupDeadlineAt: string;
      status: any;
      latitude?: number;
      longitude?: number;
    }
  ): OrganizationMatchResult {
    const cacheKey = this.hashInput(`org_${candidate.id}`, criteria);
    const cached = this.memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    const result = evaluateOrganizationMatch(candidate, criteria);
    this.memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  /**
   * Evaluate Volunteer Route Match
   */
  public evaluateVolunteerRoute(
    candidate: VolunteerRouteCandidate,
    criteria: {
      donationId: string;
      status: any;
      pickupLat?: number;
      pickupLng?: number;
      dropoffLat?: number;
      dropoffLng?: number;
      pickupStartAt: string;
      pickupDeadlineAt: string;
      isReserved: boolean;
    }
  ): VolunteerRouteMatchResult {
    const cacheKey = this.hashInput(`route_${candidate.id}`, criteria);
    const cached = this.memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    const result = evaluateVolunteerRouteMatch(candidate, criteria);
    this.memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }

  /**
   * Assess Rescue Risk
   */
  public assessRisk(context: {
    id: string;
    status: any;
    pickupDeadlineAt: string;
    isReserved: boolean;
    isVolunteerAssigned: boolean;
    isPickedUp: boolean;
    reservedAt?: string;
    assignedAt?: string;
    pickedUpAt?: string;
  }): RescueRiskAssessment {
    return detectRescueRisk(context);
  }

  /**
   * Clear cache for a specific donation or all
   */
  public invalidateCache(donationId?: string) {
    if (donationId) {
      for (const key of this.memoryCache.keys()) {
        if (key.includes(donationId)) {
          this.memoryCache.delete(key);
        }
      }
    } else {
      this.memoryCache.clear();
    }
  }
}

export const rescueAIService = new RescueAIService();
