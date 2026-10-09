/**
 * Rescue Lifecycle Domain Types and Interfaces
 * Community Food Rescue App - Member 3 Feature
 */

import { Donation, DonationStatus } from './donation';

export interface RescueAssignment {
  id: string;
  donationId: string;
  volunteerId: string;
  volunteerName: string;
  donorId: string;
  coordinatorId?: string;
  communityPointId?: string;
  communityPointName?: string;
  communityPointAddress?: string;

  // Snapshot for offline / history display
  foodName: string;
  quantity: number;
  unit: string;
  pickupAddress: string;
  imageUrl?: string;

  // Status
  status?: string;
  donationStatus?: DonationStatus;

  // Verification & Safety Flags
  quantityChecked: boolean;
  actualQuantity?: number;
  packagingChecked: boolean;

  // Lifecycle Timestamps (ISO 8601 strings)
  acceptedAt: string;
  pickupStartedAt?: string;
  pickedUpAt?: string;
  deliveryStartedAt?: string;
  deliveredAt?: string;
  acknowledgedAt?: string;
  completedAt?: string;
  deliveryCode?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  createdAt: string;
  updatedAt: string;
}

export type RescueIssueType =
  | 'QUANTITY_MISMATCH'
  | 'PACKAGING_CONCERN'
  | 'FOOD_INFORMATION_MISMATCH'
  | 'DONOR_UNAVAILABLE'
  | 'PICKUP_LOCATION_PROBLEM'
  | 'DELIVERY_LOCATION_PROBLEM'
  | 'OTHER';

export type RescueIssueStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'CLOSED';

export interface RescueIssue {
  id: string;
  donationId: string;
  assignmentId?: string;
  reportedBy: string;
  reporterName: string;
  reporterRole: 'VOLUNTEER' | 'DONOR' | 'COORDINATOR';
  issueType: RescueIssueType;
  description: string;
  expectedQuantity?: number;
  actualQuantity?: number;
  status: RescueIssueStatus;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type VolunteerCancellationReason =
  | 'Vehicle breakdown or transit issue'
  | 'Schedule conflict / Emergency'
  | 'Cannot reach donor location in time'
  | 'Safety concern at location'
  | 'Other';
