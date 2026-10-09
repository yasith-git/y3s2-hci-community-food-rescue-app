/**
 * Supabase Service Layer for Smart Food Donations
 * Community Food Rescue App
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  Donation,
  CreateDonationInput,
  CancellationReason,
  DonationStatus,
} from '../../types/donation';
import { generateSecurePickupCode } from '../../utils/crypto';
import { uploadDonationImage } from '../storage/storage.service';
import { canEditDonation, canWithdrawDonation } from './donation.state-machine';

export type Unsubscribe = () => void;

/**
 * Maps a database row from the `donations` table to the frontend `Donation` interface.
 */
export function mapRowToDonation(row: any): Donation {
  return {
    id: row.id,
    donorId: row.donor_id,
    donorName: row.donor_name,
    donorOrganization: row.donor_organization || undefined,
    food: {
      name: row.food_name,
      category: row.food_category,
      description: row.description || undefined,
      quantity: Number(row.quantity),
      unit: row.unit,
      imageUrl: row.image_url || undefined,
    },
    safety: {
      preparedAt: row.prepared_at || row.created_at,
      storageCondition: row.storage_condition,
      packagingCondition: row.packaging_condition,
      ingredients: row.ingredients || undefined,
      allergens: row.allergens || [],
      donorDeclarationAccepted: Boolean(row.donor_declaration_accepted),
      donorDeclarationText: row.donor_declaration_text || 'Standard food safety declaration accepted.',
    },
    pickup: {
      address: row.pickup_address,
      latitude: row.pickup_latitude ?? undefined,
      longitude: row.pickup_longitude ?? undefined,
      locationSource: row.pickup_latitude ? 'GPS' : 'MANUAL',
      pickupStartAt: row.pickup_window_start,
      pickupDeadlineAt: row.pickup_deadline_at,
      instructions: row.pickup_instructions || undefined,
    },
    verification: {
      pickupCode: row.pickup_code,
      isVerified: Boolean(row.picked_up_at),
      verifiedAt: row.picked_up_at || undefined,
    },
    status: row.status as DonationStatus,
    cancellationReason: row.cancellation_reason || undefined,
    assignedVolunteerId: row.assigned_volunteer_id || undefined,
    assignedVolunteerName: row.assigned_volunteer_name || undefined,
    coordinatorId: row.reserved_by || undefined,
    coordinatorName: row.reserved_by_name || undefined,
    communityPointId: row.community_point_id || undefined,
    communityPointName: row.community_point_name || undefined,
    communityPointAddress: row.community_point_address || undefined,
    deliveryCode: row.delivery_code || undefined,
    acknowledgedAt: row.acknowledged_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.created_at,
    expiresAt: row.pickup_deadline_at,
    reservedAt: row.reserved_at || undefined,
    assignedAt: row.accepted_at || undefined,
    pickedUpAt: row.picked_up_at || undefined,
    deliveredAt: row.delivered_at || undefined,
    completedAt: row.completed_at || undefined,
    cancelledAt: row.cancelled_at || undefined,
  };
}

export async function createAndPublishDonation(
  donorId: string,
  input: CreateDonationInput
): Promise<Donation> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Please check your .env settings.');
  }

  const tempId = Math.random().toString(36).substring(2, 12);

  // Upload image to Supabase Storage if a local uri was provided
  let finalImageUrl = input.food.imageUrl;
  if (
    input.food.imageUrl &&
    (input.food.imageUrl.startsWith('file:') ||
      input.food.imageUrl.startsWith('content:') ||
      input.food.imageUrl.startsWith('data:'))
  ) {
    try {
      finalImageUrl = await uploadDonationImage(input.food.imageUrl, donorId, tempId);
    } catch (uploadErr) {
      console.warn('[Donation Service] Image upload notice, skipping image:', uploadErr);
      finalImageUrl = undefined;
    }
  }

  // Never insert massive data: URIs or local file:// URIs into remote DB
  if (finalImageUrl && (finalImageUrl.startsWith('file:') || finalImageUrl.startsWith('data:'))) {
    finalImageUrl = undefined;
  }

  const pickupCode = await generateSecurePickupCode();
  const deliveryCode = await generateSecurePickupCode();

  const insertPayload = {
    donor_id: donorId,
    donor_name: input.donorName,
    donor_organization: input.donorOrganization || null,
    food_name: input.food.name,
    food_category: input.food.category,
    quantity: input.food.quantity,
    unit: input.food.unit,
    image_url: finalImageUrl || null,
    storage_condition: input.safety.storageCondition,
    packaging_condition: input.safety.packagingCondition,
    allergens: input.safety.allergens || [],
    donor_declaration_accepted: input.safety.donorDeclarationAccepted,
    pickup_address: input.pickup.address,
    pickup_latitude: input.pickup.latitude || null,
    pickup_longitude: input.pickup.longitude || null,
    pickup_window_start: input.pickup.pickupStartAt,
    pickup_deadline_at: input.pickup.pickupDeadlineAt,
    pickup_instructions: input.pickup.instructions || null,
    pickup_code: pickupCode,
    delivery_code: deliveryCode,
    status: (input.status || 'PUBLISHED') as any,
  };

  const { data, error } = await supabase
    .from('donations')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('[Donation Service] Insert error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    const msg = error.message || '';
    if (msg.includes('bad URL') || msg.includes('fetch failed')) {
      throw new Error('Network connection error. Please verify your connection and try again.');
    }
    throw new Error(msg || 'Failed to create donation in Supabase.');
  }

  return mapRowToDonation(data);
}

