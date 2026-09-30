/**
 * Firestore Service Layer for User Profiles
 * Community Food Rescue App
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from './config';
import { UserProfile, UserRole } from '../../types/auth';

const USERS_COLLECTION = 'users';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!firestore) return null;

  try {
    const userRef = doc(firestore, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        fullName: data.fullName || '',
        email: data.email || '',
        role: data.role || null,
        verificationStatus: data.verificationStatus || 'NOT_REQUIRED',
        phoneNumber: data.phoneNumber,
        organizationName: data.organizationName,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
      };
    }
    return null;
  } catch (error) {
    console.warn('[Firestore] Error getting user profile:', error);
    throw error;
  }
}

export async function createUserProfile(
  uid: string,
  data: {
    fullName: string;
    email: string;
    role?: UserRole | null;
  }
): Promise<UserProfile> {
  if (!firestore) {
    throw new Error('Firestore is not configured.');
  }

  const role = data.role || null;
  const verificationStatus = role === 'COORDINATOR' ? 'PENDING' : 'NOT_REQUIRED';
  const now = new Date().toISOString();

  const profileData = {
    uid,
    fullName: data.fullName,
    email: data.email,
    role,
    verificationStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const userRef = doc(firestore, USERS_COLLECTION, uid);
  await setDoc(userRef, profileData, { merge: true });

  return {
    uid,
    fullName: data.fullName,
    email: data.email,
    role,
    verificationStatus,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateUserRole(
  uid: string,
  role: UserRole,
  additionalData?: { organizationName?: string; phoneNumber?: string }
): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore is not configured.');
  }

  const verificationStatus = role === 'COORDINATOR' ? 'PENDING' : 'NOT_REQUIRED';
  const userRef = doc(firestore, USERS_COLLECTION, uid);

  await updateDoc(userRef, {
    role,
    verificationStatus,
    ...additionalData,
    updatedAt: serverTimestamp(),
  });
}
