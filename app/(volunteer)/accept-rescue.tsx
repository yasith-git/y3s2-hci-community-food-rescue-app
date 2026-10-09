/**
 * Rescue Review & Confirmation Screen
 * Shows full opportunity breakdown before atomic acceptance.
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
} from '../../src/components/ui';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { Donation } from '../../src/types/donation';
import { getDonationById } from '../../src/services/donations/donation.service';
import { acceptRescueAtomically } from '../../src/services/rescue/rescue.service';
import { scheduleLocalPickupReminder } from '../../src/services/notifications/notification.service';
import { DEV_MOCK_DONATIONS } from '../../src/services/matching/dev.fixtures';
import { formatTimeRemaining, formatTimeWindow } from '../../src/utils/dateTime';

export default function RescueAcceptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const d = await getDonationById(id);
        if (d) {
          setDonation(d);
        } else {
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

  const handleAccept = async () => {
    if (!donation || !user) return;
    setIsAccepting(true);
    haptic.selection();

    try {
      const assignment = await acceptRescueAtomically(
        donation.id,
        user.uid,
        user.displayName || 'Volunteer Rescue Partner'
      );

      // Schedule local reminder for pickup start
      await scheduleLocalPickupReminder(
        donation.id,
        donation.food.name,
        donation.pickup.pickupStartAt
      );

      haptic.success();
      // Requirement: Navigate to Rescue Activity -> Active tab immediately
      router.replace('/(volunteer)/activity');
    } catch (error: any) {
      console.warn('[RescueAccept] Error accepting rescue:', error);
      haptic.warning();
      const errMsg = error?.message || 'Unable to accept rescue. Please try again.';
      Alert.alert(
        'Unable to Accept Rescue',
        errMsg.includes('already have an active rescue')
          ? 'You already have an active rescue. Complete or release your current rescue before accepting another.'
          : errMsg.includes('already been accepted')
          ? 'This rescue has already been accepted by another volunteer.'
          : errMsg.includes('no longer available')
          ? 'This rescue is no longer available.'
          : errMsg
      );
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <GlassHeader title="Review Rescue" onBack={() => router.back()} />
        <View style={{ padding: spacing.md, gap: 12 }}>
          <Skeleton width="100%" height={160} borderRadius={radius.lg} />
          <Skeleton width="60%" height={24} borderRadius={radius.md} />
          <Skeleton width="100%" height={120} borderRadius={radius.lg} />
        </View>
      </ScreenContainer>
    );
  }

  if (!donation) {
    return (
      <ScreenContainer scrollable={false}>
        <GlassHeader title="Review Rescue" onBack={() => router.back()} />
        <View style={styles.errorContainer}>
          <Text style={[typography.headingSmall, { color: colors.text.primary }]}>
            Rescue Not Found
          </Text>
          <GlassButton title="Return to Discovery" variant="primary" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    );
  }

  const timeRemainingStr = formatTimeRemaining(donation.pickup.pickupDeadlineAt);
  const timeWindowStr = formatTimeWindow(donation.pickup.pickupStartAt, donation.pickup.pickupDeadlineAt);

  return (
    <ScreenContainer scrollable={false} testID="rescue-accept-screen">
      <GlassHeader
        title="Review & Accept Rescue"
        subtitle="Confirm commitment before heading out"
        onBack={() => router.back()}
      />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Core Summary Card */}
        <GlassCard variant="elevated" style={styles.card}>
          <View style={styles.topBadgeRow}>
            <GlassBadge label={donation.food.category} variant="brand" size="small" />
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={12} color={colors.status.warning} />
              <Text style={[typography.caption, styles.timeText]}>{timeRemainingStr}</Text>
            </View>
          </View>

          <View style={styles.foodRow}>
            {donation.food.imageUrl && (
              <Image source={{ uri: donation.food.imageUrl }} style={styles.foodThumbnail} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[typography.headingMedium, styles.foodName]}>{donation.food.name}</Text>
              <Text style={[typography.bodySmall, styles.donorOrg]}>
                From {donation.donorOrganization || donation.donorName}
              </Text>
              <Text style={[typography.labelLarge, styles.qtyText]}>
                📦 {donation.food.quantity} {donation.food.unit}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Step 1: Donor Pickup Location */}
        <GlassCard variant="standard" style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="radio-button-on" size={18} color={colors.status.info} />
            <Text style={[typography.labelLarge, styles.sectionTitle]}>1. Pickup Location</Text>
          </View>
          <Text style={[typography.bodyMedium, styles.addressText]}>
            {donation.pickup.address}
          </Text>
          <Text style={[typography.caption, styles.metaText]}>
            Pickup Window: {timeWindowStr}
          </Text>
          {donation.pickup.instructions && (
            <Text style={[typography.bodySmall, styles.instructionsText]}>
              Note: "{donation.pickup.instructions}"
            </Text>
          )}
        </GlassCard>

        {/* Step 2: Community Delivery Point */}
        <GlassCard variant="standard" style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="flag" size={18} color={colors.brand.primary} />
            <Text style={[typography.labelLarge, styles.sectionTitle]}>2. Community Drop-off Hub</Text>
          </View>
          <Text style={[typography.bodyMedium, styles.addressText]}>
            Colombo Central Community Food Hub
          </Text>
          <Text style={[typography.caption, styles.metaText]}>
            Maradana Road, Colombo 10 (Partner Pantry)
          </Text>
        </GlassCard>

        {/* Commitment Checklist */}
        <GlassCard variant="standard" style={styles.card}>
          <Text style={[typography.labelMedium, styles.checklistHeading]}>Volunteer Safety Commitment</Text>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
            <Text style={[typography.caption, styles.checkText]}>
              I have adequate clean transport space for {donation.food.quantity} {donation.food.unit}.
            </Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
            <Text style={[typography.caption, styles.checkText]}>
              I will verify the 4-digit code and inspect packaging before taking custody.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.bottomBar}>
        <GlassButton
          title="Confirm & Accept Rescue"
          variant="primary"
          icon="bicycle"
          loading={isAccepting}
          onPress={handleAccept}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  card: {
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
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  timeText: {
    color: colors.status.warning,
    fontWeight: '600',
  },
  foodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  foodThumbnail: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
  },
  foodName: {
    color: colors.text.primary,
  },
  donorOrg: {
    color: colors.text.muted,
    marginVertical: 2,
  },
  qtyText: {
    color: colors.brand.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  addressText: {
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  metaText: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  instructionsText: {
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  checklistHeading: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  checkText: {
    color: colors.text.secondary,
    flex: 1,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
});
