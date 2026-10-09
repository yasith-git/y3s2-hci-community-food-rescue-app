/**
 * Volunteer Opportunity Details Screen
 * Comprehensive inspection: Food details, Safety declarations, Allergens, Pickup window, Detour fit, and Member 3 Handoff CTA.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassButton,
  GlassCard,
  GlassBadge,
  GlassChip,
  Skeleton,
} from '../../../src/components/ui';
import { colors } from '../../../src/design-system/colors';
import { typography } from '../../../src/design-system/typography';
import { spacing } from '../../../src/design-system/spacing';
import { radius } from '../../../src/design-system/radius';
import { haptic } from '../../../src/design-system/haptics';
import { useAuth } from '../../../src/contexts/AuthContext';
import { Donation } from '../../../src/types/donation';
import { getDonationById } from '../../../src/services/donations/donation.service';
import { hasActiveRescue } from '../../../src/services/rescue/rescue.service';
import { DEV_MOCK_DONATIONS } from '../../../src/services/matching/dev.fixtures';
import { formatTimeRemaining, formatTimeWindow } from '../../../src/utils/dateTime';

export default function OpportunityDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const d = await getDonationById(id);
        if (d) {
          setDonation(d);
        } else {
          // Dev mock fallback
          const mock = DEV_MOCK_DONATIONS.find((m: Donation) => m.id === id);
          if (mock) setDonation(mock);
        }
      } catch {
        const mock = DEV_MOCK_DONATIONS.find((m: Donation) => m.id === id);
        if (mock) setDonation(mock);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleContinueToRescue = async () => {
    if (!donation) return;
    if (user?.uid) {
      const active = await hasActiveRescue(user.uid);
      if (active) {
        haptic.warning();
        Alert.alert(
          'Active Rescue in Progress',
          'You already have an active rescue. Complete or release your current rescue before accepting another.'
        );
        return;
      }
    }
    haptic.selection();
    // Navigate directly to Member 3 Rescue Confirmation & Acceptance Screen
    router.push({
      pathname: '/(volunteer)/accept-rescue',
      params: { id: donation.id },
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <GlassHeader title="Rescue Details" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={200} borderRadius={0} />
          <View style={{ padding: spacing.md, gap: 12 }}>
            <Skeleton width="60%" height={24} borderRadius={radius.md} />
            <Skeleton width="90%" height={16} borderRadius={radius.sm} />
            <Skeleton width="100%" height={100} borderRadius={radius.lg} />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  if (!donation) {
    return (
      <ScreenContainer scrollable={false}>
        <GlassHeader title="Rescue Details" onBack={() => router.back()} />
        <View style={styles.notFoundContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.status.error} />
          <Text style={[typography.headingSmall, styles.notFoundTitle]}>Rescue Not Found</Text>
          <Text style={[typography.bodyMedium, styles.notFoundSubtitle]}>
            This rescue opportunity may have expired or been claimed by another volunteer.
          </Text>
          <GlassButton title="Return to Discovery" variant="primary" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    );
  }

  const timeRemainingStr = formatTimeRemaining(donation.pickup.pickupDeadlineAt);
  const timeWindowStr = formatTimeWindow(donation.pickup.pickupStartAt, donation.pickup.pickupDeadlineAt);

  return (
    <ScreenContainer scrollable={false} testID="opportunity-details-screen">
      <GlassHeader
        title="Rescue Opportunity"
        subtitle={donation.food.name}
        onBack={() => router.back()}
      />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Food Banner Image */}
        {donation.food.imageUrl ? (
          <Image source={{ uri: donation.food.imageUrl }} style={styles.bannerImage} />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="fast-food" size={54} color={colors.brand.primary} />
          </View>
        )}

        {/* Essential Opportunity Header */}
        <GlassCard variant="standard" style={styles.sectionCard}>
          <View style={styles.topBadgeRow}>
            <GlassBadge label={donation.food.category} variant="brand" size="medium" />
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={14} color={colors.status.warning} />
              <Text style={[typography.labelSmall, styles.timeBadgeText]}>Expires in {timeRemainingStr}</Text>
            </View>
          </View>

          <Text style={[typography.headingMedium, styles.foodTitle]}>{donation.food.name}</Text>
          <Text style={[typography.bodyMedium, styles.donorOrg]}>
            Offered by {donation.donorOrganization || donation.donorName}
          </Text>

          {donation.food.description && (
            <Text style={[typography.bodyMedium, styles.foodDescription]}>
              {donation.food.description}
            </Text>
          )}

          <View style={styles.quantityBanner}>
            <Ionicons name="cube" size={20} color={colors.brand.primary} />
            <Text style={[typography.labelLarge, styles.quantityText]}>
              {donation.food.quantity} {donation.food.unit} available for rescue
            </Text>
          </View>
        </GlassCard>

        {/* Route Fit & Detour Assessment */}
        <GlassCard variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="git-branch" size={20} color={colors.brand.primary} />
            <Text style={[typography.labelLarge, styles.sectionHeading]}>Route Compatibility</Text>
          </View>

          <View style={styles.compatibilityDetails}>
            <View style={styles.compatPill}>
              <Text style={styles.compatPillLabel}>Estimated Detour</Text>
              <Text style={styles.compatPillVal}>+8 min driving</Text>
            </View>
            <View style={styles.compatPill}>
              <Text style={styles.compatPillLabel}>Off Route</Text>
              <Text style={styles.compatPillVal}>1.4 km</Text>
            </View>
            <View style={styles.compatPill}>
              <Text style={styles.compatPillLabel}>Match Confidence</Text>
              <Text style={styles.compatPillVal}>Geometric</Text>
            </View>
          </View>

          <Text style={[typography.caption, styles.compatDisclaimer]}>
            Calculated relative to your active journey corridor. Exact driving detour may vary slightly depending on real-time traffic.
          </Text>
        </GlassCard>

        {/* Pickup Location & Instructions */}
        <GlassCard variant="standard" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location" size={20} color={colors.status.info} />
            <Text style={[typography.labelLarge, styles.sectionHeading]}>Pickup Information</Text>
          </View>

          <Text style={[typography.bodyMedium, styles.addressText]}>
            📍 {donation.pickup.address}
          </Text>

          <View style={styles.timeWindowBox}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={[typography.bodySmall, styles.timeWindowText]}>
              Pickup Window: {timeWindowStr}
            </Text>
          </View>

          {donation.pickup.instructions && (
            <View style={styles.instructionsBox}>
              <Text style={[typography.labelSmall, styles.instructionsLabel]}>Donor Instructions:</Text>
              <Text style={[typography.bodySmall, styles.instructionsContent]}>
                "{donation.pickup.instructions}"
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Food Safety & Handling Declarations */}
        <GlassCard variant="standard" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark" size={20} color={colors.status.success} />
            <Text style={[typography.labelLarge, styles.sectionHeading]}>Food Safety & Handling</Text>
          </View>

          <View style={styles.safetyGrid}>
            <View style={styles.safetyRow}>
              <Text style={styles.safetyLabel}>Storage Condition:</Text>
              <Text style={styles.safetyValue}>{donation.safety.storageCondition}</Text>
            </View>
            <View style={styles.safetyRow}>
              <Text style={styles.safetyLabel}>Packaging:</Text>
              <Text style={styles.safetyValue}>{donation.safety.packagingCondition}</Text>
            </View>
          </View>

          {donation.safety.allergens && donation.safety.allergens.length > 0 && (
            <View style={styles.allergensSection}>
              <Text style={[typography.labelSmall, styles.allergensTitle]}>Declared Allergens:</Text>
              <View style={styles.allergenChips}>
                {donation.safety.allergens.map((allergen: string) => (
                  <GlassChip key={allergen} label={allergen} selected={true} />
                ))}
              </View>
            </View>
          )}

          <View style={styles.declarationNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.text.muted} />
            <Text style={[typography.caption, styles.declarationText]}>
              Food information is declared directly by the donor in compliance with food rescue guidelines.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Bottom CTA to Member 3 Rescue Flow */}
      <View style={styles.bottomBar}>
        <GlassButton
          title="Review & Accept Rescue"
          variant="primary"
          icon="arrow-forward"
          iconPosition="right"
          onPress={handleContinueToRescue}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  notFoundTitle: {
    color: colors.text.primary,
  },
  notFoundSubtitle: {
    color: colors.text.muted,
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  bannerImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surface.secondary,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  timeBadgeText: {
    color: colors.status.warning,
    fontWeight: '600',
  },
  foodTitle: {
    color: colors.text.primary,
    marginTop: 4,
  },
  donorOrg: {
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  foodDescription: {
    color: colors.text.secondary,
    marginVertical: spacing.xs,
  },
  quantityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.brand[50],
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  quantityText: {
    color: colors.brand[900],
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  sectionHeading: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  compatibilityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: spacing.xs,
  },
  compatPill: {
    flex: 1,
    backgroundColor: colors.surface.secondary,
    padding: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  compatPillLabel: {
    color: colors.text.muted,
    fontSize: 10,
  },
  compatPillVal: {
    color: colors.brand.primary,
    fontWeight: '700',
    marginTop: 2,
    fontSize: 12,
  },
  compatDisclaimer: {
    color: colors.text.muted,
    marginTop: 6,
  },
  addressText: {
    color: colors.text.primary,
    fontWeight: '500',
    marginVertical: 4,
  },
  timeWindowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timeWindowText: {
    color: colors.text.secondary,
  },
  instructionsBox: {
    backgroundColor: colors.surface.secondary,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  instructionsLabel: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  instructionsContent: {
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  safetyGrid: {
    marginVertical: spacing.xs,
    gap: 6,
  },
  safetyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  safetyLabel: {
    color: colors.text.secondary,
  },
  safetyValue: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  allergensSection: {
    marginTop: spacing.xs,
  },
  allergensTitle: {
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  allergenChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  declarationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  declarationText: {
    color: colors.text.muted,
    flex: 1,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
});
