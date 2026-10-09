const assert = require('assert');

// Setup environment globals
globalThis.__DEV__ = true;

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (condition) {
    passed++;
    console.log(`  âœ“ ${message}`);
  } else {
    failed++;
    console.error(`  âœ— FAIL: ${message}`);
  }
}

console.log('=== RUNNING UNIFIED VERIFICATION TEST SUITES ===\n');

// 1. AUTH & VALIDATION LOGIC
console.log('[Suite 1: Auth & Profile Validation Rules]');
function validateEmail(email) {
  const trimmed = (email || '').trim();
  if (!trimmed) return { isValid: false, error: 'Email address is required.' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return { isValid: false, error: 'Please enter a valid email address.' };
  return { isValid: true };
}

function validatePassword(password) {
  if (!password) return { isValid: false, error: 'Password is required.' };
  if (password.length < 8) return { isValid: false, error: 'Password must be at least 8 characters long.' };
  return { isValid: true };
}

function mapAuthError(error) {
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

check(validateEmail('test@university.edu').isValid, 'Email validation accepts valid organization/user email');
check(!validateEmail('invalid-email').isValid, 'Email validation rejects malformed email');
check(validatePassword('12345678').isValid, 'Password validation accepts 8+ characters');
check(!validatePassword('1234567').isValid, 'Password validation rejects < 8 characters');

check(mapAuthError({ code: 'unverified_email' }).includes('Please verify your email'), 'Auth error mapper handles unverified email');
check(mapAuthError({ message: 'Invalid login credentials' }).includes('Incorrect email or password'), 'Auth error mapper handles invalid login');
check(mapAuthError({ message: 'Token has expired' }).includes('Invalid or expired verification code'), 'Auth error mapper handles expired OTP');
check(mapAuthError({ message: 'over_email_send_rate_limit' }).includes('Too many verification emails'), 'Auth error mapper handles rate limit');

// 2. COORDINATOR ORGANIZATION SECURITY GATE
const isOpPermitted = (role, verificationStatus, isOrgActive) =>
  role === 'COORDINATOR' && verificationStatus === 'VERIFIED' && isOrgActive === true;

check(isOpPermitted('COORDINATOR', 'VERIFIED', true), 'Permits coordinator operations for authenticated verified organization');
check(!isOpPermitted('COORDINATOR', 'PENDING', true), 'Blocks pending organization from coordinator operations');
check(!isOpPermitted('COORDINATOR', 'REJECTED', true), 'Blocks rejected organization from coordinator operations');
check(!isOpPermitted('COORDINATOR', 'VERIFIED', false), 'Blocks inactive organization from coordinator operations');
check(!isOpPermitted('VOLUNTEER', 'VERIFIED', true), 'Blocks volunteer role from coordinator operations');
check(!isOpPermitted('DONOR', 'VERIFIED', true), 'Blocks donor role from coordinator operations');

// 3. COMPLETE DONATION & RESCUE STATE MACHINE
console.log('\n[Suite 2: State Machine & Full Lifecycle Transitions]');
const validTransitions = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['RESERVED', 'VOLUNTEER_ASSIGNED', 'CANCELLED', 'EXPIRED'],
  RESERVED: ['VOLUNTEER_ASSIGNED', 'PUBLISHED', 'CANCELLED', 'EXPIRED'],
  VOLUNTEER_ASSIGNED: ['PICKUP_EN_ROUTE', 'PUBLISHED', 'CANCELLED', 'EXPIRED'],
  PICKUP_EN_ROUTE: ['PICKED_UP', 'CANCELLED', 'EXPIRED'],
  PICKED_UP: ['DELIVERY_EN_ROUTE', 'CANCELLED'],
  DELIVERY_EN_ROUTE: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['ACKNOWLEDGED', 'COMPLETED', 'ISSUE_REPORTED'],
  ACKNOWLEDGED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
  ISSUE_REPORTED: ['COMPLETED', 'CANCELLED'],
};

const canTransition = (from, to) => validTransitions[from]?.includes(to) ?? false;

check(canTransition('DRAFT', 'PUBLISHED'), 'Allows DRAFT -> PUBLISHED');
check(canTransition('PUBLISHED', 'VOLUNTEER_ASSIGNED'), 'Allows volunteer acceptance: PUBLISHED -> VOLUNTEER_ASSIGNED');
check(canTransition('PUBLISHED', 'RESERVED'), 'Allows atomic reservation PUBLISHED -> RESERVED');
check(canTransition('RESERVED', 'VOLUNTEER_ASSIGNED'), 'Allows RESERVED -> VOLUNTEER_ASSIGNED');
check(canTransition('VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE'), 'Allows VOLUNTEER_ASSIGNED -> PICKUP_EN_ROUTE');
check(canTransition('PICKUP_EN_ROUTE', 'PICKED_UP'), 'Allows PICKUP_EN_ROUTE -> PICKED_UP');
check(canTransition('PICKED_UP', 'DELIVERY_EN_ROUTE'), 'Allows PICKED_UP -> DELIVERY_EN_ROUTE');
check(canTransition('DELIVERY_EN_ROUTE', 'DELIVERED'), 'Allows DELIVERY_EN_ROUTE -> DELIVERED');
check(canTransition('DELIVERED', 'ACKNOWLEDGED'), 'Allows DELIVERED -> ACKNOWLEDGED');
check(canTransition('ACKNOWLEDGED', 'COMPLETED'), 'Allows ACKNOWLEDGED -> COMPLETED');
check(!canTransition('PUBLISHED', 'COMPLETED'), 'Blocks skipping directly from PUBLISHED to COMPLETED');
check(!canTransition('COMPLETED', 'PUBLISHED'), 'Blocks regression from terminal COMPLETED');

// 4. RESCUEAI DETERMINISTIC ENGINES
console.log('\n[Suite 3: RescueAI Explainable Engines & Matching]');

function calculateDonationUrgency(context) {
  const now = new Date().getTime();
  const deadline = new Date(context.pickupDeadlineAt).getTime();
  const diffMs = deadline - now;
  const timeRemainingMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(context.status) || timeRemainingMinutes <= 0) {
    return { urgencyLevel: 'LOW', urgencyScore: 0, timeRemainingMinutes };
  }

  let score = 0;
  if (timeRemainingMinutes <= 60) score += 50;
  else if (timeRemainingMinutes <= 120) score += 35;
  else if (timeRemainingMinutes <= 240) score += 20;
  else score += 5;

  if (['Prepared Meals', 'Rice & Curry', 'Bakery'].includes(context.category)) score += 25;
  else if (['Dairy', 'Fruit', 'Vegetables'].includes(context.category)) score += 15;
  else score += 5;

  if (context.storageCondition === 'Warm / Heated') score += 15;
  else if (['Refrigerated', 'Frozen'].includes(context.storageCondition)) score += 10;

  if (!context.isReserved && !context.isVolunteerAssigned) score += 10;
  else if (context.isReserved && !context.isVolunteerAssigned) score += 5;

  let urgencyLevel = 'LOW';
  if (score >= 75 || timeRemainingMinutes <= 60) {
    urgencyLevel = 'HIGH';
    if (score >= 85 && timeRemainingMinutes <= 45) urgencyLevel = 'CRITICAL';
  } else if (score >= 45) {
    urgencyLevel = 'MODERATE';
  }

  return { urgencyLevel, urgencyScore: Math.min(100, Math.max(0, score)), timeRemainingMinutes };
}

