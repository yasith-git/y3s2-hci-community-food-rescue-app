/**
 * RescueAI 1.0 Comprehensive Unit & Engine Test Suite
 * Tests deterministic urgency, organization matching, volunteer route matching, and risk detection.
 */

import { calculateDonationUrgency } from '../src/services/rescue-ai/engines/urgency.engine';
import { evaluateOrganizationMatch } from '../src/services/rescue-ai/engines/organizationMatch.engine';
import { evaluateVolunteerRouteMatch } from '../src/services/rescue-ai/engines/volunteerMatch.engine';
import { detectRescueRisk } from '../src/services/rescue-ai/engines/risk.engine';
import { DeterministicRescueAIProvider } from '../src/services/rescue-ai/providers/deterministicProvider';
import { OrganizationCandidate, VolunteerRouteCandidate } from '../src/types/rescue-ai';

describe('RescueAI 1.0 Engine Test Suite', () => {
  const provider = new DeterministicRescueAIProvider();

  describe('Urgency Engine', () => {
    test('Calculates HIGH / CRITICAL urgency for prepared food with short pickup deadline', () => {
      const now = new Date();
      const in45m = new Date(now.getTime() + 45 * 60 * 1000).toISOString();

      const urgency = calculateDonationUrgency({
        id: 'don-1',
        category: 'Prepared Meals',
        storageCondition: 'Warm / Heated',
        pickupStartAt: now.toISOString(),
        pickupDeadlineAt: in45m,
        status: 'PUBLISHED',
        isReserved: false,
        isVolunteerAssigned: false,
        createdAt: now.toISOString(),
      });

      expect(urgency.urgencyLevel).toMatch(/HIGH|CRITICAL/);
      expect(urgency.urgencyScore).toBeGreaterThanOrEqual(75);
      expect(urgency.reasons.length).toBeGreaterThan(0);
      expect(urgency.engineVersion).toBe('rescue-ai-v1');
    });

    test('Calculates LOW urgency for shelf-stable goods with generous pickup deadline', () => {
      const now = new Date();
      const in12h = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();

      const urgency = calculateDonationUrgency({
        id: 'don-2',
        category: 'Packaged Food',
        storageCondition: 'Room Temperature',
        pickupStartAt: now.toISOString(),
        pickupDeadlineAt: in12h,
        status: 'PUBLISHED',
        isReserved: true,
        isVolunteerAssigned: true,
        createdAt: now.toISOString(),
      });

      expect(urgency.urgencyLevel).toBe('LOW');
      expect(urgency.urgencyScore).toBeLessThan(45);
    });

    test('Returns 0 score for completed / cancelled / expired donations', () => {
      const now = new Date().toISOString();
      const urgency = calculateDonationUrgency({
        id: 'don-3',
        category: 'Bakery',
        storageCondition: 'Room Temperature',
        pickupStartAt: now,
        pickupDeadlineAt: now,
        status: 'COMPLETED',
        isReserved: true,
        isVolunteerAssigned: true,
        createdAt: now,
      });

      expect(urgency.urgencyScore).toBe(0);
      expect(urgency.urgencyLevel).toBe('LOW');
    });
  });

  describe('Organization Match Engine', () => {
    const verifiedOrg: OrganizationCandidate = {
      id: 'org-1',
      name: 'Central Food Relief',
      isVerified: true,
      isActive: true,
      serviceAreaKm: 10,
      latitude: 6.9271,
      longitude: 79.8612,
      acceptedCategories: ['Prepared Meals', 'Bakery', 'Rice & Curry'],
      supportedStorage: ['Refrigerated', 'Warm / Heated'],
      maxCapacityPortions: 100,
      currentWorkloadPortions: 20,
      hasAvailableCommunityPoint: true,
      distanceKm: 2.4,
    };

    test('Identifies BEST FIT for verified, category-matching, storage-compatible organization', () => {
      const match = evaluateOrganizationMatch(verifiedOrg, {
        category: 'Prepared Meals',
        storageCondition: 'Refrigerated',
        quantityPortions: 25,
        pickupDeadlineAt: new Date(Date.now() + 120 * 60000).toISOString(),
        status: 'PUBLISHED',
      });

      expect(match.isEligible).toBe(true);
      expect(match.label).toBe('BEST FIT');
      expect(match.reasons.length).toBeGreaterThan(1);
    });

    test('Hard rule: Excludes UNVERIFIED organization immediately', () => {
      const unverifiedOrg = { ...verifiedOrg, isVerified: false };
      const match = evaluateOrganizationMatch(unverifiedOrg, {
        category: 'Prepared Meals',
        storageCondition: 'Refrigerated',
        quantityPortions: 25,
        pickupDeadlineAt: new Date(Date.now() + 120 * 60000).toISOString(),
        status: 'PUBLISHED',
      });

      expect(match.isEligible).toBe(false);
      expect(match.label).toBe('NOT ELIGIBLE');
      expect(match.warnings[0]).toContain('not VERIFIED');
    });

    test('Hard rule: Excludes organization lacking required storage capabilities', () => {
      const match = evaluateOrganizationMatch(verifiedOrg, {
        category: 'Prepared Meals',
        storageCondition: 'Frozen', // Org only supports Refrigerated & Warm
        quantityPortions: 10,
        pickupDeadlineAt: new Date(Date.now() + 120 * 60000).toISOString(),
        status: 'PUBLISHED',
      });

      expect(match.isEligible).toBe(false);
      expect(match.label).toBe('NOT ELIGIBLE');
      expect(match.warnings[0]).toContain('Lacks required storage');
    });

    test('Hard rule: Excludes organization with insufficient portion capacity when units are compatible (portions)', () => {
      const match = evaluateOrganizationMatch(verifiedOrg, {
        category: 'Prepared Meals',
        storageCondition: 'Refrigerated',
        quantity: 120,
        quantityUnit: 'portions',
        quantityPortions: 120, // remaining capacity is 80 (100 - 20)
        pickupDeadlineAt: new Date(Date.now() + 120 * 60000).toISOString(),
        status: 'PUBLISHED',
      });

      expect(match.isEligible).toBe(false);
      expect(match.label).toBe('NOT ELIGIBLE');
      expect(match.warnings[0]).toContain('capacity exceeded');
    });

    test('Incompatible capacity unit (e.g. boxes/kg) is flagged for manual review without false numerical rejection', () => {
      const match = evaluateOrganizationMatch(verifiedOrg, {
        category: 'Prepared Meals',
        storageCondition: 'Refrigerated',
        quantity: 15,
        quantityUnit: 'boxes', // non-portions unit: do not invent 1 box = 1 person
        pickupDeadlineAt: new Date(Date.now() + 120 * 60000).toISOString(),
        status: 'PUBLISHED',
      });

      expect(match.isEligible).toBe(true);
      expect(match.attention?.[0]).toContain('Capacity compatibility requires manual coordinator review');
    });

    test('Hard rule: Excludes organization lacking an active community collection point', () => {
      const noPointOrg = { ...verifiedOrg, hasAvailableCommunityPoint: false };
      const match = evaluateOrganizationMatch(noPointOrg, {
        category: 'Prepared Meals',
        storageCondition: 'Refrigerated',
        quantity: 10,
        pickupDeadlineAt: new Date(Date.now() + 120 * 60000).toISOString(),
        status: 'PUBLISHED',
      });

      expect(match.isEligible).toBe(false);
      expect(match.label).toBe('NOT ELIGIBLE');
      expect(match.warnings[0]).toContain('No available receiving community point');
    });

    test('Hard rule: Excludes organization when pickup distance exceeds service area', () => {
      const farOrg = { ...verifiedOrg, distanceKm: 15.0, serviceAreaKm: 10.0 };
      const match = evaluateOrganizationMatch(farOrg, {
        category: 'Prepared Meals',
        storageCondition: 'Refrigerated',
        quantity: 10,
        pickupDeadlineAt: new Date(Date.now() + 120 * 60000).toISOString(),
        status: 'PUBLISHED',
      });

      expect(match.isEligible).toBe(false);
      expect(match.label).toBe('NOT ELIGIBLE');
      expect(match.warnings[0]).toContain('exceeds service radius');
    });
  });

  describe('Volunteer Route Match Engine', () => {
    const activeRoute: VolunteerRouteCandidate = {
      id: 'route-1',
      volunteerId: 'vol-123',
      volunteerName: 'Samira Perera',
      isAvailable: true,
      routeOriginLat: 6.9000,
      routeOriginLng: 79.8500,
      routeDestinationLat: 6.9500,
      routeDestinationLng: 79.8700,
      pickupTimeWindowStart: new Date(Date.now() - 30 * 60000).toISOString(),
      pickupTimeWindowEnd: new Date(Date.now() + 120 * 60000).toISOString(),
      maxDetourKm: 3.5,
      calculatedPickupDistanceKm: 0.8,
      calculatedAdditionalDetourKm: 1.2,
      calculatedEtaMinutes: 12,
    };

    test('PUBLISHED donation cannot become actionable Volunteer rescue before coordinator reservation (DESTINATION PENDING)', () => {
      const match = evaluateVolunteerRouteMatch(activeRoute, {
        donationId: 'don-pub-1',
        status: 'PUBLISHED',
        pickupLat: 6.9100,
        pickupLng: 79.8550,
        pickupStartAt: new Date().toISOString(),
        pickupDeadlineAt: new Date(Date.now() + 90 * 60000).toISOString(),
        isReserved: false,
      });

      expect(match.isEligible).toBe(false);
      expect(match.label).toBe('DESTINATION PENDING');
      expect(match.summary).toContain('awaiting coordinator reservation');
    });

    test('Missing drop-off destination coordinates blocks actionable route recommendation', () => {
      const match = evaluateVolunteerRouteMatch(activeRoute, {
        donationId: 'don-res-no-dest',
        status: 'RESERVED',
        pickupLat: 6.9100,
        pickupLng: 79.8550,
        // dropoffLat & dropoffLng missing
        pickupStartAt: new Date().toISOString(),
        pickupDeadlineAt: new Date(Date.now() + 90 * 60000).toISOString(),
        isReserved: true,
      });

      expect(match.isEligible).toBe(false);
      expect(match.label).toBe('DESTINATION PENDING');
      expect(match.warnings[0]).toContain('community drop-off coordinates are missing');
    });

    test('RESERVED donation with valid community point destination can be actionable route-matched (EXCELLENT MATCH)', () => {
      const match = evaluateVolunteerRouteMatch(activeRoute, {
        donationId: 'don-res-ready',
        status: 'RESERVED',
        pickupLat: 6.9100,
        pickupLng: 79.8550,
        dropoffLat: 6.9400,
        dropoffLng: 79.8650,
        pickupStartAt: new Date().toISOString(),
        pickupDeadlineAt: new Date(Date.now() + 90 * 60000).toISOString(),
        isReserved: true,
      });

      expect(match.isEligible).toBe(true);
      expect(match.label).toBe('EXCELLENT MATCH');
      expect(match.score).toBeGreaterThanOrEqual(80);
      expect(match.detourKm).toBe(1.2);
    });

    test('Hard rule: Excludes route when schedule window does not overlap', () => {
      const futureRoute = {
        ...activeRoute,
        pickupTimeWindowStart: new Date(Date.now() + 180 * 60000).toISOString(),
        pickupTimeWindowEnd: new Date(Date.now() + 240 * 60000).toISOString(),
      };
      const match = evaluateVolunteerRouteMatch(futureRoute, {
        donationId: 'don-1',
        status: 'RESERVED',
        pickupLat: 6.9100,
        pickupLng: 79.8550,
        dropoffLat: 6.9400,
        dropoffLng: 79.8650,
        pickupStartAt: new Date().toISOString(),
        pickupDeadlineAt: new Date(Date.now() + 90 * 60000).toISOString(),
        isReserved: true,
      });

      expect(match.isEligible).toBe(false);
      expect(match.label).toBe('NOT SUITABLE');
      expect(match.warnings[0]).toContain('Schedule mismatch');
    });

    test('Hard rule: Excludes route when additional detour exceeds maxDetour limit', () => {
      const longDetourRoute = { ...activeRoute, calculatedAdditionalDetourKm: 5.0 }; // limit is 3.5
      const match = evaluateVolunteerRouteMatch(longDetourRoute, {
        donationId: 'don-1',
        status: 'RESERVED',
        pickupLat: 6.9100,
        pickupLng: 79.8550,
        dropoffLat: 6.9400,
        dropoffLng: 79.8650,
        pickupStartAt: new Date().toISOString(),
        pickupDeadlineAt: new Date(Date.now() + 90 * 60000).toISOString(),
        isReserved: true,
      });

      expect(match.isEligible).toBe(false);
      expect(match.label).toBe('NOT SUITABLE');
      expect(match.warnings[0]).toContain('exceeds maximum threshold');
    });
  });

  describe('Rescue Risk Detection Engine', () => {
    test('Flags AT RISK or URGENT when deadline is close without volunteer assignment', () => {
      const now = new Date();
      const in30m = new Date(now.getTime() + 30 * 60000).toISOString();

      const assessment = detectRescueRisk({
        id: 'don-urgent',
        status: 'PUBLISHED',
        pickupDeadlineAt: in30m,
        isReserved: false,
        isVolunteerAssigned: false,
        isPickedUp: false,
      });

      expect(assessment.riskLevel).toMatch(/AT RISK|URGENT/);
      expect(assessment.recommendedAction).toBeDefined();
    });

    test('Returns NORMAL for comfortably scheduled active delivery', () => {
      const now = new Date();
      const in4h = new Date(now.getTime() + 4 * 3600000).toISOString();

      const assessment = detectRescueRisk({
        id: 'don-healthy',
        status: 'VOLUNTEER_ASSIGNED',
        pickupDeadlineAt: in4h,
        isReserved: true,
        isVolunteerAssigned: true,
        isPickedUp: false,
        assignedAt: now.toISOString(),
      });

      expect(assessment.riskLevel).toBe('NORMAL');
    });

    test('Terminal Expired Handling: Returns non-actionable result when deadline has passed', () => {
      const pastDeadline = new Date(Date.now() - 10 * 60000).toISOString();

      const assessment = detectRescueRisk({
        id: 'don-expired',
        status: 'PUBLISHED',
        pickupDeadlineAt: pastDeadline,
        isReserved: false,
        isVolunteerAssigned: false,
        isPickedUp: false,
      });

      expect(assessment.riskLevel).toBe('NORMAL');
      expect(assessment.riskScore).toBe(0);
      expect(assessment.summary).toContain('Listing is expired');
    });
  });

  describe('Deterministic Fallback Provider & Food Safety Guardrails', () => {
    test('Returns unconfigured confidence notice rather than fake AI inferences', async () => {
      const result = await provider.analyzeDonationImage('file://photo.jpg', {
        title: 'Vegetarian rice packages',
      });

      expect(result.suggestedName).toBe('Vegetarian rice packages');
      expect(result.suggestedCategory).toBeUndefined();
      expect(result.confidenceNotice).toContain('External AI image analysis is not configured');
    });

    test('Food Safety Guardrail: RescueAI never outputs authoritative safety or allergen certification claims', async () => {
      const result = await provider.analyzeDonationImage('file://photo.jpg');
      const text = `${result.confidenceNotice || ''} ${result.suggestedDescription || ''}`.toLowerCase();

      expect(text).not.toContain('certified safe');
      expect(text).not.toContain('safe to eat');
      expect(text).not.toContain('allergen-free');
      expect(text).not.toContain('contains no allergens');
    });
  });
});
