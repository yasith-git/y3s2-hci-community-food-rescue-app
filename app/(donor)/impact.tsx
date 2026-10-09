/**
 * Donor Impact Screen
 * Real-time dynamic aggregation of completed food rescue contributions
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassButton,
  ProgressBar,
  SectionHeader,
  Skeleton,
} from '../../src/components/ui';
import { colors, typography, spacing, radius } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';
import { subscribeToDonorDonations } from '../../src/services/donations/donation.service';
import { Donation } from '../../src/types/donation';

export default function DonorImpactScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToDonorDonations(user.uid, (list) => {
      setDonations(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const completed = donations.filter((d) => d.status === 'COMPLETED');
  const totalMeals = completed.reduce((sum, d) => sum + (d.food.quantity || 0), 0);
  const totalKg = Math.round(totalMeals * 0.45);
  const totalCO2 = Math.round(totalKg * 1.9); // Standard waste emission factor: ~1.9kg CO2e per kg food

  const monthlyTarget = 100;
  const progressPct = Math.min(1, totalMeals / monthlyTarget);

  return (
    <ScreenContainer scrollable={true} testID="donor-impact-screen">
      <GlassHeader title="Community Impact" />

      <View style={styles.content}>
        <GlassCard variant="elevated" style={styles.heroImpactCard}>
          <View style={styles.heroIconBox}>
            <Ionicons name="earth" size={32} color={colors.brand.primary} />
          </View>
          <Text style={[typography.headingLarge, styles.heroTitle]}>
            Your Environmental Impact
          </Text>
          <Text style={[typography.bodyMedium, styles.heroSubtitle]}>
            Every kilogram of surplus food saved reduces greenhouse gas emissions and feeds members of your university community.
          </Text>
        </GlassCard>

        <SectionHeader
          title="Lifetime Overview"
          subtitle="Cumulative verified rescue statistics"
        />

        {loading ? (
          <Skeleton height={100} borderRadius={radius.xl} />
        ) : (
          <View style={styles.metricsRow}>
            <GlassCard variant="standard" style={styles.metricCard}>
              <Text style={[typography.displayMedium, styles.metricVal]}>{totalMeals}</Text>
              <Text style={[typography.labelMedium, styles.metricTitle]}>Meals Provided</Text>
              <Text style={[typography.caption, styles.metricSub]}>Redirected fresh food</Text>
            </GlassCard>

            <GlassCard variant="standard" style={styles.metricCard}>
              <Text style={[typography.displayMedium, styles.metricVal]}>{totalCO2} kg</Text>
              <Text style={[typography.labelMedium, styles.metricTitle]}>CO2 Avoided</Text>
              <Text style={[typography.caption, styles.metricSub]}>From landfill prevention</Text>
            </GlassCard>
          </View>
        )}

        <SectionHeader
          title="Campus Sustainability Milestone"
          subtitle="Monthly community target (100 meals)"
        />

        <GlassCard variant="standard">
          <View style={styles.milestoneHeader}>
            <Text style={[typography.titleSmall, styles.milestoneTitle]}>
              Community Food Waste Reduction
            </Text>
            <Text style={[typography.labelSmall, styles.milestonePct]}>
              {Math.round(progressPct * 100)}%
            </Text>
          </View>
          <ProgressBar progress={progressPct} />
          <Text style={[typography.caption, styles.milestoneSub]}>
            {totalMeals >= monthlyTarget
              ? 'Congratulations! You have reached your monthly community food-rescue milestone!'
              : `${monthlyTarget - totalMeals} more meals to reach the community monthly milestone.`}
          </Text>
        </GlassCard>

        <GlassButton
          title="+ Offer Food Donation"
          variant="primary"
          size="medium"
          icon="add-circle-outline"
          onPress={() => router.push('/(donor)/create' as any)}
          style={styles.actionButton}
          fullWidth
        />

        <View style={{ height: 40 }} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  heroImpactCard: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: radius.round,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.brand[900],
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metricVal: {
    color: colors.brand.primary,
    fontSize: 26,
    lineHeight: 32,
  },
  metricTitle: {
    color: colors.text.primary,
    marginTop: 2,
  },
  metricSub: {
    color: colors.text.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  milestoneTitle: {
    color: colors.text.primary,
  },
  milestonePct: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
  milestoneSub: {
    color: colors.text.muted,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  actionButton: {
    marginTop: spacing.md,
  },
});
