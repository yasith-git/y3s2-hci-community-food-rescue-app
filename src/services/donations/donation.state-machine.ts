/**
 * Donation Lifecycle State Machine
 * Defines strictly allowed status transitions and helper permissions
 */

import { Donation, DonationStatus } from '../../types/donation';

export const ALLOWED_TRANSITIONS: Record<DonationStatus, DonationStatus[]> = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['RESERVED', 'VOLUNTEER_ASSIGNED', 'CANCELLED', 'EXPIRED'],
  RESERVED: ['VOLUNTEER_ASSIGNED', 'PUBLISHED', 'CANCELLED', 'EXPIRED'],
  VOLUNTEER_ASSIGNED: ['PICKUP_EN_ROUTE', 'PUBLISHED', 'CANCELLED', 'EXPIRED'],
  PICKUP_EN_ROUTE: ['PICKED_UP', 'PUBLISHED', 'CANCELLED', 'EXPIRED'],
  PICKED_UP: ['DELIVERY_EN_ROUTE', 'ISSUE_REPORTED'],
  DELIVERY_EN_ROUTE: ['DELIVERED', 'ISSUE_REPORTED'],
  DELIVERED: ['ACKNOWLEDGED', 'COMPLETED', 'ISSUE_REPORTED'],
  ACKNOWLEDGED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
  ISSUE_REPORTED: ['COMPLETED', 'CANCELLED'],
};

/**
 * Checks whether a donation can legitimately transition to a new status
 */
export function canTransitionDonationStatus(
  current: DonationStatus,
  target: DonationStatus
): boolean {
  if (current === target) return true;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

/**
 * Checks if a donation can be edited by the donor
 * Donors can edit food and pickup details before the food is picked up or assigned
 */
export function canEditDonation(donation: Donation): boolean {
  return (
    donation.status === 'DRAFT' ||
    donation.status === 'PUBLISHED' ||
    donation.status === 'RESERVED'
  );
}

/**
 * Checks if a donation can be withdrawn/cancelled by the donor
 */
export function canWithdrawDonation(donation: Donation): boolean {
  return (
    donation.status === 'PUBLISHED' ||
    donation.status === 'RESERVED' ||
    donation.status === 'VOLUNTEER_ASSIGNED' ||
    donation.status === 'PICKUP_EN_ROUTE'
  );
}

/**
 * Checks whether the donation is actively available or in active transit
 */
export function isDonationActive(status: DonationStatus): boolean {
  return (
    status === 'PUBLISHED' ||
    status === 'RESERVED' ||
    status === 'VOLUNTEER_ASSIGNED' ||
    status === 'PICKUP_EN_ROUTE' ||
    status === 'PICKED_UP' ||
    status === 'DELIVERY_EN_ROUTE' ||
    status === 'DELIVERED' ||
    status === 'ACKNOWLEDGED'
  );
}

/**
 * Checks if a donation is expired based on pickup deadline or explicit status
 */
export function isDonationExpired(donation: Donation): boolean {
  if (donation.status === 'EXPIRED') return true;
  if (!isDonationActive(donation.status)) return false;

  const now = new Date().getTime();
  const deadline = new Date(donation.pickup.pickupDeadlineAt).getTime();
  return now > deadline;
}
