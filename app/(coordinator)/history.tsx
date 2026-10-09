/**
 * Coordinator History Screen
 * Audit and operational record of all completed handovers and released reservations.
 * Privacy by design: Contains zero beneficiary identities or recipient profiles.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Text,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassBadge,
  GlassIconButton,
  EmptyState,
  Skeleton,
} from '../../src/components/ui';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  subscribeToCoordinatorHistory,
  CoordinatorHistoryItem,
} from '../../src/services/coordinator/coordinator.service';
import { formatRelativeTime } from '../../src/utils/dateTime';

export default function CoordinatorHistoryScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [historyItems, setHistoryItems] = useState<CoordinatorHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToCoordinatorHistory(user.uid, (items) => {
      setHistoryItems(items);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    haptic.selection();
    setTimeout(() => setIsRefreshing(false), 800);
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
    <ScreenContainer scrollable={false} testID="coordinator-history-screen">
      <GlassHeader
        title="Completed Rescues"
        subtitle="Historical Handover Records"
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
        {isLoading ? (
          <View style={{ padding: spacing.md, gap: 12 }}>
            <Skeleton width="100%" height={120} borderRadius={radius.lg} />
            <Skeleton width="100%" height={120} borderRadius={radius.lg} />
          </View>
        ) : historyItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="time-outline"
              title="No Completed Rescues Yet"
              description="When you confirm food handovers at your collection centers, completed records will be displayed here."
            />
          </View>
        ) : (
          historyItems.map((item) => (
            <GlassCard key={item.donation.id} variant="standard" style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={[typography.headingSmall, styles.foodName]}>
                  {item.donation.food.name}
                </Text>
                <GlassBadge
                  label={item.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                  variant={item.status === 'COMPLETED' ? 'success' : 'neutral'}
                  size="small"
                />
              </View>

              <Text style={[typography.labelLarge, styles.qtyText]}>
                📦 {item.donation.food.quantity} {item.donation.food.unit}
              </Text>

              <View style={styles.metaRow}>
                <Ionicons name="business-outline" size={14} color={colors.text.secondary} />
                <Text style={[typography.caption, styles.metaText]}>
                  Center: {item.donation.communityPointName || 'Collection Center'}
                </Text>
              </View>

              {(item.donation as any).assignedVolunteerName && (
                <View style={styles.metaRow}>
                  <Ionicons name="bicycle-outline" size={14} color={colors.brand.primary} />
                  <Text style={[typography.caption, { color: colors.brand.primary, fontWeight: '600' }]}>
                    Volunteer: {(item.donation as any).assignedVolunteerName}
                  </Text>
                </View>
              )}

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.text.muted} />
                <Text style={[typography.caption, styles.dateText]}>
                  Completed {formatRelativeTime(item.completedAt || item.donation.updatedAt)}
                </Text>
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
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
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  foodName: {
    color: colors.text.primary,
  },
  qtyText: {
    color: colors.brand.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    color: colors.text.secondary,
  },
  dateText: {
    color: colors.text.muted,
  },
  emptyContainer: {
    padding: spacing.md,
    marginTop: spacing.xl,
  },
});
