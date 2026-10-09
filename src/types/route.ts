/**
 * Volunteer Route & Matching Types
 * Community Food Rescue App - Smart Routing System
 */

import { Donation } from './donation';

export type TransportMode = 'DRIVING' | 'BICYCLE' | 'WALKING';

export type RouteType = 'ONE_TIME' | 'SAVED';

export type MatchConfidence = 'EXACT' | 'APPROXIMATE';

export type MatchFitCategory = 'EXCELLENT' | 'GOOD' | 'POSSIBLE';

export interface GeoPointData {
  address: string;
  latitude: number;
  longitude: number;
}

export interface VolunteerRoute {
  id: string;
  volunteerId: string;
  name?: string; // e.g. "Home → Campus" for saved routes
  origin: GeoPointData;
  destination: GeoPointData;
  availableFromAt: string; // ISO 8601 string
  availableUntilAt: string; // ISO 8601 string
  maxDetourMinutes: number; // e.g., 5, 10, 15, 20, 30
  transportMode: TransportMode;
  routeType: RouteType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateVolunteerRouteInput = Omit<
  VolunteerRoute,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface CommunityPointSummary {
  id: string;
  name: string;
  organizationName: string;
  address: string;
  latitude: number;
  longitude: number;
  operatingHours?: string;
  contactNumber?: string;
}

export interface RouteMatch {
  donation: Donation;
  communityPoint?: CommunityPointSummary;
  
  // Geospatial Metrics
  pickupDistanceKm: number; // Direct distance from volunteer's origin or current location
  routeDeviationKm: number; // Perpendicular / detour distance from the planned trajectory
  estimatedDetourMinutes: number; // Calculated driving/transit detour in minutes
  
  // Scoring & Qualitative Breakdown
  matchScore: number; // 0 to 100 deterministic score
  fitCategory: MatchFitCategory;
  confidence: MatchConfidence;
  timingCompatibility: {
    isCompatible: boolean;
    pickupWindowOverlapMinutes: number;
    hoursUntilPickupDeadline: number;
  };
  explanation: {
    headline: string;
    detourText: string;
    timingText: string;
    distanceText: string;
    badges: string[];
  };
}

export type DiscoveryViewMode = 'MAP' | 'LIST';

export type DiscoveryFilterOption = 'ALL' | 'FITS_ROUTE' | 'NEARBY' | 'URGENT';

export interface DiscoveryFilterState {
  mode: DiscoveryFilterOption;
  selectedCategory?: string;
  maxDistanceKm?: number;
  onlyActiveRoutes?: boolean;
}
