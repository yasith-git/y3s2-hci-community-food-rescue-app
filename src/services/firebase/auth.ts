/**
 * Firebase Authentication Service Wrapper
 * Community Food Rescue App
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';
import { createUserProfile, getUserProfile, updateUserRole } from './firestore';
import { UserProfile, UserRole } from '../../types/auth';

export async function registerWithEmail(
  fullName: string,
  email: string,
  pass: string
): Promise<{ user: User; profile: UserProfile }> {
  if (!auth) {
    throw new Error('firebase/unconfigured');
  }

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  // Update display name in Firebase Auth
  await updateProfile(user, { displayName: fullName.trim() });

  // Send email verification
  await sendEmailVerification(user);

  // Create initial user document in Firestore
  const profile = await createUserProfile(user.uid, {
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    role: null,
  });

  return { user, profile };
}

export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ user: User; profile: UserProfile | null }> {
  if (!auth) {
    throw new Error('firebase/unconfigured');
  }

  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = credential.user;

  // Load Firestore profile
  let profile = await getUserProfile(user.uid);

  // If profile doesn't exist yet, construct base profile
  if (!profile) {
    profile = await createUserProfile(user.uid, {
      fullName: user.displayName || 'User',
      email: user.email || email,
      role: null,
    });
  }

  return { user, profile };
}

export async function logOut(): Promise<void> {
  if (!auth) return;
  await fbSignOut(auth);
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (!auth) {
    throw new Error('firebase/unconfigured');
  }
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendEmailVerification(user: User): Promise<void> {
  if (!user) throw new Error('No active user to send verification email.');
  await sendEmailVerification(user);
}

export async function reloadUser(user: User): Promise<boolean> {
  if (!user) return false;
  await user.reload();
  return user.emailVerified;
}

export async function assignUserRole(
  uid: string,
  role: UserRole,
  additionalData?: { organizationName?: string; phoneNumber?: string }
): Promise<void> {
  await updateUserRole(uid, role, additionalData);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
