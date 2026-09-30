/**
 * Donor Donations List Screen Foundation
 * Shows segmented filter tabs and polished empty states for active, completed, and cancelled donations
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  GlassChip,
  GlassCard,
  EmptyState,
} from '../../src/components/ui';
import { colors, typography, spacing } from '../../src/design-system';

export default function DonorDonationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  return (
    <ScreenContainer scrollable={true} testID="donor-donations-screen">
      <GlassHeader title="My Donations" />

      <View style={styles.content}>
        {/* Filter Segmented Chips */}
        <View style={styles.chipsRow}>
          <GlassChip
            label="All (0)"
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <GlassChip
            label="Active (0)"
            selected={filter === 'active'}
            onPress={() => setFilter('active')}
          />
          <GlassChip
            label="Completed (0)"
            selected={filter === 'completed'}
            onPress={() => setFilter('completed')}
          />
          <GlassChip
            label="Cancelled (0)"
            selected={filter === 'cancelled'}
            onPress={() => setFilter('cancelled')}
          />
        </View>

        {/* Empty State */}
        <EmptyState
          icon="cube-outline"
          title="No Donations Yet"
          description="When you share surplus food, your listings, active volunteer pickups, and delivery receipts will appear here."
          primaryActionTitle="+ Offer Food"
          onPrimaryAction={() => router.push('/(donor)/offer-food-placeholder' as any)}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});
