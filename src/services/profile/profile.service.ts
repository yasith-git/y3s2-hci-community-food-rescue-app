/**
 * Profile Details Service
 * Community Food Rescue App
 *
 * Self-service profile editing for Donor & Volunteer accounts:
 *   - full name, mobile number, date of birth
 *   - profile photo upload / replace / remove (Supabase Storage `avatars` bucket)
 *
 * Designed to be isolated from the rest of the app: it does not modify role,
 * verification status or organization data, and degrades gracefully if the
 * optional `20261008183000_profile_details_and_avatars.sql` migration has not
 * been applied yet (falls back to direct table update + auth metadata).
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { getSupabaseProfile } from '../supabase/auth';
import { UserProfile } from '../../types/auth';

export const AVATAR_BUCKET = 'avatars';

/** Describes what should happen to the profile photo on save. */
export type AvatarChange =
  | { kind: 'keep' }
  | { kind: 'remove' }
  | { kind: 'replace'; uri: string; base64?: string | null; mimeType?: string | null };

export interface SaveProfileDetailsInput {
  fullName: string;
  phoneNumber: string;
  /** ISO YYYY-MM-DD or null to clear */
  dateOfBirth: string | null;
  avatar: AvatarChange;
  currentAvatarUrl?: string | null;
}

export interface SaveProfileDetailsResult {
  profile: UserProfile | null;
  authUser: any | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Dependency-free base64 → bytes decoder (works on Hermes, JSC and web). */
export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^;]+;base64,/, '').replace(/[^A-Za-z0-9+/]/g, '');
  const lookup = new Uint8Array(256);
  for (let i = 0; i < BASE64_CHARS.length; i++) lookup[BASE64_CHARS.charCodeAt(i)] = i;

  const byteLength = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(byteLength);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)];
    const e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)];
    const e4 = lookup[clean.charCodeAt(i + 3)];
    if (p < byteLength) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < byteLength && i + 2 < clean.length) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < byteLength && i + 3 < clean.length) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes.subarray(0, p);
}

function resolveImageType(mimeType?: string | null, uri?: string): { ext: string; contentType: string } {
  const mime = (mimeType || '').toLowerCase();
  const uriExt = (uri || '').split('?')[0].split('.').pop()?.toLowerCase() || '';
  if (mime === 'image/png' || uriExt === 'png') return { ext: 'png', contentType: 'image/png' };
  if (mime === 'image/webp' || uriExt === 'webp') return { ext: 'webp', contentType: 'image/webp' };
  return { ext: 'jpg', contentType: 'image/jpeg' };
}

/** Extracts the object path inside the avatars bucket from a public URL. */
export function getAvatarStoragePath(publicUrl?: string | null): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length).split('?')[0]);
}

function isMissingFunctionError(error: any): boolean {
  const code = error?.code;
  const msg = String(error?.message || '').toLowerCase();
  return code === 'PGRST202' || code === '42883' || msg.includes('could not find the function');
}

function isMissingColumnError(error: any): boolean {
  const code = error?.code;
  const msg = String(error?.message || '').toLowerCase();
  return code === 'PGRST204' || code === '42703' || (msg.includes('date_of_birth') && msg.includes('column'));
}

function friendlyError(error: any, fallback: string): Error {
  const msg = String(error?.message || '');
  if (/bucket not found/i.test(msg)) {
    return new Error(
      'Profile photo storage is not set up yet. Please apply the latest Supabase migration (avatars bucket).'
    );
  }
  if (/row-level security|violates row-level|unauthorized|not authenticated/i.test(msg)) {
    return new Error('You do not have permission to update this profile. Please sign in again.');
  }
  if (/network request failed|failed to fetch/i.test(msg)) {
    return new Error('Network error. Please check your connection and try again.');
  }
  return new Error(msg || fallback);
}

// ---------------------------------------------------------------------------
// Avatar upload
// ---------------------------------------------------------------------------

