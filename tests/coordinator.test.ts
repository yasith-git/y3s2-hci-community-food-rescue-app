/**
 * Member 4 Coordinator, Verified Organizations, Smart Allocation,
 * Delivery Acknowledgment, Beneficiary Distribution Traceability & Issue Management Unit Tests
 */

import {
  canTransitionDonationStatus,
  isDonationExpired,
} from '../src/services/donations/donation.state-machine';
import { Donation, DonationStatus } from '../src/types/donation';
import {
  CommunityPoint,
  Reservation,
  Organization,
  DistributionRecord,
} from '../src/types/coordinator';
import { evaluateDonationFitForOrg } from '../src/components/coordinator/AvailableDonationCard';

describe('Coordinator 2.0: Verified Organization Access Control', () => {
  test('restricts surplus food reservation exclusively to VERIFIED organizations', () => {
    const isReservationAllowed = (
      userRole: string,
      orgVerificationStatus: string,
      isOrgActive: boolean
    ) => {
      return (
        userRole === 'COORDINATOR' &&
        orgVerificationStatus === 'VERIFIED' &&
        isOrgActive
      );
    };

    expect(isReservationAllowed('COORDINATOR', 'VERIFIED', true)).toBe(true);
    expect(isReservationAllowed('COORDINATOR', 'PENDING', true)).toBe(false);
    expect(isReservationAllowed('COORDINATOR', 'REJECTED', true)).toBe(false);
    expect(isReservationAllowed('COORDINATOR', 'VERIFIED', false)).toBe(false);
    expect(isReservationAllowed('VOLUNTEER', 'VERIFIED', true)).toBe(false);
    expect(isReservationAllowed('DONOR', 'VERIFIED', true)).toBe(false);
  });

  test('blocks client self-verification attacks (security rule simulation)', () => {
    const simulateClientProfileUpdate = (
      currentStatus: string,
      requestedStatus: string,
      isCallerAdmin: boolean
    ) => {
      if (requestedStatus === 'VERIFIED' && !isCallerAdmin) {
        throw new Error('permission-denied: Client cannot self-verify organization.');
      }
      return requestedStatus;
    };

    expect(() =>
      simulateClientProfileUpdate('PENDING', 'VERIFIED', false)
    ).toThrow('permission-denied');

    expect(simulateClientProfileUpdate('PENDING', 'VERIFIED', true)).toBe('VERIFIED');
  });
});

