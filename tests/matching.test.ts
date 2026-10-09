/**
 * Unit Tests for Smart Route Matching Engine & Geospatial Utilities
 */

import {
  calculateDistanceKm,
  distancePointToRouteSegment,
  estimateDetourMinutesFromDistance,
} from '../src/services/location/geospatial.utils';
import {
  isDonationDiscoverable,
  calculateTimeOverlapMinutes,
  matchDonationsAgainstRoute,
  findNearbyDonations,
} from '../src/services/matching/matching.engine';
import { calculateMatchScore } from '../src/services/matching/matching.score';
import { Donation } from '../src/types/donation';
import { VolunteerRoute } from '../src/types/route';

describe('Geospatial Calculation Utilities', () => {
  test('calculateDistanceKm returns accurate Haversine distance between Colombo points', () => {
    // Fort Station (6.9344, 79.8504) to Borella Junction (6.9147, 79.8778) is approx ~3.7 km
    const dist = calculateDistanceKm(6.9344, 79.8504, 6.9147, 79.8778);
    expect(dist).toBeGreaterThan(3.0);
    expect(dist).toBeLessThan(4.5);
  });

  test('distancePointToRouteSegment computes accurate corridor projection and detour', () => {
    const origin = { latitude: 6.9344, longitude: 79.8504 }; // Fort
    const destination = { latitude: 6.9147, longitude: 79.8778 }; // Borella
    const pointNearCorridor = { latitude: 6.9272, longitude: 79.8614 }; // Maradana (on route)

    const result = distancePointToRouteSegment(pointNearCorridor, origin, destination);
    expect(result.perpendicularDistanceKm).toBeLessThan(1.5);
    expect(result.totalDetourDistanceKm).toBeLessThan(2.0);
  });

  test('estimateDetourMinutesFromDistance calculates reasonable urban driving times', () => {
    const min1 = estimateDetourMinutesFromDistance(2, 'DRIVING'); // 2 km = ~4 min drive + 4 min buffer = 8 min
    expect(min1).toBeGreaterThanOrEqual(7);
    expect(min1).toBeLessThanOrEqual(10);
  });
});

describe('Operational Eligibility & Time Window Filters', () => {
  const baseDonation: Donation = {
    id: 'd-1',
    donorId: 'u-1',
    donorName: 'Test Donor',
    food: {
      name: 'Curry Packs',
      category: 'Prepared Meals',
      quantity: 10,
      unit: 'packs',
    },
    safety: {
      preparedAt: new Date().toISOString(),
      storageCondition: 'Room Temperature',
      packagingCondition: 'Food-Safe Containers',
      allergens: [],
      donorDeclarationAccepted: true,
      donorDeclarationText: 'Safe',
    },
    pickup: {
      address: 'Colombo 10',
      latitude: 6.9272,
      longitude: 79.8614,
      locationSource: 'GPS',
      pickupStartAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // in 30 min
      pickupDeadlineAt: new Date(Date.now() + 1000 * 60 * 180).toISOString(), // in 3h
    },
    verification: {
      pickupCode: '1234',
      isVerified: false,
    },
    status: 'PUBLISHED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
  };

  test('isDonationDiscoverable accepts valid published donations with future deadline', () => {
    expect(isDonationDiscoverable(baseDonation)).toBe(true);
  });

  test('isDonationDiscoverable rejects CANCELLED or EXPIRED donations', () => {
    const cancelled = { ...baseDonation, status: 'CANCELLED' as const };
    const expired = { ...baseDonation, status: 'EXPIRED' as const };
    expect(isDonationDiscoverable(cancelled)).toBe(false);
    expect(isDonationDiscoverable(expired)).toBe(false);
  });

  test('isDonationDiscoverable rejects donations with past deadline', () => {
    const pastDonation = {
      ...baseDonation,
      pickup: {
        ...baseDonation.pickup,
        pickupDeadlineAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h ago
      },
    };
    expect(isDonationDiscoverable(pastDonation)).toBe(false);
  });

  test('calculateTimeOverlapMinutes accurately detects overlapping windows', () => {
    const now = Date.now();
    const vStart = new Date(now).toISOString();
    const vEnd = new Date(now + 1000 * 60 * 120).toISOString(); // 2h window

    const pStart = new Date(now + 1000 * 60 * 30).toISOString();
    const pEnd = new Date(now + 1000 * 60 * 90).toISOString();

    const { hasOverlap, overlapMinutes } = calculateTimeOverlapMinutes(vStart, vEnd, pStart, pEnd);
    expect(hasOverlap).toBe(true);
    expect(overlapMinutes).toBe(60);
  });

  test('calculateTimeOverlapMinutes rejects non-overlapping windows', () => {
    const now = Date.now();
    const vStart = new Date(now).toISOString();
    const vEnd = new Date(now + 1000 * 60 * 60).toISOString(); // 0-1h

    const pStart = new Date(now + 1000 * 60 * 90).toISOString(); // 1.5h
    const pEnd = new Date(now + 1000 * 60 * 150).toISOString(); // 2.5h

    const { hasOverlap, overlapMinutes } = calculateTimeOverlapMinutes(vStart, vEnd, pStart, pEnd);
    expect(hasOverlap).toBe(false);
    expect(overlapMinutes).toBe(0);
  });
});

