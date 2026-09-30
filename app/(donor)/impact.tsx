/**
 * Donor Impact Screen Foundation
 * Shows environmental and community impact metrics for verified donations
 */

import React from 'react';
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
} from '../../src/components/ui';
import { colors, typography, spacing, radius } from '../../src/design-system';

export default function DonorImpactScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scrollable={true} testID="donor-impact-screen">
      <GlassHeader title="Community Impact" />

      <View style={styles.content}>
        <GlassCard variant="elevated" style={styles.heroImpactCard}>
          <View style={styles.heroIconBox}>
            <Ionicons name="earth" size={32} color={colors.brand.primary} />
          </View>
          <Text style={[typography.headingLarge, styles.heroTitle]}>
            Your Impact Starts Here
          </Text>
          <Text style={[typography.bodyMedium, styles.heroSubtitle]}>
            Every kilogram of surplus food saved reduces greenhouse gas emissions and feeds members of your university community.
          </Text>
        </GlassCard>

        <SectionHeader
          title="Lifetime Overview"
          subtitle="Cumulative verified rescue statistics"
        />

        <View style={styles.metricsRow}>
          <GlassCard variant="standard" style={styles.metricCard}>
            <Text style={[typography.displayMedium, styles.metricVal]}>0</Text>
            <Text style={[typography.labelMedium, styles.metricTitle]}>Meals Provided</Text>
            <Text style={[typography.caption, styles.metricSub]}>Redirected fresh food</Text>
          </GlassCard>

          <GlassCard variant="standard" style={styles.metricCard}>
            <Text style={[typography.displayMedium, styles.metricVal]}>0 kg</Text>
            <Text style={[typography.labelMedium, styles.metricTitle]}>CO2 Avoided</Text>
            <Text style={[typography.caption, styles.metricSub]}>From landfill prevention</Text>
          </GlassCard>
        </View>

        <SectionHeader
          title="Campus Milestone"
          subtitle="Monthly sustainability goal"
        />

        <GlassCard variant="standard">
          <View style={styles.milestoneHeader}>
            <Text style={[typography.titleSmall, styles.milestoneTitle]}>
              Campus Food Waste Reduction Goal
            </Text>
            <Text style={[typography.labelSmall, styles.milestonePct]}>0%</Text>
          </View>
          <ProgressBar progress={0} />
          <Text style={[typography.caption, styles.milestoneSub]}>
            Make your first surplus donation to contribute towards the 500-meal community milestone.
          </Text>
        </GlassCard>

        <GlassButton
          title="+ Offer First Donation"
          variant="primary"
          size="medium"
          icon="add-circle-outline"
          onPress={() => router.push('/(donor)/offer-food-placeholder' as any)}
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
