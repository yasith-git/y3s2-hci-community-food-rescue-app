/**
 * Available Surplus Food Feed for Coordinators
 * Real-time feed of published food donations ready for review and reservation.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  GlassChip,
  SearchInput,
  EmptyState,
  Skeleton,
} from '../../src/components/ui';
import {
  AvailableDonationCard,
  DonationReviewModal,
  ClarificationModal,
  CommunityPointModal,
} from '../../src/components/coordinator';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { Donation, FoodCategory } from '../../src/types/donation';
import { CommunityPoint, ClarificationCategory } from '../../src/types/coordinator';
import {
  subscribeToAvailableDonationsForCoordinator,
  reserveDonationAtomically,
} from '../../src/services/reservations/reservation.service';
import {
  subscribeToCoordinatorCommunityPoints,
  createCommunityPoint,
} from '../../src/services/community-points/community-point.service';
import { requestClarification } from '../../src/services/clarifications/clarification.service';
import { DEV_MOCK_DONATIONS } from '../../src/services/matching/dev.fixtures';

const CATEGORIES: (FoodCategory | 'All')[] = [
  'All',
  'Prepared Meals',
  'Bakery',
  'Rice & Curry',
  'Vegetables',
  'Fruit',
  'Dairy',
  'Packaged Food',
];

export default function AvailableDonationsScreen() {
  const router = useRouter();
  const { user, profile, isConfigured } = useAuth();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [communityPoints, setCommunityPoints] = useState<CommunityPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [reviewDonation, setReviewDonation] = useState<Donation | null>(null);
  const [clarificationDonation, setClarificationDonation] = useState<Donation | null>(null);
  const [isPointModalVisible, setIsPointModalVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const unsubAvailable = subscribeToAvailableDonationsForCoordinator((items) => {
      if (items.length > 0) {
        setDonations(items);
      } else if (!isConfigured) {
        setDonations(DEV_MOCK_DONATIONS);
      } else {
        setDonations([]);
      }
      setIsLoading(false);
    });

    const unsubPoints = subscribeToCoordinatorCommunityPoints(user.uid, (points) => {
      setCommunityPoints(points);
    });

    return () => {
      unsubAvailable();
      unsubPoints();
    };
  }, [user, isConfigured]);

  const onRefresh = () => {
    setIsRefreshing(true);
    haptic.selection();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const filteredDonations = donations.filter((d) => {
    if (selectedCategory !== 'All' && d.food.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = d.food.name.toLowerCase().includes(q);
      const matchAddress = d.pickup.address.toLowerCase().includes(q);
      const matchDonor = (d.donorOrganization || d.donorName).toLowerCase().includes(q);
      return matchName || matchAddress || matchDonor;
    }
    return true;
  });

  const handleReserve = async (donation: Donation, communityPointId: string) => {
    if (!user) return;
    await reserveDonationAtomically(
      donation.id,
      communityPointId,
      user.uid,
      profile?.fullName || 'Community Coordinator',
      profile?.organizationName || 'Community Hub'
    );
  };

  const handleClarificationSubmit = async (category: ClarificationCategory, message: string) => {
    if (!clarificationDonation || !user) return;
    await requestClarification({
      donationId: clarificationDonation.id,
      donationName: clarificationDonation.food.name,
      donorId: clarificationDonation.donorId,
      coordinatorId: user.uid,
      coordinatorName: profile?.fullName || 'Community Coordinator',
      category,
      message,
    });
  };

  const handleCreatePoint = async (input: any) => {
    if (!user) return;
    await createCommunityPoint(user.uid, input);
  };

  return (
    <ScreenContainer scrollable={false} testID="available-donations-screen">
      <GlassHeader
        title="Available Surplus Food"
        subtitle="Review & Reserve for Community Hubs"
      />

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <SearchInput
          placeholder="Search by food, donor, or area..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories Horizontal Filter */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => (
            <GlassChip
              key={cat}
              label={cat}
              selected={selectedCategory === cat}
              onPress={() => {
                haptic.selection();
                setSelectedCategory(cat);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Main Donations Feed */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />}
      >
        {isLoading ? (
          <View style={{ padding: spacing.md, gap: 12 }}>
            <Skeleton width="100%" height={160} borderRadius={radius.lg} />
            <Skeleton width="100%" height={160} borderRadius={radius.lg} />
          </View>
        ) : filteredDonations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="fast-food-outline"
              title="No Matching Food Found"
              description="No available donations match your selected filters or search query."
              primaryActionTitle={searchQuery || selectedCategory !== 'All' ? 'Clear Filters' : undefined}
              onPrimaryAction={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            />
          </View>
        ) : (
          filteredDonations.map((donation) => (
            <AvailableDonationCard
              key={donation.id}
              donation={donation}
              onReview={(d) => setReviewDonation(d)}
            />
          ))
        )}
      </ScrollView>

      {/* Donation Review Modal */}
      <DonationReviewModal
        visible={!!reviewDonation}
        donation={reviewDonation}
        communityPoints={communityPoints}
        onClose={() => setReviewDonation(null)}
        onRequestClarification={(d) => {
          setClarificationDonation(d);
          setReviewDonation(null);
        }}
        onReserve={handleReserve}
        onAddNewCommunityPoint={() => {
          setReviewDonation(null);
          setIsPointModalVisible(true);
        }}
      />

      {/* Clarification Modal */}
      <ClarificationModal
        visible={!!clarificationDonation}
        donation={clarificationDonation}
        onClose={() => setClarificationDonation(null)}
        onSubmit={handleClarificationSubmit}
      />

      {/* Community Point Modal */}
      <CommunityPointModal
        visible={isPointModalVisible}
        onClose={() => setIsPointModalVisible(false)}
        onSave={handleCreatePoint}
        organizationName={profile?.organizationName}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  categoryScrollContainer: {
    marginBottom: spacing.sm,
  },
  categoryContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  emptyContainer: {
    padding: spacing.md,
    marginTop: spacing.lg,
  },
});
