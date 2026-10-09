/**
 * Donor Donations Tab Screen
 * Real-time filterable donation records (Active, Completed, Cancelled / Expired)
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  GlassChip,
  EmptyState,
  Skeleton,
} from '../../src/components/ui';
import { DonationCard } from '../../src/components/donation/DonationCard';
import { colors, typography, spacing, radius } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { subscribeToDonorDonations } from '../../src/services/donations/donation.service';
import { isDonationActive, isDonationExpired } from '../../src/services/donations/donation.state-machine';
import { Donation } from '../../src/types/donation';

export default function DonorDonationsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'other'>('all');

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToDonorDonations(user.uid, (list) => {
      setDonations(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const activeDonations = donations.filter(
    (d) => isDonationActive(d.status) && !isDonationExpired(d)
  );
  const completedDonations = donations.filter((d) => d.status === 'COMPLETED');
  const otherDonations = donations.filter(
    (d) =>
      d.status === 'CANCELLED' ||
      d.status === 'EXPIRED' ||
      d.status === 'ISSUE_REPORTED' ||
      isDonationExpired(d)
  );

  const getFilteredList = () => {
    switch (filter) {
      case 'active':
        return activeDonations;
      case 'completed':
        return completedDonations;
      case 'other':
        return otherDonations;
      case 'all':
      default:
        return donations;
    }
  };

  const filteredList = getFilteredList();

  return (
    <ScreenContainer scrollable={true} testID="donor-donations-screen">
      <GlassHeader title="My Donations" />

      <View style={styles.content}>
        {/* Filter Segmented Chips */}
        <View style={styles.chipsRow}>
          <GlassChip
            label={`All (${donations.length})`}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <GlassChip
            label={`Active (${activeDonations.length})`}
            selected={filter === 'active'}
            onPress={() => setFilter('active')}
          />
          <GlassChip
            label={`Completed (${completedDonations.length})`}
            selected={filter === 'completed'}
            onPress={() => setFilter('completed')}
          />
          <GlassChip
            label={`Other (${otherDonations.length})`}
            selected={filter === 'other'}
            onPress={() => setFilter('other')}
          />
        </View>

        {loading ? (
          <View style={{ gap: spacing.sm }}>
            <Skeleton height={80} borderRadius={radius.lg} />
            <Skeleton height={80} borderRadius={radius.lg} />
            <Skeleton height={80} borderRadius={radius.lg} />
          </View>
        ) : filteredList.length > 0 ? (
          filteredList.map((item) => (
            <DonationCard
              key={item.id}
              donation={item}
              onPress={() =>
                router.push({
                  pathname: '/(donor)/tracking',
                  params: { donationId: item.id },
                } as any)
              }
            />
          ))
        ) : (
          <EmptyState
            icon="cube-outline"
            title="No Donations Found"
            description={
              filter === 'all'
                ? 'When you share surplus food, your active listings and past delivery receipts will appear here.'
                : `You currently have no ${filter} donations.`
            }
            primaryActionTitle="+ Offer Food"
            onPrimaryAction={() => router.push('/(donor)/create' as any)}
          />
        )}

        <View style={{ height: 40 }} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
});
