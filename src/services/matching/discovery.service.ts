/**
 * Discovery Service for Volunteers
 * Subscribes to published donations and evaluates matches in real-time.
 * Community Food Rescue App (Supabase Backend)
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Donation } from '../../types/donation';
import {
  VolunteerRoute,
  RouteMatch,
  DiscoveryFilterState,
  CommunityPointSummary,
} from '../../types/route';
import {
  matchDonationsAgainstRoute,
  findNearbyDonations,
  isDonationDiscoverable,
} from './matching.engine';
import { mapRowToDonation } from '../donations/donation.service';

export type Unsubscribe = () => void;

/**
 * Real-time listener for discoverable (PUBLISHED) donations.
 */
export function subscribeToDiscoverableDonations(
  onUpdate: (donations: Donation[]) => void,
  maxLimit: number = 50
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  const fetchDiscoverable = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('pickup_deadline_at', { ascending: true })
        .limit(maxLimit);

      if (error) {
        console.warn('[DiscoveryService] Fetch error:', error);
        onUpdate([]);
        return;
      }

      const activeList: Donation[] = (data || [])
        .map(mapRowToDonation)
        .filter(isDonationDiscoverable);

      onUpdate(activeList);
    } catch (e) {
      console.warn('[DiscoveryService] Exception fetching discoverable donations:', e);
      onUpdate([]);
    }
  };

  fetchDiscoverable();

  const channel = supabase
    .channel('realtime:discoverable_donations')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'donations' },
      () => fetchDiscoverable()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Runs the matching pipeline given current donations and active volunteer route / user location.
 */
export function evaluateDiscoveryMatches(
  donations: Donation[],
  activeRoute: VolunteerRoute | null,
  userLocation: { latitude: number; longitude: number } | null,
  filters: DiscoveryFilterState
): RouteMatch[] {
  let filteredDonations = donations;

  // Food Category filter
  if (filters.selectedCategory && filters.selectedCategory !== 'All') {
    filteredDonations = filteredDonations.filter(
      (d) => d.food.category === filters.selectedCategory
    );
  }

  // 1. Strict route mode
  if (filters.mode === 'FITS_ROUTE' && activeRoute) {
    return matchDonationsAgainstRoute(activeRoute, filteredDonations);
  }

  // 2. Strict nearby mode
  if (filters.mode === 'NEARBY' && userLocation) {
    return findNearbyDonations(userLocation, filteredDonations, filters.maxDistanceKm || 15);
  }

  // 3. ALL / Default Mode: Include all donations, prioritizing route matches if route exists
  const routeMatches = activeRoute ? matchDonationsAgainstRoute(activeRoute, filteredDonations) : [];
  const matchedDonationIds = new Set(routeMatches.map((m) => m.donation.id));

  const remainingMatches: RouteMatch[] = filteredDonations
    .filter((d) => !matchedDonationIds.has(d.id))
    .map((d) => {
      const deadline = new Date(d.pickup.pickupDeadlineAt).getTime();
      const hoursRemaining = Math.max(0, (deadline - Date.now()) / (1000 * 60 * 60));
      return {
        donation: d,
        pickupDistanceKm: 0,
        routeDeviationKm: 0,
        estimatedDetourMinutes: 0,
        matchScore: 60,
        fitCategory: 'POSSIBLE' as const,
        confidence: 'APPROXIMATE' as const,
        timingCompatibility: {
          isCompatible: true,
          pickupWindowOverlapMinutes: 60,
          hoursUntilPickupDeadline: hoursRemaining,
        },
        explanation: {
          headline: 'Available for Rescue',
          detourText: 'Available in community area',
          timingText: `${Math.round(hoursRemaining)}h window remaining`,
          distanceText: d.pickup.address,
          badges: ['Available'],
        },
      };
    });

  let allMatches = [...routeMatches, ...remainingMatches];

  if (filters.mode === 'URGENT') {
    allMatches = allMatches.filter((m) => m.timingCompatibility.hoursUntilPickupDeadline <= 3);
  }

  return allMatches;
}
