/**
 * Organization Service Layer
 * Supabase-backed organization management, application submission, verification status, and member queries.
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  Organization,
  OrganizationApplicationInput,
  CoordinatorVerificationStatus,
} from '../../types/coordinator';

/**
 * Submits a verified community organization application via atomic RPC.
 */
export async function submitOrganizationApplication(
  input: OrganizationApplicationInput
): Promise<{ success: boolean; organizationId?: string; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: true,
      organizationId: 'demo-org-123',
      message: 'Application recorded in local preview mode.',
    };
  }

  const { data, error } = await supabase.rpc('apply_coordinator_organization_atomic', {
    p_name: input.name,
    p_organization_type: input.organizationType,
    p_registration_number: input.registrationNumber || null,
    p_contact_email: input.contactEmail,
    p_contact_phone: input.contactPhone,
    p_address: input.address,
    p_city_area: input.cityArea,
    p_latitude: input.latitude || null,
    p_longitude: input.longitude || null,
    p_service_radius_km: input.serviceRadiusKm || 15.0,
    p_description: input.description || null,
    p_distribution_capacity_people: input.distributionCapacityPeople || 50,
    p_storage_capabilities: input.storageCapabilities || ['AMBIENT'],
    p_accepted_food_categories: input.acceptedFoodCategories || ['All'],
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = data as { success: boolean; organizationId?: string; message?: string };
  return {
    success: result?.success ?? true,
    organizationId: result?.organizationId,
    message: result?.message || 'Application submitted successfully.',
  };
}

/**
 * Fetches the organization details linked to a coordinator user.
 */
export async function getCoordinatorOrganization(
  userId: string
): Promise<Organization | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  // Query organization_members -> organizations
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      member_role,
      is_primary_contact,
      organizations (*)
    `)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const rawOrg = (data as any).organizations;
  if (!rawOrg) return null;

  return {
    id: rawOrg.id,
    name: rawOrg.name,
    organizationType: rawOrg.organization_type,
    registrationNumber: rawOrg.registration_number,
    contactEmail: rawOrg.contact_email,
    contactPhone: rawOrg.contact_phone,
    address: rawOrg.address,
    cityArea: rawOrg.city_area,
    latitude: rawOrg.latitude,
    longitude: rawOrg.longitude,
    serviceRadiusKm: Number(rawOrg.service_radius_km) || 15,
    description: rawOrg.description,
    distributionCapacityPeople: Number(rawOrg.distribution_capacity_people) || 50,
    storageCapabilities: rawOrg.storage_capabilities || ['AMBIENT'],
    acceptedFoodCategories: rawOrg.accepted_food_categories || ['All'],
    verificationStatus: rawOrg.verification_status as CoordinatorVerificationStatus,
    verificationNotes: rawOrg.verification_notes,
    verifiedAt: rawOrg.verified_at,
    verifiedBy: rawOrg.verified_by,
    isActive: Boolean(rawOrg.is_active),
    createdAt: rawOrg.created_at,
    updatedAt: rawOrg.updated_at,
  };
}

/**
 * Subscribes to the live verification status of a coordinator's organization.
 */
export function subscribeToOrganizationStatus(
  userId: string,
  onUpdate: (org: Organization | null) => void
): () => void {
  if (!isSupabaseConfigured) {
    onUpdate(null);
    return () => {};
  }

  let currentOrgId: string | null = null;

  const fetchOrg = async () => {
    const org = await getCoordinatorOrganization(userId);
    currentOrgId = org?.id || null;
    onUpdate(org);
  };

  fetchOrg();

  const channel = supabase
    .channel(`org-status-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'organizations' },
      () => {
        fetchOrg();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'organization_members' },
      () => {
        fetchOrg();
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}
