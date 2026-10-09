/**
 * Supabase Client Initialization
 * Community Food Rescue App (Supabase Backend)
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const sanitizeEnv = (val?: string): string => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
};

const rawUrl = sanitizeEnv(process.env.EXPO_PUBLIC_SUPABASE_URL);
const rawKey = sanitizeEnv(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

// Strip /rest/v1 or trailing slashes if accidentally appended
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const isSupabaseConfigured = Boolean(
  cleanUrl &&
    rawKey &&
    cleanUrl.startsWith('https://') &&
    !cleanUrl.includes('placeholder') &&
    rawKey.length > 20
);

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    '[Supabase] Missing or incomplete EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env. Running in unconfigured preview mode.'
  );
}

const FALLBACK_URL = 'https://beioqyfdzekknqbrgmaz.supabase.co';
const FALLBACK_KEY = 'sb_publishable_OfrvYdHBmYoDaeUtUUhK0w_FQmPaMmX';

const supabaseUrl = cleanUrl && cleanUrl.startsWith('https://') && !cleanUrl.includes('placeholder')
  ? cleanUrl
  : FALLBACK_URL;
const supabaseAnonKey = rawKey && rawKey.length > 20 && !rawKey.includes('placeholder')
  ? rawKey
  : FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: false,
  },
});
