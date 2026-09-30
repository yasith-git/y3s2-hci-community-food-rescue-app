/**
 * Authentication and Validation Utilities Unit Tests
 */

import {
  validateEmail,
  validatePassword,
  validateFullName,
  validateConfirmPassword,
} from '../src/utils/validation';
import { mapFirebaseAuthError } from '../src/utils/authErrors';

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

describe('Firebase Error Mapper', () => {
  test('maps common error codes to friendly text', () => {
    expect(mapFirebaseAuthError({ code: 'auth/invalid-credential' })).toContain(
      'Incorrect email or password'
    );
    expect(mapFirebaseAuthError({ code: 'auth/email-already-in-use' })).toContain(
      'already exists'
    );
    expect(mapFirebaseAuthError({ code: 'auth/network-request-failed' })).toContain(
      'Network connection failed'
    );
  });
});
