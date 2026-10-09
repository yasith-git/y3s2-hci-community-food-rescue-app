/**
 * Coordinator, Community Point, Organization & Distribution Domain Types
 * Community Food Rescue App - Member 4 Feature (Coordinator 2.0)
 */

export type CoordinatorVerificationStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type OrganizationType =
  | 'FOOD_BANK'
  | 'CHARITY'
  | 'COMMUNITY_PANTRY'
  | 'SHELTER'
  | 'RELIGIOUS_WELFARE'
  | 'COMMUNITY_KITCHEN'
  | 'OTHER';

export interface Organization {
  id: string;
  name: string;
  organizationType: OrganizationType | string;
  registrationNumber?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  cityArea: string;
  latitude?: number;
  longitude?: number;
  serviceRadiusKm: number;
  description?: string;
  distributionCapacityPeople: number;
  storageCapabilities: string[];
  acceptedFoodCategories: string[];
  verificationStatus: CoordinatorVerificationStatus;
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationApplicationInput {
  name: string;
  organizationType: string;
  registrationNumber?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  cityArea: string;
  latitude?: number;
  longitude?: number;
  serviceRadiusKm?: number;
  description?: string;
  distributionCapacityPeople?: number;
  storageCapabilities?: string[];
  acceptedFoodCategories?: string[];
}

export interface CommunityPoint {
  id: string;
  coordinatorId: string;
  organizationId?: string;
  organizationName: string;
  label: string; // e.g. "Hope Community Food Hub"
  address: string;
  latitude: number;
  longitude: number;
  instructions?: string;
  contactName: string;
  contactPhone: string;
  operatingHours?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateCommunityPointInput = Omit<
  CommunityPoint,
  'id' | 'createdAt' | 'updatedAt'
>;

export type ReservationStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

export type ReservationCancellationReason =
  | 'Unable to receive food'
  | 'Collection point unavailable'
  | 'Incorrect reservation'
  | 'Unexpected issue / Emergency'
  | 'Other';

export interface Reservation {
  id: string;
  donationId: string;
  donorId: string;
  coordinatorId: string;
  coordinatorName?: string;
  coordinatorOrganization?: string;
  communityPointId: string;
  communityPointName?: string;
  communityPointAddress?: string;
  status: ReservationStatus;
  deliveryCode?: string;
  reservedAt: string;
  cancelledAt?: string;
  cancellationReason?: ReservationCancellationReason | string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecipientGroup =
  | 'Families'
  | 'Children'
  | 'Elderly People'
  | 'Community Shelter'
  | 'Students'
  | 'Low-Income Households'
  | 'Emergency Relief Group'
  | 'Other';

export interface DistributionRecord {
  id: string;
  donationId: string;
  organizationId: string;
  communityPointId?: string;
  recordedBy: string;
  distributionReference: string;
  distributionDate: string;
  recipientGroup: RecipientGroup | string;
  peopleServed: number;
  quantityDistributed: number;
  unit: string;
  distributionLocation: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordDistributionInput {
  donationId: string;
  recipientGroup: RecipientGroup | string;
  peopleServed: number;
  quantityDistributed: number;
  unit: string;
  distributionLocation: string;
  notes?: string;
}

export type ClarificationCategory =
  | 'PREPARATION_TIME'
  | 'ALLERGENS'
  | 'INGREDIENTS'
  | 'STORAGE'
  | 'PACKAGING'
  | 'QUANTITY'
  | 'PICKUP_DETAILS'
  | 'OTHER';

export type ClarificationStatus = 'OPEN' | 'RESPONDED' | 'CLOSED';

export interface ClarificationRequest {
  id: string;
  donationId: string;
  donationName: string;
  coordinatorId: string;
  coordinatorName: string;
  donorId: string;
  category: ClarificationCategory;
  message: string;
  status: ClarificationStatus;
  response?: string;
  createdAt: string;
  respondedAt?: string;
  closedAt?: string;
  updatedAt: string;
}

export interface CoordinatorStats {
  availableCount: number;
  incomingCount: number;
  openIssuesCount: number;
  completedCount: number;
  distributedCount?: number;
}
