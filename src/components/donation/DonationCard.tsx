/**
 * Donation Summary Card Component
 * Reusable card representing an active or completed food donation
 */

import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, StatusBadge, GlassBadge } from '../ui';
import { Donation } from '../../types/donation';
import { colors, typography, spacing, radius } from '../../design-system';
import { formatTime, getRelativeTimeString } from '../../utils/dateTime';
import { isDonationExpired, isDonationActive } from '../../services/donations/donation.state-machine';
import { rescueAIService } from '../../services/rescue-ai/rescueAI.service';
import { RescueAIBadge } from '../rescue-ai/RescueAIBadge';

interface DonationCardProps {
  donation: Donation;
  onPress: () => void;
}

export const DonationCard: React.FC<DonationCardProps> = ({ donation, onPress }) => {
  const { food, pickup, status } = donation;
  const expired = isDonationExpired(donation);
  const displayStatus = expired ? 'EXPIRED' : status;

  // Compute RescueAI urgency for active donations
  const urgency = isDonationActive(donation.status) && !expired
    ? rescueAIService.getDonationUrgency({
        id: donation.id,
        category: donation.food.category,
        storageCondition: donation.safety.storageCondition,
        pickupStartAt: donation.pickup.pickupStartAt,
        pickupDeadlineAt: donation.pickup.pickupDeadlineAt,
        status: donation.status,
        isReserved: Boolean(donation.reservedAt),
        isVolunteerAssigned: Boolean(donation.assignedAt),
        createdAt: donation.createdAt,
      })
    : null;

  return (
    <GlassCard variant="interactive" onPress={onPress} style={styles.card}>
      <View style={styles.contentRow}>
        {/* Food Thumbnail */}
        {food.imageUrl ? (
          <Image source={{ uri: food.imageUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailFallback}>
            <Ionicons name="restaurant-outline" size={24} color={colors.brand.primary} />
          </View>
        )}

        {/* Info Column */}
        <View style={styles.infoColumn}>
          <View style={styles.headerRow}>
            <Text style={[typography.titleMedium, styles.foodName]} numberOfLines={1}>
              {food.name}
            </Text>
            <StatusBadge status={displayStatus.toLowerCase() as any} size="small" />
          </View>

          <Text style={[typography.bodySmall, styles.quantityText]}>
            {food.quantity} {food.unit} • {food.category}
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={13} color={colors.text.muted} />
              <Text style={[typography.caption, styles.timeText]} numberOfLines={1}>
                {expired
                  ? 'Expired'
                  : getRelativeTimeString(pickup.pickupDeadlineAt, 'Until')}
              </Text>
            </View>

            {urgency && (urgency.urgencyLevel === 'HIGH' || urgency.urgencyLevel === 'CRITICAL') && (
              <RescueAIBadge label="High Priority" level={urgency.urgencyLevel} size="small" />
            )}

            <Ionicons name="chevron-forward" size={16} color={colors.text.disabled} />
          </View>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginVertical: spacing.xs,
  },
  contentRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surface.subtle,
  },
  thumbnailFallback: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoColumn: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
    minHeight: 72,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  quantityText: {
    color: colors.text.muted,
    marginVertical: 3,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
