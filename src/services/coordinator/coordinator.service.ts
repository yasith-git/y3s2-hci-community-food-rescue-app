/**
 * Coordinator Logistics & Trust Service Layer
 * Coordinates incoming delivery tracking, delivery verification code presentation, receipt acknowledgement, and final rescue completion.
 * Community Food Rescue App (Supabase Backend)
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Donation, DonationStatus } from '../../types/donation';
import { RescueAssignment, RescueIssue } from '../../types/rescue';
import { Reservation, CoordinatorStats } from '../../types/coordinator';
import { createInAppNotification } from '../notifications/notification.service';
import { mapRowToDonation, getDonationById } from '../donations/donation.service';

export type Unsubscribe = () => void;

export interface CoordinatorIncomingItem {
  donation: Donation;
  reservation: Reservation;
  assignment?: RescueAssignment;
  issues: RescueIssue[];
}

export interface CoordinatorHistoryItem {
  donation: Donation;
  reservation: Reservation;
  assignment?: RescueAssignment;
  completedAt?: string;
  status: DonationStatus;
}

/**
 * Retrieves the secure 4-digit delivery verification code for the authorized coordinator.
 */
export async function getDeliveryVerificationCode(
  donationId: string,
  coordinatorId: string
): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('id', donationId)
    .single();

  if (error || !data) {
    throw new Error('Donation not found.');
  }

  const donation = mapRowToDonation(data);

  // Delivery code is available once volunteer is assigned or food is collected/en-route
  if (
    donation.status !== 'PICKED_UP' &&
    donation.status !== 'DELIVERY_EN_ROUTE' &&
    donation.status !== 'VOLUNTEER_ASSIGNED' &&
    donation.status !== 'DELIVERED'
  ) {
    throw new Error('Delivery code is only available when the rescue is in active transit.');
  }

  return donation.deliveryCode || '8888';
}

/**
 * Acknowledges food receipt and completes the rescue atomically.
 */
export async function acknowledgeReceiptAndComplete(
  donationId: string,
  coordinatorId: string,
  options?: {
    quantityConfirmed?: number;
    notes?: string;
  }
): Promise<{ success: boolean; donation: Donation }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const don = await getDonationById(donationId);
  if (!don) {
    throw new Error('Donation record not found.');
  }

  if (don.status === 'COMPLETED') {
    return { success: true, donation: don };
  }

  // 1. Invoke Atomic Handover RPC (SECURITY DEFINER)
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'complete_collection_handover_atomic',
    {
      p_donation_id: donationId,
      p_actual_quantity: options?.quantityConfirmed || don.food.quantity || 1,
      p_notes: options?.notes || null,
    }
  );

  if (rpcError) {
    console.error('[AuthorityHandover] complete_collection_handover_atomic failed:', {
      code: rpcError.code,
      message: rpcError.message,
      details: rpcError.details,
      hint: rpcError.hint,
      donationId,
      coordinatorId,
    });
    throw new Error(rpcError.message || 'Unable to confirm handover. Please try again.');
  }

  // 2. Critical Read-After-Write Verification
  const verifiedDonation = await getDonationById(donationId);
  if (!verifiedDonation || verifiedDonation.status !== 'COMPLETED') {
    console.error('[CoordinatorService] Read-after-write verification failed for donation:', donationId, verifiedDonation, rpcResult);
    throw new Error('Unable to confirm handover. Please try again.');
  }

  // 3. Fallback async notifications if needed
  if (don.donorId) {
    createInAppNotification(don.donorId, {
      userId: don.donorId,
      type: 'RESCUE_COMPLETED',
      title: 'Food Rescue Complete 🎉',
      body: 'Your food donation has reached the collection center. Rescue completed.',
      resourceType: 'donation',
      resourceId: donationId,
      deepLinkRoute: `/(donor)/tracking?id=${donationId}`,
      priority: 'HIGH',
    }).catch((err) => console.warn('[CoordinatorService] Donor notification error:', err));
  }

  const volunteerId = (don as any).assignedVolunteerId;
  if (volunteerId) {
    createInAppNotification(volunteerId, {
      userId: volunteerId,
      type: 'RESCUE_COMPLETED',
      title: 'Food Rescue Complete 🎉',
      body: 'Food handover confirmed. Rescue completed.',
      resourceType: 'donation',
      resourceId: donationId,
      deepLinkRoute: `/(volunteer)/activity`,
      priority: 'HIGH',
    }).catch((err) => console.warn('[CoordinatorService] Volunteer notification error:', err));
  }

  return { success: true, donation: verifiedDonation };
}

/**
 * Subscribes in real-time to active incoming rescues for a coordinator.
 */
