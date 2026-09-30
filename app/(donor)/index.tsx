/**
 * Donor Dashboard Home Screen
 * Foundation with Greeting, Prominent "Offer Food" CTA, Active Donation Card, Impact metrics, and Recent Activity
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassCard,
  GlassButton,
  GlassIconButton,
  GlassBadge,
  Avatar,
  SectionHeader,
  EmptyState,
} from '../../src/components/ui';
import { colors, typography, spacing, radius } from '../../src/design-system';
import { useAuth } from '../../src/contexts/AuthContext';

export default function DonorDashboardScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();

  const firstName = profile?.fullName
    ? profile.fullName.split(' ')[0]
    : user?.displayName
    ? user.displayName.split(' ')[0]
    : 'Partner';

  return (
    <ScreenContainer scrollable={true} testID="donor-dashboard">
      {/* Top Welcome Header */}
      <View style={styles.topHeader}>
        <View style={styles.welcomeColumn}>
          <Text style={[typography.titleSmall, styles.greeting]}>Good afternoon</Text>
          <Text style={[typography.headingLarge, styles.userName]}>{firstName}</Text>
        </View>

        <Avatar
          name={profile?.fullName || 'User'}
          size="medium"
          statusIndicator="online"
        />
      </View>

      <View style={styles.content}>
        {/* ============================================================ */}
        {/* 1. HERO CALL TO ACTION: OFFER SURPLUS FOOD */}
        {/* ============================================================ */}
        <GlassCard variant="elevated" style={styles.heroCtaCard}>
          <View style={styles.heroInner}>
            <View style={styles.heroTextColumn}>
              <View style={styles.liveTag}>
                <View style={styles.pulsingDot} />
                <Text style={[typography.labelSmall, styles.liveTagText]}>
                  Food Bank Network Active
                </Text>
              </View>

              <Text style={[typography.headingMedium, styles.heroTitle]}>
                Make good food go further
              </Text>
              <Text style={[typography.bodySmall, styles.heroSubtitle]}>
                Have leftover prepared meals, produce, or bakery stock? Offer it to nearby rescues.
              </Text>
            </View>
          </View>

          <GlassButton
            title="+ Offer Food"
            variant="primary"
            size="large"
            icon="add-circle"
            onPress={() => router.push('/(donor)/offer-food-placeholder' as any)}
            style={styles.offerButton}
            fullWidth
          />
        </GlassCard>

        {/* ============================================================ */}
        {/* 2. ACTIVE RESCUE STATUS CARD */}
        {/* ============================================================ */}
        <SectionHeader
          title="Active Rescue"
          subtitle="Real-time volunteer and pickup updates"
        />

        <GlassCard variant="standard">
          <View style={styles.zeroActiveBox}>
            <View style={styles.leafIconCircle}>
              <Ionicons name="leaf-outline" size={28} color={colors.brand.primary} />
            </View>
            <Text style={[typography.titleMedium, styles.zeroActiveTitle]}>
              No active rescue right now
            </Text>
            <Text style={[typography.bodySmall, styles.zeroActiveSubtitle]}>
              When you list surplus food, live volunteer assignment and pickup tracking will appear here.
            </Text>
          </View>
        </GlassCard>

        {/* ============================================================ */}
        {/* 3. DONATION IMPACT SUMMARY */}
        {/* ============================================================ */}
        <SectionHeader
          title="Your Community Impact"
          subtitle="Food diverted from waste to people"
          action={
            <GlassButton
              title="View Impact"
              variant="tertiary"
              size="small"
              onPress={() => router.push('/(donor)/impact')}
            />
          }
        />

        <GlassCard variant="standard">
          <View style={styles.impactGrid}>
            <View style={styles.impactItem}>
              <Text style={[typography.displayMedium, styles.impactValue]}>0</Text>
              <Text style={[typography.caption, styles.impactLabel]}>
                Completed Donations
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.impactItem}>
              <Text style={[typography.displayMedium, styles.impactValue]}>0</Text>
              <Text style={[typography.caption, styles.impactLabel]}>
                Meals Redirected
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.impactItem}>
              <Text style={[typography.displayMedium, styles.impactValue]}>0 kg</Text>
              <Text style={[typography.caption, styles.impactLabel]}>
                CO2 Avoided
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* ============================================================ */}
        {/* 4. RECENT ACTIVITY LIST */}
        {/* ============================================================ */}
        <SectionHeader
          title="Recent Activity"
          subtitle="Donation history and past pickups"
          action={
            <GlassButton
              title="View All"
              variant="tertiary"
              size="small"
              onPress={() => router.push('/(donor)/donations')}
            />
          }
        />

        <GlassCard variant="standard">
          <View style={styles.recentEmptyBox}>
            <Ionicons name="time-outline" size={24} color={colors.text.muted} />
            <Text style={[typography.bodyMedium, styles.recentEmptyText]}>
              No donation history yet
            </Text>
            <Text style={[typography.caption, styles.recentEmptySubtext]}>
              Your verified receipts and distribution history will be logged here.
            </Text>
          </View>
        </GlassCard>

        <View style={{ height: 40 }} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  welcomeColumn: {
    flex: 1,
  },
  greeting: {
    color: colors.text.muted,
  },
  userName: {
    color: colors.brand[900],
  },
  content: {
    gap: spacing.xs,
  },
  heroCtaCard: {
    marginVertical: spacing.xs,
    borderColor: 'rgba(35, 132, 113, 0.25)',
  },
  heroInner: {
    marginBottom: spacing.md,
  },
  heroTextColumn: {
    gap: 4,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand[100],
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    marginBottom: 4,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
    marginRight: 6,
  },
  liveTagText: {
    color: colors.brand[900],
    fontWeight: '600',
  },
  heroTitle: {
    color: colors.text.primary,
  },
  heroSubtitle: {
    color: colors.text.muted,
    lineHeight: 18,
  },
  offerButton: {
    marginTop: spacing.xs,
  },
  zeroActiveBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  leafIconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.round,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  zeroActiveTitle: {
    color: colors.text.primary,
    marginBottom: 2,
  },
  zeroActiveSubtitle: {
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  impactGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  impactItem: {
    flex: 1,
    alignItems: 'center',
  },
  impactValue: {
    color: colors.brand[900],
    fontSize: 22,
    lineHeight: 28,
  },
  impactLabel: {
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.surface.divider,
  },
  recentEmptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  recentEmptyText: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
  recentEmptySubtext: {
    color: colors.text.muted,
    textAlign: 'center',
  },
});
