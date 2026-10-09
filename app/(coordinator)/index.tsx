/**
 * Coordinator Dashboard & Home Screen
 * Central logistics hub for verified community food pantries and coordinators.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassButton,
  GlassIconButton,
  AnimatedPressable,
  SectionHeader,
  EmptyState,
  Skeleton,
} from '../../src/components/ui';
import {
  VerificationPendingView,
  OrganizationTrustBadge,
  CoordinatorDashboardSummary,
  AvailableDonationCard,
  IncomingRescueCard,
  DonationReviewModal,
  ClarificationModal,
  CommunityPointModal,
  DeliveryCodeCard,
  ReceiptConfirmationModal,
  PrivacyTrustCard,
} from '../../src/components/coordinator';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { Donation } from '../../src/types/donation';
import { CommunityPoint, CoordinatorStats, ClarificationCategory } from '../../src/types/coordinator';
import {
  subscribeToCoordinatorStats,
  subscribeToCoordinatorIncoming,
  acknowledgeReceiptAndComplete,
  getDeliveryVerificationCode,
  CoordinatorIncomingItem,
} from '../../src/services/coordinator/coordinator.service';
import {
  subscribeToAvailableDonationsForCoordinator,
  reserveDonationAtomically,
  releaseReservationAtomically,
} from '../../src/services/reservations/reservation.service';
import {
  subscribeToCoordinatorCommunityPoints,
  createCommunityPoint,
} from '../../src/services/community-points/community-point.service';
import { requestClarification } from '../../src/services/clarifications/clarification.service';
import { DEV_MOCK_DONATIONS } from '../../src/services/matching/dev.fixtures';

export default function CoordinatorHomeScreen() {
  const router = useRouter();
  const { user, profile, isConfigured, signOut } = useAuth();

  const [stats, setStats] = useState<CoordinatorStats>({
    availableCount: 0,
    incomingCount: 0,
    openIssuesCount: 0,
    completedCount: 0,
  });
  const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);
  const [incomingItems, setIncomingItems] = useState<CoordinatorIncomingItem[]>([]);
  const [communityPoints, setCommunityPoints] = useState<CommunityPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [reviewDonation, setReviewDonation] = useState<Donation | null>(null);
  const [clarificationDonation, setClarificationDonation] = useState<Donation | null>(null);
  const [isPointModalVisible, setIsPointModalVisible] = useState(false);
  const [receiptDonation, setReceiptDonation] = useState<Donation | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  const isPending = profile?.role === 'COORDINATOR' && profile?.verificationStatus === 'PENDING';

  useEffect(() => {
    if (!user?.uid || isPending) {
      setIsLoading(false);
      return;
    }

    // 1. Subscribe to Live Dashboard Stats
    const unsubStats = subscribeToCoordinatorStats(user.uid, (newStats) => {
      setStats(newStats);
    });

    // 2. Subscribe to Available Food Donations
    const unsubAvailable = subscribeToAvailableDonationsForCoordinator((donations) => {
      if (donations.length > 0) {
        setAvailableDonations(donations);
      } else if (!isConfigured) {
        setAvailableDonations(DEV_MOCK_DONATIONS);
      } else {
        setAvailableDonations([]);
      }
      setIsLoading(false);
    });

    // 3. Subscribe to Incoming Rescues
    const unsubIncoming = subscribeToCoordinatorIncoming(user.uid, (items) => {
      setIncomingItems(items);
    });

    // 4. Subscribe to Community Collection Points
    const unsubPoints = subscribeToCoordinatorCommunityPoints(user.uid, (points) => {
      setCommunityPoints(points);
    });

    return () => {
      unsubStats();
      unsubAvailable();
      unsubIncoming();
      unsubPoints();
    };
  }, [user?.uid, isPending, isConfigured]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    haptic.selection();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // If pending, render the secure VerificationPendingView
  if (isPending) {
    return <VerificationPendingView />;
  }

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

  const handleViewCode = async (item: CoordinatorIncomingItem) => {
    if (!user) return;
    try {
      const code = await getDeliveryVerificationCode(item.donation.id, user.uid);
      setActiveCode(code);
      haptic.success();
    } catch (err: any) {
      console.warn('[CoordinatorDashboard] Error getting code:', err);
    }
  };

  const handleConfirmReceiptSubmit = async (donationId: string, quantityReceived: number, notes?: string) => {
    if (!user) return;
    try {
      const res = await acknowledgeReceiptAndComplete(donationId, user.uid, { quantityConfirmed: quantityReceived, notes });
      if (res.success) {
        setIncomingItems((prev) => prev.filter((it) => it.donation.id !== donationId));
      }
    } catch (err: any) {
      console.error('[CoordinatorDashboard] Confirm handover error:', err);
      throw err;
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from Community Authority account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          haptic.medium();
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const rawProfileName = (profile?.fullName || profile?.organizationName || '').trim();
  const authorityDisplayName =
    rawProfileName && rawProfileName.toLowerCase() !== 'new member'
      ? rawProfileName
      : 'Community Authority';

  return (
    <ScreenContainer scrollable={false} testID="coordinator-dashboard-screen">
      <GlassHeader
        title="Community Authority"
        subtitle="Food Rescue Operations"
        rightAction={
          <AnimatedPressable
            onPress={handleSignOut}
            hapticType="medium"
            accessibilityRole="button"
            accessibilityLabel="Sign Out"
            style={styles.signOutHeaderButton}
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </AnimatedPressable>
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />}
      >
        {/* Authority Hero Card */}
        <View style={styles.heroWrapper}>
          <GlassCard variant="elevated" style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroAvatarCircle}>
                <Ionicons name="shield-checkmark" size={26} color={colors.brand.primary} />
              </View>
              <View style={styles.heroTextColumn}>
                <Text style={styles.heroGreeting}>Welcome back,</Text>
                <Text style={styles.heroName} numberOfLines={1}>
                  {authorityDisplayName}
                </Text>
                <View style={styles.verifiedTagRow}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.brand.primary} />
                  <Text style={styles.verifiedTagText}>Verified Food Authority</Text>
                </View>
              </View>
              <View style={styles.liveStatusPill}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveStatusText}>Live Hub</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Operations Overview Section */}
        <View style={styles.sectionHeaderCompact}>
          <SectionHeader
            title="Operations Overview"
            subtitle="Live receiving hub performance & rescue metrics"
          />
        </View>

        {/* Real-time Dashboard Summary Cards */}
        <CoordinatorDashboardSummary
          stats={stats}
          activeCentersCount={communityPoints.filter((p) => p.isActive).length}
          onPressCenters={() => router.push('/(coordinator)/community-points')}
          onPressIncoming={() => router.push('/(coordinator)/incoming')}
          onPressCompleted={() => router.push('/(coordinator)/history')}
        />

        {/* Food Summary & Reports Action Card */}
        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
          <AnimatedPressable
            onPress={() => {
              haptic.light();
              router.push('/(coordinator)/food-summary');
            }}
            accessibilityRole="button"
            accessibilityLabel="Food Summary & Reports"
          >
            <GlassCard variant="standard" style={styles.foodSummaryActionCard}>
              <View style={styles.foodSummaryIconWrap}>
                <Ionicons name="stats-chart" size={22} color={colors.brand.primary} />
              </View>
              <View style={styles.foodSummaryTextWrap}>
                <Text style={styles.foodSummaryTitle}>Food Summary & Reports</Text>
                <Text style={styles.foodSummarySubtitle}>
                  View received food by category and export reports
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
            </GlassCard>
          </AnimatedPressable>
        </View>

        {/* Active Handover Code Card if triggered */}
        {activeCode && (
          <View style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
            <DeliveryCodeCard code={activeCode} />
          </View>
        )}

        {/* Incoming Deliveries Section */}
        <View style={styles.sectionHeaderCompact}>
          <SectionHeader
            title="Incoming Deliveries"
            subtitle="Rescues en route to community hubs"
            action={
              incomingItems.length > 0 ? (
                <View style={styles.actionRowInline}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{incomingItems.length} active</Text>
                  </View>
                  <GlassButton
                    title="View All"
                    variant="tertiary"
                    size="small"
                    onPress={() => router.push('/(coordinator)/incoming')}
                  />
                </View>
              ) : undefined
            }
          />
        </View>

        {isLoading ? (
          <View style={{ paddingHorizontal: spacing.md, gap: 12 }}>
            <Skeleton width="100%" height={140} borderRadius={radius.lg} />
            <Skeleton width="100%" height={140} borderRadius={radius.lg} />
          </View>
        ) : incomingItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <GlassCard variant="standard" style={styles.emptyCard}>
              <View style={styles.emptyIconBackdrop}>
                <Ionicons name="bicycle-outline" size={32} color={colors.brand.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Active Rescues In Transit</Text>
              <Text style={styles.emptyDescription}>
                When volunteers accept food donations and transport them to your collection centers, live updates will appear here.
              </Text>
              <GlassButton
                title="+ Manage Collection Centers"
                variant="secondary"
                size="small"
                icon="business-outline"
                onPress={() => router.push('/(coordinator)/community-points')}
              />
            </GlassCard>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
            {incomingItems.slice(0, 3).map((item) => (
              <IncomingRescueCard
                key={item.donation.id}
                item={item}
                onTrack={() =>
                  router.push({
                    pathname: '/(coordinator)/tracking',
                    params: { id: item.donation.id },
                  })
                }
                onViewCode={() => handleViewCode(item)}
                onConfirmReceipt={() => setReceiptDonation(item.donation)}
                onRelease={async () => {
                  if (item.donation.reservationId && user) {
                    await releaseReservationAtomically(
                      item.donation.reservationId,
                      item.donation.id,
                      user.uid,
                      'Released by authority from dashboard'
                    );
                  }
                }}
              />
            ))}
          </View>
        )}

        {/* Privacy & Trust Notice */}
        <View style={{ marginTop: spacing.md }}>
          <PrivacyTrustCard />
        </View>
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

      {/* Clarification Request Modal */}
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

      {/* Receipt Confirmation Modal */}
      <ReceiptConfirmationModal
        visible={!!receiptDonation}
        donation={receiptDonation}
        onClose={() => setReceiptDonation(null)}
        onConfirm={handleConfirmReceiptSubmit}
        onReportIssue={(d) => {
          setReceiptDonation(null);
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
    paddingBottom: spacing['4xl'],
  },
  heroWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  heroCard: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface.borderStrong,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  heroTextColumn: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.muted,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  verifiedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brand[50],
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
  },
  liveStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.brand.primary,
    textTransform: 'uppercase',
  },
  sectionHeaderCompact: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  actionRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  countBadge: {
    backgroundColor: colors.status.infoBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.status.infoBorder,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.status.info,
  },
  emptyContainer: {
    paddingHorizontal: spacing.md,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
    gap: spacing.sm,
  },
  emptyIconBackdrop: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: spacing.xs,
  },
  foodSummaryActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  foodSummaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodSummaryTextWrap: {
    flex: 1,
  },
  foodSummaryTitle: {
    ...typography.subtitle2,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  foodSummarySubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  signOutHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
});



