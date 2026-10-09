/**
 * Live Donation Tracking Screen
 * Real-time status updates, dynamic lifecycle timeline, verification code display, edit & withdrawal actions
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassButton,
  StatusBadge,
  GlassBadge,
  Divider,
  SectionHeader,
  Skeleton,
  ErrorState,
} from '../../src/components/ui';
import { DonationTimeline } from '../../src/components/donation/DonationTimeline';
import { VerificationCodeCard } from '../../src/components/donation/VerificationCodeCard';
import { WithdrawalModal } from '../../src/components/donation/WithdrawalModal';
import { colors, typography, spacing, radius } from '../../src/design-system';
import {
  subscribeToDonation,
  withdrawDonation,
} from '../../src/services/donations/donation.service';
import {
  canWithdrawDonation,
  canEditDonation,
  isDonationExpired,
} from '../../src/services/donations/donation.state-machine';
import { getDonationStatusConfig } from '../../src/services/donations/donation.mapper';
import { Donation, CancellationReason } from '../../src/types/donation';
import { formatDateTime, getRelativeTimeString } from '../../src/utils/dateTime';
import { rescueAIService } from '../../src/services/rescue-ai/rescueAI.service';
import { RescueAIRiskBanner } from '../../src/components/rescue-ai/RescueAIRiskBanner';
import { RescueAIBadge } from '../../src/components/rescue-ai/RescueAIBadge';

export default function DonationTrackingScreen() {
  const router = useRouter();
  const { donationId } = useLocalSearchParams<{ donationId: string }>();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (!donationId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToDonation(donationId, (updatedDonation) => {
      setDonation(updatedDonation);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [donationId]);

  const handleWithdraw = async (reason: CancellationReason) => {
    if (!donation) return;
    try {
      await withdrawDonation(donation.id, reason);
    } catch (error: any) {
      Alert.alert('Withdrawal Failed', error.message || 'Could not withdraw donation.');
    }
  };

  if (loading) {
    return (
      <ScreenContainer scrollable={true} testID="tracking-loading">
        <GlassHeader title="Donation Status" onBack={() => router.back()} />
        <View style={styles.loadingPadding}>
          <Skeleton height={200} borderRadius={radius.xl} />
          <View style={{ height: 16 }} />
          <Skeleton height={140} borderRadius={radius.xl} />
          <View style={{ height: 16 }} />
          <Skeleton height={220} borderRadius={radius.xl} />
        </View>
      </ScreenContainer>
    );
  }

  if (!donation) {
    return (
      <ScreenContainer scrollable={true} testID="tracking-not-found">
        <GlassHeader title="Donation Status" onBack={() => router.back()} />
        <View style={styles.content}>
          <ErrorState
            title="Donation Not Found"
            description="We couldn't locate this donation record or it has been removed."
            retryTitle="Back to Dashboard"
            onRetry={() => router.replace('/(donor)')}
          />
        </View>
      </ScreenContainer>
    );
  }

  const expired = isDonationExpired(donation);
  const currentStatus = expired ? 'EXPIRED' : donation.status;
  const statusConfig = getDonationStatusConfig(currentStatus);
  const canWithdraw = canWithdrawDonation(donation);
  const canEdit = canEditDonation(donation);

  const isVolunteerAssigned =
    currentStatus === 'VOLUNTEER_ASSIGNED' ||
    currentStatus === 'PICKUP_EN_ROUTE' ||
    currentStatus === 'PICKED_UP';

  const riskAssessment = rescueAIService.assessRisk({
    id: donation.id,
    status: donation.status,
    pickupDeadlineAt: donation.pickup.pickupDeadlineAt,
    isReserved: Boolean(donation.reservedAt),
    isVolunteerAssigned: Boolean(donation.assignedAt),
    isPickedUp: Boolean(donation.pickedUpAt),
    reservedAt: donation.reservedAt,
    assignedAt: donation.assignedAt,
    pickedUpAt: donation.pickedUpAt,
  });

  return (
    <ScreenContainer scrollable={true} testID="donation-tracking-screen">
      <WithdrawalModal
        visible={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onConfirmWithdraw={handleWithdraw}
      />

      <GlassHeader
        title="Rescue Tracking"
        subtitle={donation.food.name}
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        {/* RescueAI Risk Detection Banner (When active rescue is at risk) */}
        {riskAssessment.riskLevel !== 'NORMAL' && (
          <RescueAIRiskBanner assessment={riskAssessment} />
        )}

        {/* Status Hero Card */}
        <GlassCard variant="elevated" style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={[styles.statusIconBox, { backgroundColor: statusConfig.bg }]}>
              <Ionicons
                name={statusConfig.icon}
                size={26}
                color={statusConfig.color}
              />
            </View>

            <View style={styles.heroStatusColumn}>
              <Text style={[typography.titleLarge, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
              <Text style={[typography.bodySmall, styles.heroSublabel]}>
                {statusConfig.sublabel}
              </Text>
            </View>
          </View>

          <Divider spacingSize="sm" />

          {/* Food Details Row */}
          <View style={styles.foodRow}>
            {donation.food.imageUrl ? (
              <Image source={{ uri: donation.food.imageUrl }} style={styles.foodThumbnail} />
            ) : (
              <View style={styles.foodThumbnailFallback}>
                <Ionicons name="restaurant-outline" size={24} color={colors.brand.primary} />
              </View>
            )}

            <View style={styles.foodTextCol}>
              <Text style={[typography.headingSmall, styles.foodName]}>
                {donation.food.name}
              </Text>
              <Text style={[typography.bodySmall, styles.foodQty]}>
                {donation.food.quantity} {donation.food.unit} • {donation.food.category}
              </Text>
              <Text style={[typography.caption, styles.expiryRelative]}>
                {expired
                  ? 'Expired'
                  : getRelativeTimeString(donation.pickup.pickupDeadlineAt, 'Pickup deadline in')}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Verification PIN Section */}
        {donation.verification?.pickupCode && (
          <VerificationCodeCard
            code={donation.verification.pickupCode}
            isVolunteerAssigned={isVolunteerAssigned}
          />
        )}

        {/* Live Rescue Timeline */}
        <SectionHeader
          title="Rescue Timeline"
          subtitle="Real-time progress and verification stages"
        />

        <GlassCard variant="standard">
          <DonationTimeline donation={donation} />
        </GlassCard>

        {/* Pickup & Handling Details */}
        <SectionHeader title="Pickup & Handling Details" />

        <GlassCard variant="standard">
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={colors.brand.primary} />
            <View style={styles.detailTextCol}>
              <Text style={[typography.labelSmall, styles.detailLabel]}>Pickup Address</Text>
              <Text style={[typography.bodySmall, styles.detailVal]}>
                {donation.pickup.address}
              </Text>
            </View>
          </View>

          <Divider spacingSize="xs" />

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={colors.brand.primary} />
            <View style={styles.detailTextCol}>
              <Text style={[typography.labelSmall, styles.detailLabel]}>Pickup Window</Text>
              <Text style={[typography.bodySmall, styles.detailVal]}>
                {formatDateTime(donation.pickup.pickupStartAt)} to {formatDateTime(donation.pickup.pickupDeadlineAt)}
              </Text>
            </View>
          </View>

          {donation.pickup.instructions ? (
            <>
              <Divider spacingSize="xs" />
              <View style={styles.detailRow}>
                <Ionicons name="information-circle-outline" size={18} color={colors.brand.primary} />
                <View style={styles.detailTextCol}>
                  <Text style={[typography.labelSmall, styles.detailLabel]}>Access Notes</Text>
                  <Text style={[typography.bodySmall, styles.detailVal]}>
                    {donation.pickup.instructions}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </GlassCard>

        {/* Donor Actions: Edit & Withdraw */}
        {(canEdit || canWithdraw) && (
          <View style={styles.actionsBox}>
            {canEdit && (
              <GlassButton
                title="Edit Donation Details"
                variant="secondary"
                size="medium"
                icon="create-outline"
                onPress={() =>
                  router.push({
                    pathname: '/(donor)/edit',
                    params: { donationId: donation.id },
                  } as any)
                }
                fullWidth
              />
            )}

            {canWithdraw && (
              <GlassButton
                title="Withdraw Donation"
                variant="danger"
                size="medium"
                icon="trash-outline"
                onPress={() => setShowWithdrawModal(true)}
                style={styles.withdrawBtn}
                fullWidth
              />
            )}
          </View>
        )}

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
  loadingPadding: {
    padding: spacing.screenHorizontal,
  },
  heroCard: {
    marginVertical: spacing.xs,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  heroStatusColumn: {
    flex: 1,
  },
  heroSublabel: {
    color: colors.text.muted,
    marginTop: 2,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodThumbnail: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
  },
  foodThumbnailFallback: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodTextCol: {
    flex: 1,
    marginLeft: spacing.sm,
    gap: 2,
  },
  foodName: {
    color: colors.text.primary,
  },
  foodQty: {
    color: colors.text.muted,
  },
  expiryRelative: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  detailTextCol: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  detailLabel: {
    color: colors.text.muted,
  },
  detailVal: {
    color: colors.text.primary,
    marginTop: 1,
  },
  actionsBox: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  withdrawBtn: {
    marginTop: 2,
  },
});
