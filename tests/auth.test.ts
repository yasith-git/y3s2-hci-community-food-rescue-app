/**
 * Authentication, OTP and Error Mapper Unit Tests
 */

import {
  validateEmail,
  validatePassword,
  validateFullName,
  validateConfirmPassword,
} from '../src/utils/validation';
import { mapAuthError } from '../src/utils/authErrors';

describe('Validation Utilities', () => {
  test('validateEmail validates proper email addresses', () => {
    expect(validateEmail('test@university.edu').isValid).toBe(true);
    expect(validateEmail('invalid-email').isValid).toBe(false);
    expect(validateEmail('').isValid).toBe(false);
  });

  test('validatePassword requires at least 8 characters', () => {
    expect(validatePassword('12345678').isValid).toBe(true);
    expect(validatePassword('1234567').isValid).toBe(false);
    expect(validatePassword('').isValid).toBe(false);
  });

  test('validateFullName requires non-empty name of length >= 2', () => {
    expect(validateFullName('Alex Doe').isValid).toBe(true);
    expect(validateFullName('A').isValid).toBe(false);
    expect(validateFullName('   ').isValid).toBe(false);
  });

  test('validateConfirmPassword checks equality', () => {
    expect(validateConfirmPassword('secret123', 'secret123').isValid).toBe(true);
    expect(validateConfirmPassword('secret123', 'secret456').isValid).toBe(false);
  });
});

describe('Supabase Auth Error Mapper', () => {
  test('maps unverified email error to action-guiding message', () => {
    expect(mapAuthError({ message: 'Email not confirmed' })).toContain(
      'Please verify your email before signing in'
    );
    expect(mapAuthError({ code: 'unverified_email' })).toContain(
      'Please verify your email before signing in'
    );
  });

  test('maps invalid login credentials to user-friendly message', () => {
    expect(mapAuthError({ message: 'Invalid login credentials' })).toContain(
      'Incorrect email or password'
    );
  });

  test('maps OTP expiration or token error to re-request instruction', () => {
    expect(mapAuthError({ message: 'Token has expired or is invalid' })).toContain(
      'Invalid or expired verification code'
    );
  });

  test('maps rate limiting error gracefully', () => {
    expect(mapAuthError({ message: 'over_email_send_rate_limit' })).toContain(
      'Too many verification emails'
    );
  });
});
