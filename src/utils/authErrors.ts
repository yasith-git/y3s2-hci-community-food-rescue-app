/**
 * Centralized Firebase Authentication Error Mapper
 * Maps Firebase Auth error codes to user-friendly accessible messages
 */

export function mapFirebaseAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || error.message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 8 characters long.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again in a few minutes.';
    case 'auth/network-request-failed':
      return "Network connection failed. Please check your internet connection and try again.";
    case 'auth/requires-recent-login':
      return 'For your security, please sign in again to perform this action.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is currently not enabled.';
    case 'auth/expired-action-code':
      return 'This verification link or reset code has expired.';
    case 'auth/invalid-action-code':
      return 'This verification link or reset code is invalid.';
    case 'firebase/unconfigured':
      return 'Firebase project is not yet configured. Please set environment variables.';
    default:
      if (typeof error === 'string') return error;
      return error.message || 'Something went wrong. Please try again.';
  }
}
