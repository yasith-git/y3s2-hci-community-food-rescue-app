/**
 * Donation Domain Types and Interfaces
 * Community Food Rescue App - Smart Donation System
 */

export type DonationStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'RESERVED'
  | 'VOLUNTEER_ASSIGNED'
  | 'PICKUP_EN_ROUTE'
  | 'PICKED_UP'
  | 'DELIVERY_EN_ROUTE'
  | 'DELIVERED'
  | 'ACKNOWLEDGED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'ISSUE_REPORTED';

export type FoodCategory =
  | 'Bakery'
  | 'Prepared Meals'
  | 'Rice & Curry'
  | 'Vegetables'
  | 'Fruit'
  | 'Dairy'
  | 'Packaged Food'
  | 'Beverages'
  | 'Other';

export type QuantityUnit =
  | 'portions'
  | 'packs'
  | 'boxes'
  | 'loaves'
  | 'kg'
  | 'items'
  | 'containers';

export type StorageCondition =
  | 'Room Temperature'
  | 'Refrigerated'
  | 'Frozen'
  | 'Warm / Heated'
  | 'Other';

export type PackagingCondition =
  | 'Individually Sealed'
  | 'Covered Trays'
  | 'Food-Safe Containers'
  | 'Original Packaging'
  | 'Other';

export type Allergen =
  | 'Gluten/Wheat'
  | 'Milk/Dairy'
  | 'Egg'
  | 'Peanuts'
  | 'Tree Nuts'
  | 'Soy'
  | 'Fish'
  | 'Shellfish'
  | 'Sesame'
  | 'Unknown'
  | 'None';

export type CancellationReason =
  | 'Food is no longer available'
  | 'Pickup time changed'
  | 'Incorrect information entered'
  | 'Unexpected issue / Emergency'
  | 'Other';

export interface FoodDetails {
  name: string;
  category: FoodCategory;
  description?: string;
  quantity: number;
  unit: QuantityUnit;
  imageUrl?: string;
}

export interface FoodSafetyDetails {
  preparedAt: string; // ISO 8601 string
  storageCondition: StorageCondition;
  packagingCondition: PackagingCondition;
  ingredients?: string;
  allergens: Allergen[];
  donorDeclarationAccepted: boolean;
  donorDeclarationText: string;
}

export interface PickupDetails {
  address: string;
  latitude?: number;
  longitude?: number;
  locationSource: 'GPS' | 'MANUAL';
  pickupStartAt: string; // ISO 8601 string
  pickupDeadlineAt: string; // ISO 8601 string
  instructions?: string;
}

export interface VerificationDetails {
  /**
   * Cryptographically generated 4-6 digit numeric code.
   * Stored securely on Firestore and exposed to donor once volunteer is assigned.
   */
  pickupCode: string;
  hashedCode?: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  donorOrganization?: string;
  food: FoodDetails;
  safety: FoodSafetyDetails;
  pickup: PickupDetails;
  verification: VerificationDetails;
  status: DonationStatus;
  cancellationReason?: CancellationReason | string;

  // Volunteer Assignment
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;

  // Coordinator & Delivery Destination (Member 4 Integration)
  reservationId?: string;
  coordinatorId?: string;
  coordinatorName?: string;
  communityPointId?: string;
  communityPointName?: string;
  communityPointAddress?: string;
  destination?: {
    address: string;
    latitude: number;
    longitude: number;
    name?: string;
  };
  acknowledgedAt?: string;
  deliveryCode?: string;

  // Lifecycle Timestamps (ISO 8601 Strings)
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt: string;
  reservedAt?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export type CreateDonationInput = Omit<
  Donation,
  'id' | 'createdAt' | 'updatedAt' | 'verification' | 'status' | 'reservationId' | 'coordinatorId' | 'coordinatorName' | 'communityPointId' | 'communityPointName' | 'communityPointAddress' | 'destination' | 'acknowledgedAt' | 'deliveryCode'
> & {
  status?: 'DRAFT' | 'PUBLISHED';
};
