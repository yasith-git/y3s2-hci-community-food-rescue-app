/**
 * Incoming Rescues Screen for Coordinators
 * Real-time monitoring of all active food rescues heading to community collection hubs.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  GlassIconButton,
  EmptyState,
  Skeleton,
} from '../../src/components/ui';
import {
  IncomingRescueCard,
  DeliveryCodeCard,
  ReceiptConfirmationModal,
} from '../../src/components/coordinator';
import { colors } from '../../src/design-system/colors';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { Donation } from '../../src/types/donation';
import {
  subscribeToCoordinatorIncoming,
  acknowledgeReceiptAndComplete,
  getDeliveryVerificationCode,
  CoordinatorIncomingItem,
} from '../../src/services/coordinator/coordinator.service';
import { releaseReservationAtomically } from '../../src/services/reservations/reservation.service';

export default function CoordinatorIncomingScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [items, setItems] = useState<CoordinatorIncomingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [receiptDonation, setReceiptDonation] = useState<Donation | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToCoordinatorIncoming(user.uid, (incomingList) => {
      setItems(incomingList);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    haptic.selection();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleViewCode = async (item: CoordinatorIncomingItem) => {
    if (!user) return;
    try {
      const code = await getDeliveryVerificationCode(item.donation.id, user.uid);
      setActiveCode(code);
      haptic.success();
    } catch (err: any) {
      Alert.alert('Delivery Code Unavailable', err?.message || 'Code is not yet active.');
    }
  };

  const handleRelease = (item: CoordinatorIncomingItem) => {
    Alert.alert(
      'Release Food Reservation?',
      'Are you sure you want to release this reservation? The food will become available for other community pantries.',
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Release Food',
          style: 'destructive',
          onPress: async () => {
            if (!user || !item.donation.reservationId) return;
            try {
              await releaseReservationAtomically(
                item.donation.reservationId,
                item.donation.id,
                user.uid,
                'Released by coordinator'
              );
              haptic.success();
            } catch (err: any) {
              Alert.alert('Release Failed', err?.message || 'Could not release reservation.');
            }
          },
        },
      ]
    );
  };

  const handleConfirmReceiptSubmit = async (
    donationId: string,
    quantityReceived: number,
    notes?: string
  ) => {
    if (!user) return;
    try {
      const res = await acknowledgeReceiptAndComplete(donationId, user.uid, {
        quantityConfirmed: quantityReceived,
        notes,
      });
      if (res.success) {
        setItems((prev) => prev.filter((it) => it.donation.id !== donationId));
      }
    } catch (err: any) {
      console.error('[CoordinatorIncoming] Confirm handover error:', err);
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

  return (
    <ScreenContainer scrollable={false} testID="coordinator-incoming-screen">
      <GlassHeader
        title="Incoming Deliveries"
        subtitle="Active Transit & Handover Verification"
        onBack={() => router.replace('/(coordinator)')}
        rightAction={
          <GlassIconButton
            icon="log-out-outline"
            size="small"
            variant="subtle"
            onPress={handleSignOut}
            accessibilityLabel="Sign Out"
          />
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />}
      >
        {/* Handover Code Card if opened */}
        {activeCode && (
          <View style={{ marginBottom: spacing.md }}>
            <DeliveryCodeCard code={activeCode} />
          </View>
        )}

        {isLoading ? (
          <View style={{ padding: spacing.md, gap: 12 }}>
            <Skeleton width="100%" height={150} borderRadius={radius.lg} />
            <Skeleton width="100%" height={150} borderRadius={radius.lg} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="bicycle-outline"
              title="No Incoming Rescues"
              description="No food rescues are currently heading to your centers."
            />
          </View>
        ) : (
          items.map((item) => (
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
              onRelease={() => handleRelease(item)}
            />
          ))
        )}
      </ScrollView>

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
    paddingBottom: spacing['3xl'],
  },
  emptyContainer: {
    padding: spacing.md,
    marginTop: spacing.lg,
  },
});