export async function uploadProfileAvatar(
  userId: string,
  image: { uri: string; base64?: string | null; mimeType?: string | null }
): Promise<string> {
  const { ext, contentType } = resolveImageType(image.base64 ? 'image/jpeg' : image.mimeType, image.uri);

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Profile photo cannot be uploaded.');
  }

  let body: Uint8Array | null = null;
  if (image.base64) {
    body = base64ToUint8Array(image.base64);
  } else {
    try {
      const response = await fetch(image.uri);
      const blob = await response.blob();
      const arrayBuf = await new Response(blob).arrayBuffer();
      body = new Uint8Array(arrayBuf);
    } catch (e: any) {
      console.warn('[ProfileService] Failed reading image file:', e?.message || e);
    }
  }

  if (!body || body.byteLength === 0) {
    throw new Error('Could not read image file. Please try selecting the image again.');
  }

  // Predictable user-scoped storage path
  const storagePath = `${userId}/avatar_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(storagePath, body, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });

  if (error) {
    console.error('[ProfileService] Storage upload error:', error.message);
    throw friendlyError(error, 'Failed to upload profile photo to storage. Please try again.');
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);
  if (!data?.publicUrl) {
    throw new Error('Failed to obtain avatar public URL after upload.');
  }

  return data.publicUrl;
}

async function removeAvatarFile(publicUrl?: string | null, userId?: string): Promise<void> {
  const path = getAvatarStoragePath(publicUrl);
  // Only ever delete files inside the current user's own folder
  if (!path || !userId || !path.startsWith(`${userId}/`)) return;
  try {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  } catch (err) {
    console.warn('[ProfileService] Old avatar cleanup skipped:', err);
  }
}

// ---------------------------------------------------------------------------
// Save profile details
// ---------------------------------------------------------------------------

async function persistToProfilesTable(
  userId: string,
  values: { fullName: string; phoneNumber: string | null; dateOfBirth: string | null; avatarUrl: string | null }
): Promise<void> {
  // CRITICAL SAFEGUARD: Never persist raw base64 or local file URIs to database
  let safeAvatarUrl = values.avatarUrl;
  if (safeAvatarUrl && (safeAvatarUrl.startsWith('data:') || safeAvatarUrl.startsWith('file:'))) {
    console.warn('[ProfileService] Rejected invalid avatar URL format (base64 or local file):', safeAvatarUrl.slice(0, 30));
    safeAvatarUrl = null;
  }

  // 1. Preferred path: scoped SECURITY DEFINER RPC (validates server-side)
  const { error: rpcError } = await supabase.rpc('update_my_profile_details', {
    p_full_name: values.fullName,
    p_phone_number: values.phoneNumber,
    p_date_of_birth: values.dateOfBirth,
    p_avatar_url: safeAvatarUrl,
  });

  if (!rpcError) return;
  if (!isMissingFunctionError(rpcError)) {
    throw friendlyError(rpcError, 'Failed to save profile details.');
  }

  // 2. Fallback (migration not yet applied): direct own-row update
  const baseUpdate: Record<string, any> = {
    full_name: values.fullName,
    phone_number: values.phoneNumber,
    avatar_url: safeAvatarUrl,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase
    .from('profiles')
    .update({ ...baseUpdate, date_of_birth: values.dateOfBirth })
    .eq('id', userId);

  if (error && isMissingColumnError(error)) {
    // date_of_birth column not present yet → store it in auth metadata only
    ({ error } = await supabase.from('profiles').update(baseUpdate).eq('id', userId));
  }

  if (error) {
    throw friendlyError(error, 'Failed to save profile details.');
  }
}

export async function saveProfileDetails(
  userId: string,
  input: SaveProfileDetailsInput
): Promise<SaveProfileDetailsResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Profile changes cannot be saved.');
  }
  if (!userId) {
    throw new Error('You must be signed in to update your profile.');
  }

  const fullName = input.fullName.trim();
  const phoneNumber = input.phoneNumber.trim() || null;
  const dateOfBirth = input.dateOfBirth || null;
  const previousAvatarUrl = input.currentAvatarUrl || null;

  // 1. Resolve avatar (upload to Supabase Storage avatars bucket)
  let avatarUrl: string | null = previousAvatarUrl;
  if (input.avatar.kind === 'replace') {
    avatarUrl = await uploadProfileAvatar(userId, input.avatar);
  } else if (input.avatar.kind === 'remove') {
    avatarUrl = null;
  }

  // Guard against any lingering invalid format
  if (avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('file:'))) {
    avatarUrl = null;
  }

  // 2. Persist to profiles table (primary source of truth)
  let tablePersistError: any = null;
  try {
    await persistToProfilesTable(userId, { fullName, phoneNumber, dateOfBirth, avatarUrl });
  } catch (err) {
    console.warn('[ProfileService] Profiles table update notice:', err);
    tablePersistError = err;
  }

  // 3. Mirror into auth user metadata (safeguarded against base64)
  // CRITICAL: NEVER store base64 data URLs in auth.user_metadata because it blows up the JWT header,
  // causing Cloudflare "400 Request Header Or Cookie Too Large" and network failure on all requests.
  const authMetadataUpdates: Record<string, any> = {
    full_name: fullName,
    phone_number: phoneNumber,
    date_of_birth: dateOfBirth,
  };
  if (avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
    authMetadataUpdates.avatar_url = avatarUrl;
  } else if (input.avatar.kind === 'remove' || !avatarUrl) {
    authMetadataUpdates.avatar_url = null;
  }
  // Clear any legacy metadata key if present
  authMetadataUpdates.avatarUrl = null;

  const { error: metaError } = await supabase.auth.updateUser({
    data: authMetadataUpdates,
  });

  if (metaError) {
    console.warn('[ProfileService] Auth metadata sync notice:', metaError.message);
    if (tablePersistError) {
      // Both database table and auth metadata update failed
      if (input.avatar.kind === 'replace' && avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'))) {
        await removeAvatarFile(avatarUrl, userId);
      }
      throw friendlyError(metaError, 'Failed to save profile details.');
    }
  }

  // 4. Clean up the previous photo from storage once the new one is safely saved
  if (input.avatar.kind !== 'keep' && previousAvatarUrl && previousAvatarUrl !== avatarUrl) {
    await removeAvatarFile(previousAvatarUrl, userId);
  }

  // 5. Return a fresh profile built from the updated session user
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user ?? null;
  const profile = await getSupabaseProfile(userId, authUser);
  return { profile, authUser };
}