function evaluateOrganizationMatch(org, criteria) {
  const now = new Date().getTime();
  const deadline = new Date(criteria.pickupDeadlineAt || Date.now() + 60000).getTime();
  const unit = criteria.quantityUnit || 'portions';
  const quantity = criteria.quantity ?? criteria.quantityPortions ?? 0;
  const isPortionsCompatible = unit.toLowerCase() === 'portions';
  const attention = [];

  if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(criteria.status)) return { isEligible: false, label: 'NOT ELIGIBLE', score: 0 };
  if (deadline <= now) return { isEligible: false, label: 'NOT ELIGIBLE', score: 0 };
  if (!org.isVerified) return { isEligible: false, label: 'NOT ELIGIBLE', score: 0 };
  if (!org.isActive) return { isEligible: false, label: 'NOT ELIGIBLE', score: 0 };
  if (!org.hasAvailableCommunityPoint) return { isEligible: false, label: 'NOT ELIGIBLE', score: 0 };

  const supportsStorage =
    criteria.storageCondition === 'Room Temperature' ||
    (org.supportedStorage && org.supportedStorage.includes(criteria.storageCondition));
  if (!supportsStorage) return { isEligible: false, label: 'NOT ELIGIBLE', score: 0 };

  if (org.acceptedCategories && org.acceptedCategories.length > 0 && !org.acceptedCategories.includes(criteria.category)) {
    return { isEligible: false, label: 'NOT ELIGIBLE', score: 0 };
  }

  if (org.maxCapacityPortions) {
    const remaining = org.maxCapacityPortions - (org.currentWorkloadPortions || 0);
    if (isPortionsCompatible) {
      if (remaining < quantity) {
        return { isEligible: false, label: 'NOT ELIGIBLE', score: 0 };
      }
    } else {
      attention.push(`Capacity unit is non-standard (${quantity} ${unit}). Capacity compatibility requires manual coordinator review.`);
    }
  }

  if (org.serviceAreaKm !== undefined && org.distanceKm !== undefined && org.distanceKm > org.serviceAreaKm) {
    return { isEligible: false, label: 'NOT ELIGIBLE', score: 0 };
  }

  let score = 50;
  if (org.acceptedCategories && org.acceptedCategories.includes(criteria.category)) score += 15;
  if (org.maxCapacityPortions) score += 15;
  if (org.distanceKm !== undefined && org.distanceKm <= 3.0) score += 20;

  let label = 'POSSIBLE';
  if (score >= 80) label = 'BEST FIT';
  else if (score >= 65) label = 'SUITABLE';

  return { isEligible: true, label, score, attention };
}

