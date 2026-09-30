/**
 * User & Authentication Domain Types
 * Community Food Rescue App
 */

export type UserRole = 'DONOR' | 'VOLUNTEER' | 'COORDINATOR';

export type VerificationStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole | null;
  verificationStatus: VerificationStatus;
  phoneNumber?: string;
  organizationName?: string;
  createdAt: string; // ISO 8601 string or Firestore Timestamp serialized
  updatedAt: string;
}

export interface AuthState {
  user: any | null; // Firebase User instance
  profile: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  isConfigured: boolean;
}
