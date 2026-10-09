/**
 * Centralized Supabase / Authentication Error Mapper
 * Maps Auth and database error codes to user-friendly accessible messages
 */

export function mapAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = error.message || '';
  const combined = `${code} ${message}`.toLowerCase();

  if (combined.includes('email not confirmed') || combined.includes('email_not_confirmed') || combined.includes('unverified_email')) {
    return 'Please verify your email before signing in. Check your inbox for the verification code.';
  }
  if (combined.includes('invalid login credentials') || combined.includes('invalid_grant')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (combined.includes('user already registered') || combined.includes('email_exists') || combined.includes('user_already_exists')) {
    return 'An account with this email already exists.';
  }
  if (combined.includes('password should be at least') || combined.includes('weak_password')) {
    return 'Password should be at least 8 characters long.';
  }
  if (combined.includes('email_address_invalid') || combined.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (combined.includes('over_email_send_rate_limit') || combined.includes('too many requests') || combined.includes('rate limit') || combined.includes('429')) {
    return 'Too many verification emails were requested. Please wait a while before trying again.';
  }
  if (combined.includes('token has expired') || combined.includes('otp_expired') || combined.includes('token is invalid') || combined.includes('invalid_token') || combined.includes('invalid otp')) {
    return 'Invalid or expired verification code. Please check the code or request a new one.';
  }
  if (combined.includes('supabase/unconfigured')) {
    return 'Supabase is not configured. Please set environment variables in .env.';
  }
  if (combined.includes('network') || combined.includes('fetch failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (typeof error === 'string') return error;
  return error.message || 'Something went wrong. Please try again.';
}

export const mapFirebaseAuthError = mapAuthError;