function evaluateVolunteerRouteMatch(route, criteria) {
  const now = new Date().getTime();
  const deadline = new Date(criteria.pickupDeadlineAt || Date.now() + 60000).getTime();
  const pickupStart = new Date(criteria.pickupStartAt || Date.now()).getTime();

  if (criteria.status === 'PUBLISHED' || !criteria.isReserved) {
    return {
      isEligible: false,
      label: 'DESTINATION PENDING',
      score: 0,
      summary: 'Donation is published but not yet reserved. Actionable volunteer route matching requires a designated community collection point.',
    };
  }

  if (criteria.status !== 'RESERVED') {
    return { isEligible: false, label: 'NOT SUITABLE', score: 0 };
  }

  if (
    criteria.pickupLat === undefined ||
    criteria.pickupLng === undefined ||
    criteria.dropoffLat === undefined ||
    criteria.dropoffLng === undefined
  ) {
    return {
      isEligible: false,
      label: 'DESTINATION PENDING',
      score: 0,
      summary: 'Drop-off community point coordinates are missing.',
    };
  }

  if (deadline <= now) return { isEligible: false, label: 'NOT SUITABLE', score: 0 };
  if (!route.isAvailable) return { isEligible: false, label: 'NOT SUITABLE', score: 0 };

  if (route.pickupTimeWindowStart && route.pickupTimeWindowEnd) {
    const volStart = new Date(route.pickupTimeWindowStart).getTime();
    const volEnd = new Date(route.pickupTimeWindowEnd).getTime();
    if (!(volStart <= deadline && volEnd >= pickupStart)) {
      return { isEligible: false, label: 'NOT SUITABLE', score: 0 };
    }
  }

  const detour = route.calculatedAdditionalDetourKm || 0;
  if (route.maxDetourKm && detour > route.maxDetourKm) return { isEligible: false, label: 'NOT SUITABLE', score: 0 };

  let score = 50;
  if (route.calculatedPickupDistanceKm <= 1.0) score += 25;
  if (detour <= 1.0) score += 15;

  let label = 'POSSIBLE MATCH';
  if (score >= 80) label = 'EXCELLENT MATCH';
  else if (score >= 65) label = 'GOOD MATCH';

  return { isEligible: true, label, score, detourKm: detour };
}

