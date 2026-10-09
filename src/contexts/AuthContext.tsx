/**
 * Centralized Authentication Context & Provider
 * Community Food Rescue App (Supabase Backend)
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase/client';
import {
  signInWithSupabase,
  signUpWithSupabase,
  signOutSupabase,
  getSupabaseProfile,
  updateSupabaseRole,
  updateSupabaseProfile,
  updateSupabasePassword,
  resendSupabaseVerificationEmail,
  verifySignupEmailOtp,
} from '../services/supabase/auth';
import { UserProfile, UserRole, AuthGateState } from '../types/auth';
import {
  saveProfileDetails as saveProfileDetailsService,
  SaveProfileDetailsInput,
} from '../services/profile/profile.service';

export interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  role: UserRole | null;
  gateState: AuthGateState;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (
    fullName: string,
    email: string,
    pass: string,
    role?: UserRole | null,
    extra?: { organizationName?: string; phoneNumber?: string }
  ) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: (email?: string) => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
  selectRole: (role: UserRole, extra?: { organizationName?: string; phoneNumber?: string }) => Promise<void>;
  updateProfile: (updates: { fullName?: string; phoneNumber?: string; organizationName?: string; avatarUrl?: string }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Self-service edit of name / mobile / DOB / photo (Donor & Volunteer profile screens) */
  saveProfileDetails: (input: SaveProfileDetailsInput) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured);
  const [gateState, setGateState] = useState<AuthGateState>(
    isSupabaseConfigured ? 'INITIALIZING' : 'SIGNED_OUT'
  );

  const normalizeUser = (u: any) => {
    if (!u) return null;
    if (!u.uid && u.id) {
      return { ...u, uid: u.id };
    }
    return u;
  };

  const isUserEmailConfirmed = (u: any): boolean => {
    if (!u) return false;
    if (!isSupabaseConfigured) return true;
    return Boolean(u.email_confirmed_at || u.confirmed_at);
  };

  const computeGateState = (currentUser: any, currentProfile: UserProfile | null, loading: boolean): AuthGateState => {
    if (loading) return 'INITIALIZING';
    if (!currentUser) return 'SIGNED_OUT';
    if (!isUserEmailConfirmed(currentUser)) return 'SIGNED_IN_UNVERIFIED';
    if (!currentProfile) return 'SIGNED_IN_VERIFIED_PROFILE_LOADING';
    return 'SIGNED_IN_VERIFIED_READY';
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;

    // Listen to Supabase auth state changes (automatically receives INITIAL_SESSION on mount)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      const currentUser = normalizeUser(session?.user ?? null);

      setUser((prev: any) => {
        if (prev?.id === currentUser?.id && event === 'TOKEN_REFRESHED') {
          return prev;
        }
        return currentUser;
      });

      if (currentUser) {
        if (isUserEmailConfirmed(currentUser)) {
          setGateState('SIGNED_IN_VERIFIED_PROFILE_LOADING');
          const p = await getSupabaseProfile(currentUser.id, currentUser);
          if (isMounted) {
            setProfile(p);
            setGateState('SIGNED_IN_VERIFIED_READY');
          }
        } else {
          if (isMounted) {
            setProfile(null);
            setGateState('SIGNED_IN_UNVERIFIED');
          }
        }
      } else {
        if (isMounted) {
          setProfile(null);
          setGateState('SIGNED_OUT');
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { user: authedUser, profile: loadedProfile } = await signInWithSupabase(email, pass);
      const normalized = normalizeUser(authedUser);
      setUser(normalized);
      setProfile(loadedProfile);
      setGateState(computeGateState(normalized, loadedProfile, false));
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    fullName: string,
    email: string,
    pass: string,
    role?: UserRole | null,
    extra?: { organizationName?: string; phoneNumber?: string }
  ) => {
    setIsLoading(true);
    try {
      const { user: registeredUser, profile: createdProfile, session } = await signUpWithSupabase(
        fullName,
        email,
        pass,
        role,
        extra
      );

      // If signup did not produce an active verified session, keep state unverified
      const normalized = normalizeUser(registeredUser);
      const isConfirmed = isUserEmailConfirmed(normalized);

      if (!isConfirmed || !session) {
        setUser(normalized);
        setProfile(null);
        setGateState('SIGNED_IN_UNVERIFIED');
      } else {
        setUser(normalized);
        setProfile(createdProfile);
        setGateState('SIGNED_IN_VERIFIED_READY');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    setIsLoading(true);
    try {
      const res = await verifySignupEmailOtp(email, token);
      const targetUser = res.user || user;
      if (targetUser) {
        const normalized = normalizeUser(targetUser);
        setUser(normalized);
        const p = res.profile || (await getSupabaseProfile(targetUser.id, targetUser));
        setProfile(p);
        setGateState('SIGNED_IN_VERIFIED_READY');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await signOutSupabase();
      setUser(null);
      setProfile(null);
      setGateState('SIGNED_OUT');
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  };

  const sendVerificationEmail = async (targetEmail?: string) => {
    if (!isSupabaseConfigured) return;
    const emailToUse = targetEmail || user?.email;
    if (emailToUse) {
      await resendSupabaseVerificationEmail(emailToUse);
    }
  };

  const checkEmailVerified = async (): Promise<boolean> => {
    if (!user) return false;
    return isUserEmailConfirmed(user);
  };

  const selectRole = async (role: UserRole, extra?: { organizationName?: string; phoneNumber?: string }) => {
    if (!user) return;
    await updateSupabaseRole(user.id, role, extra);
    const updated = await getSupabaseProfile(user.id, user);
    setProfile(updated);
  };

  const updateProfile = async (updates: {
    fullName?: string;
    phoneNumber?: string;
    organizationName?: string;
    avatarUrl?: string;
  }) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updated = await updateSupabaseProfile(user.id, updates);
      if (updated) {
        setProfile(updated);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    setIsLoading(true);
    try {
      await updateSupabasePassword(newPassword);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const p = await getSupabaseProfile(user.id, user);
    setProfile(p);
  };

  const saveProfileDetails = async (input: SaveProfileDetailsInput): Promise<UserProfile | null> => {
    if (!user) {
      throw new Error('You must be signed in to update your profile.');
    }
    // Intentionally does NOT toggle global isLoading (would unmount screens via root splash)
    const { profile: updated, authUser } = await saveProfileDetailsService(user.id, input);
    if (authUser) {
      setUser(normalizeUser(authUser));
    }
    if (updated) {
      setProfile(updated);
    }
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || null,
        gateState,
        isAuthenticated: Boolean(user),
        isLoading,
        isEmailVerified: isUserEmailConfirmed(user),
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        verifyEmailOtp,
        signOut,
        sendPasswordReset,
        sendVerificationEmail,
        checkEmailVerified,
        selectRole,
        updateProfile,
        updatePassword,
        refreshProfile,
        saveProfileDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
