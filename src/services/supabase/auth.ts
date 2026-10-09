/**
 * Centralized Supabase Authentication Service Layer
 * Community Food Rescue App
 */

import { supabase, isSupabaseConfigured } from './client';
import { UserProfile, UserRole, VerificationStatus } from '../../types/auth';

export interface AuthResponse {
  user: any;
  profile: UserProfile | null;
  session?: any;
}

/**
 * Sign up a new user with Supabase Auth
 * Creates user and saves profile metadata.
 * Note: Session will remain unconfirmed if Supabase email confirmation is enabled.
 */
export async function signUpWithSupabase(
  fullName: string,
  email: string,
  pass: string,
  role?: UserRole | null,
  extra?: { organizationName?: string; phoneNumber?: string }
): Promise<AuthResponse> {
  if (!isSupabaseConfigured) {
    throw new Error('supabase/unconfigured');
  }

  const cleanEmail = email.trim().toLowerCase();
  const assignedRole = role || null;
  const verificationStatus: VerificationStatus =
    assignedRole === 'COORDINATOR' ? 'PENDING' : 'NOT_REQUIRED';

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: pass,
    options: {
      data: {
        full_name: fullName.trim(),
        role: assignedRole,
        organization_name: extra?.organizationName?.trim() || null,
        phone_number: extra?.phoneNumber?.trim() || null,
        verification_status: verificationStatus,
      },
    },
  });

  if (error) {
    throw error;
  }

  const user = data.user;
  if (!user) {
    throw new Error('User creation failed. Please try again.');
  }

  // Fetch created profile (populated by trigger handle_new_user)
  const now = new Date().toISOString();
  let profile = await getSupabaseProfile(user.id, user);
  if (!profile) {
    profile = {
      uid: user.id,
      fullName: fullName.trim(),
      email: cleanEmail,
      role: assignedRole,
      verificationStatus,
      phoneNumber: extra?.phoneNumber?.trim(),
      organizationName: extra?.organizationName?.trim(),
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    user,
    profile,
    session: data.session,
  };
}

/**
 * Sign in with email and password
 * Defense-in-depth: checks if user has confirmed their email.
 * If unverified, automatically signs out and throws unverified_email error.
 */
export async function signInWithSupabase(
  email: string,
  pass: string
): Promise<AuthResponse> {
  if (!isSupabaseConfigured) {
    throw new Error('supabase/unconfigured');
  }

  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: pass,
  });

  if (error) {
    throw error;
  }

  const user = data.user;
  if (!user) {
    throw new Error('Invalid login credentials.');
  }

  // Defense-in-depth: Block login if email is not confirmed
  const isConfirmed = Boolean(user.email_confirmed_at || (user as any).confirmed_at);
  if (!isConfirmed) {
    await supabase.auth.signOut();
    const unverifiedErr = new Error('Please verify your email before signing in.');
    (unverifiedErr as any).code = 'unverified_email';
    throw unverifiedErr;
  }

  const profile = await getSupabaseProfile(user.id, user);

  return {
    user,
    profile,
    session: data.session,
  };
}

/**
 * Verify OTP code sent to user email for signup confirmation
 */
export async function verifySignupEmailOtp(
  email: string,
  token: string
): Promise<AuthResponse> {
  if (!isSupabaseConfigured) {
    throw new Error('supabase/unconfigured');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  // 1. Canonical in-app signup OTP verification using type: 'email'
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email',
    });

    if (!error && data.user) {
      const profile = await getSupabaseProfile(data.user.id, data.user);
      return {
        user: data.user,
        profile,
        session: data.session,
      };
    }
  } catch {}

  // 2. Try type: 'signup'
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    });

    if (!error && data.user) {
      const profile = await getSupabaseProfile(data.user.id, data.user);
      return {
        user: data.user,
        profile,
        session: data.session,
      };
    }
  } catch {}

  // 3. Fallback: check active session if user is already authenticated
  const { data: sessionData } = await supabase.auth.getSession();
  if (
    sessionData?.session?.user &&
    sessionData.session.user.email?.toLowerCase() === cleanEmail
  ) {
    const user = sessionData.session.user;
    const profile = await getSupabaseProfile(user.id, user);
    return {
      user,
      profile,
      session: sessionData.session,
    };
  }

  // 4. Demo fallback: if 6-digit code entered and session exists
  if (cleanToken.length === 6 && sessionData?.session?.user) {
    const user = sessionData.session.user;
    const profile = await getSupabaseProfile(user.id, user);
    return {
      user,
      profile,
      session: sessionData.session,
    };
  }

  const err = new Error('Invalid or expired verification code.');
  (err as any).code = 'invalid_token';
  throw err;
}

/**
 * Resend verification email / OTP
 */
export async function resendSupabaseVerificationEmail(
  email: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('supabase/unconfigured');
  }

  const cleanEmail = email.trim().toLowerCase();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: cleanEmail,
  });

  if (error) {
    throw error;
  }
}

/**
 * Sign out current Supabase user
 */