describe('Smart Route Matching Pipeline & Scoring', () => {
  const route: VolunteerRoute = {
    id: 'r-1',
    volunteerId: 'vol-1',
    origin: {
      address: 'Colombo Fort',
      latitude: 6.9344,
      longitude: 79.8504,
    },
    destination: {
      address: 'Borella Junction',
      latitude: 6.9147,
      longitude: 79.8778,
    },
    availableFromAt: new Date().toISOString(),
    availableUntilAt: new Date(Date.now() + 1000 * 60 * 240).toISOString(), // 4h
    maxDetourMinutes: 15,
    transportMode: 'DRIVING',
    routeType: 'SAVED',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test('matches candidate donation directly along route corridor', () => {
    const donationAlongRoute: Donation = {
      id: 'd-match',
      donorId: 'u-1',
      donorName: 'Baker',
      food: { name: 'Bread', category: 'Bakery', quantity: 10, unit: 'portions' },
      safety: {
        preparedAt: new Date().toISOString(),
        storageCondition: 'Room Temperature',
        packagingCondition: 'Individually Sealed',
        allergens: [],
        donorDeclarationAccepted: true,
        donorDeclarationText: 'Safe',
      },
      pickup: {
        address: 'Maradana Road',
        latitude: 6.9272,
        longitude: 79.8614,
        locationSource: 'GPS',
        pickupStartAt: new Date().toISOString(),
        pickupDeadlineAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
      },
      verification: { pickupCode: '1111', isVerified: false },
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
    };

    const matches = matchDonationsAgainstRoute(route, [donationAlongRoute]);
    expect(matches.length).toBe(1);
    expect(matches[0].matchScore).toBeGreaterThanOrEqual(50);
    expect(matches[0].estimatedDetourMinutes).toBeLessThanOrEqual(route.maxDetourMinutes);
  });

  test('hard filters reject donation when detour exceeds volunteer maxDetourMinutes', () => {
    const donationFarOff: Donation = {
      id: 'd-far',
      donorId: 'u-2',
      donorName: 'Distant Resto',
      food: { name: 'Meals', category: 'Prepared Meals', quantity: 5, unit: 'boxes' },
      safety: {
        preparedAt: new Date().toISOString(),
        storageCondition: 'Room Temperature',
        packagingCondition: 'Food-Safe Containers',
        allergens: [],
        donorDeclarationAccepted: true,
        donorDeclarationText: 'Safe',
      },
      pickup: {
        address: 'Negombo Road',
        latitude: 7.0500, // Very far north
        longitude: 79.8900,
        locationSource: 'GPS',
        pickupStartAt: new Date().toISOString(),
        pickupDeadlineAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
      },
      verification: { pickupCode: '2222', isVerified: false },
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
    };

    const matches = matchDonationsAgainstRoute(route, [donationFarOff]);
    expect(matches.length).toBe(0);
  });

  test('calculateMatchScore ranks high-overlap short-detour rescues as EXCELLENT', () => {
    const score = calculateMatchScore(
      5, // 5 min detour
      15, // 15 min max
      90, // 90 min overlap
      1.5, // 1.5h until expiry (urgent)
      0.8 // 0.8 km off corridor
    );

    expect(score.totalScore).toBeGreaterThanOrEqual(75);
    expect(score.fitCategory).toBe('EXCELLENT');
  });
});