export async function getDonationById(donationId: string): Promise<Donation | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapRowToDonation(data);
  } catch (error) {
    console.warn('[Donation Service] Error fetching donation:', error);
    throw error;
  }
}

export async function getDonorDonationsList(donorId: string): Promise<Donation[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_id', donorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Donation Service] Error fetching donor list:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(error.message);
    }

    return (data || []).map(mapRowToDonation);
  } catch (error) {
    console.warn('[Donation Service] Error fetching donor list:', error);
    throw error;
  }
}

export function subscribeToDonorDonations(
  donorId: string,
  onUpdate: (donations: Donation[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  // Fetch initial data
  getDonorDonationsList(donorId)
    .then((list) => onUpdate(list))
    .catch((err) => {
      console.warn('[Donation Service] Initial subscription query error:', err);
      onUpdate([]);
    });

  const channel = supabase
    .channel(`realtime:donations:donor_${donorId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'donations',
        filter: `donor_id=eq.${donorId}`,
      },
      async () => {
        try {
          const list = await getDonorDonationsList(donorId);
          onUpdate(list);
        } catch (e) {
          console.warn('[Donation Service] Realtime update fetch error:', e);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToDonation(
  donationId: string,
  onUpdate: (donation: Donation | null) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate(null);
    return () => {};
  }

  getDonationById(donationId)
    .then((item) => onUpdate(item))
    .catch((err) => {
      console.warn('[Donation Service] Initial single donation query error:', err);
      onUpdate(null);
    });

  const channel = supabase
    .channel(`realtime:donations:id_${donationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'donations',
        filter: `id=eq.${donationId}`,
      },
      async () => {
        try {
          const item = await getDonationById(donationId);
          onUpdate(item);
        } catch (e) {
          console.warn('[Donation Service] Realtime single donation update error:', e);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function withdrawDonation(
  donationId: string,
  reason: CancellationReason | string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const current = await getDonationById(donationId);
  if (!current) {
    throw new Error('Donation record not found.');
  }
  if (!canWithdrawDonation(current)) {
    throw new Error(`Cannot withdraw donation in state ${current.status}.`);
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('donations')
    .update({
      status: 'CANCELLED',
      cancellation_reason: reason,
      cancelled_at: now,
      updated_at: now,
    })
    .eq('id', donationId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateDonationDetails(
  donationId: string,
  updates: Partial<Pick<Donation, 'food' | 'pickup' | 'safety'>>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const current = await getDonationById(donationId);
  if (!current) {
    throw new Error('Donation record not found.');
  }
  if (!canEditDonation(current)) {
    throw new Error('This donation can no longer be edited.');
  }

  const dbUpdates: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.food) {
    if (updates.food.name) dbUpdates.food_name = updates.food.name;
    if (updates.food.category) dbUpdates.food_category = updates.food.category;
    if (updates.food.quantity) dbUpdates.quantity = updates.food.quantity;
    if (updates.food.unit) dbUpdates.unit = updates.food.unit;
    if (updates.food.imageUrl) dbUpdates.image_url = updates.food.imageUrl;
  }

  if (updates.safety) {
    if (updates.safety.storageCondition) dbUpdates.storage_condition = updates.safety.storageCondition;
    if (updates.safety.packagingCondition) dbUpdates.packaging_condition = updates.safety.packagingCondition;
    if (updates.safety.allergens) dbUpdates.allergens = updates.safety.allergens;
  }

  if (updates.pickup) {
    if (updates.pickup.address) dbUpdates.pickup_address = updates.pickup.address;
    if (updates.pickup.latitude !== undefined) dbUpdates.pickup_latitude = updates.pickup.latitude;
    if (updates.pickup.longitude !== undefined) dbUpdates.pickup_longitude = updates.pickup.longitude;
    if (updates.pickup.pickupStartAt) dbUpdates.pickup_window_start = updates.pickup.pickupStartAt;
    if (updates.pickup.pickupDeadlineAt) dbUpdates.pickup_deadline_at = updates.pickup.pickupDeadlineAt;
    if (updates.pickup.instructions !== undefined) dbUpdates.pickup_instructions = updates.pickup.instructions;
  }

  const { error } = await supabase
    .from('donations')
    .update(dbUpdates)
    .eq('id', donationId);

  if (error) {
    throw new Error(error.message);
  }
}
