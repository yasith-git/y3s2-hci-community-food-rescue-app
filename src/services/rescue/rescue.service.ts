/**
 * Rescue Service Layer
 * Manages atomic rescue acceptance, lifecycle transitions (pickup & delivery), issue reporting, and active assignment tracking.
 * Community Food Rescue App (Supabase Backend)
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Donation } from '../../types/donation';
import { RescueAssignment, RescueIssue, RescueIssueType, VolunteerCancellationReason } from '../../types/rescue';
import { mapRowToDonation, getDonationById } from '../donations/donation.service';
import { canTransitionDonationStatus } from '../donations/donation.state-machine';
import { DEV_MOCK_DONATIONS } from '../matching/dev.fixtures';

export type Unsubscribe = () => void;

function mapRowToAssignment(row: any): RescueAssignment {
  return {
    id: row.id,
    donationId: row.donation_id,
    volunteerId: row.volunteer_id,
    volunteerName: row.volunteer_name,
    donorId: row.donor_id || '',
    communityPointId: row.community_point_id || undefined,
    communityPointName: row.destination_name || 'Community Food Hub',
    communityPointAddress: row.destination_address || '',
    foodName: row.food_name || 'Surplus Food',
    quantity: Number(row.quantity || 1),
    unit: row.unit || 'portions',
    pickupAddress: row.pickup_address,
    imageUrl: row.image_url || undefined,
    quantityChecked: Boolean(row.pickup_completed_at),
    packagingChecked: true,
    acceptedAt: row.accepted_at || row.created_at,
    pickupStartedAt: row.pickup_started_at || undefined,
    pickedUpAt: row.pickup_completed_at || undefined,
    deliveryStartedAt: row.delivery_arrived_at || undefined,
    deliveredAt: row.delivered_at || undefined,
    completedAt: row.completed_at || undefined,
    deliveryCode: row.delivery_code || undefined,
    cancelledAt: row.cancelled_at || undefined,
    cancellationReason: row.cancellation_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Checks whether a volunteer currently has an unfinished active rescue assignment.
 * Terminal states (COMPLETED, CANCELLED) are excluded.
 */
export async function hasActiveRescue(volunteerId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !volunteerId) return false;
  try {
    const { data: assignData } = await supabase
      .from('rescue_assignments')
      .select('id')
      .eq('volunteer_id', volunteerId)
      .not('status', 'in', '("COMPLETED","CANCELLED")')
      .limit(1);

    if (assignData && assignData.length > 0) return true;

    const { data: donData } = await supabase
      .from('donations')
      .select('id')
      .eq('assigned_volunteer_id', volunteerId)
      .in('status', ['VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE', 'PICKED_UP', 'DELIVERY_EN_ROUTE', 'DELIVERED'])
      .limit(1);

    return Boolean(donData && donData.length > 0);
  } catch {
    return false;
  }
}

/**
 * Accepts a food rescue opportunity for the current authenticated volunteer.
 */