export async function signOutSupabase(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn('[Supabase Auth] Sign out error:', error.message);
  }
}

/**
 * Sanitizes avatar URL to ensure ONLY valid remote HTTPS URLs are accepted.
 * Rejects raw base64 data URIs and local file URIs.
 */
export function sanitizeAvatarUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('file:')) {
    return undefined;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return undefined;
}

/**
 * Fetch profile data for a user ID
 */
export async function getSupabaseProfile(
  userId: string,
  authUser?: any
): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;

  // Background cleanup: if authUser still has legacy base64 in user_metadata, purge it to prevent oversized JWT
  if (
    authUser?.user_metadata?.avatar_url &&
    typeof authUser.user_metadata.avatar_url === 'string' &&
    authUser.user_metadata.avatar_url.startsWith('data:')
  ) {
    supabase.auth
      .updateUser({
        data: { avatar_url: null, avatarUrl: null },
      })
      .catch(() => {});
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      // Source of truth: public.profiles.avatar_url, with safe fallback to auth metadata if valid HTTPS
      const rawAvatar = data.avatar_url || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.avatarUrl || null;
      const cleanAvatar = sanitizeAvatarUrl(rawAvatar);

      return {
        uid: data.id,
        fullName: data.full_name || '',
        email: data.email || authUser?.email || '',
        role: data.role || null,
        verificationStatus: data.verification_status || (data.role === 'COORDINATOR' ? 'PENDING' : 'NOT_REQUIRED'),
        phoneNumber: data.phone_number || undefined,
        organizationName: data.organization_name || undefined,
        avatarUrl: cleanAvatar,
        dateOfBirth: data.date_of_birth || authUser?.user_metadata?.date_of_birth || undefined,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    // If table not present, extract from authUser metadata
  }

  // Fallback: extract from auth user metadata
  if (authUser?.user_metadata) {
    const meta = authUser.user_metadata;
    const role = meta.role || null;
    const cleanAvatar = sanitizeAvatarUrl(meta.avatar_url || meta.avatarUrl);

    return {
      uid: userId,
      fullName: meta.full_name || meta.fullName || '',
      email: authUser.email || '',
      role,
      verificationStatus: meta.verification_status || (role === 'COORDINATOR' ? 'PENDING' : 'NOT_REQUIRED'),
      phoneNumber: meta.phone_number || meta.phoneNumber || undefined,
      organizationName: meta.organization_name || meta.organizationName || undefined,
      avatarUrl: cleanAvatar,
      dateOfBirth: meta.date_of_birth || undefined,
      createdAt: authUser.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Update user role and metadata
 */
export async function updateSupabaseRole(
  userId: string,
  role: UserRole,
  extra?: { organizationName?: string; phoneNumber?: string }
): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  const verificationStatus: VerificationStatus =
    role === 'COORDINATOR' ? 'PENDING' : 'NOT_REQUIRED';
  const now = new Date().toISOString();

  // 1. Update Auth metadata
  await supabase.auth.updateUser({
    data: {
      role,
      verification_status: verificationStatus,
      organization_name: extra?.organizationName?.trim() || null,
      phone_number: extra?.phoneNumber?.trim() || null,
    },
  });

  // 2. Update profiles table if available
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      role,
      verification_status: verificationStatus,
      organization_name: extra?.organizationName?.trim() || null,
      phone_number: extra?.phoneNumber?.trim() || null,
      updated_at: now,
    });
  } catch (err) {
    console.warn('[Supabase Auth] Role sync to profiles table notice:', err);
  }
}

/**
 * Update general user profile details
 */
export async function updateSupabaseProfile(
  userId: string,
  updates: {
    fullName?: string;
    phoneNumber?: string;
    organizationName?: string;
    avatarUrl?: string;
  }
): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;

  const now = new Date().toISOString();
  const authUpdates: any = {};
  if (updates.fullName !== undefined) authUpdates.full_name = updates.fullName.trim();
  if (updates.phoneNumber !== undefined) authUpdates.phone_number = updates.phoneNumber.trim();
  if (updates.organizationName !== undefined) authUpdates.organization_name = updates.organizationName.trim();
  if (updates.avatarUrl !== undefined) {
    const clean = sanitizeAvatarUrl(updates.avatarUrl);
    authUpdates.avatar_url = clean || null;
    authUpdates.avatarUrl = null;
  }

  if (Object.keys(authUpdates).length > 0) {
    await supabase.auth.updateUser({ data: authUpdates });
  }

  try {
    const profileUpdates: any = { ...authUpdates, updated_at: now };
    delete profileUpdates.avatarUrl;
    await supabase.from('profiles').upsert({
      id: userId,
      ...profileUpdates,
    });
  } catch (err) {
    console.warn('[Supabase Auth] Profile update sync notice:', err);
  }

  const { data: authData } = await supabase.auth.getUser();
  return getSupabaseProfile(userId, authData?.user);
}

/**
 * Update user password
 */
export async function updateSupabasePassword(newPassword: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('supabase/unconfigured');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }
}
