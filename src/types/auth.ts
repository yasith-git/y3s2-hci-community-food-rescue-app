/**
 * User & Authentication Domain Types
 * Community Food Rescue App (Supabase Backend)
 */

export type UserRole = 'DONOR' | 'VOLUNTEER' | 'COORDINATOR';

export type VerificationStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type AuthGateState =
  | 'INITIALIZING'
  | 'SIGNED_OUT'
  | 'SIGNED_IN_UNVERIFIED'
  | 'SIGNED_IN_VERIFIED_PROFILE_LOADING'
  | 'SIGNED_IN_VERIFIED_READY';

export interface UserProfile {
  id?: string;
  uid: string;
  fullName: string;
  email: string;
  role: UserRole | null;
  verificationStatus: VerificationStatus;
  phoneNumber?: string;
  organizationId?: string;
  organizationName?: string;
  avatarUrl?: string;
  dateOfBirth?: string; // ISO 8601 date (YYYY-MM-DD)
  createdAt: string; // ISO 8601 string
  updatedAt: string;
}

export interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  role: UserRole | null;
  gateState: AuthGateState;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  isConfigured: boolean;
}
