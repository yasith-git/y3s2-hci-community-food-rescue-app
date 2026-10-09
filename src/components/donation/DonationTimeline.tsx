/**
 * Donation Timeline Component
 * Generates dynamic lifecycle timeline based on actual timestamps and state
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Donation } from '../../types/donation';
import { colors, typography, spacing, radius } from '../../design-system';
import { formatTime } from '../../utils/dateTime';

interface DonationTimelineProps {
  donation: Donation;
}

interface TimelineStage {
  key: string;
  title: string;
  subtext?: string;
  timestamp?: string;
  isComplete: boolean;
  isCurrent: boolean;
}

export const DonationTimeline: React.FC<DonationTimelineProps> = ({ donation }) => {
  const { status, publishedAt, reservedAt, assignedAt, pickedUpAt, deliveredAt, completedAt, cancelledAt } = donation;

  const isCancelled = status === 'CANCELLED';
  const isExpired = status === 'EXPIRED';

  const stages: TimelineStage[] = [
    {
      key: 'published',
      title: 'Donation Published',
      timestamp: publishedAt,
      isComplete: !!publishedAt,
      isCurrent: status === 'PUBLISHED',
    },
    {
      key: 'assigned',
      title: 'Volunteer Accepted',
      timestamp: assignedAt,
      isComplete: !!assignedAt || !!pickedUpAt || !!deliveredAt || !!completedAt,
      isCurrent: status === 'VOLUNTEER_ASSIGNED',
    },
    {
      key: 'pickup_en_route',
      title: 'Volunteer Heading to Pickup',
      timestamp: undefined,
      isComplete: !!pickedUpAt || !!deliveredAt || !!completedAt,
      isCurrent: status === 'PICKUP_EN_ROUTE',
    },
    {
      key: 'pickedUp',
      title: 'Food Picked Up',
      timestamp: pickedUpAt,
      isComplete: !!pickedUpAt || !!deliveredAt || !!completedAt,
      isCurrent: status === 'PICKED_UP',
    },
    {
      key: 'delivery_en_route',
      title: 'Heading to Collection Center',
      timestamp: undefined,
      isComplete: !!deliveredAt || !!completedAt,
      isCurrent: status === 'DELIVERY_EN_ROUTE',
    },
    {
      key: 'delivered',
      title: 'Delivered to Collection Center',
      subtext: status === 'DELIVERED' ? 'Awaiting Community Authority confirmation.' : undefined,
      timestamp: deliveredAt,
      isComplete: !!deliveredAt || status === 'DELIVERED' || status === 'COMPLETED' || status === 'ACKNOWLEDGED',
      isCurrent: status === 'DELIVERED',
    },
    {
      key: 'completed',
      title: 'Rescue Completed',
      subtext: status === 'COMPLETED' || status === 'ACKNOWLEDGED' ? 'Your donation was received by the Community Authority.' : undefined,
      timestamp: completedAt,
      isComplete: status === 'COMPLETED' || status === 'ACKNOWLEDGED',
      isCurrent: status === 'COMPLETED' || status === 'ACKNOWLEDGED',
    },
  ];

  return (
    <View style={styles.container}>
      {isCancelled ? (
        <View style={styles.terminalBox}>
          <Ionicons name="close-circle" size={24} color={colors.status.error} />
          <View style={styles.terminalTextColumn}>
            <Text style={[typography.titleMedium, { color: colors.status.error }]}>
              Donation Cancelled
            </Text>
            {donation.cancellationReason && (
              <Text style={[typography.bodySmall, styles.terminalReason]}>
                Reason: {donation.cancellationReason}
              </Text>
            )}
            {cancelledAt && (
              <Text style={[typography.caption, styles.terminalTime]}>
                Cancelled at {formatTime(cancelledAt)}
              </Text>
            )}
          </View>
        </View>
      ) : isExpired ? (
        <View style={styles.terminalBox}>
          <Ionicons name="timer-outline" size={24} color={colors.status.error} />
          <View style={styles.terminalTextColumn}>
            <Text style={[typography.titleMedium, { color: colors.status.error }]}>
              Donation Expired
            </Text>
            <Text style={[typography.bodySmall, styles.terminalReason]}>
              Pickup window closed before a courier or pantry was assigned.
            </Text>
          </View>
        </View>
      ) : (
        stages.map((stage, idx) => (
          <View key={stage.key} style={styles.timelineRow}>
            {/* Indicator Node */}
            <View style={styles.nodeColumn}>
              <View
                style={[
                  styles.nodeCircle,
                  stage.isComplete && styles.nodeComplete,
                  stage.isCurrent && styles.nodeCurrent,
                ]}
              >
                {stage.isComplete ? (
                  <Ionicons name="checkmark" size={12} color={colors.text.inverse} />
                ) : (
                  <View style={styles.nodeUpcomingDot} />
                )}
              </View>
              {idx < stages.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    stage.isComplete && styles.connectorComplete,
                  ]}
                />
              )}
            </View>

            {/* Stage Text */}
            <View style={styles.stageTextColumn}>
              <Text
                style={[
                  typography.bodyMedium,
                  stage.isCurrent ? styles.stageTitleCurrent : styles.stageTitle,
                ]}
              >
                {stage.title}
              </Text>
              {stage.subtext && (
                <Text style={[typography.caption, { color: colors.brand.primary, marginTop: 2, fontWeight: '500' }]}>
                  {stage.subtext}
                </Text>
              )}
              {stage.timestamp && (
                <Text style={[typography.caption, styles.stageTime]}>
                  {formatTime(stage.timestamp)}
                </Text>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 48,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 28,
  },
  nodeCircle: {
    width: 20,
    height: 20,
    borderRadius: radius.round,
    backgroundColor: colors.surface.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeComplete: {
    backgroundColor: colors.brand.primary,
  },
  nodeCurrent: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand[100],
    borderWidth: 3,
  },
  nodeUpcomingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.disabled,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.surface.borderStrong,
    marginVertical: 2,
  },
  connectorComplete: {
    backgroundColor: colors.brand.primary,
  },
  stageTextColumn: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingBottom: spacing.md,
  },
  stageTitle: {
    color: colors.text.secondary,
  },
  stageTitleCurrent: {
    color: colors.brand.dark,
    fontWeight: '700',
  },
  stageTime: {
    color: colors.text.muted,
    marginTop: 2,
  },
  terminalBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.status.errorBg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderColor: colors.status.errorBorder,
    borderWidth: 1,
    gap: spacing.sm,
  },
  terminalTextColumn: {
    flex: 1,
  },
  terminalReason: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  terminalTime: {
    color: colors.text.muted,
    marginTop: 4,
  },
});
