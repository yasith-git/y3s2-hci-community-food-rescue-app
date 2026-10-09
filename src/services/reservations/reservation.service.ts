/**
 * Reservation Service Layer
 * Manages atomic reservation transactions, concurrency protection, cancellation, and available donation feeds for coordinators.
 * Community Food Rescue App (Supabase Backend)
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Donation } from '../../types/donation';
import { Reservation, ReservationCancellationReason } from '../../types/coordinator';
import { generateSecurePickupCode } from '../../utils/crypto';
import { createInAppNotification } from '../notifications/notification.service';
import { mapRowToDonation, getDonationById } from '../donations/donation.service';

export type Unsubscribe = () => void;

function mapRowToReservation(row: any): Reservation {
  return {
    id: row.id,
    donationId: row.donation_id,
    donorId: row.donor_id || '',
    coordinatorId: row.coordinator_id,
    coordinatorName: row.coordinator_name || undefined,
    coordinatorOrganization: row.coordinator_organization || undefined,
    communityPointId: row.community_point_id,
    communityPointName: row.community_point_name || undefined,
    communityPointAddress: row.community_point_address || undefined,
    status: row.status as any,
    deliveryCode: row.delivery_code || undefined,
    reservedAt: row.created_at,
    cancelledAt: row.cancelled_at || undefined,
    cancellationReason: row.cancellation_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Atomically reserves a food donation for a verified coordinator using Supabase RPC.
 */
export async function reserveDonationAtomically(
  donationId: string,
  communityPointId: string,
  coordinatorId: string,
  coordinatorName: string,
  organizationName?: string
): Promise<{ reservation: Reservation; donation: Donation }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  // Retrieve community point details for the reservation
  const { data: pointData, error: pointError } = await supabase
    .from('community_points')
    .select('*')
    .eq('id', communityPointId)
    .single();

  if (pointError || !pointData) {
    throw new Error('Selected community collection point not found.');
  }

  const deliveryCode = await generateSecurePickupCode();

  // Call Supabase RPC
  const { data, error } = await supabase.rpc('reserve_donation_atomic', {
    p_donation_id: donationId,
    p_community_point_id: communityPointId,
    p_community_point_name: pointData.name || 'Community Hub',
    p_community_point_address: pointData.address || '',
    p_delivery_code: deliveryCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  const resRow = data as any;
  const updatedDonation = await getDonationById(donationId);
  if (!updatedDonation) {
    throw new Error('Failed to retrieve updated donation after reservation.');
  }

  const reservation: Reservation = {
    id: resRow?.reservationId || 'res_' + donationId,
    donationId,
    donorId: updatedDonation.donorId,
    coordinatorId,
    coordinatorName,
    coordinatorOrganization: organizationName,
    communityPointId,
    communityPointName: pointData.name,
    communityPointAddress: pointData.address,
    status: 'ACTIVE',
    deliveryCode,
    reservedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Send notification to donor
  if (updatedDonation.donorId) {
    createInAppNotification(updatedDonation.donorId, {
      userId: updatedDonation.donorId,
      type: 'DONATION_RESERVED',
      title: 'Donation Reserved',
      body: `${organizationName || coordinatorName} reserved your ${updatedDonation.food.name}. A volunteer will be matched shortly.`,
      resourceType: 'donation',
      resourceId: donationId,
      deepLinkRoute: `/(donor)/tracking?id=${donationId}`,
      priority: 'OPERATIONAL',
    }).catch((err) => console.warn('[ReservationService] Notification error:', err));
  }

  return { reservation, donation: updatedDonation };
}

/**
 * Safely releases a reservation before a volunteer is assigned.
 */
export async function releaseReservationAtomically(
  reservationId: string,
  donationId: string,
  coordinatorId: string,
  reason: ReservationCancellationReason | string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const donation = await getDonationById(donationId);
  if (!donation) {
    throw new Error('Donation not found.');
  }
  if (donation.status !== 'RESERVED') {
    throw new Error('Cannot release reservation once a volunteer has been assigned.');
  }

  const now = new Date().toISOString();

  // Revert donation to PUBLISHED
  await supabase
    .from('donations')
    .update({
      status: 'PUBLISHED',
      reserved_by: null,
      reserved_by_name: null,
      reserved_at: null,
      community_point_id: null,
      community_point_name: null,
      community_point_address: null,
      delivery_code: null,
      updated_at: now,
    })
    .eq('id', donationId);

  // Update reservation status
  await supabase
    .from('reservations')
    .update({
      status: 'CANCELLED',
      cancelled_at: now,
      cancellation_reason: reason,
      updated_at: now,
    })
    .eq('id', reservationId);

  if (donation.donorId) {
    createInAppNotification(donation.donorId, {
      userId: donation.donorId,
      type: 'RESERVATION_CANCELLED',
      title: 'Reservation Released',
      body: `The reservation for ${donation.food.name} was released and is now available for other community hubs.`,
      resourceType: 'donation',
      resourceId: donationId,
      deepLinkRoute: `/(donor)/tracking?id=${donationId}`,
      priority: 'NORMAL',
    }).catch((err) => console.warn('[ReservationService] Notification error:', err));
  }
}

/**
 * Subscribes in real-time to all PUBLISHED donations that are eligible for reservation.
 */
export function subscribeToAvailableDonationsForCoordinator(
  onUpdate: (donations: Donation[]) => void,
  maxLimit: number = 50
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  const fetchAvailable = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('pickup_deadline_at', { ascending: true })
        .limit(maxLimit);

      if (error) {
        console.warn('[ReservationService] Available fetch error:', error);
        return;
      }

      const list = (data || []).map(mapRowToDonation).filter((d) => {
        return new Date(d.pickup.pickupDeadlineAt).getTime() > Date.now();
      });

      onUpdate(list);
    } catch (e) {
      console.warn('[ReservationService] Error querying available donations:', e);
    }
  };

  fetchAvailable();

  const channel = supabase
    .channel('realtime:available_donations')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'donations' },
      () => {
        fetchAvailable();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetches a single reservation by ID.
 */
export async function getReservationById(reservationId: string): Promise<Reservation | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (error || !data) return null;
    return mapRowToReservation(data);
  } catch (error) {
    console.warn('[ReservationService] Error fetching reservation:', error);
    throw error;
  }
}
