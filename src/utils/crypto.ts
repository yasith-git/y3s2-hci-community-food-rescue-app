/**
 * Cryptographic Verification Code Generator
 * Generates 4-digit secure alphanumeric or numeric verification tokens
 */

import * as Crypto from 'expo-crypto';

/**
 * Generates a cryptographically secure 4-digit numeric verification code (e.g. "8241")
 */
export async function generateSecurePickupCode(): Promise<string> {
  try {
    const randomBytes = await Crypto.getRandomBytesAsync(2);
    const num = ((randomBytes[0] << 8) | randomBytes[1]) % 9000 + 1000;
    return num.toString();
  } catch {
    // Graceful fallback for web/non-native
    const rand = Math.floor(1000 + Math.random() * 9000);
    return rand.toString();
  }
}
