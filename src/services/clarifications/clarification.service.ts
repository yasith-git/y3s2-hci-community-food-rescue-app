/**
 * Clarification Request Service Layer
 * Enables community coordinators to ask targeted operational questions before reserving food.
 * Dispatches real-time in-app notifications and tracks resolution history.
 * Community Food Rescue App (Supabase Backend)
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  ClarificationRequest,
  ClarificationCategory,
  ClarificationStatus,
} from '../../types/coordinator';
import { createInAppNotification } from '../notifications/notification.service';

export type Unsubscribe = () => void;

function mapRowToClarification(row: any): ClarificationRequest {
  return {
    id: row.id,
    donationId: row.donation_id,
    donationName: 'Surplus Food',
    donorId: row.donor_id,
    coordinatorId: row.coordinator_id,
    coordinatorName: row.coordinator_name || 'Coordinator',
    category: row.category as ClarificationCategory,
    message: row.message,
    status: (row.status === 'RESOLVED' ? 'RESPONDED' : (row.status as ClarificationStatus)) || 'OPEN',
    response: row.response || undefined,
    respondedAt: row.responded_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Submits a new clarification request from a verified coordinator to the donor.
 */
export async function requestClarification(input: {
  donationId: string;
  donationName: string;
  donorId: string;
  coordinatorId: string;
  coordinatorName: string;
  category: ClarificationCategory;
  message: string;
}): Promise<ClarificationRequest> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

  if (!input.message.trim()) {
    throw new Error('Please enter a clarification question.');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('clarification_requests')
    .insert({
      donation_id: input.donationId,
      donor_id: input.donorId,
      coordinator_id: input.coordinatorId,
      coordinator_name: input.coordinatorName,
      category: input.category,
      message: input.message.trim(),
      status: 'OPEN',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Notify donor
  if (input.donorId) {
    createInAppNotification(input.donorId, {
      userId: input.donorId,
      type: 'CLARIFICATION_REQUESTED',
      title: 'Clarification Requested',
      body: `${input.coordinatorName} asked about ${input.category}: "${input.message.trim()}"`,
      resourceType: 'donation',
      resourceId: input.donationId,
      deepLinkRoute: `/(donor)/tracking?id=${input.donationId}`,
      priority: 'HIGH',
    }).catch((err) => console.warn('[ClarificationService] Notification error:', err));
  }

  return mapRowToClarification(data);
}

/**
 * Responds to an open clarification request.
 */
export async function respondToClarification(
  requestId: string,
  donorId: string,
  responseMessage: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('clarification_requests')
    .update({
      response: responseMessage.trim(),
      status: 'RESPONDED',
      responded_at: now,
      updated_at: now,
    })
    .eq('id', requestId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Subscribes to clarification requests for a given donation.
 */
export function subscribeToDonationClarifications(
  donationId: string,
  onUpdate: (requests: ClarificationRequest[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  const fetchClarifications = async () => {
    try {
      const { data, error } = await supabase
        .from('clarification_requests')
        .select('*')
        .eq('donation_id', donationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[ClarificationService] Query error:', error);
        return;
      }

      onUpdate((data || []).map(mapRowToClarification));
    } catch (e) {
      console.warn('[ClarificationService] Exception fetching clarifications:', e);
    }
  };

  fetchClarifications();

  const channel = supabase
    .channel(`realtime:clarifications:${donationId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clarification_requests', filter: `donation_id=eq.${donationId}` },
      () => fetchClarifications()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
