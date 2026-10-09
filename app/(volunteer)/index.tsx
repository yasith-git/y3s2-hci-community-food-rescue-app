/**
 * Volunteer Discover Home Screen
 * Displays greeting, active route status, active rescue banner, interactive map, list view toggle, notification bell, and opportunity cards.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  EmptyState,
  Skeleton,
} from '../../src/components/ui';
import { RouteSummaryCard } from '../../src/components/routes/RouteSummaryCard';
import { ActiveRescueCard } from '../../src/components/rescue/ActiveRescueCard';
import { RouteMap } from '../../src/components/map/RouteMap';
import { MapListToggle } from '../../src/components/discovery/MapListToggle';
import { OpportunityCard } from '../../src/components/discovery/OpportunityCard';
import { OpportunityBottomSheet } from '../../src/components/discovery/OpportunityBottomSheet';
import { FilterSheet } from '../../src/components/discovery/FilterSheet';
import { NotificationBanner } from '../../src/components/notifications/NotificationBanner';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { Donation } from '../../src/types/donation';
import { RescueAssignment } from '../../src/types/rescue';
import { AppNotification } from '../../src/types/notification';
import {
  VolunteerRoute,
  RouteMatch,
  DiscoveryViewMode,
  DiscoveryFilterState,
} from '../../src/types/route';
import {
  subscribeToActiveVolunteerRoute,
  getActiveVolunteerRoute,
} from '../../src/services/routes/route.service';
import {
  subscribeToDiscoverableDonations,
  evaluateDiscoveryMatches,
} from '../../src/services/matching/discovery.service';
import { subscribeToActiveRescue } from '../../src/services/rescue/rescue.service';
import { subscribeToUserNotifications } from '../../src/services/notifications/notification.service';
import { getCurrentGeoPosition } from '../../src/services/location/location.service';
import {
  DEV_DEFAULT_VOLUNTEER_ROUTE,
} from '../../src/services/matching/dev.fixtures';

export default function VolunteerDiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeRoute, setActiveRoute] = useState<VolunteerRoute | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<RescueAssignment | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [viewMode, setViewMode] = useState<DiscoveryViewMode>('MAP');
  const [selectedMatch, setSelectedMatch] = useState<RouteMatch | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [latestNotification, setLatestNotification] = useState<AppNotification | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<DiscoveryFilterState>({
    mode: 'ALL',
    selectedCategory: 'All',
    maxDistanceKm: 15,
  });

  useEffect(() => {
    let unsubRoute: () => void = () => {};
    let unsubDonations: () => void = () => {};
    let unsubRescue: () => void = () => {};
    let unsubNotifs: () => void = () => {};

    // Safety timeout to ensure loading skeletons never permanently block map view
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    if (user?.uid) {
      unsubRoute = subscribeToActiveVolunteerRoute(user.uid, (route) => {
        if (route) {
          setActiveRoute(route);
        } else {
          setActiveRoute(DEV_DEFAULT_VOLUNTEER_ROUTE);
        }
      });

      unsubRescue = subscribeToActiveRescue(user.uid, (assign) => {
        setActiveAssignment(assign);
      });

      unsubNotifs = subscribeToUserNotifications(user.uid, (list, unread) => {
        setUnreadNotifications(unread);
        if (list.length > 0 && !list[0].readAt) {
          setLatestNotification(list[0]);
        }
      });
    } else {
      setActiveRoute(DEV_DEFAULT_VOLUNTEER_ROUTE);
    }

    unsubDonations = subscribeToDiscoverableDonations((activeDonations) => {
      setDonations(activeDonations);
      setIsLoading(false);
    });

    getCurrentGeoPosition().then((pos) => {
      if (pos) {
        setUserLocation({ latitude: pos.latitude, longitude: pos.longitude });
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubRoute();
      unsubDonations();
      unsubRescue();
      unsubNotifs();
    };
  }, [user?.uid]);

  const matches: RouteMatch[] = evaluateDiscoveryMatches(
    donations,
    activeRoute,
    userLocation,
    filters
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    haptic.selection();
    if (user?.uid) {
      const r = await getActiveVolunteerRoute(user.uid);
      if (r) setActiveRoute(r);
    }
    const pos = await getCurrentGeoPosition();
    if (pos) {
      setUserLocation({ latitude: pos.latitude, longitude: pos.longitude });
    }
    setRefreshing(false);
  };

  const handleOpportunityPress = (match: RouteMatch) => {
    setSelectedMatch(match);
  };

  const handleViewDetails = (match: RouteMatch) => {
    router.push({
      pathname: '/(volunteer)/opportunity/[id]',
      params: { id: match.donation.id },
    });
  };

  return (
    <ScreenContainer scrollable={false} testID="volunteer-discover-screen">
      {/* Foreground Alert Banner */}
      <NotificationBanner
        notification={latestNotification}
        onPress={(n) => {
          setLatestNotification(null);
          router.push('/(volunteer)/notifications');
        }}
        onDismiss={() => setLatestNotification(null)}
      />

      {/* Top Header with Greeting, Notification Center & Filters */}
      <GlassHeader
        title="Discover Rescues"
        subtitle="Make your daily journey matter"
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                haptic.selection();
                router.push('/(volunteer)/notifications');
              }}
              style={styles.bellButton}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
              {unreadNotifications > 0 && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                haptic.selection();
                setFilterVisible(true);
              }}
              style={styles.filterButton}
              accessibilityRole="button"
              accessibilityLabel="Filter rescues"
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={20} color={colors.brand[800]} />
              {(filters.selectedCategory !== 'All' || filters.mode !== 'ALL' || filters.maxDistanceKm !== 15) && (
                <View style={styles.filterActiveDot} />
              )}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* Active Rescue Quick Alert Card if Volunteer is Assigned */}
        {activeAssignment && (
          <ActiveRescueCard
            assignment={activeAssignment}
            status={
              (activeAssignment.donationStatus as any) ||
              (activeAssignment.pickedUpAt ? 'PICKED_UP' : activeAssignment.pickupStartedAt ? 'PICKUP_EN_ROUTE' : 'VOLUNTEER_ASSIGNED')
            }
            onContinue={() => {
              router.push({
                pathname: '/(volunteer)/active-rescue',
                params: { id: activeAssignment.donationId },
              });
            }}
          />
        )}

        {/* Active Route Summary Bar */}
        <RouteSummaryCard
          route={activeRoute}
          matchCount={matches.length}
          onSetRoute={() => router.push('/(volunteer)/create-route')}
          onEditRoute={() => router.push('/(volunteer)/create-route')}
        />

        {/* Segmented View Toggle (Map vs List) */}
        <MapListToggle mode={viewMode} onChange={setViewMode} />

        {/* Main Content Area */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Skeleton width="92%" height={240} borderRadius={radius.lg} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Skeleton width="92%" height={80} borderRadius={radius.md} style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Skeleton width="92%" height={80} borderRadius={radius.md} style={{ alignSelf: 'center' }} />
          </View>
        ) : viewMode === 'MAP' ? (
          <View style={styles.mapContainer}>
            <RouteMap
              activeRoute={activeRoute}
              matches={matches}
              selectedMatchId={selectedMatch?.donation.id || null}
              onSelectMatch={handleOpportunityPress}
              userLocation={userLocation}
            />

            {/* Quick Preview Bottom Sheet when marker tapped */}
            <OpportunityBottomSheet
              match={selectedMatch}
              onClose={() => setSelectedMatch(null)}
              onViewDetails={handleViewDetails}
            />
          </View>
        ) : matches.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No Route Matches Found"
            description="No donations currently fit this trajectory. Try increasing your maximum detour or checking nearby rescues."
            primaryActionTitle="Edit Journey"
            onPrimaryAction={() => router.push('/(volunteer)/create-route')}
          />
        ) : (
          matches.map((match) => (
            <OpportunityCard
              key={match.donation.id}
              match={match}
              onPress={() => handleViewDetails(match)}
              selected={selectedMatch?.donation.id === match.donation.id}
            />
          ))
        )}
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={filters}
        onApplyFilters={setFilters}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bellButton: {
    padding: 6,
    position: 'relative',
    marginRight: 4,
  },
  badgePill: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(35, 132, 113, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0B3D35',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  filterActiveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  loadingContainer: {
    paddingTop: spacing.md,
  },
  mapContainer: {
    width: '100%',
    height: 380,
    minHeight: 280,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
    marginVertical: spacing.xs,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing['6xl'] + spacing.xl,
  },
});
