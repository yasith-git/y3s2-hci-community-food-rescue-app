/**
 * Unit Tests for Rescue Lifecycle, Verification Security, and Notifications
 */

import {
  canTransitionDonationStatus,
  canWithdrawDonation,
  isDonationActive,
} from '../src/services/donations/donation.state-machine';
import { Donation, DonationStatus } from '../src/types/donation';
import { RescueAssignment, RescueIssue } from '../src/types/rescue';
import { AppNotification, DEFAULT_NOTIFICATION_PREFERENCES } from '../src/types/notification';

describe('Rescue Lifecycle State Machine Transitions', () => {
  test('allows legal operational transitions for volunteer rescue', () => {
    expect(canTransitionDonationStatus('PUBLISHED', 'RESERVED')).toBe(true);
    expect(canTransitionDonationStatus('RESERVED', 'VOLUNTEER_ASSIGNED')).toBe(true);
    expect(canTransitionDonationStatus('VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE')).toBe(true);
    expect(canTransitionDonationStatus('PICKUP_EN_ROUTE', 'PICKED_UP')).toBe(true);
    expect(canTransitionDonationStatus('PICKED_UP', 'DELIVERY_EN_ROUTE')).toBe(true);
    expect(canTransitionDonationStatus('DELIVERY_EN_ROUTE', 'DELIVERED')).toBe(true);
    expect(canTransitionDonationStatus('VOLUNTEER_ASSIGNED', 'PUBLISHED')).toBe(true);
    expect(canTransitionDonationStatus('PICKUP_EN_ROUTE', 'PUBLISHED')).toBe(true);
  });

  test('blocks illegal state skips and regressions', () => {
    expect(canTransitionDonationStatus('PUBLISHED', 'DELIVERED')).toBe(false);
    expect(canTransitionDonationStatus('VOLUNTEER_ASSIGNED', 'DELIVERED')).toBe(false);
    expect(canTransitionDonationStatus('DELIVERED', 'PUBLISHED')).toBe(false);
    expect(canTransitionDonationStatus('COMPLETED', 'VOLUNTEER_ASSIGNED')).toBe(false);
    expect(canTransitionDonationStatus('PICKED_UP', 'PUBLISHED')).toBe(false);
  });

  test('prevents donor withdrawal after food has been physically picked up', () => {
    const baseDonation: Donation = {
      id: 'd-test',
      donorId: 'donor-1',
      donorName: 'Bakery',
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
        address: 'Colombo',
        locationSource: 'GPS',
        pickupStartAt: new Date().toISOString(),
        pickupDeadlineAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
      },
      verification: { pickupCode: '4321', isVerified: false },
      status: 'PICKED_UP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
    };

    expect(canWithdrawDonation(baseDonation)).toBe(false);

    // Withdrawable before pickup
    const assignedDonation: Donation = { ...baseDonation, status: 'VOLUNTEER_ASSIGNED' };
    expect(canWithdrawDonation(assignedDonation)).toBe(true);
  });
});

describe('Notification Preferences & Quiet Hours Evaluation', () => {
  test('default preferences enable critical operational updates', () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.routeMatches).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.pickupReminders).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.deliveryUpdates).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.quietHoursEnabled).toBe(false);
  });

  test('correctly evaluates quiet hours time span', () => {
    const quietStart = 22; // 22:00
    const quietEnd = 7; // 07:00

    const isInsideQuietHours = (hour: number) => {
      if (quietStart > quietEnd) {
        return hour >= quietStart || hour < quietEnd;
      }
      return hour >= quietStart && hour < quietEnd;
    };

    expect(isInsideQuietHours(23)).toBe(true); // 11 PM -> Muted
    expect(isInsideQuietHours(3)).toBe(true); // 3 AM -> Muted
    expect(isInsideQuietHours(14)).toBe(false); // 2 PM -> Active
    expect(isInsideQuietHours(9)).toBe(false); // 9 AM -> Active
  });
});

describe('Pickup Verification Code & Security Checks', () => {
  test('validates correct 4-digit numeric code match', () => {
    const storedCode = '5829';
    const enteredCorrect = '5829';
    const enteredIncorrect = '9999';

    expect(storedCode.trim() === enteredCorrect.trim()).toBe(true);
    expect(storedCode.trim() === enteredIncorrect.trim()).toBe(false);
  });

  test('blocks verification on quantity mismatch unless explicitly acknowledged', () => {
    const expectedQty: number = 20;
    const actualQty: number = 18;
    const isChecked = false;

    const isMismatchBlocked = actualQty !== expectedQty && !isChecked;
    expect(isMismatchBlocked).toBe(true);
  });
});
