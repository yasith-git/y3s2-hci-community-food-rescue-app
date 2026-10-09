/**
 * Beneficiary Distribution Service Layer
 * Supabase-backed distribution recording, traceability query, quantity verification, and post-delivery lifecycle management.
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  DistributionRecord,
  RecordDistributionInput,
  RecipientGroup,
} from '../../types/coordinator';

/**
 * Acknowledges receipt of delivered food at the collection hub.
 * Transitions DELIVERED -> ACKNOWLEDGED.
 */
export async function acknowledgeDelivery(
  donationId: string,
  notes?: string,
  actualQuantityReceived?: number
): Promise<{ success: boolean; status: string; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      status: 'ACKNOWLEDGED',
      message: 'Delivery receipt acknowledged in local mode.',
    };
  }

  const { data, error } = await supabase.rpc('acknowledge_delivery_atomic', {
    p_donation_id: donationId,
    p_notes: notes || null,
    p_actual_quantity_received: actualQuantityReceived || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as { success: boolean; status: string; message: string };
}

/**
 * Records an anonymized community distribution record for an acknowledged donation.
 * Transitions ACKNOWLEDGED -> COMPLETED once all quantities are accounted for.
 */
export async function recordBeneficiaryDistribution(
  input: RecordDistributionInput
): Promise<{
  success: boolean;
  distributionReference: string;
  isCompleted: boolean;
  totalDistributed: number;
  remainingQuantity: number;
  status: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      distributionReference: 'DIST-2026-DEMO',
      isCompleted: true,
      totalDistributed: input.quantityDistributed,
      remainingQuantity: 0,
      status: 'COMPLETED',
    };
  }

  const { data, error } = await supabase.rpc('record_distribution_atomic', {
    p_donation_id: input.donationId,
    p_recipient_group: input.recipientGroup,
    p_people_served: input.peopleServed,
    p_quantity_distributed: input.quantityDistributed,
    p_unit: input.unit,
    p_distribution_location: input.distributionLocation,
    p_notes: input.notes || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as {
    success: boolean;
    distributionReference: string;
    isCompleted: boolean;
    totalDistributed: number;
    remainingQuantity: number;
    status: string;
  };
}

/**
 * Fetches all distribution records for a specific donation.
 */
export async function getDonationDistributionRecords(
  donationId: string
): Promise<DistributionRecord[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('distribution_records')
    .select('*')
    .eq('donation_id', donationId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    donationId: row.donation_id,
    organizationId: row.organization_id,
    communityPointId: row.community_point_id,
    recordedBy: row.recorded_by,
    distributionReference: row.distribution_reference,
    distributionDate: row.distribution_date,
    recipientGroup: row.recipient_group,
    peopleServed: Number(row.people_served),
    quantityDistributed: Number(row.quantity_distributed),
    unit: row.unit,
    distributionLocation: row.distribution_location,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Subscribes to live distribution records for an organization's completed rescues.
 */
export function subscribeToOrganizationDistributions(
  organizationId: string,
  onUpdate: (records: DistributionRecord[]) => void
): () => void {
  if (!isSupabaseConfigured || !organizationId) {
    onUpdate([]);
    return () => {};
  }

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('distribution_records')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      onUpdate([]);
      return;
    }

    onUpdate(
      data.map((row: any) => ({
        id: row.id,
        donationId: row.donation_id,
        organizationId: row.organization_id,
        communityPointId: row.community_point_id,
        recordedBy: row.recorded_by,
        distributionReference: row.distribution_reference,
        distributionDate: row.distribution_date,
        recipientGroup: row.recipient_group,
        peopleServed: Number(row.people_served),
        quantityDistributed: Number(row.quantity_distributed),
        unit: row.unit,
        distributionLocation: row.distribution_location,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    );
  };

  fetchRecords();

  const channel = supabase
    .channel(`org-distributions-${organizationId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'distribution_records', filter: `organization_id=eq.${organizationId}` },
      () => {
        fetchRecords();
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}
