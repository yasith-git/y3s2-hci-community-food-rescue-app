/**
 * Centralized Authentication Context & Provider
 * Community Food Rescue App
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  isFirebaseConfigured,
  auth,
} from '../services/firebase/config';
import {
  loginWithEmail,
  registerWithEmail,
  logOut as firebaseLogout,
  requestPasswordReset,
  resendEmailVerification,
  reloadUser,
  assignUserRole,
  subscribeToAuthChanges,
} from '../services/firebase/auth';
import { getUserProfile } from '../services/firebase/firestore';
import { UserProfile, UserRole } from '../types/auth';
import { haptic } from '../design-system/haptics';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (fullName: string, email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
  selectRole: (role: UserRole, extra?: { organizationName?: string; phoneNumber?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth listener
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
        } catch (error) {
          console.warn('[AuthContext] Error fetching profile:', error);
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.warn('[AuthContext] Error refreshing profile:', error);
    }
  };

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser, profile: loadedProfile } = await loginWithEmail(email, pass);
      setUser(loggedInUser);
      setProfile(loadedProfile);
      haptic.success();
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (fullName: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { user: registeredUser, profile: createdProfile } = await registerWithEmail(
        fullName,
        email,
        pass
      );
      setUser(registeredUser);
      setProfile(createdProfile);
      haptic.success();
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await firebaseLogout();
      setUser(null);
      setProfile(null);
      haptic.medium();
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await requestPasswordReset(email);
    haptic.success();
  };

  const sendVerificationEmail = async () => {
    if (!user) throw new Error('No user logged in to send verification email.');
    await resendEmailVerification(user);
    haptic.success();
  };

  const checkEmailVerified = async (): Promise<boolean> => {
    if (!user) return false;
    const verified = await reloadUser(user);
    if (verified) {
      setUser({ ...user } as User);
      haptic.success();
    }
    return verified;
  };

  const selectRole = async (
    role: UserRole,
    extra?: { organizationName?: string; phoneNumber?: string }
  ) => {
    if (!user) throw new Error('Cannot assign role without authenticated user.');
    setIsLoading(true);
    try {
      await assignUserRole(user.uid, role, extra);
      await refreshProfile();
      haptic.success();
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailVerified = Boolean(user?.emailVerified);
  const isAuthenticated = Boolean(user);
  const role = profile?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAuthenticated,
        isLoading,
        isEmailVerified,
        isConfigured: isFirebaseConfigured,
        signIn,
        signUp,
        signOut,
        sendPasswordReset,
        sendVerificationEmail,
        checkEmailVerified,
        selectRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
