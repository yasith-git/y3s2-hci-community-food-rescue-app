/**
 * Volunteer Route Supabase Service
 * Handles CRUD and active route status for volunteer journeys.
 * Community Food Rescue App (Supabase Backend)
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  VolunteerRoute,
  CreateVolunteerRouteInput,
} from '../../types/route';

export type Unsubscribe = () => void;

function mapRowToRoute(row: any): VolunteerRoute {
  return {
    id: row.id,
    volunteerId: row.volunteer_id || row.user_id,
    name: row.name || row.route_name || undefined,
    origin: {
      address: row.origin_address,
      latitude: Number(row.origin_latitude),
      longitude: Number(row.origin_longitude),
    },
    destination: {
      address: row.destination_address,
      latitude: Number(row.destination_latitude),
      longitude: Number(row.destination_longitude),
    },
    availableFromAt: row.available_from_at || row.departure_time || new Date().toISOString(),
    availableUntilAt: row.available_until_at || new Date(Date.now() + 86400000).toISOString(),
    maxDetourMinutes: Number(row.max_detour_minutes || 15),
    transportMode: (row.transport_mode as any) || 'DRIVING',
    routeType: (row.route_type as any) || 'ONE_TIME',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createVolunteerRoute(
  volunteerId: string,
  input: CreateVolunteerRouteInput
): Promise<VolunteerRoute> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  if (input.isActive) {
    await deactivateAllVolunteerRoutes(volunteerId);
  }

  const { data, error } = await supabase
    .from('volunteer_routes')
    .insert({
      volunteer_id: volunteerId,
      name: input.name || 'Volunteer Route',
      origin_address: input.origin.address,
      origin_latitude: input.origin.latitude,
      origin_longitude: input.origin.longitude,
      destination_address: input.destination.address,
      destination_latitude: input.destination.latitude,
      destination_longitude: input.destination.longitude,
      max_detour_minutes: input.maxDetourMinutes || 15,
      transport_mode: input.transportMode || 'DRIVING',
      available_from_at: input.availableFromAt || new Date().toISOString(),
      available_until_at: input.availableUntilAt || new Date(Date.now() + 86400000).toISOString(),
      route_type: 'ONE_TIME',
      is_active: input.isActive ?? true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToRoute(data);
}

export async function getVolunteerRoutes(volunteerId: string): Promise<VolunteerRoute[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('volunteer_routes')
    .select('*')
    .eq('volunteer_id', volunteerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[RouteService] Fetch error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  return (data || []).map(mapRowToRoute);
}

export async function getActiveVolunteerRoute(volunteerId: string): Promise<VolunteerRoute | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('volunteer_routes')
    .select('*')
    .eq('volunteer_id', volunteerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.warn('[RouteService] Fetch active route error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }
  if (!data || data.length === 0) return null;
  return mapRowToRoute(data[0]);
}

export function subscribeToActiveVolunteerRoute(
  volunteerId: string,
  onUpdate: (route: VolunteerRoute | null) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate(null);
    return () => {};
  }

  getActiveVolunteerRoute(volunteerId).then(onUpdate);

  const channel = supabase
    .channel(`realtime:active_route:${volunteerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'volunteer_routes', filter: `volunteer_id=eq.${volunteerId}` },
      () => {
        getActiveVolunteerRoute(volunteerId).then(onUpdate);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToSavedRoutes(
  volunteerId: string,
  onUpdate: (routes: VolunteerRoute[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  getVolunteerRoutes(volunteerId).then(onUpdate);

  const channel = supabase
    .channel(`realtime:saved_routes:${volunteerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'volunteer_routes', filter: `volunteer_id=eq.${volunteerId}` },
      () => {
        getVolunteerRoutes(volunteerId).then(onUpdate);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function setActiveVolunteerRoute(
  routeId: string,
  volunteerId: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

  await deactivateAllVolunteerRoutes(volunteerId);

  const { error } = await supabase
    .from('volunteer_routes')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', routeId)
    .eq('volunteer_id', volunteerId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deactivateAllVolunteerRoutes(volunteerId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase
    .from('volunteer_routes')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('volunteer_id', volunteerId);
}

export async function deleteVolunteerRoute(
  routeId: string,
  volunteerId?: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
  if (routeId.startsWith('dev-')) return; // ignore mock routes

  let query = supabase.from('volunteer_routes').delete().eq('id', routeId);
  if (volunteerId) {
    query = query.eq('volunteer_id', volunteerId);
  }

  const { error } = await query;
  if (error) {
    console.warn('[RouteService] Delete route notice:', error.message);
  }
}
