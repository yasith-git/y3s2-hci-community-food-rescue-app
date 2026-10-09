/**
 * Detailed Coordinator Rescue Tracking Screen
 * Real-time operational lifecycle timeline, delivery verification code, and receipt confirmation.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassBadge,
  GlassButton,
  ProgressStepper,
  Skeleton,
} from '../../src/components/ui';
import {
  DeliveryCodeCard,
  ReceiptConfirmationModal,
  CoordinatorIssueCard,
} from '../../src/components/coordinator';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { useAuth } from '../../src/contexts/AuthContext';
import { Donation } from '../../src/types/donation';
import { RescueIssue } from '../../src/types/rescue';
import { subscribeToDonation } from '../../src/services/donations/donation.service';
import {
  acknowledgeReceiptAndComplete,
  getDeliveryVerificationCode,
} from '../../src/services/coordinator/coordinator.service';
import { subscribeToDonationIssues } from '../../src/services/issues/issue.service';

const TIMELINE_STEPS = [
  { key: 'reserved', label: 'Reserved' },
  { key: 'matched', label: 'Matched' },
  { key: 'collected', label: 'Collected' },
  { key: 'transit', label: 'On Way' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'receipt', label: 'Receipt' },
  { key: 'completed', label: 'Completed' },
];

export default function CoordinatorTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [issues, setIssues] = useState<RescueIssue[]>([]);
  const [deliveryCode, setDeliveryCode] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubDonation = subscribeToDonation(id, (d) => {
      setDonation(d);
      setIsLoading(false);
    });

    const unsubIssues = subscribeToDonationIssues(id, (list) => {
      setIssues(list);
    });

    return () => {
      unsubDonation();
      unsubIssues();
    };
  }, [id]);

  // Load delivery verification code when in active transit
  useEffect(() => {
    if (!donation || !user) return;

    if (
      donation.status === 'PICKED_UP' ||
      donation.status === 'DELIVERY_EN_ROUTE' ||
      donation.status === 'DELIVERED' ||
      donation.status === 'VOLUNTEER_ASSIGNED'
    ) {
      getDeliveryVerificationCode(donation.id, user.uid)
        .then((code) => setDeliveryCode(code))
        .catch(() => {});
    }
  }, [donation, user]);

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false}>
        <GlassHeader title="Rescue Tracking" onBack={() => router.back()} />
        <View style={{ padding: spacing.md, gap: 12 }}>
          <Skeleton width="100%" height={120} borderRadius={radius.lg} />
          <Skeleton width="100%" height={160} borderRadius={radius.lg} />
        </View>
      </ScreenContainer>
    );
  }

  if (!donation) {
    return (
      <ScreenContainer scrollable={false}>
        <GlassHeader title="Rescue Tracking" onBack={() => router.back()} />
        <View style={styles.errorContainer}>
          <Text style={[typography.headingSmall, { color: colors.text.primary }]}>
            Rescue Not Found
          </Text>
          <GlassButton title="Return to Dashboard" variant="primary" onPress={() => router.replace('/(coordinator)')} />
        </View>
      </ScreenContainer>
    );
  }

  const getActiveStepIndex = () => {
    switch (donation.status) {
      case 'RESERVED':
        return 0;
      case 'VOLUNTEER_ASSIGNED':
      case 'PICKUP_EN_ROUTE':
        return 1;
      case 'PICKED_UP':
        return 2;
      case 'DELIVERY_EN_ROUTE':
        return 3;
      case 'DELIVERED':
        return 4;
      case 'ACKNOWLEDGED':
        return 5;
      case 'COMPLETED':
        return 6;
      default:
        return 0;
    }
  };

  const handleConfirmReceipt = async (
    donationId: string,
    quantityReceived: number,
    notes?: string
  ) => {
    if (!user) return;
    await acknowledgeReceiptAndComplete(donationId, user.uid, {
      quantityConfirmed: quantityReceived,
      notes,
    });
  };

  const isDeliverable = donation.status === 'DELIVERED';
  const isCompleted = donation.status === 'COMPLETED';

  return (
    <ScreenContainer scrollable={false} testID="coordinator-tracking-screen">
      <GlassHeader
        title="Rescue Mission Tracking"
        subtitle={donation.food.name}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Core Food Summary */}
        <GlassCard variant="elevated" style={styles.card}>
          <View style={styles.headerRow}>
            <GlassBadge label={donation.food.category} variant="brand" size="small" />
            <Text style={[typography.labelLarge, styles.qtyText]}>
              📦 {donation.food.quantity} {donation.food.unit}
            </Text>
          </View>
          <Text style={[typography.headingMedium, styles.foodName]}>{donation.food.name}</Text>
          <Text style={[typography.caption, styles.metaText]}>
            Hub: {donation.communityPointName || 'Community Collection Hub'}
          </Text>
        </GlassCard>

        {/* Real-time Stepper Timeline */}
        <GlassCard variant="standard" style={styles.card}>
          <Text style={[typography.labelLarge, styles.sectionTitle]}>Rescue Progress</Text>
          <ProgressStepper steps={TIMELINE_STEPS} currentStepIndex={getActiveStepIndex()} />
        </GlassCard>

        {/* Secure Handover Verification Code Card */}
        {deliveryCode && (
          <DeliveryCodeCard code={deliveryCode} />
        )}

        {/* Active Issues Warning if any */}
        {issues.length > 0 && (
          <View style={{ marginTop: spacing.sm }}>
            <View style={styles.issuesHeader}>
              <Ionicons name="alert-circle" size={18} color={colors.status.error} />
              <Text style={[typography.labelLarge, styles.issuesHeaderText]}>
                Reported Issues ({issues.length})
              </Text>
            </View>
            {issues.map((issue) => (
              <CoordinatorIssueCard
                key={issue.id}
                issue={issue}
                onResolve={() =>
                  router.push({
                    pathname: '/(coordinator)/issues',
                    params: { donationId: donation.id },
                  })
                }
              />
            ))}
          </View>
        )}

        {/* Logistics & Route Points */}
        <GlassCard variant="standard" style={styles.card}>
          <Text style={[typography.labelLarge, styles.sectionTitle]}>Logistics Routing</Text>

          {/* 1. Pickup Point */}
          <View style={styles.routeItem}>
            <Ionicons name="radio-button-on" size={16} color={colors.status.info} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelSmall, styles.routeLabel]}>Donor Pickup Location</Text>
              <Text style={[typography.bodySmall, styles.routeAddress]}>{donation.pickup.address}</Text>
            </View>
          </View>

          {/* 2. Delivery Hub */}
          <View style={[styles.routeItem, { marginTop: spacing.sm }]}>
            <Ionicons name="flag" size={16} color={colors.brand.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelSmall, styles.routeLabel]}>Community Drop-off Point</Text>
              <Text style={[typography.bodySmall, styles.routeAddress]}>
                {donation.communityPointAddress || 'Community Drop-off Hub'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Action Bar */}
        <View style={styles.actionsFooter}>
          {isDeliverable && (
            <GlassButton
              title="Confirm Delivery Receipt"
              variant="primary"
              icon="checkmark-done"
              onPress={() => setIsReceiptModalOpen(true)}
            />
          )}

          {isCompleted && (
            <View style={styles.completedNotice}>
              <Ionicons name="checkmark-circle" size={24} color={colors.status.success} />
              <Text style={[typography.labelLarge, styles.completedText]}>
                Rescue Successfully Completed
              </Text>
            </View>
          )}

          <GlassButton
            title="Report / View Issues"
            variant="tertiary"
            icon="warning-outline"
            onPress={() =>
              router.push({
                pathname: '/(coordinator)/issues',
                params: { donationId: donation.id },
              })
            }
          />
        </View>
      </ScrollView>

      {/* Receipt Confirmation Modal */}
      <ReceiptConfirmationModal
        visible={isReceiptModalOpen}
        donation={donation}
        onClose={() => setIsReceiptModalOpen(false)}
        onConfirm={handleConfirmReceipt}
        onReportIssue={(d) => {
          setIsReceiptModalOpen(false);
          router.push({
            pathname: '/(coordinator)/issues',
            params: { donationId: d.id },
          });
        }}
      />
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
    marginTop: spacing.md,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  qtyText: {
    color: colors.brand.primary,
    fontWeight: '700',
  },
  foodName: {
    color: colors.text.primary,
    marginBottom: 2,
  },
  metaText: {
    color: colors.text.muted,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  issuesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  issuesHeaderText: {
    color: colors.status.error,
    fontWeight: '700',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  routeLabel: {
    color: colors.text.muted,
  },
  routeAddress: {
    color: colors.text.primary,
    marginTop: 2,
  },
  actionsFooter: {
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  completedText: {
    color: colors.brand[900],
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
});
