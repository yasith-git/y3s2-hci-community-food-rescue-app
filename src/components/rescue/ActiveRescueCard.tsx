/**
 * ActiveRescueCard Component
 * Prominent banner/card on the volunteer home & activity tabs displaying live assignment progress.
 */

import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { GlassBadge } from '../ui/GlassBadge';
import { GlassButton } from '../ui/GlassButton';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { RescueAssignment } from '../../types/rescue';
import { DonationStatus } from '../../types/donation';
import { haptic } from '../../design-system/haptics';

interface ActiveRescueCardProps {
  assignment: RescueAssignment;
  status: DonationStatus;
  onContinue: () => void;
  onReportIssue?: () => void;
}

export function ActiveRescueCard({
  assignment,
  status,
  onContinue,
  onReportIssue,
}: ActiveRescueCardProps) {
  const getStageInfo = () => {
    switch (status) {
      case 'VOLUNTEER_ASSIGNED':
        return {
          badge: 'Accepted',
          variant: 'brand' as const,
          actionText: 'Continue Pickup',
          subtext: `Pickup: ${assignment.pickupAddress.split(',')[0]}`,
          icon: 'bicycle' as const,
        };
      case 'PICKUP_EN_ROUTE':
        return {
          badge: 'Heading to Pickup',
          variant: 'warning' as const,
          actionText: 'Continue Pickup',
          subtext: `At: ${assignment.pickupAddress}`,
          icon: 'navigate' as const,
        };
      case 'PICKED_UP':
        return {
          badge: 'Pickup Confirmed',
          variant: 'success' as const,
          actionText: 'Continue Delivery',
          subtext: `Deliver to: ${assignment.communityPointName || 'Community Hub'}`,
          icon: 'cube' as const,
        };
      case 'DELIVERY_EN_ROUTE':
        return {
          badge: 'Delivering to Hub',
          variant: 'warning' as const,
          actionText: 'Continue Delivery',
          subtext: `Destination: ${assignment.communityPointAddress || 'Community Center'}`,
          icon: 'location' as const,
        };
      case 'DELIVERED':
        return {
          badge: 'Delivered',
          variant: 'success' as const,
          actionText: 'Awaiting Receipt',
          subtext: 'Coordinator verifying handover...',
          icon: 'checkmark-circle' as const,
        };
      default:
        return {
          badge: 'Accepted',
          variant: 'brand' as const,
          actionText: 'Continue Pickup',
          subtext: assignment.foodName,
          icon: 'arrow-forward' as const,
        };
    }
  };

  const stage = getStageInfo();

  return (
    <GlassCard variant="elevated" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Ionicons name="flash" size={16} color={colors.status.warning} />
          <Text style={[typography.labelMedium, styles.activeTitle]}>Active Food Rescue</Text>
        </View>
        <GlassBadge label={stage.badge} variant={stage.variant} size="small" />
      </View>

      <View style={styles.contentRow}>
        {assignment.imageUrl ? (
          <Image source={{ uri: assignment.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="fast-food" size={24} color={colors.brand.primary} />
          </View>
        )}

        <View style={styles.infoCol}>
          <Text style={[typography.labelLarge, styles.foodName]} numberOfLines={1}>
            {assignment.foodName}
          </Text>
          <Text style={[typography.caption, styles.quantityText]}>
            {assignment.quantity} {assignment.unit}
          </Text>
          <Text style={[typography.bodySmall, styles.subtext]} numberOfLines={1}>
            📍 {stage.subtext}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <GlassButton
          title={stage.actionText}
          variant="primary"
          size="medium"
          icon={stage.icon}
          iconPosition="right"
          fullWidth
          onPress={() => {
            haptic.selection();
            onContinue();
          }}
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeTitle: {
    color: colors.status.warning,
    fontWeight: '700',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
  },
  placeholder: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  foodName: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  quantityText: {
    color: colors.brand.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  subtext: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  buttonRow: {
    marginTop: spacing.sm,
    width: '100%',
  },
});