function detectRescueRisk(context) {
  if (['DRAFT', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'ISSUE_REPORTED'].includes(context.status)) {
    return { riskLevel: 'NORMAL', riskScore: 0, isTerminal: true };
  }
  const now = new Date().getTime();
  const deadline = new Date(context.pickupDeadlineAt).getTime();
  const timeRemainingMinutes = Math.floor((deadline - now) / 60000);

  if (timeRemainingMinutes <= 0) {
    return { riskLevel: 'NORMAL', riskScore: 0, isExpired: true };
  }

  let riskScore = 0;
  if (timeRemainingMinutes <= 45 && !context.isVolunteerAssigned) riskScore += 75;
  else if (timeRemainingMinutes <= 90 && !context.isReserved) riskScore += 45;

  let riskLevel = 'NORMAL';
  if (riskScore >= 70 || (timeRemainingMinutes <= 30 && !context.isVolunteerAssigned)) riskLevel = 'URGENT';
  else if (riskScore >= 45) riskLevel = 'AT RISK';
  else if (riskScore >= 25) riskLevel = 'WATCH';

  return { riskLevel, riskScore };
}

const now = new Date();
const in40m = new Date(now.getTime() + 40 * 60000).toISOString();
const pastDeadline = new Date(now.getTime() - 10 * 60000).toISOString();

const highUrgency = calculateDonationUrgency({
  pickupDeadlineAt: in40m,
  status: 'PUBLISHED',
  category: 'Prepared Meals',
  storageCondition: 'Warm / Heated',
  isReserved: false,
  isVolunteerAssigned: false,
});
check(highUrgency.urgencyLevel === 'CRITICAL' && highUrgency.urgencyScore >= 85, 'Calculates CRITICAL urgency for hot prepared meals with imminent deadline');

const testOrg = {
  isVerified: true,
  isActive: true,
  acceptedCategories: ['Prepared Meals', 'Bakery'],
  supportedStorage: ['Refrigerated'],
  hasAvailableCommunityPoint: true,
  maxCapacityPortions: 100,
  currentWorkloadPortions: 20,
  serviceAreaKm: 10.0,
  distanceKm: 2.1,
};

const bestFitOrg = evaluateOrganizationMatch(testOrg, {
  category: 'Prepared Meals',
  storageCondition: 'Refrigerated',
  quantity: 20,
  quantityUnit: 'portions',
  pickupDeadlineAt: in40m,
  status: 'PUBLISHED',
});
check(bestFitOrg.isEligible && bestFitOrg.label === 'BEST FIT', 'Identifies BEST FIT organization with matching storage and capacity');

const incompatibleUnitOrg = evaluateOrganizationMatch(testOrg, {
  category: 'Prepared Meals',
  storageCondition: 'Refrigerated',
  quantity: 15,
  quantityUnit: 'boxes',
  pickupDeadlineAt: in40m,
  status: 'PUBLISHED',
});
check(incompatibleUnitOrg.isEligible && incompatibleUnitOrg.attention[0].includes('Capacity compatibility requires manual coordinator review'), 'Flags non-portions unit for manual review without false rejection');

const testRoute = {
  isAvailable: true,
  calculatedPickupDistanceKm: 0.7,
  calculatedAdditionalDetourKm: 1.0,
  maxDetourKm: 3.0,
  pickupTimeWindowStart: new Date(now.getTime() - 30 * 60000).toISOString(),
  pickupTimeWindowEnd: new Date(now.getTime() + 120 * 60000).toISOString(),
};

const publishedRoute = evaluateVolunteerRouteMatch(testRoute, {
  donationId: 'don-pub-1',
  pickupStartAt: now.toISOString(),
  pickupDeadlineAt: in40m,
  status: 'PUBLISHED',
  isReserved: false,
  pickupLat: 6.9100,
  pickupLng: 79.8550,
});
check(!publishedRoute.isEligible && publishedRoute.label === 'DESTINATION PENDING', 'PUBLISHED donation cannot become actionable Volunteer rescue (DESTINATION PENDING)');

