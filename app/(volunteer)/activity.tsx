/**
 * Volunteer Activity Tab Screen
 * Displays real-time Active rescues, Completed deliveries history, and Reported issues with live updates.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassBadge,
  GlassChip,
  EmptyState,
} from '../../src/components/ui';
import { ActiveRescueCard } from '../../src/components/rescue/ActiveRescueCard';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { RescueAssignment } from '../../src/types/rescue';
import { Donation } from '../../src/types/donation';
import {
  subscribeToVolunteerAssignments,
} from '../../src/services/rescue/rescue.service';
import { getDonationById } from '../../src/services/donations/donation.service';
import { formatDate } from '../../src/utils/dateTime';

type ActivityTab = 'ACTIVE' | 'COMPLETED' | 'ISSUES';

export default function VolunteerActivityScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<ActivityTab>('ACTIVE');
  const [assignments, setAssignments] = useState<RescueAssignment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let unsub: () => void = () => {};

    if (user?.uid) {
      unsub = subscribeToVolunteerAssignments(user.uid, (list) => {
        setAssignments(list);
      });
    }

    return () => unsub();
  }, [user?.uid]);

  const activeAssignments = assignments.filter((a) => {
    const s = a.status;
    return (
      (s === 'ASSIGNED' ||
        s === 'VOLUNTEER_ASSIGNED' ||
        s === 'PICKUP_EN_ROUTE' ||
        s === 'PICKED_UP' ||
        s === 'DELIVERY_EN_ROUTE') &&
      !a.deliveredAt &&
      !a.completedAt &&
      !a.cancelledAt
    );
  });

  const completedAssignments = assignments.filter((a) => {
    const s = a.status;
    return (
      (s === 'DELIVERED' ||
        s === 'COMPLETED' ||
        s === 'ACKNOWLEDGED' ||
        Boolean(a.deliveredAt) ||
        Boolean(a.completedAt)) &&
      s !== 'CANCELLED' &&
      !a.cancelledAt
    );
  });

  const cancelledAssignments = assignments.filter((a) => {
    const s = a.status;
    return s === 'CANCELLED' || Boolean(a.cancelledAt);
  });

  return (
    <ScreenContainer scrollable={false} testID="volunteer-activity-screen">
      <GlassHeader
        title="Rescue Activity"
        subtitle="Track active missions and your community impact"
      />

      {/* Segmented Tab Filter */}
      <View style={styles.tabRow}>
        <GlassChip
          label={`Active (${activeAssignments.length})`}
          selected={activeTab === 'ACTIVE'}
          onPress={() => {
            haptic.selection();
            setActiveTab('ACTIVE');
          }}
        />
        <GlassChip
          label={`Completed (${completedAssignments.length})`}
          selected={activeTab === 'COMPLETED'}
          onPress={() => {
            haptic.selection();
            setActiveTab('COMPLETED');
          }}
        />
        <GlassChip
          label={`Issues / Cancelled (${cancelledAssignments.length})`}
          selected={activeTab === 'ISSUES'}
          onPress={() => {
            haptic.selection();
            setActiveTab('ISSUES');
          }}
        />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(false)}
            tintColor={colors.brand.primary}
          />
        }
      >
        {activeTab === 'ACTIVE' && (
          <>
            {activeAssignments.length === 0 ? (
              <EmptyState
                icon="bicycle-outline"
                title="No Active Missions"
                description="You are not currently assigned to an active food rescue. Discover nearby opportunities along your route."
                primaryActionTitle="Discover Rescues"
                onPrimaryAction={() => router.replace('/(volunteer)')}
              />
            ) : (
              activeAssignments.map((assignment) => (
                <ActiveRescueCard
                  key={assignment.id}
                  assignment={assignment}
                  status={
                    (assignment.donationStatus as any) ||
                    (assignment.pickedUpAt ? 'PICKED_UP' : assignment.pickupStartedAt ? 'PICKUP_EN_ROUTE' : 'VOLUNTEER_ASSIGNED')
                  }
                  onContinue={() => {
                    router.push({
                      pathname: '/(volunteer)/active-rescue',
                      params: { id: assignment.donationId },
                    });
                  }}
                />
              ))
            )}
          </>
        )}

        {activeTab === 'COMPLETED' && (
          <>
            {completedAssignments.length === 0 ? (
              <EmptyState
                icon="checkmark-done-circle-outline"
                title="No Completed Rescues Yet"
                description="Your verified and delivered rescues will be recorded here with official community receipt confirmations."
              />
            ) : (
              completedAssignments.map((assignment) => {
                const isFinalComplete =
                  assignment.donationStatus === 'COMPLETED' ||
                  assignment.donationStatus === 'ACKNOWLEDGED' ||
                  Boolean(assignment.completedAt && assignment.donationStatus !== 'DELIVERED');

                return (
                  <GlassCard key={assignment.id} variant="standard" style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <Text style={[typography.labelLarge, styles.historyTitle]}>
                        {assignment.foodName}
                      </Text>
                      <GlassBadge
                        label={isFinalComplete ? 'Rescue Completed' : 'Delivered'}
                        variant={isFinalComplete ? 'success' : 'warning'}
                        size="small"
                      />
                    </View>

                    <Text style={[typography.bodySmall, styles.historyDetails]}>
                      📦 {assignment.quantity} {assignment.unit} • Delivered to {assignment.communityPointName || 'Community Hub'}
                    </Text>

                    <View style={styles.historyFooter}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.caption, styles.historyDate]}>
                          {isFinalComplete
                            ? `Completed ${formatDate(assignment.completedAt || assignment.deliveredAt)}`
                            : 'Awaiting Authority Receipt'}
                        </Text>
                      </View>
                      <Ionicons
                        name={isFinalComplete ? 'shield-checkmark' : 'time-outline'}
                        size={16}
                        color={isFinalComplete ? colors.status.success : colors.status.warning}
                      />
                    </View>
                  </GlassCard>
                );
              })
            )}
          </>
        )}

        {activeTab === 'ISSUES' && (
          <>
            {cancelledAssignments.length === 0 ? (
              <EmptyState
                icon="shield-checkmark-outline"
                title="No Issues Reported"
                description="All your rescue assignments are running smoothly with no operational incidents."
              />
            ) : (
              cancelledAssignments.map((assignment) => (
                <GlassCard key={assignment.id} variant="standard" style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={[typography.labelLarge, styles.historyTitle]}>
                      {assignment.foodName}
                    </Text>
                    <GlassBadge label="Released" variant="error" size="small" />
                  </View>

                  <Text style={[typography.bodySmall, styles.historyDetails]}>
                    Reason: {assignment.cancellationReason || 'Volunteer unable to complete mission'}
                  </Text>

                  <Text style={[typography.caption, styles.historyDate]}>
                    Logged {formatDate(assignment.cancelledAt)}
                  </Text>
                </GlassCard>
              ))
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing['4xl'],
  },
  historyCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
  },
  historyDetails: {
    color: colors.text.secondary,
    marginVertical: 4,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  historyDate: {
    color: colors.text.muted,
  },
});