export function subscribeToCoordinatorIncoming(
  coordinatorId: string,
  onUpdate: (items: CoordinatorIncomingItem[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  const fetchIncoming = async () => {
    try {
      // Query active donations that are in transit / assigned / reserved
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('[CoordinatorService] Incoming fetch error:', error);
        return;
      }

      // Canonical incoming active statuses: strictly excludes COMPLETED and ACKNOWLEDGED
      const activeStatuses: DonationStatus[] = [
        'RESERVED',
        'VOLUNTEER_ASSIGNED',
        'PICKUP_EN_ROUTE',
        'PICKED_UP',
        'DELIVERY_EN_ROUTE',
        'DELIVERED',
        'ISSUE_REPORTED',
      ];

      // Deduplicate and filter by canonical donation status
      const seenDonationIds = new Set<string>();
      const activeDonations: Donation[] = [];

      for (const row of data || []) {
        const d = mapRowToDonation(row);
        if (
          !seenDonationIds.has(d.id) &&
          d.status !== 'COMPLETED' &&
          d.status !== 'CANCELLED' &&
          d.status !== 'EXPIRED' &&
          d.status !== 'ACKNOWLEDGED' &&
          activeStatuses.includes(d.status) &&
          (d.coordinatorId === coordinatorId || !d.coordinatorId || d.status !== 'RESERVED')
        ) {
          seenDonationIds.add(d.id);
          activeDonations.push(d);
        }
      }

      const items: CoordinatorIncomingItem[] = activeDonations.map((d) => ({
        donation: d,
        reservation: {
          id: d.reservationId || `res-${d.id}`,
          donationId: d.id,
          donorId: d.donorId,
          coordinatorId,
          coordinatorName: d.coordinatorName,
          communityPointId: d.communityPointId || '',
          communityPointName: d.communityPointName || d.destination?.name || 'Community Hub',
          communityPointAddress: d.communityPointAddress || d.destination?.address || '',
          status: 'ACTIVE',
          deliveryCode: d.deliveryCode,
          reservedAt: d.reservedAt || d.createdAt,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        },
        issues: [],
      }));

      onUpdate(items);
    } catch (e) {
      console.warn('[CoordinatorService] Incoming fetch exception:', e);
    }
  };

  fetchIncoming();

  const channel = supabase
    .channel(`realtime:coordinator_incoming:${coordinatorId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'donations' },
      () => {
        fetchIncoming();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes in real-time to coordinator history (Completed & Cancelled rescues).
 */
export function subscribeToCoordinatorHistory(
  coordinatorId: string,
  onUpdate: (items: CoordinatorHistoryItem[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .in('status', ['COMPLETED', 'CANCELLED'])
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('[CoordinatorService] History fetch error:', error);
        return;
      }

      const historyList: CoordinatorHistoryItem[] = (data || []).map((row) => {
        const d = mapRowToDonation(row);
        return {
          donation: d,
          reservation: {
            id: d.reservationId || `res-${d.id}`,
            donationId: d.id,
            donorId: d.donorId,
            coordinatorId,
            communityPointId: d.communityPointId || '',
            communityPointName: d.communityPointName || 'Collection Center',
            communityPointAddress: d.communityPointAddress || '',
            status: d.status === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED',
            reservedAt: d.reservedAt || d.createdAt,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          },
          completedAt: d.completedAt || d.updatedAt,
          status: d.status,
        };
      });

      onUpdate(historyList);
    } catch (e) {
      console.warn('[CoordinatorService] History fetch exception:', e);
    }
  };

  fetchHistory();

  const channel = supabase
    .channel(`realtime:coordinator_history:${coordinatorId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'donations' },
      () => {
        fetchHistory();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes in real-time to aggregated dashboard metrics for a coordinator.
 */
export function subscribeToCoordinatorStats(
  coordinatorId: string,
  onUpdate: (stats: CoordinatorStats) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate({ availableCount: 0, incomingCount: 0, openIssuesCount: 0, completedCount: 0 });
    return () => {};
  }

  const fetchStats = async () => {
    try {
      const { data: allDonations } = await supabase.from('donations').select('status, reserved_by, pickup_deadline_at');
      const { count: issueCount } = await supabase
        .from('rescue_issues')
        .select('*', { count: 'exact', head: true })
        .in('status', ['OPEN', 'REVIEWING']);

      let available = 0;
      let incoming = 0;
      let completed = 0;
      const now = Date.now();

      const activeIncomingStatuses: DonationStatus[] = [
        'RESERVED',
        'VOLUNTEER_ASSIGNED',
        'PICKUP_EN_ROUTE',
        'PICKED_UP',
        'DELIVERY_EN_ROUTE',
        'DELIVERED',
        'ISSUE_REPORTED',
      ];

      (allDonations || []).forEach((d) => {
        if (d.status === 'PUBLISHED') {
          const deadline = new Date(d.pickup_deadline_at).getTime();
          if (deadline > now) available++;
        } else if (activeIncomingStatuses.includes(d.status)) {
          incoming++;
        } else if (d.status === 'COMPLETED' || d.status === 'ACKNOWLEDGED') {
          completed++;
        }
      });

      onUpdate({
        availableCount: available,
        incomingCount: incoming,
        openIssuesCount: issueCount || 0,
        completedCount: completed,
      });
    } catch (e) {
      console.warn('[CoordinatorService] Stats calculation error:', e);
    }
  };

  fetchStats();

  const channel = supabase
    .channel('realtime:coordinator_stats')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => fetchStats())
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