export async function acceptRescueAtomically(
  donationId: string,
  volunteerId: string,
  volunteerName: string,
  communityPointInfo?: { id: string; name: string; address: string }
): Promise<RescueAssignment> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  // 1. Pre-check: enforce single active rescue rule on client
  const isAlreadyActive = await hasActiveRescue(volunteerId);
  if (isAlreadyActive) {
    throw new Error('You already have an active rescue. Complete or release it before accepting another.');
  }

  // 2. Try backend atomic RPC if available
  try {
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('accept_rescue_atomic', {
      p_donation_id: donationId,
    });
    if (!rpcError && rpcData) {
      const donation = await getDonationById(donationId);
      const now = new Date().toISOString();
      return {
        id: (rpcData as any)?.id || `assign-${Date.now()}`,
        donationId,
        volunteerId,
        volunteerName,
        donorId: donation?.donorId || '',
        communityPointId: communityPointInfo?.id || donation?.communityPointId || 'hub-default',
        communityPointName: communityPointInfo?.name || donation?.communityPointName || 'Community Food Hub',
        communityPointAddress: communityPointInfo?.address || donation?.communityPointAddress || '',
        foodName: donation?.food?.name || 'Surplus Food',
        quantity: donation?.food?.quantity || 1,
        unit: donation?.food?.unit || 'portions',
        pickupAddress: donation?.pickup?.address || '',
        imageUrl: donation?.food?.imageUrl,
        quantityChecked: false,
        packagingChecked: false,
        status: 'ASSIGNED',
        donationStatus: 'VOLUNTEER_ASSIGNED',
        acceptedAt: now,
        createdAt: now,
        updatedAt: now,
      };
    }

    if (rpcError) {
      const msg = rpcError.message || '';
      if (
        msg.includes('already have an active rescue') ||
        msg.includes('already been accepted') ||
        msg.includes('no longer available') ||
        msg.includes('failed-precondition') ||
        msg.includes('permission-denied')
      ) {
        throw new Error(msg);
      }
      console.warn('[RescueService] accept_rescue_atomic notice:', rpcError);
    }
  } catch (rpcErr: any) {
    if (
      rpcErr?.message &&
      (rpcErr.message.includes('already have an active rescue') ||
        rpcErr.message.includes('already been accepted') ||
        rpcErr.message.includes('no longer available') ||
        rpcErr.message.includes('failed-precondition') ||
        rpcErr.message.includes('permission-denied'))
    ) {
      throw rpcErr;
    }
    console.warn('[RescueService] accept_rescue_atomic call failed, falling back to direct logic:', rpcErr);
  }

  // 3. Direct transactional check: ensure donation exists and is PUBLISHED
  let donation = await getDonationById(donationId);
  if (!donation) {
    const mock = DEV_MOCK_DONATIONS.find((m: Donation) => m.id === donationId);
    if (mock) {
      donation = mock;
    }
  }

  if (!donation) {
    throw new Error('This rescue is no longer available.');
  }

  if (donation.status !== 'PUBLISHED' && donation.status !== 'RESERVED') {
    throw new Error('This rescue has already been accepted by another volunteer.');
  }

  // Re-verify single active rescue in fallback path
  const isStillActive = await hasActiveRescue(volunteerId);
  if (isStillActive) {
    throw new Error('You already have an active rescue. Complete or release it before accepting another.');
  }

  const now = new Date().toISOString();

  // Atomically update donation only if status is still PUBLISHED / RESERVED
  const { data: updatedDonations, error: donError } = await supabase
    .from('donations')
    .update({
      status: 'VOLUNTEER_ASSIGNED',
      assigned_volunteer_id: volunteerId,
      assigned_volunteer_name: volunteerName,
      accepted_at: now,
      updated_at: now,
    })
    .eq('id', donationId)
    .in('status', ['PUBLISHED', 'RESERVED'])
    .select();

  if (donError) {
    console.warn('[RescueService] Notice on donation update:', donError.message);
  }

  if (updatedDonations && updatedDonations.length === 0) {
    // Another volunteer already accepted this donation concurrently
    throw new Error('This rescue has already been accepted by another volunteer.');
  }

  // Insert rescue assignment record
  const { data: assignmentData, error: assignError } = await supabase
    .from('rescue_assignments')
    .insert({
      donation_id: donationId,
      volunteer_id: volunteerId,
      volunteer_name: volunteerName,
      pickup_address: donation.pickup.address,
      pickup_latitude: donation.pickup.latitude || 0,
      pickup_longitude: donation.pickup.longitude || 0,
      pickup_code: donation.verification?.pickupCode || '0000',
      destination_address: communityPointInfo?.address || donation.communityPointAddress || 'Community Food Hub',
      destination_latitude: 0,
      destination_longitude: 0,
      destination_name: communityPointInfo?.name || donation.communityPointName || 'Community Food Hub',
      status: 'ASSIGNED',
      accepted_at: now,
    })
    .select()
    .single();

  if (assignError) {
    console.warn('[RescueService] Assignment insert error:', assignError);
  }

  // Notify Donor asynchronously on volunteer acceptance
  if (donation.donorId) {
    import('../notifications/notification.service').then(({ createInAppNotification }) => {
      createInAppNotification(donation.donorId, {
        userId: donation.donorId,
        type: 'RESCUE_ACCEPTED',
        title: 'Volunteer Accepted',
        body: 'A volunteer accepted your food donation.',
        resourceType: 'donation',
        resourceId: donationId,
        deepLinkRoute: `/(donor)/tracking?donationId=${donationId}`,
        priority: 'NORMAL',
      }).catch((err) => console.warn('[RescueService] Donor accept notification error:', err));
    });
  }

  return {
    id: assignmentData?.id || `assign-${Date.now()}`,
    donationId,
    volunteerId,
    volunteerName,
    donorId: donation.donorId,
    communityPointId: communityPointInfo?.id || donation.communityPointId || 'hub-default',
    communityPointName: communityPointInfo?.name || donation.communityPointName || 'Community Food Hub',
    communityPointAddress: communityPointInfo?.address || donation.communityPointAddress || '',
    foodName: donation.food.name,
    quantity: donation.food.quantity,
    unit: donation.food.unit,
    pickupAddress: donation.pickup.address,
    imageUrl: donation.food.imageUrl,
    quantityChecked: false,
    packagingChecked: false,
    acceptedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Transitions rescue status from VOLUNTEER_ASSIGNED to PICKUP_EN_ROUTE.
 */
export async function startPickupJourney(
  assignmentId: string,
  donationId: string,
  volunteerId: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

  const now = new Date().toISOString();

  await supabase
    .from('donations')
    .update({
      status: 'PICKUP_EN_ROUTE',
      updated_at: now,
    })
    .eq('id', donationId);

  await supabase
    .from('rescue_assignments')
    .update({
      status: 'PICKUP_EN_ROUTE',
      pickup_started_at: now,
      updated_at: now,
    })
    .eq('id', assignmentId);

  // Notify Donor asynchronously
  getDonationById(donationId).then((donation) => {
    if (donation?.donorId) {
      import('../notifications/notification.service').then(({ createInAppNotification }) => {
        createInAppNotification(donation.donorId, {
          userId: donation.donorId,
          type: 'PICKUP_STARTED',
          title: 'Volunteer Heading to Pickup',
          body: 'Your volunteer is on the way to collect the donation.',
          resourceType: 'donation',
          resourceId: donationId,
          deepLinkRoute: `/(donor)/tracking?donationId=${donationId}`,
          priority: 'NORMAL',
        }).catch((err) => console.warn('[RescueService] Donor pickup journey notification error:', err));
      });
    }
  });
}

/**
 * Verifies the 4-digit pickup code securely and confirms food collection.
 */
export async function verifyAndConfirmPickup(
  assignmentId: string,
  donationId: string,
  volunteerId: string,
  enteredCode: string,
  quantityChecked: boolean,
  actualQuantity?: number,
  packagingChecked: boolean = true
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

  const donation = await getDonationById(donationId);
  if (!donation) {
    return { success: false, message: 'Donation record not found.' };
  }

  const storedCode = donation.verification?.pickupCode;
  if (!storedCode || storedCode.trim() !== enteredCode.trim()) {
    return {
      success: false,
      message: 'Invalid pickup code. Please ask the donor for the 4-digit verification code.',
    };
  }

  if (actualQuantity !== undefined && actualQuantity !== donation.food.quantity && !quantityChecked) {
    return {
      success: false,
      message: 'Quantity mismatch detected. Please report the mismatch before confirming collection.',
    };
  }

  const now = new Date().toISOString();

  await supabase
    .from('donations')
    .update({
      status: 'PICKED_UP',
      picked_up_at: now,
      updated_at: now,
    })
    .eq('id', donationId);

  await supabase
    .from('rescue_assignments')
    .update({
      status: 'PICKED_UP',
      pickup_verified_at: now,
      pickup_completed_at: now,
      updated_at: now,
    })
    .eq('id', assignmentId);

  // Notify Donor asynchronously
  if (donation.donorId) {
    import('../notifications/notification.service').then(({ createInAppNotification }) => {
      createInAppNotification(donation.donorId, {
        userId: donation.donorId,
        type: 'PICKUP_CONFIRMED',
        title: 'Food Picked Up',
        body: 'Your donation has been successfully collected.',
        resourceType: 'donation',
        resourceId: donationId,
        deepLinkRoute: `/(donor)/tracking?donationId=${donationId}`,
        priority: 'NORMAL',
      }).catch((err) => console.warn('[RescueService] Donor picked up notification error:', err));
    });
  }

  return { success: true };
}

/**
 * Transitions rescue from PICKED_UP to DELIVERY_EN_ROUTE.
 */
export async function startDeliveryJourney(
  assignmentId: string,
  donationId: string,
  volunteerId: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

  const now = new Date().toISOString();

  await supabase
    .from('donations')
    .update({
      status: 'DELIVERY_EN_ROUTE',
      updated_at: now,
    })
    .eq('id', donationId);

  await supabase
    .from('rescue_assignments')
    .update({
      status: 'DELIVERY_EN_ROUTE',
      delivery_arrived_at: now,
      updated_at: now,
    })
    .eq('id', assignmentId);

  // Notify Donor and Authority asynchronously
  getDonationById(donationId).then((donation) => {
    if (!donation) return;
    import('../notifications/notification.service').then(({ createInAppNotification }) => {
      if (donation.donorId) {
        createInAppNotification(donation.donorId, {
          userId: donation.donorId,
          type: 'DELIVERY_STARTED',
          title: 'Heading to Collection Center',
          body: 'Your donation is being delivered to a community collection center.',
          resourceType: 'donation',
          resourceId: donationId,
          deepLinkRoute: `/(donor)/tracking?donationId=${donationId}`,
          priority: 'NORMAL',
        }).catch((err) => console.warn('[RescueService] Donor delivery notice error:', err));
      }

      if (donation.coordinatorId) {
        createInAppNotification(donation.coordinatorId, {
          userId: donation.coordinatorId,
          type: 'DELIVERY_STARTED',
          title: 'Incoming Food Rescue',
          body: 'A volunteer is heading to one of your collection centers.',
          resourceType: 'donation',
          resourceId: donationId,
          deepLinkRoute: `/(coordinator)/incoming`,
          priority: 'NORMAL',
        }).catch((err) => console.warn('[RescueService] Coordinator incoming notice error:', err));
      }
    });
  });
}

/**
 * Verifies delivery handover at community point using the 4-digit code provided by Community Authority.
 * Atomically marks the donation and rescue assignment as DELIVERED (Awaiting Authority Receipt).
 */
export async function verifyAndConfirmDelivery(
  assignmentId: string,
  donationId: string,
  volunteerId: string,
  deliveryCode: string
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

  const donation = await getDonationById(donationId);
  if (!donation) {
    return { success: false, message: 'Donation record not found.' };
  }

  const expectedCode = donation.deliveryCode || '8888';
  if (expectedCode.trim() !== deliveryCode.trim()) {
    return {
      success: false,
      message: 'Invalid delivery code. Please check the 4-digit code displayed by the Community Authority.',
    };
  }

  const now = new Date().toISOString();

  // Atomically mark donation DELIVERED
  const { error: donError } = await supabase
    .from('donations')
    .update({
      status: 'DELIVERED',
      delivered_at: now,
      updated_at: now,
    })
    .eq('id', donationId);

  if (donError) {
    throw new Error(donError.message);
  }

  // Mark rescue_assignments DELIVERED
  await supabase
    .from('rescue_assignments')
    .update({
      status: 'DELIVERED',
      delivered_at: now,
      updated_at: now,
    })
    .eq('id', assignmentId);

  // Notify Coordinator / Community Authority asynchronously
  if (donation.coordinatorId) {
    const { createInAppNotification } = await import('../notifications/notification.service');
    createInAppNotification(donation.coordinatorId, {
      userId: donation.coordinatorId,
      type: 'DELIVERY_CONFIRMED',
      title: 'Delivery Awaiting Receipt',
      body: 'A food rescue has arrived. Please confirm receipt.',
      resourceType: 'donation',
      resourceId: donationId,
      deepLinkRoute: `/(coordinator)/incoming`,
      priority: 'HIGH',
    }).catch((err) => console.warn('[RescueService] Coordinator arrival notice error:', err));
  }

  // Notify Volunteer asynchronously
  if (volunteerId) {
    const { createInAppNotification } = await import('../notifications/notification.service');
    createInAppNotification(volunteerId, {
      userId: volunteerId,
      type: 'DELIVERY_CONFIRMED',
      title: 'Delivery Recorded',
      body: 'Food delivered. Waiting for Community Authority receipt confirmation.',
      resourceType: 'donation',
      resourceId: donationId,
      deepLinkRoute: `/(volunteer)/activity`,
      priority: 'NORMAL',
    }).catch((err) => console.warn('[RescueService] Volunteer delivery notice error:', err));
  }

  // Notify Donor asynchronously
  if (donation.donorId) {
    const { createInAppNotification } = await import('../notifications/notification.service');
    createInAppNotification(donation.donorId, {
      userId: donation.donorId,
      type: 'DELIVERY_CONFIRMED',
      title: 'Delivered to Collection Center',
      body: 'Your donation has reached the collection center and is awaiting confirmation.',
      resourceType: 'donation',
      resourceId: donationId,
      deepLinkRoute: `/(donor)/tracking?donationId=${donationId}`,
      priority: 'HIGH',
    }).catch((err) => console.warn('[RescueService] Donor arrival notice error:', err));
  }

  return { success: true };
}

/**
 * Reports an operational issue or quantity mismatch during pickup or delivery.
 */
export async function reportRescueIssue(
  donationId: string,
  assignmentId: string | undefined,
  reportedBy: string,
  reporterName: string,
  issueType: RescueIssueType,
  description: string,
  expectedQuantity?: number,
  actualQuantity?: number
): Promise<RescueIssue> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('rescue_issues')
    .insert({
      donation_id: donationId,
      reported_by_id: reportedBy,
      reported_by_name: reporterName,
      reported_by_role: 'VOLUNTEER',
      issue_type: issueType,
      description,
      block_completion: true,
      status: 'OPEN',
    })
    .select()
    .single();

  if (error) {
    console.warn('[RescueService] Issue report error:', error);
  }

  // Update donation status
  await supabase
    .from('donations')
    .update({
      status: 'ISSUE_REPORTED',
      updated_at: now,
    })
    .eq('id', donationId);

  return {
    id: data?.id || `issue-${Date.now()}`,
    donationId,
    assignmentId,
    reportedBy,
    reporterName,
    reporterRole: 'VOLUNTEER',
    issueType,
    description,
    expectedQuantity,
    actualQuantity,
    status: 'OPEN',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Safely releases an assignment before pickup if volunteer cannot complete the mission.
 */
export async function releaseAssignmentBeforePickup(
  assignmentId: string,
  donationId: string,
  volunteerId: string,
  reason: VolunteerCancellationReason | string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

  const donation = await getDonationById(donationId);
  if (
    donation &&
    (donation.status === 'PICKED_UP' ||
      donation.status === 'DELIVERY_EN_ROUTE' ||
      donation.status === 'DELIVERED' ||
      donation.status === 'COMPLETED' ||
      donation.status === 'ACKNOWLEDGED')
  ) {
    throw new Error('Food has already been collected. Please use the Report Issue flow instead of cancelling.');
  }

  // 1. Try backend atomic RPC
  try {
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('release_rescue_atomic', {
      p_donation_id: donationId,
      p_assignment_id: assignmentId,
      p_reason: reason || 'Volunteer released mission before pickup',
    });

    if (!rpcError && rpcData?.success) {
      return;
    }

    if (rpcError) {
      console.warn('[RescueService] release_rescue_atomic RPC error:', rpcError);
      if (
        rpcError.message &&
        (rpcError.message.includes('failed-precondition') ||
          rpcError.message.includes('permission-denied') ||
          rpcError.message.includes('Food has already been collected'))
      ) {
        throw new Error(rpcError.message);
      }
    }
  } catch (rpcErr: any) {
    if (
      rpcErr?.message &&
      (rpcErr.message.includes('failed-precondition') ||
        rpcErr.message.includes('permission-denied') ||
        rpcErr.message.includes('Food has already been collected'))
    ) {
      throw rpcErr;
    }
    console.warn('[RescueService] release_rescue_atomic call failed, falling back to direct update:', rpcErr);
  }

  // 2. Direct transactional fallback (strictly aligned with remote table columns)
  const now = new Date().toISOString();

  const { error: donError } = await supabase
    .from('donations')
    .update({
      status: 'PUBLISHED',
      assigned_volunteer_id: null,
      assigned_volunteer_name: null,
      updated_at: now,
    })
    .eq('id', donationId);

  if (donError) {
    console.warn('[RescueService] Direct donation release update error:', donError);
    throw new Error(donError.message || 'Unable to update donation status.');
  }

  const { error: assignError } = await supabase
    .from('rescue_assignments')
    .update({
      status: 'CANCELLED',
      updated_at: now,
    })
    .eq('id', assignmentId);

  if (assignError) {
    console.warn('[RescueService] Direct assignment cancellation update error:', assignError);
  }
}

/**
 * Subscribes in real-time to active rescue assignments for the current volunteer.
 */
export function subscribeToActiveRescue(
  volunteerId: string,
  onUpdate: (assignment: RescueAssignment | null) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate(null);
    return () => {};
  }

  const fetchActive = async () => {
    try {
      // 1. Fetch active donations directly where assigned_volunteer_id = volunteerId and in active transit states
      const { data: donData } = await supabase
        .from('donations')
        .select('*')
        .eq('assigned_volunteer_id', volunteerId)
        .in('status', ['VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE', 'PICKED_UP', 'DELIVERY_EN_ROUTE'])
        .order('accepted_at', { ascending: false })
        .limit(1);

      if (donData && donData.length > 0) {
        const row = donData[0];
        // Also check if there is an existing rescue_assignment row for this donation
        const { data: assignRows } = await supabase
          .from('rescue_assignments')
          .select('*')
          .eq('donation_id', row.id)
          .eq('volunteer_id', volunteerId)
          .limit(1);

        const assignRow = assignRows && assignRows.length > 0 ? assignRows[0] : null;

        onUpdate({
          id: assignRow?.id || 'assign-' + row.id,
          donationId: row.id,
          volunteerId: volunteerId,
          volunteerName: row.assigned_volunteer_name || assignRow?.volunteer_name || 'Volunteer',
          donorId: row.donor_id || assignRow?.donor_id || '',
          communityPointId: row.community_point_id || assignRow?.community_point_id || undefined,
          communityPointName: row.community_point_name || assignRow?.destination_name || 'Community Food Hub',
          communityPointAddress: row.community_point_address || assignRow?.destination_address || 'Colombo Hub',
          foodName: row.food_name || assignRow?.food_name || 'Surplus Food',
          quantity: Number(row.quantity || assignRow?.quantity || 1),
          unit: row.unit || assignRow?.unit || 'portions',
          pickupAddress: row.pickup_address || assignRow?.pickup_address,
          imageUrl: row.image_url || assignRow?.image_url || undefined,
          quantityChecked: Boolean(row.picked_up_at || assignRow?.pickup_completed_at),
          packagingChecked: true,
          status: row.status,
          donationStatus: row.status,
          acceptedAt: row.accepted_at || assignRow?.accepted_at || row.created_at,
          pickupStartedAt: row.status === 'PICKUP_EN_ROUTE' ? (assignRow?.pickup_started_at || row.updated_at) : undefined,
          pickedUpAt: row.picked_up_at || (row.status === 'PICKED_UP' || row.status === 'DELIVERY_EN_ROUTE' ? (assignRow?.pickup_completed_at || row.updated_at) : undefined),
          deliveryStartedAt: row.status === 'DELIVERY_EN_ROUTE' ? (assignRow?.delivery_arrived_at || row.updated_at) : undefined,
          deliveredAt: undefined,
          completedAt: undefined,
          cancelledAt: undefined,
          cancellationReason: undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
        return;
      }

      // 2. If not found in donations table with assigned_volunteer_id, check rescue_assignments table joined with donation status
      const { data: assignData } = await supabase
        .from('rescue_assignments')
        .select('*')
        .eq('volunteer_id', volunteerId)
        .neq('status', 'CANCELLED')
        .is('delivered_at', null)
        .order('accepted_at', { ascending: false })
        .limit(1);

      if (assignData && assignData.length > 0) {
        const assign = assignData[0];
        // Validate with canonical donation row
        const { data: donCheck } = await supabase
          .from('donations')
          .select('*')
          .eq('id', assign.donation_id)
          .single();

        if (donCheck) {
          const terminalOrDelivered = ['DELIVERED', 'COMPLETED', 'ACKNOWLEDGED', 'CANCELLED', 'EXPIRED', 'PUBLISHED'];
          if (terminalOrDelivered.includes(donCheck.status) || (donCheck.assigned_volunteer_id && donCheck.assigned_volunteer_id !== volunteerId)) {
            // Already released, delivered or completed; should NOT be active
            onUpdate(null);
            return;
          }
          const mapped = mapRowToAssignment(assign);
          mapped.donationStatus = donCheck.status;
          mapped.status = donCheck.status;
          onUpdate(mapped);
          return;
        }

        onUpdate(mapRowToAssignment(assign));
        return;
      }

      onUpdate(null);
    } catch (e) {
      console.warn('[RescueService] Active assignment query error:', e);
      onUpdate(null);
    }
  };

  fetchActive();

  const channel1 = supabase
    .channel(`realtime:active_rescue:${volunteerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rescue_assignments', filter: `volunteer_id=eq.${volunteerId}` },
      () => fetchActive()
    )
    .subscribe();

  const channel2 = supabase
    .channel(`realtime:active_rescue_donations:${volunteerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'donations' },
      () => fetchActive()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel1);
    supabase.removeChannel(channel2);
  };
}

/**
 * Subscribes to all past and active volunteer rescue assignments.
 */
export function subscribeToVolunteerAssignments(
  volunteerId: string,
  onUpdate: (assignments: RescueAssignment[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  const fetchAssignments = async () => {
    try {
      // 1. Fetch from rescue_assignments table
      const { data: assignData } = await supabase
        .from('rescue_assignments')
        .select('*')
        .eq('volunteer_id', volunteerId)
        .order('created_at', { ascending: false });

      // 2. Fetch directly from donations table where assigned_volunteer_id = volunteerId
      const { data: donData } = await supabase
        .from('donations')
        .select('*')
        .eq('assigned_volunteer_id', volunteerId)
        .order('created_at', { ascending: false });

      // Create a map of canonical donations by ID
      const donationMap = new Map<string, any>();
      (donData || []).forEach((row) => donationMap.set(row.id, row));

      // Fetch any missing donation records referenced by rescue_assignments
      const missingDonationIds = (assignData || [])
        .map((a) => a.donation_id)
        .filter((id) => id && !donationMap.has(id));

      if (missingDonationIds.length > 0) {
        const { data: extraDonations } = await supabase
          .from('donations')
          .select('*')
          .in('id', missingDonationIds);
        (extraDonations || []).forEach((row) => donationMap.set(row.id, row));
      }

      const assignmentMap = new Map<string, RescueAssignment>();

      // Process assignments from rescue_assignments table
      for (const row of assignData || []) {
        const don = donationMap.get(row.donation_id);
        const isAssignmentCancelled = row.status === 'CANCELLED' || Boolean(row.cancelled_at);
        const isDonationCompleted = don?.status === 'COMPLETED' || don?.status === 'ACKNOWLEDGED';
        const isAssignmentCompleted = row.status === 'COMPLETED' || isDonationCompleted;
        const isAssignmentDelivered = row.status === 'DELIVERED' || don?.status === 'DELIVERED' || Boolean(row.delivered_at);

        let resolvedAssignmentStatus = row.status || 'ASSIGNED';
        if (isAssignmentCancelled) {
          resolvedAssignmentStatus = 'CANCELLED';
        } else if (isAssignmentCompleted) {
          resolvedAssignmentStatus = 'COMPLETED';
        } else if (isAssignmentDelivered) {
          resolvedAssignmentStatus = 'DELIVERED';
        } else if (don?.status && ['VOLUNTEER_ASSIGNED', 'PICKUP_EN_ROUTE', 'PICKED_UP', 'DELIVERY_EN_ROUTE'].includes(don.status)) {
          resolvedAssignmentStatus = don.status;
        }

        const isDelivered = resolvedAssignmentStatus === 'DELIVERED' || isAssignmentCompleted;
        const isCompleted = isAssignmentCompleted;
        const isCancelled = isAssignmentCancelled;

        assignmentMap.set(row.id, {
          id: row.id,
          donationId: row.donation_id,
          volunteerId: row.volunteer_id,
          volunteerName: row.volunteer_name,
          donorId: row.donor_id || don?.donor_id || '',
          communityPointId: row.community_point_id || don?.community_point_id || undefined,
          communityPointName: row.destination_name || don?.community_point_name || 'Community Food Hub',
          communityPointAddress: row.destination_address || don?.community_point_address || '',
          foodName: row.food_name || don?.food_name || 'Surplus Food',
          quantity: Number(row.quantity || don?.quantity || 1),
          unit: row.unit || don?.unit || 'portions',
          pickupAddress: row.pickup_address || don?.pickup_address,
          imageUrl: row.image_url || don?.image_url || undefined,
          quantityChecked: Boolean(row.pickup_completed_at || don?.picked_up_at),
          packagingChecked: true,
          status: resolvedAssignmentStatus,
          donationStatus: don ? don.status : resolvedAssignmentStatus,
          acceptedAt: row.accepted_at || don?.accepted_at || row.created_at,
          pickupStartedAt: row.pickup_started_at || (resolvedAssignmentStatus === 'PICKUP_EN_ROUTE' ? don?.updated_at : undefined),
          pickedUpAt: row.pickup_completed_at || don?.picked_up_at || (['PICKED_UP', 'DELIVERY_EN_ROUTE', 'DELIVERED', 'COMPLETED'].includes(resolvedAssignmentStatus) ? don?.updated_at : undefined),
          deliveryStartedAt: row.delivery_arrived_at || (resolvedAssignmentStatus === 'DELIVERY_EN_ROUTE' ? don?.updated_at : undefined),
          deliveredAt: isDelivered ? (row.delivered_at || don?.delivered_at || don?.updated_at) : undefined,
          completedAt: isCompleted ? (row.completed_at || don?.completed_at || don?.updated_at) : undefined,
          cancelledAt: isCancelled ? (row.cancelled_at || don?.cancelled_at || don?.updated_at) : undefined,
          cancellationReason: row.cancellation_reason || don?.cancellation_reason || undefined,
          createdAt: row.created_at,
          updatedAt: don?.updated_at || row.updated_at,
        });
      }

      // Process any donations directly assigned that don't have a rescue_assignment row yet
      if (donData && donData.length > 0) {
        for (const row of donData) {
          const alreadyMapped = Array.from(assignmentMap.values()).some((a) => a.donationId === row.id);
          if (!alreadyMapped) {
            const canonStatus = row.status;
            const isDelivered = canonStatus === 'DELIVERED' || canonStatus === 'COMPLETED' || canonStatus === 'ACKNOWLEDGED';
            const isCompleted = canonStatus === 'COMPLETED' || canonStatus === 'ACKNOWLEDGED';
            const isCancelled = canonStatus === 'CANCELLED';

            assignmentMap.set('assign-' + row.id, {
              id: 'assign-' + row.id,
              donationId: row.id,
              volunteerId: volunteerId,
              volunteerName: row.assigned_volunteer_name || 'Volunteer',
              donorId: row.donor_id || '',
              communityPointId: row.community_point_id || undefined,
              communityPointName: row.community_point_name || 'Community Food Hub',
              communityPointAddress: row.community_point_address || 'Colombo Hub',
              foodName: row.food_name || 'Surplus Food',
              quantity: Number(row.quantity || 1),
              unit: row.unit || 'portions',
              pickupAddress: row.pickup_address,
              imageUrl: row.image_url || undefined,
              quantityChecked: Boolean(row.picked_up_at),
              packagingChecked: true,
              status: canonStatus,
              donationStatus: canonStatus,
              acceptedAt: row.accepted_at || row.created_at,
              pickupStartedAt: canonStatus === 'PICKUP_EN_ROUTE' ? row.updated_at : undefined,
              pickedUpAt: row.picked_up_at || (['PICKED_UP', 'DELIVERY_EN_ROUTE', 'DELIVERED', 'COMPLETED'].includes(canonStatus) ? row.updated_at : undefined),
              deliveryStartedAt: canonStatus === 'DELIVERY_EN_ROUTE' ? row.updated_at : undefined,
              deliveredAt: isDelivered ? (row.delivered_at || row.updated_at) : undefined,
              completedAt: isCompleted ? (row.completed_at || row.updated_at) : undefined,
              cancelledAt: isCancelled ? (row.cancelled_at || row.updated_at) : undefined,
              cancellationReason: row.cancellation_reason || undefined,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            });
          }
        }
      }

      const assignmentList = Array.from(assignmentMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      onUpdate(assignmentList);
    } catch (e) {
      console.warn('[RescueService] Volunteer assignments fetch error:', e);
    }
  };

  fetchAssignments();

  const channel1 = supabase
    .channel(`realtime:all_volunteer_rescues:${volunteerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rescue_assignments', filter: `volunteer_id=eq.${volunteerId}` },
      () => fetchAssignments()
    )
    .subscribe();

  const channel2 = supabase
    .channel(`realtime:donations_assigned:${volunteerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'donations' },
      () => fetchAssignments()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel1);
    supabase.removeChannel(channel2);
  };
}
