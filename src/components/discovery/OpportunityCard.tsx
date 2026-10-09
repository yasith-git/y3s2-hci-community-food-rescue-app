/**
 * OpportunityCard Component
 * Renders a discoverable food rescue with thumbnail, match badge, detour estimation, and deadline.
 */

import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { GlassBadge, GlassBadgeVariant } from '../ui/GlassBadge';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { RouteMatch } from '../../types/route';
import { formatTimeRemaining } from '../../utils/dateTime';
import { haptic } from '../../design-system/haptics';

interface OpportunityCardProps {
  match: RouteMatch;
  onPress: (match: RouteMatch) => void;
  selected?: boolean;
}

export function OpportunityCard({
  match,
  onPress,
  selected = false,
}: OpportunityCardProps) {
  const { donation, explanation, fitCategory, estimatedDetourMinutes, routeDeviationKm } = match;
  const timeRemainingStr = formatTimeRemaining(donation.pickup.pickupDeadlineAt);

  const getBadgeVariant = (): GlassBadgeVariant => {
    if (fitCategory === 'EXCELLENT') return 'success';
    if (fitCategory === 'GOOD') return 'brand';
    return 'neutral';
  };

  return (
    <GlassCard
      variant={selected ? 'elevated' : 'standard'}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          haptic.selection();
          onPress(match);
        }}
      >
        <View style={styles.contentRow}>
          {/* Food Image / Placeholder */}
          <View style={styles.imageContainer}>
            {donation.food.imageUrl ? (
              <Image source={{ uri: donation.food.imageUrl }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="fast-food-outline" size={28} color={colors.brand.primary} />
              </View>
            )}
          </View>

          {/* Core Info */}
          <View style={styles.infoCol}>
            <View style={styles.headerRow}>
              <GlassBadge
                label={fitCategory === 'EXCELLENT' ? '⭐ Best Fit' : `${fitCategory} Fit`}
                variant={getBadgeVariant()}
                size="small"
              />
              <View style={styles.timeBadge}>
                <Ionicons name="time-outline" size={12} color={colors.status.warning} />
                <Text style={[typography.caption, styles.timeText]}>{timeRemainingStr}</Text>
              </View>
            </View>

            <Text style={[typography.labelLarge, styles.foodName]} numberOfLines={1}>
              {donation.food.name}
            </Text>

            <Text style={[typography.bodySmall, styles.donorOrganization]} numberOfLines={1}>
              {donation.donorOrganization || donation.donorName}
            </Text>

            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Ionicons name="cube-outline" size={13} color={colors.text.secondary} />
                <Text style={[typography.caption, styles.metricText]}>
                  {donation.food.quantity} {donation.food.unit}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Ionicons name="git-branch-outline" size={13} color={colors.brand.primary} />
                <Text style={[typography.caption, styles.metricHighlight]}>
                  +{estimatedDetourMinutes}m detour
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Ionicons name="navigate-outline" size={13} color={colors.text.secondary} />
                <Text style={[typography.caption, styles.metricText]}>
                  {routeDeviationKm.toFixed(1)} km off route
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transparent Explanation Footer */}
        <View style={styles.explanationFooter}>
          <Ionicons name="checkmark-circle" size={13} color={colors.status.success} />
          <Text style={[typography.caption, styles.explanationText]} numberOfLines={1}>
            {explanation.headline} • {explanation.timingText}
          </Text>
        </View>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.brand.primary,
    borderWidth: 1.5,
  },
  contentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface.secondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand[50],
  },
  infoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    color: colors.status.warning,
    fontWeight: '600',
  },
  foodName: {
    color: colors.text.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  donorOrganization: {
    color: colors.text.muted,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricText: {
    color: colors.text.secondary,
  },
  metricHighlight: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  explanationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  explanationText: {
    color: colors.text.secondary,
    flex: 1,
  },
});