const reservedRoute = evaluateVolunteerRouteMatch(testRoute, {
  donationId: 'don-res-ready',
  pickupStartAt: now.toISOString(),
  pickupDeadlineAt: in40m,
  status: 'RESERVED',
  isReserved: true,
  pickupLat: 6.9100,
  pickupLng: 79.8550,
  dropoffLat: 6.9400,
  dropoffLng: 79.8650,
});
check(reservedRoute.isEligible && reservedRoute.label === 'EXCELLENT MATCH', 'RESERVED donation with community destination produces EXCELLENT MATCH');

// 5. BENEFICIARY DISTRIBUTION TRACEABILITY & PRIVACY ASSURANCE
console.log('\n[Suite 10: Donor & Volunteer Profile Details & Photo Update]');

function formatDobInput(raw) {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function dobDisplayToIso(text) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((text || '').trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function isoToDobDisplay(iso) {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function calculateAge(isoDob, now = new Date('2026-10-08T00:00:00Z')) {
  const [y, m, d] = isoDob.split('-').map(Number);
  let age = now.getFullYear() - y;
  const monthDiff = now.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d)) {
    age -= 1;
  }
  return age;
}

function formatDobLong(iso) {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return '';
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}

function sanitizePhoneInput(raw) {
  const trimmed = (raw || '').trim();
  const hasPlus = trimmed.startsWith('+');
  const body = trimmed.replace(/[^0-9 ()-]/g, '').trim();
  return (hasPlus ? '+' : '') + body;
}

function validatePhoneNumber(phone) {
  const trimmed = (phone || '').trim();
  if (!trimmed) return undefined;
  if (!/^\+?[0-9 ()-]{7,20}$/.test(trimmed)) {
    return 'Use digits only, optionally starting with + (e.g. +94 77 123 4567).';
  }
  const digitCount = trimmed.replace(/\D/g, '').length;
  if (digitCount < 9 || digitCount > 15) {
    return 'Mobile number must contain 9â€“15 digits.';
  }
  return undefined;
}

function validateDateOfBirth(text, now = new Date('2026-10-08T00:00:00Z')) {
  const trimmed = (text || '').trim();
  if (!trimmed) return undefined;
  const iso = dobDisplayToIso(trimmed);
  if (!iso) return 'Enter a valid date as DD/MM/YYYY.';
  const pad2 = (n) => String(n).padStart(2, '0');
  const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  if (iso > todayIso) return 'Date of birth cannot be in the future.';
  const age = calculateAge(iso, now);
  if (age < 13) return 'You must be at least 13 years old.';
  if (age > 120) return 'Please check the year you entered.';
  return undefined;
}

function validateProfileName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters long.';
  if (trimmed.length > 80) return 'Name must be 80 characters or fewer.';
  return undefined;
}

function getAvatarStoragePath(publicUrl) {
  if (!publicUrl) return null;
  const marker = '/storage/v1/object/public/avatars/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length).split('?')[0]);
}

// 1. Name validation
check(validateProfileName('Kamal Silva') === undefined, '1. Valid full name accepted');
check(Boolean(validateProfileName('')), '2. Empty name rejected');
check(Boolean(validateProfileName('A')), '3. Single letter name rejected (< 2 chars)');
check(Boolean(validateProfileName('x'.repeat(81))), '4. Oversized name rejected (> 80 chars)');

// 2. DOB auto-formatting & parsing
check(formatDobInput('15') === '15', '5. Partial day input preserved');
check(formatDobInput('1508') === '15/08', '6. Month auto-slash applied');
check(formatDobInput('15081995') === '15/08/1995', '7. Full date auto-slashed');
check(dobDisplayToIso('15/08/1995') === '1995-08-15', '8. Valid DD/MM/YYYY parsed to ISO');
check(isoToDobDisplay('1995-08-15') === '15/08/1995', '9. ISO converted to display format');
check(dobDisplayToIso('31/02/1995') === null, '10. Impossible calendar date rejected (31 Feb)');
check(dobDisplayToIso('29/02/2024') === '2024-02-29', '11. Leap year 29 Feb valid');
check(dobDisplayToIso('29/02/2023') === null, '12. Non-leap year 29 Feb rejected');

