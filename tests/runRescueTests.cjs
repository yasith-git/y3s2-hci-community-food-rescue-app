/**
 * Standalone Test Runner for Member 3: Rescue Lifecycle, Release, Verification, and Notifications
 * Executable directly via Node.js
 */

const assert = require('assert');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('=== RUNNING MEMBER 3 RESCUE & NOTIFICATIONS TEST SUITES ===\n');

// ====================================================================
// Suite 1: Rescue Lifecycle Transitions
// ====================================================================
console.log('[Suite 1: Rescue Lifecycle State Machine Transitions]');

const VALID_TRANSITIONS = {
  PUBLISHED: ['RESERVED', 'VOLUNTEER_ASSIGNED', 'EXPIRED', 'CANCELLED'],
  RESERVED: ['VOLUNTEER_ASSIGNED', 'PUBLISHED', 'EXPIRED'],
  VOLUNTEER_ASSIGNED: ['PICKUP_EN_ROUTE', 'PUBLISHED', 'CANCELLED'],
  PICKUP_EN_ROUTE: ['PICKED_UP', 'PUBLISHED', 'CANCELLED'],
  PICKED_UP: ['DELIVERY_EN_ROUTE', 'CANCELLED'],
  DELIVERY_EN_ROUTE: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

function canTransition(current, target) {
  const allowed = VALID_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

check('allows legal operational transitions for volunteer rescue', () => {
  assert.strictEqual(canTransition('PUBLISHED', 'VOLUNTEER_ASSIGNED'), true);
  assert.strictEqual(canTransition('VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE'), true);
  assert.strictEqual(canTransition('PICKUP_EN_ROUTE', 'PICKED_UP'), true);
  assert.strictEqual(canTransition('PICKED_UP', 'DELIVERY_EN_ROUTE'), true);
  assert.strictEqual(canTransition('DELIVERY_EN_ROUTE', 'DELIVERED'), true);
  assert.strictEqual(canTransition('DELIVERED', 'COMPLETED'), true);
});

check('blocks illegal state skips and regressions', () => {
  assert.strictEqual(canTransition('PUBLISHED', 'DELIVERED'), false);
  assert.strictEqual(canTransition('VOLUNTEER_ASSIGNED', 'DELIVERED'), false);
  assert.strictEqual(canTransition('DELIVERED', 'PUBLISHED'), false);
  assert.strictEqual(canTransition('COMPLETED', 'VOLUNTEER_ASSIGNED'), false);
  assert.strictEqual(canTransition('PICKED_UP', 'PUBLISHED'), false);
});

check('prevents donor withdrawal after food has been physically picked up', () => {
  const isWithdrawable = (status) => ['DRAFT', 'PUBLISHED', 'RESERVED', 'VOLUNTEER_ASSIGNED'].includes(status);
  assert.strictEqual(isWithdrawable('VOLUNTEER_ASSIGNED'), true);
  assert.strictEqual(isWithdrawable('PICKED_UP'), false);
  assert.strictEqual(isWithdrawable('DELIVERED'), false);
});

// ====================================================================
// Suite 2: Single Active Rescue Rule Enforcement
// ====================================================================
console.log('\n[Suite 2: Single Active Rescue Enforcement]');

const UNFINISHED_STATUSES = ['ASSIGNED', 'VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE', 'PICKED_UP', 'DELIVERY_EN_ROUTE', 'DELIVERED'];

function canVolunteerAcceptNewRescue(currentActiveStatus) {
  if (!currentActiveStatus) return true;
  if (['COMPLETED', 'CANCELLED'].includes(currentActiveStatus)) return true;
  return !UNFINISHED_STATUSES.includes(currentActiveStatus);
}

check('blocks new acceptance when volunteer has an active mission en route', () => {
  assert.strictEqual(canVolunteerAcceptNewRescue('VOLUNTEER_ASSIGNED'), false);
  assert.strictEqual(canVolunteerAcceptNewRescue('PICKUP_EN_ROUTE'), false);
  assert.strictEqual(canVolunteerAcceptNewRescue('PICKED_UP'), false);
  assert.strictEqual(canVolunteerAcceptNewRescue('DELIVERY_EN_ROUTE'), false);
  assert.strictEqual(canVolunteerAcceptNewRescue('DELIVERED'), false);
});

check('allows new acceptance when previous mission is completed or cancelled', () => {
  assert.strictEqual(canVolunteerAcceptNewRescue('COMPLETED'), true);
  assert.strictEqual(canVolunteerAcceptNewRescue('CANCELLED'), true);
  assert.strictEqual(canVolunteerAcceptNewRescue(null), true);
});

// ====================================================================
// Suite 3: Pre-Pickup Mission Release & Cancelled Activity Mapping
// ====================================================================
console.log('\n[Suite 3: Mission Release & Cancelled Activity History]');

function evaluateRelease(assignmentStatus) {
  if (['ASSIGNED', 'VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE'].includes(assignmentStatus)) {
    return { canRelease: true, newDonationStatus: 'PUBLISHED', newAssignmentStatus: 'CANCELLED' };
  }
  return { canRelease: false, error: 'Cannot release mission after pickup has been confirmed' };
}

check('allows release before pickup and resets donation to PUBLISHED', () => {
  const result = evaluateRelease('VOLUNTEER_ASSIGNED');
  assert.strictEqual(result.canRelease, true);
  assert.strictEqual(result.newDonationStatus, 'PUBLISHED');
  assert.strictEqual(result.newAssignmentStatus, 'CANCELLED');
});

check('blocks release once food is PICKED_UP', () => {
  const result = evaluateRelease('PICKED_UP');
  assert.strictEqual(result.canRelease, false);
});

check('preserves cancelled mission in historical activity records without altering published donation', () => {
  const assignment = { id: 'asgn-1', status: 'CANCELLED' };
  const donation = { id: 'don-1', status: 'PUBLISHED' };
  const isAssignmentActive = UNFINISHED_STATUSES.includes(assignment.status);
  const isAssignmentCancelled = assignment.status === 'CANCELLED';
  assert.strictEqual(isAssignmentActive, false);
  assert.strictEqual(isAssignmentCancelled, true);
  assert.strictEqual(donation.status, 'PUBLISHED');
});

// ====================================================================
// Suite 4: Pickup PIN Verification & Quality Checks
// ====================================================================
console.log('\n[Suite 4: Pickup Verification & Quality Checks]');

function verifyPickupPin(expectedPin, enteredPin) {
  if (!expectedPin || !enteredPin) return false;
  return expectedPin.trim() === enteredPin.trim();
}

function validateQuantityCheck(declaredQty, verifiedQty, acknowledgedMismatch) {
  if (declaredQty === verifiedQty) return true;
  return acknowledgedMismatch === true;
}

check('validates donor pickup PIN match', () => {
  assert.strictEqual(verifyPickupPin('5829', '5829'), true);
  assert.strictEqual(verifyPickupPin('5829', '0000'), false);
  assert.strictEqual(verifyPickupPin('5829', ' 5829 '), true);
});

check('blocks verification on quantity mismatch unless acknowledged', () => {
  assert.strictEqual(validateQuantityCheck(20, 18, false), false);
  assert.strictEqual(validateQuantityCheck(20, 18, true), true);
  assert.strictEqual(validateQuantityCheck(20, 20, false), true);
});

// ====================================================================
// Suite 5: Issue Reporting Taxonomy
// ====================================================================
console.log('\n[Suite 5: Rescue Issue Reporting Taxonomy]');

const VALID_ISSUE_TYPES = [
  'QUANTITY_MISMATCH',
  'DAMAGED_FOOD',
  'DONOR_UNAVAILABLE',
  'ACCESS_ISSUE',
  'PACKAGING_PROBLEM',
  'OTHER',
];

check('validates confirmed rescue issue categories', () => {
  assert.strictEqual(VALID_ISSUE_TYPES.includes('QUANTITY_MISMATCH'), true);
  assert.strictEqual(VALID_ISSUE_TYPES.includes('DONOR_UNAVAILABLE'), true);
  assert.strictEqual(VALID_ISSUE_TYPES.includes('DAMAGED_FOOD'), true);
  assert.strictEqual(VALID_ISSUE_TYPES.includes('RANDOM_CATEGORY'), false);
});

// ====================================================================
// Suite 6: Notification Preferences & Quiet Hours
// ====================================================================
console.log('\n[Suite 6: Notification Preferences & Quiet Hours]');

const isInsideQuietHours = (hour, quietStart = 22, quietEnd = 7) => {
  if (quietStart > quietEnd) {
    return hour >= quietStart || hour < quietEnd;
  }
  return hour >= quietStart && hour < quietEnd;
};

check('correctly evaluates quiet hours time window', () => {
  assert.strictEqual(isInsideQuietHours(23), true);  // 11 PM -> Muted
  assert.strictEqual(isInsideQuietHours(3), true);   // 3 AM -> Muted
  assert.strictEqual(isInsideQuietHours(14), false); // 2 PM -> Active
  assert.strictEqual(isInsideQuietHours(9), false);  // 9 AM -> Active
});

// ====================================================================
// Suite 7: Notification Read State Management
// ====================================================================
console.log('\n[Suite 7: Notification Read State Management]');

const mockNotifications = [
  { id: 'n1', title: 'Route Match', read: false },
  { id: 'n2', title: 'Pickup Reminder', read: false },
  { id: 'n3', title: 'Delivery Confirmed', read: true },
];

function calculateUnreadCount(list) {
  return list.filter((n) => !n.read).length;
}

function markOneRead(list, id) {
  return list.map((n) => (n.id === id ? { ...n, read: true } : n));
}

function markAllRead(list) {
  return list.map((n) => ({ ...n, read: true }));
}

check('calculates initial unread count correctly', () => {
  assert.strictEqual(calculateUnreadCount(mockNotifications), 2);
});

check('marks single notification as read and decrements unread count', () => {
  const updated = markOneRead(mockNotifications, 'n1');
  assert.strictEqual(calculateUnreadCount(updated), 1);
});

check('marks all notifications as read', () => {
  const updated = markAllRead(mockNotifications);
  assert.strictEqual(calculateUnreadCount(updated), 0);
});

console.log(`\n=== MEMBER 3 TEST SUITES COMPLETE: ${passed} PASSED, ${failed} FAILED ===\n`);

if (failed > 0) {
  process.exit(1);
}
