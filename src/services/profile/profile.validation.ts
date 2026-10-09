/**
 * Profile Details Validation & Formatting Helpers
 * Community Food Rescue App
 *
 * Pure functions (no React / Supabase imports) so they can be unit tested
 * and reused by any role's profile editor.
 */

export interface ProfileDetailsInput {
  fullName: string;
  phoneNumber: string;
  /** Display format typed by the user: DD/MM/YYYY (may be empty) */
  dateOfBirthText: string;
}

export interface ProfileDetailsErrors {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

export const MIN_PROFILE_AGE = 13;
export const MAX_PROFILE_AGE = 120;

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Auto-format raw keyboard input into DD/MM/YYYY as the user types.
 */
export function formatDobInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Convert an ISO date (YYYY-MM-DD) to display format DD/MM/YYYY.
 */
export function isoToDobDisplay(iso?: string | null): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Parse DD/MM/YYYY into an ISO date string (YYYY-MM-DD).
 * Returns null if the text is not a real calendar date.
 */
export function dobDisplayToIso(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;

  // Use UTC to avoid timezone roll-over when validating the calendar date
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Whole years between an ISO birth date and `now`.
 */
export function calculateAge(isoDob: string, now: Date = new Date()): number {
  const [y, m, d] = isoDob.split('-').map(Number);
  let age = now.getFullYear() - y;
  const monthDiff = now.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d)) {
    age -= 1;
  }
  return age;
}

/**
 * Human-readable date, e.g. "12 March 1998".
 */
export function formatDobLong(iso?: string | null): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}

/**
 * Normalise phone input: keep a leading "+", digits, spaces, dashes, brackets.
 */
export function sanitizePhoneInput(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const body = trimmed.replace(/[^0-9 ()-]/g, '').trim();
  return (hasPlus ? '+' : '') + body;
}

export function validatePhoneNumber(phone: string): string | undefined {
  const trimmed = phone.trim();
  if (!trimmed) return undefined; // optional
  if (!/^\+?[0-9 ()-]{7,20}$/.test(trimmed)) {
    return 'Use digits only, optionally starting with + (e.g. +94 77 123 4567).';
  }
  const digitCount = trimmed.replace(/\D/g, '').length;
  if (digitCount < 9 || digitCount > 15) {
    return 'Mobile number must contain 9–15 digits.';
  }
  return undefined;
}

export function validateDateOfBirth(text: string, now: Date = new Date()): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined; // optional
  const iso = dobDisplayToIso(trimmed);
  if (!iso) return 'Enter a valid date as DD/MM/YYYY.';
  const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  if (iso > todayIso) return 'Date of birth cannot be in the future.';
  const age = calculateAge(iso, now);
  if (age < MIN_PROFILE_AGE) return `You must be at least ${MIN_PROFILE_AGE} years old.`;
  if (age > MAX_PROFILE_AGE) return 'Please check the year you entered.';
  return undefined;
}

export function validateProfileName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters long.';
  if (trimmed.length > 80) return 'Name must be 80 characters or fewer.';
  return undefined;
}

export function validateProfileDetails(
  input: ProfileDetailsInput,
  now: Date = new Date()
): { isValid: boolean; errors: ProfileDetailsErrors } {
  const errors: ProfileDetailsErrors = {
    fullName: validateProfileName(input.fullName),
    phoneNumber: validatePhoneNumber(input.phoneNumber),
    dateOfBirth: validateDateOfBirth(input.dateOfBirthText, now),
  };
  const isValid = !errors.fullName && !errors.phoneNumber && !errors.dateOfBirth;
  return { isValid, errors };
}
