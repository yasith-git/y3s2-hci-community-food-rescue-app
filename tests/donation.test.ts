/**
 * Smart Donation Unit Tests
 * Tests validation, lifecycle state transitions, permissions, and relative time utilities
 */

import {
  canTransitionDonationStatus,
  canEditDonation,
  canWithdrawDonation,
  isDonationActive,
  isDonationExpired,
} from '../src/services/donations/donation.state-machine';
import {
  validateFoodStep,
  validateSafetyStep,
  validatePickupStep,
} from '../src/services/donations/donation.validation';
import { getRelativeTimeString } from '../src/utils/dateTime';
import { Donation } from '../src/types/donation';

describe('Donation State Machine', () => {
  test('allows legitimate lifecycle transitions', () => {
    expect(canTransitionDonationStatus('DRAFT', 'PUBLISHED')).toBe(true);
    expect(canTransitionDonationStatus('PUBLISHED', 'RESERVED')).toBe(true);
    expect(canTransitionDonationStatus('PUBLISHED', 'CANCELLED')).toBe(true);
    expect(canTransitionDonationStatus('RESERVED', 'VOLUNTEER_ASSIGNED')).toBe(true);
    expect(canTransitionDonationStatus('VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE')).toBe(true);
    expect(canTransitionDonationStatus('PICKUP_EN_ROUTE', 'PICKED_UP')).toBe(true);
    expect(canTransitionDonationStatus('PICKED_UP', 'DELIVERY_EN_ROUTE')).toBe(true);
    expect(canTransitionDonationStatus('DELIVERY_EN_ROUTE', 'DELIVERED')).toBe(true);
    expect(canTransitionDonationStatus('DELIVERED', 'COMPLETED')).toBe(true);
  });

  test('rejects illegitimate or illegal status transitions', () => {
    expect(canTransitionDonationStatus('PUBLISHED', 'COMPLETED')).toBe(false);
    expect(canTransitionDonationStatus('COMPLETED', 'PUBLISHED')).toBe(false);
    expect(canTransitionDonationStatus('EXPIRED', 'PUBLISHED')).toBe(false);
    expect(canTransitionDonationStatus('CANCELLED', 'DELIVERED')).toBe(false);
    expect(canTransitionDonationStatus('DRAFT', 'COMPLETED')).toBe(false);
  });

  test('correctly evaluates donor edit & withdraw permissions', () => {
    const mockDonation: Donation = {
      id: 'd1',
      donorId: 'u1',
      donorName: 'Test',
      status: 'PUBLISHED',
      food: { name: 'Bread', category: 'Bakery', quantity: 10, unit: 'loaves' },
      safety: {
        preparedAt: new Date().toISOString(),
        storageCondition: 'Room Temperature',
        packagingCondition: 'Individually Sealed',
        allergens: ['None'],
        donorDeclarationAccepted: true,
        donorDeclarationText: '',
      },
      pickup: {
        address: '123 Campus Way',
        locationSource: 'MANUAL',
        pickupStartAt: new Date().toISOString(),
        pickupDeadlineAt: new Date(Date.now() + 3600000).toISOString(),
      },
      verification: { pickupCode: '1234', isVerified: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };

    expect(canEditDonation(mockDonation)).toBe(true);
    expect(canWithdrawDonation(mockDonation)).toBe(true);

    const completedDonation = { ...mockDonation, status: 'COMPLETED' as const };
    expect(canEditDonation(completedDonation)).toBe(false);
    expect(canWithdrawDonation(completedDonation)).toBe(false);
  });
});

describe('Donation Validation', () => {
  test('validates food details correctly', () => {
    expect(
      validateFoodStep({
        name: 'Curry Rice Boxes',
        category: 'Prepared Meals',
        quantity: 12,
        unit: 'portions',
      }).isValid
    ).toBe(true);

    expect(
      validateFoodStep({
        name: '',
        category: 'Prepared Meals',
        quantity: 12,
        unit: 'portions',
      }).isValid
    ).toBe(false);

    expect(
      validateFoodStep({
        name: 'Apples',
        category: 'Fruit',
        quantity: 0,
        unit: 'kg',
      }).isValid
    ).toBe(false);
  });

  test('requires donor declaration in safety step', () => {
    expect(
      validateSafetyStep({
        preparedAt: new Date().toISOString(),
        storageCondition: 'Refrigerated',
        packagingCondition: 'Covered Trays',
        allergens: ['None'],
        donorDeclarationAccepted: true,
      }).isValid
    ).toBe(true);

    expect(
      validateSafetyStep({
        preparedAt: new Date().toISOString(),
        storageCondition: 'Refrigerated',
        packagingCondition: 'Covered Trays',
        allergens: ['None'],
        donorDeclarationAccepted: false,
      }).isValid
    ).toBe(false);
  });

  test('validates pickup deadline is ahead of start time', () => {
    const now = Date.now();
    expect(
      validatePickupStep({
        address: 'Main Cafeteria',
        pickupStartAt: new Date(now).toISOString(),
        pickupDeadlineAt: new Date(now + 7200000).toISOString(),
      }).isValid
    ).toBe(true);

    expect(
      validatePickupStep({
        address: 'Main Cafeteria',
        pickupStartAt: new Date(now + 7200000).toISOString(),
        pickupDeadlineAt: new Date(now).toISOString(),
      }).isValid
    ).toBe(false);
  });
});

describe('Relative Time Calculations', () => {
  test('formats future and past countdowns accurately', () => {
    const futureTime = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    expect(getRelativeTimeString(futureTime)).toContain('45 min');

    const pastTime = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    expect(getRelativeTimeString(pastTime)).toContain('Expired 15m ago');
  });
});