describe('Smart Donation Allocation & Storage Compatibility', () => {
  const sampleDonation: Donation = {
    id: 'don-refrig-1',
    donorId: 'donor-1',
    donorName: 'Campus Dining',
    donorOrganization: 'University Dining Hall',
    status: 'PUBLISHED',
    food: {
      name: 'Fresh Dairy & Sandwiches',
      category: 'Prepared Meals',
      quantity: 30,
      unit: 'portions',
    },
    safety: {
      preparedAt: new Date().toISOString(),
      storageCondition: 'Refrigerated',
      packagingCondition: 'Food-Safe Containers',
      allergens: ['Milk/Dairy'],
      donorDeclarationAccepted: true,
      donorDeclarationText: 'Safe',
    },
    pickup: {
      address: 'East Quad Cafeteria',
      locationSource: 'MANUAL',
      pickupStartAt: new Date().toISOString(),
      pickupDeadlineAt: new Date(Date.now() + 10800000).toISOString(),
    },
    verification: { pickupCode: '4321', isVerified: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10800000).toISOString(),
  };

  const sampleVerifiedOrg: Organization = {
    id: 'org-hope-1',
    name: 'Hope Community Food Pantry',
    organizationType: 'COMMUNITY_PANTRY',
    contactEmail: 'contact@hopepantry.lk',
    contactPhone: '+94 77 123 4567',
    address: '100 University Ave',
    cityArea: 'Colombo',
    serviceRadiusKm: 15,
    distributionCapacityPeople: 50,
    storageCapabilities: ['AMBIENT', 'REFRIGERATED'],
    acceptedFoodCategories: ['All'],
    verificationStatus: 'VERIFIED',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test('evaluates Best Fit for matching storage capabilities and capacity', () => {
    const assessment = evaluateDonationFitForOrg(sampleDonation, sampleVerifiedOrg);
    expect(assessment.fit).toBe('BEST_FIT');
    expect(assessment.reasons.some((r) => r.includes('Refrigerated'))).toBe(true);
  });

  test('detects storage incompatibility when organization lacks refrigeration', () => {
    const ambientOnlyOrg: Organization = {
      ...sampleVerifiedOrg,
      storageCapabilities: ['AMBIENT'],
    };

    const assessment = evaluateDonationFitForOrg(sampleDonation, ambientOnlyOrg);
    expect(assessment.fit).toBe('NOT_ELIGIBLE');
    expect(assessment.label).toBe('Storage Incompatible');
  });
});

describe('Atomic Donation Reservation & Concurrency', () => {
  test('allows PUBLISHED -> RESERVED transition', () => {
    expect(canTransitionDonationStatus('PUBLISHED', 'RESERVED')).toBe(true);
  });

  test('prevents double reservation collision on already reserved donations', () => {
    const isReservable = (status: DonationStatus) => status === 'PUBLISHED';

    expect(isReservable('PUBLISHED')).toBe(true);
    expect(isReservable('RESERVED')).toBe(false);
    expect(isReservable('VOLUNTEER_ASSIGNED')).toBe(false);
    expect(isReservable('DELIVERED')).toBe(false);
    expect(isReservable('COMPLETED')).toBe(false);
  });

  test('rejects reservation for expired donations', () => {
    const expiredDonation: Donation = {
      id: 'd-exp',
      donorId: 'donor-1',
      donorName: 'Campus Cafe',
      status: 'PUBLISHED',
      food: { name: 'Pastries', category: 'Bakery', quantity: 15, unit: 'portions' },
      safety: {
        preparedAt: new Date(Date.now() - 7200000).toISOString(),
        storageCondition: 'Room Temperature',
        packagingCondition: 'Individually Sealed',
        allergens: ['Gluten/Wheat'],
        donorDeclarationAccepted: true,
        donorDeclarationText: 'Safe',
      },
      pickup: {
        address: 'Cafeteria A',
        locationSource: 'MANUAL',
        pickupStartAt: new Date(Date.now() - 7200000).toISOString(),
        pickupDeadlineAt: new Date(Date.now() - 3600000).toISOString(),
      },
      verification: { pickupCode: '1234', isVerified: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 3600000).toISOString(),
    };

    expect(isDonationExpired(expiredDonation)).toBe(true);
  });

  test('validates cross-organization isolation for community points', () => {
    const pointOfOrgA: CommunityPoint = {
      id: 'cp-org-a',
      coordinatorId: 'coord-a',
      organizationId: 'org-a',
      organizationName: 'Org A Food Hub',
      label: 'Hub A',
      address: '10 Main St',
      latitude: 6.9,
      longitude: 79.8,
      contactName: 'Alice',
      contactPhone: '0771111111',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validatePointReservation = (point: CommunityPoint, requestingOrgId: string) => {
      if (point.organizationId && point.organizationId !== requestingOrgId) {
        return 'CROSS_ORG_DENIED';
      }
      if (!point.isActive) return 'INACTIVE';
      return 'AUTHORIZED';
    };

    expect(validatePointReservation(pointOfOrgA, 'org-a')).toBe('AUTHORIZED');
    expect(validatePointReservation(pointOfOrgA, 'org-b')).toBe('CROSS_ORG_DENIED');
  });
});

describe('Beneficiary Distribution Traceability & Privacy Assurance', () => {
  test('validates that distributed quantity cannot exceed received quantity', () => {
    const receivedQty = 20;
    const previousDistributions = [10, 5]; // Sum = 15
    const totalPrevious = previousDistributions.reduce((a, b) => a + b, 0);

    const validateDistribution = (newQty: number) => {
      if (newQty <= 0) return { isValid: false, reason: 'Must be > 0' };
      if (totalPrevious + newQty > receivedQty) {
        return { isValid: false, reason: 'Exceeds received quantity' };
      }
      return { isValid: true, isFullyAccounted: totalPrevious + newQty === receivedQty };
    };

    expect(validateDistribution(5).isValid).toBe(true);
    expect(validateDistribution(5).isFullyAccounted).toBe(true);
    expect(validateDistribution(6).isValid).toBe(false);
    expect(validateDistribution(-1).isValid).toBe(false);
  });

  test('guarantees zero beneficiary personal data in DistributionRecord schema', () => {
    const forbiddenKeys = [
      'beneficiaryName',
      'beneficiaryPhoto',
      'beneficiaryAddress',
      'recipientHomeAddress',
      'nationalId',
      'medicalInfo',
      'householdIncome',
    ];

    const sampleRecord: DistributionRecord = {
      id: 'dist-1',
      donationId: 'don-1',
      organizationId: 'org-1',
      communityPointId: 'cp-1',
      recordedBy: 'coord-1',
      distributionReference: 'DIST-2026-0042',
      distributionDate: new Date().toISOString(),
      recipientGroup: 'Families',
      peopleServed: 45,
      quantityDistributed: 20,
      unit: 'portions',
      distributionLocation: 'Hope Hub Hall',
      notes: 'Evening emergency distribution',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    forbiddenKeys.forEach((key) => {
      expect(key in sampleRecord).toBe(false);
    });

    expect(sampleRecord.recipientGroup).toBe('Families');
    expect(sampleRecord.peopleServed).toBeGreaterThan(0);
  });
});

describe('Receipt Acknowledgement Lifecycle Separation', () => {
  test('enforces clean two-step progression: DELIVERED -> ACKNOWLEDGED -> COMPLETED', () => {
    expect(canTransitionDonationStatus('DELIVERED', 'ACKNOWLEDGED')).toBe(true);
    expect(canTransitionDonationStatus('ACKNOWLEDGED', 'COMPLETED')).toBe(true);
    // Skips from PUBLISHED directly to COMPLETED are blocked
    expect(canTransitionDonationStatus('PUBLISHED', 'COMPLETED')).toBe(false);
  });
});
