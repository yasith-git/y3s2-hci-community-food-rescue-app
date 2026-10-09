/**
 * Community Collection Point Service Layer
 * Manages operational food hub receiving points created by verified coordinators.
 * Privacy principle: Only operational logistics data is stored (NO beneficiary personal data).
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { CommunityPoint, CreateCommunityPointInput } from '../../types/coordinator';

export type Unsubscribe = () => void;

export function mapRowToPoint(row: any): CommunityPoint {
  return {
    id: row.id,
    coordinatorId: row.coordinator_id || row.organization_id || '',
    organizationId: row.organization_id || undefined,
    organizationName: row.organization_name || row.point_type || 'Community Hub',
    label: row.label || row.name || 'Collection Center',
    address: row.address || '',
    latitude: Number(row.latitude) || 0,
    longitude: Number(row.longitude) || 0,
    instructions: row.instructions || row.access_instructions || '',
    contactName: row.contact_name || row.point_type || 'Coordinator',
    contactPhone: row.contact_phone || '',
    operatingHours: row.operating_hours || '',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Creates a new community collection point for a verified coordinator.
 */
export async function createCommunityPoint(
  coordinatorId: string,
  input: CreateCommunityPointInput
): Promise<CommunityPoint> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const trimmedLabel = input.label?.trim();
  if (!trimmedLabel) {
    throw new Error('Collection point label is required.');
  }

  const trimmedAddress = input.address?.trim();
  if (!trimmedAddress) {
    throw new Error('Collection point address is required.');
  }

  if (
    typeof input.latitude !== 'number' ||
    typeof input.longitude !== 'number' ||
    isNaN(input.latitude) ||
    isNaN(input.longitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    throw new Error('Valid coordinates are required (latitude -90..90, longitude -180..180).');
  }

  const payload = {
    coordinator_id: coordinatorId || input.coordinatorId,
    organization_id: input.organizationId || null,
    organization_name: input.organizationName?.trim() || 'Community Partner Hub',
    label: trimmedLabel,
    address: trimmedAddress,
    latitude: input.latitude,
    longitude: input.longitude,
    instructions: input.instructions?.trim() || null,
    contact_name: input.contactName?.trim() || 'Coordinator',
    contact_phone: input.contactPhone?.trim() || '',
    operating_hours: input.operatingHours?.trim() || null,
    is_active: input.isActive ?? true,
  };

  const { data, error } = await supabase
    .from('community_points')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[CommunityPointCRUD] create failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message);
  }

  return mapRowToPoint(data);
}

/**
 * Updates an existing community collection point.
 */
export async function updateCommunityPoint(
  pointId: string,
  coordinatorIdOrUpdates: string | Partial<CreateCommunityPointInput>,
  maybeUpdates?: Partial<CreateCommunityPointInput>
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const updates = (typeof coordinatorIdOrUpdates === 'object' ? coordinatorIdOrUpdates : maybeUpdates) || {};

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.label !== undefined) updatePayload.label = updates.label.trim();
  if (updates.address !== undefined) updatePayload.address = updates.address.trim();
  if (updates.latitude !== undefined) {
    if (isNaN(updates.latitude) || updates.latitude < -90 || updates.latitude > 90) {
      throw new Error('Valid latitude is required (-90..90).');
    }
    updatePayload.latitude = updates.latitude;
  }
  if (updates.longitude !== undefined) {
    if (isNaN(updates.longitude) || updates.longitude < -180 || updates.longitude > 180) {
      throw new Error('Valid longitude is required (-180..180).');
    }
    updatePayload.longitude = updates.longitude;
  }
  if (updates.instructions !== undefined) updatePayload.instructions = updates.instructions.trim() || null;
  if (updates.contactName !== undefined) updatePayload.contact_name = updates.contactName.trim();
  if (updates.contactPhone !== undefined) updatePayload.contact_phone = updates.contactPhone.trim();
  if (updates.operatingHours !== undefined) updatePayload.operating_hours = updates.operatingHours.trim() || null;
  if (updates.organizationName !== undefined) updatePayload.organization_name = updates.organizationName.trim();
  if (updates.isActive !== undefined) updatePayload.is_active = updates.isActive;

  const { error } = await supabase
    .from('community_points')
    .update(updatePayload)
    .eq('id', pointId);

  if (error) {
    console.error('[CommunityPointCRUD] update failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message);
  }
}

/**
 * Retrieves all active community points for coordinators or general dropoffs.
 */
export async function getActiveCommunityPoints(): Promise<CommunityPoint[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('community_points')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CommunityPointCRUD] fetch active failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return (data || []).map(mapRowToPoint);
}

/**
 * Retrieves community points belonging to a specific coordinator's organization.
 */
export async function getCoordinatorCommunityPoints(
  coordinatorId: string
): Promise<CommunityPoint[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('community_points')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CommunityPointCRUD] fetch coordinator points failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return (data || []).map(mapRowToPoint);
}

/**
 * Subscribes to community points for a specific coordinator.
 */
export function subscribeToCoordinatorCommunityPoints(
  coordinatorId: string,
  onUpdate: (points: CommunityPoint[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  getCoordinatorCommunityPoints(coordinatorId).then(onUpdate);

  const channel = supabase
    .channel(`realtime:coordinator_community_points:${coordinatorId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'community_points' },
      () => {
        getCoordinatorCommunityPoints(coordinatorId).then(onUpdate);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Real-time subscription to active community points.
 */
export function subscribeToActiveCommunityPoints(
  onUpdate: (points: CommunityPoint[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  getActiveCommunityPoints().then(onUpdate);

  const channel = supabase
    .channel('realtime:community_points')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'community_points' },
      () => {
        getActiveCommunityPoints().then(onUpdate);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Deactivates or toggles a community point.
 */
export async function deactivateCommunityPoint(pointId: string, coordinatorId?: string): Promise<void> {
  await toggleCommunityPointActiveStatus(pointId, false);
}

/**
 * Toggles the active/pause status of a community collection point.
 */
export async function toggleCommunityPointActiveStatus(
  pointId: string,
  isActive: boolean
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('community_points')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pointId);

  if (error) {
    console.error('[CommunityPointCRUD] toggleActiveStatus failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message);
  }
}