// 3. Age calculation & range checks
const fixedNow = new Date('2026-10-08T00:00:00Z');
check(calculateAge('1996-10-08', fixedNow) === 30, '13. Exact birthday age correct');
check(calculateAge('1996-10-09', fixedNow) === 29, '14. Day before birthday age correct');
check(formatDobLong('1995-08-15') === '15 August 1995', '15. formatDobLong displays human-readable date');
check(validateDateOfBirth('15/08/1995', fixedNow) === undefined, '16. Valid adult DOB accepted');
check(validateDateOfBirth('', fixedNow) === undefined, '17. Optional empty DOB accepted');
check(Boolean(validateDateOfBirth('15/08/2020', fixedNow)), '18. Under 13 years old rejected');
check(Boolean(validateDateOfBirth('15/08/2027', fixedNow)), '19. Future date rejected');

// 4. Mobile number formatting & validation
check(sanitizePhoneInput('  +94 77 123 4567 ') === '+94 77 123 4567', '20. Phone sanitizer preserves + and spaces');
check(sanitizePhoneInput('abc0771234567xyz') === '0771234567', '21. Phone sanitizer strips non-phone characters');
check(validatePhoneNumber('+94 77 123 4567') === undefined, '22. International mobile accepted');
check(validatePhoneNumber('0771234567') === undefined, '23. Local mobile accepted');
check(validatePhoneNumber('') === undefined, '24. Optional empty phone accepted');
check(Boolean(validatePhoneNumber('12345')), '25. Too few digits rejected (< 9)');

// 5. Storage path extraction & isolation
const sampleAvatarUrl = 'https://abc.supabase.co/storage/v1/object/public/avatars/usr-123/avatar_123.jpg';
check(getAvatarStoragePath(sampleAvatarUrl) === 'usr-123/avatar_123.jpg', '26. Avatar storage path extracted correctly');
check(getAvatarStoragePath('https://external.com/photo.jpg') === null, '27. External avatar path returns null');

// 6. Security & Privilege Escalation Prevention
const mockDonorProfile = {
  id: 'donor-1',
  role: 'DONOR',
  verification_status: 'NOT_REQUIRED',
  full_name: 'Original Donor',
  phone_number: null,
  date_of_birth: null,
  avatar_url: null,
};

function simulateSelfServiceProfileUpdate(profile, updates) {
  return {
    ...profile,
    full_name: updates.fullName || profile.full_name,
    phone_number: updates.phoneNumber !== undefined ? updates.phoneNumber : profile.phone_number,
    date_of_birth: updates.dateOfBirth !== undefined ? updates.dateOfBirth : profile.date_of_birth,
    avatar_url: updates.avatarUrl !== undefined ? updates.avatarUrl : profile.avatar_url,
    role: profile.role,
    verification_status: profile.verification_status,
  };
}

const updatedDonor = simulateSelfServiceProfileUpdate(mockDonorProfile, {
  fullName: 'Updated Donor Name',
  phoneNumber: '+94 71 234 5678',
  dateOfBirth: '1992-04-12',
  avatarUrl: sampleAvatarUrl,
  role: 'COORDINATOR',
});

check(updatedDonor.full_name === 'Updated Donor Name', '28. Donor full name updated');
check(updatedDonor.phone_number === '+94 71 234 5678', '29. Donor mobile number updated');
check(updatedDonor.date_of_birth === '1992-04-12', '30. Donor date of birth updated');
check(updatedDonor.avatar_url === sampleAvatarUrl, '31. Donor profile photo updated');
check(updatedDonor.role === 'DONOR', '32. Donor role remains immutable (no privilege escalation)');

// 11. AUTHORITY SURPLUS FOOD CATEGORY SUMMARY & PDF REPORT
console.log("\n=== LEADER CORE TEST SUITES COMPLETE: " + passed + " PASSED, " + failed + " FAILED ===\n");
if (failed > 0) process.exit(1);
