/**
 * OpportunityBottomSheet Component
 * Quick preview card shown when a map marker is selected.
 */

import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassBadge } from '../ui/GlassBadge';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { RouteMatch } from '../../types/route';
import { formatTimeRemaining } from '../../utils/dateTime';
import { haptic } from '../../design-system/haptics';

interface OpportunityBottomSheetProps {
  match: RouteMatch | null;
  onClose: () => void;
  onViewDetails: (match: RouteMatch) => void;
}

export function OpportunityBottomSheet({
  match,
  onClose,
  onViewDetails,
}: OpportunityBottomSheetProps) {
  if (!match) return null;

  const { donation, estimatedDetourMinutes, fitCategory, routeDeviationKm } = match;
  const timeRemainingStr = formatTimeRemaining(donation.pickup.pickupDeadlineAt);

  return (
    <View style={styles.container}>
      <GlassCard variant="elevated" style={styles.sheetCard}>
        <View style={styles.topRow}>
          <View style={styles.badgeGroup}>
            <GlassBadge
              label={fitCategory === 'EXCELLENT' ? '⭐ Best Match' : `${fitCategory} Fit`}
              variant={fitCategory === 'EXCELLENT' ? 'success' : 'brand'}
              size="small"
            />
            <View style={styles.timePill}>
              <Ionicons name="time-outline" size={12} color={colors.status.warning} />
              <Text style={[typography.caption, styles.timePillText]}>{timeRemainingStr}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              haptic.selection();
              onClose();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.contentRow}>
          {donation.food.imageUrl ? (
            <Image source={{ uri: donation.food.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="fast-food" size={24} color={colors.brand.primary} />
            </View>
          )}

          <View style={styles.infoCol}>
            <Text style={[typography.labelLarge, styles.foodName]} numberOfLines={1}>
              {donation.food.name}
            </Text>
            <Text style={[typography.bodySmall, styles.donorName]} numberOfLines={1}>
              {donation.donorOrganization || donation.donorName}
            </Text>
            <Text style={[typography.caption, styles.pickupAddress]} numberOfLines={1}>
              📍 {donation.pickup.address}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricPill}>
            <Text style={[typography.caption, styles.metricLabel]}>Quantity</Text>
            <Text style={[typography.labelSmall, styles.metricVal]}>
              {donation.food.quantity} {donation.food.unit}
            </Text>
          </View>

          <View style={styles.metricPill}>
            <Text style={[typography.caption, styles.metricLabel]}>Est. Detour</Text>
            <Text style={[typography.labelSmall, styles.metricHighlight]}>
              +{estimatedDetourMinutes} min
            </Text>
          </View>

          <View style={styles.metricPill}>
            <Text style={[typography.caption, styles.metricLabel]}>Off Route</Text>
            <Text style={[typography.labelSmall, styles.metricVal]}>
              {routeDeviationKm.toFixed(1)} km
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <GlassButton
            title="Inspect Opportunity"
            variant="primary"
            size="medium"
            icon="arrow-forward"
            iconPosition="right"
            onPress={() => {
              haptic.selection();
              onViewDetails(match);
            }}
          />
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
  },
  sheetCard: {
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  timePillText: {
    color: colors.status.warning,
    fontWeight: '600',
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
  imagePlaceholder: {
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
  donorName: {
    color: colors.text.muted,
  },
  pickupAddress: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: spacing.xs,
  },
  metricPill: {
    flex: 1,
    backgroundColor: colors.surface.secondary,
    padding: 6,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  metricLabel: {
    color: colors.text.muted,
    fontSize: 10,
  },
  metricVal: {
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  metricHighlight: {
    color: colors.brand.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  actionRow: {
    marginTop: spacing.xs,
  },
});
