/**
 * Incoming Rescue Card for Coordinator
 * Displays current status, volunteer assignment, delivery tracking, and receipt actions.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassBadge, GlassButton } from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { CoordinatorIncomingItem } from '../../services/coordinator/coordinator.service';
import { formatRelativeTime } from '../../utils/dateTime';

interface IncomingRescueCardProps {
  item: CoordinatorIncomingItem;
  onTrack: (item: CoordinatorIncomingItem) => void;
  onViewCode: (item: CoordinatorIncomingItem) => void;
  onConfirmReceipt: (item: CoordinatorIncomingItem) => void;
  onRelease?: (item: CoordinatorIncomingItem) => void;
}

export const IncomingRescueCard: React.FC<IncomingRescueCardProps> = ({
  item,
  onTrack,
  onViewCode,
  onConfirmReceipt,
  onRelease,
}) => {
  const { donation, reservation } = item;
  const status = donation.status;

  const getStatusBadge = () => {
    switch (status) {
      case 'RESERVED':
        return <GlassBadge label="Waiting for Volunteer" variant="warning" size="small" />;
      case 'VOLUNTEER_ASSIGNED':
        return <GlassBadge label="Volunteer Matched" variant="brand" size="small" />;
      case 'PICKUP_EN_ROUTE':
        return <GlassBadge label="Heading to Pickup" variant="brand" size="small" />;
      case 'PICKED_UP':
        return <GlassBadge label="Food Collected" variant="brand" size="small" />;
      case 'DELIVERY_EN_ROUTE':
        return <GlassBadge label="On the Way" variant="brand" size="small" />;
      case 'DELIVERED':
        return <GlassBadge label="Delivered - Awaiting Receipt" variant="success" size="small" />;
      case 'ISSUE_REPORTED':
        return <GlassBadge label="Issue Reported" variant="error" size="small" />;
      default:
        return <GlassBadge label={status} variant="neutral" size="small" />;
    }
  };

  const isDeliverable = status === 'DELIVERED';
  const isEnRoute = status === 'DELIVERY_EN_ROUTE' || status === 'PICKED_UP';
  const isCancellable = status === 'RESERVED';

  return (
    <GlassCard variant="elevated" style={styles.card} testID={`incoming-card-${donation.id}`}>
      {/* Top Status Row */}
      <View style={styles.topRow}>
        {getStatusBadge()}
        <Text style={[typography.caption, styles.timeText]}>
          Updated {formatRelativeTime(donation.updatedAt)}
        </Text>
      </View>

      {/* Main Details */}
      <View style={styles.body}>
        <Text style={[typography.headingSmall, styles.foodName]}>{donation.food.name}</Text>
        <Text style={[typography.labelLarge, styles.qtyText]}>
          📦 {donation.food.quantity} {donation.food.unit}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="business-outline" size={14} color={colors.text.secondary} />
          <Text style={[typography.caption, styles.metaText]}>
            Hub: {donation.communityPointName || reservation.communityPointName || 'Community Hub'}
          </Text>
        </View>

        {(donation as any).assignedVolunteerName && (
          <View style={styles.metaRow}>
            <Ionicons name="bicycle-outline" size={14} color={colors.brand.primary} />
            <Text style={[typography.caption, styles.volunteerText]}>
              Volunteer: {(donation as any).assignedVolunteerName}
            </Text>
          </View>
        )}
      </View>

      {/* Action Bar */}
      <View style={styles.actionsRow}>
        <GlassButton
          title="View Delivery"
          variant="secondary"
          icon="navigate-outline"
          size="small"
          onPress={() => onTrack(item)}
        />

        {(isDeliverable || isEnRoute) && (
          <GlassButton
            title="Confirm Handover"
            variant="primary"
            icon="checkmark-done"
            size="small"
            onPress={() => onConfirmReceipt(item)}
          />
        )}

        {isEnRoute && (
          <GlassButton
            title="Code"
            variant="tertiary"
            icon="key-outline"
            size="small"
            onPress={() => onViewCode(item)}
          />
        )}

        {isCancellable && onRelease && (
          <GlassButton
            title="Release"
            variant="tertiary"
            icon="close-circle-outline"
            size="small"
            onPress={() => onRelease(item)}
          />
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timeText: {
    color: colors.text.muted,
  },
  body: {
    marginVertical: spacing.xs,
  },
  foodName: {
    color: colors.text.primary,
  },
  qtyText: {
    color: colors.brand.primary,
    fontWeight: '700',
    marginTop: 2,
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
  volunteerText: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
});
