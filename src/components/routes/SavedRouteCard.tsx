/**
 * SavedRouteCard Component
 * Renders a saved volunteer trajectory with activation toggle, edit, and deletion actions.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { GlassBadge } from '../ui/GlassBadge';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { VolunteerRoute } from '../../types/route';
import { formatTimeWindow } from '../../utils/dateTime';
import { haptic } from '../../design-system/haptics';

interface SavedRouteCardProps {
  route: VolunteerRoute;
  onActivate: (route: VolunteerRoute) => void;
  onDelete: (route: VolunteerRoute) => void;
}

export function SavedRouteCard({
  route,
  onActivate,
  onDelete,
}: SavedRouteCardProps) {
  const timeWindowStr = formatTimeWindow(route.availableFromAt, route.availableUntilAt);

  return (
    <GlassCard variant={route.isActive ? 'elevated' : 'standard'} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="bookmark" size={16} color={colors.brand.primary} />
          <Text style={[typography.labelLarge, styles.routeTitle]}>
            {route.name || `${route.origin.address.split(',')[0]} → ${route.destination.address.split(',')[0]}`}
          </Text>
        </View>

        {route.isActive ? (
          <GlassBadge label="Active Now" variant="success" size="small" />
        ) : (
          <TouchableOpacity
            style={styles.activateBtn}
            onPress={() => {
              haptic.selection();
              onActivate(route);
            }}
            activeOpacity={0.7}
          >
            <Text style={[typography.labelSmall, styles.activateBtnText]}>Activate</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.locationRow}>
          <Ionicons name="radio-button-on" size={14} color={colors.status.info} />
          <Text style={[typography.bodySmall, styles.addressText]} numberOfLines={1}>
            From: {route.origin.address}
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="flag" size={14} color={colors.brand.primary} />
          <Text style={[typography.bodySmall, styles.addressText]} numberOfLines={1}>
            To: {route.destination.address}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.metaBadge}>
          <Ionicons name="time-outline" size={12} color={colors.text.secondary} />
          <Text style={[typography.caption, styles.metaText]}>{timeWindowStr}</Text>
        </View>

        <View style={styles.metaBadge}>
          <Ionicons name="git-branch-outline" size={12} color={colors.text.secondary} />
          <Text style={[typography.caption, styles.metaText]}>
            Max detour: {route.maxDetourMinutes} min
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            haptic.warning();
            onDelete(route);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={colors.status.error} />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: spacing.xs,
  },
  routeTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
  },
  activateBtn: {
    backgroundColor: colors.brand[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  activateBtnText: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  routeDetails: {
    marginVertical: spacing.xs,
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    color: colors.text.secondary,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  metaText: {
    color: colors.text.secondary,
  },
  deleteButton: {
    padding: 4,
  },
});
