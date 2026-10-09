/**
 * RouteSummaryCard Component
 * Displays current active route information, origin -> destination, detour allowance, and edit action.
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

interface RouteSummaryCardProps {
  route: VolunteerRoute | null;
  onSetRoute: () => void;
  onEditRoute?: () => void;
  matchCount?: number;
}

export function RouteSummaryCard({
  route,
  onSetRoute,
  onEditRoute,
  matchCount = 0,
}: RouteSummaryCardProps) {
  if (!route) {
    return (
      <GlassCard variant="standard" style={styles.card}>
        <View style={styles.noRouteRow}>
          <View style={styles.noRouteIconContainer}>
            <Ionicons name="map-outline" size={24} color={colors.brand.primary} />
          </View>
          <View style={styles.noRouteContent}>
            <Text style={[typography.labelLarge, styles.noRouteTitle]}>
              No Active Journey
            </Text>
            <Text style={[typography.bodySmall, styles.noRouteSubtitle]}>
              Set your route to discover rescues right along your path.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.setRouteBtn}
            onPress={() => {
              haptic.selection();
              onSetRoute();
            }}
            activeOpacity={0.8}
          >
            <Text style={[typography.labelSmall, styles.setRouteBtnText]}>Set Route</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  }

  const timeWindowStr = formatTimeWindow(route.availableFromAt, route.availableUntilAt);

  return (
    <GlassCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.statusRow}>
          <View style={styles.activeDot} />
          <Text style={[typography.labelSmall, styles.activeStatusText]}>
            Active Journey
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            haptic.selection();
            onEditRoute?.();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[typography.labelSmall, styles.editActionText]}>Edit Route</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.trajectoryContainer}>
        {/* Origin */}
        <View style={styles.waypointRow}>
          <Ionicons name="radio-button-on" size={16} color={colors.status.info} />
          <Text style={[typography.bodyMedium, styles.waypointText]} numberOfLines={1}>
            {route.origin.address}
          </Text>
        </View>

        {/* Connector line */}
        <View style={styles.connectorLine} />

        {/* Destination */}
        <View style={styles.waypointRow}>
          <Ionicons name="flag" size={16} color={colors.brand.primary} />
          <Text style={[typography.bodyMedium, styles.waypointText]} numberOfLines={1}>
            {route.destination.address}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.pillBadge}>
          <Ionicons name="time-outline" size={13} color={colors.text.secondary} />
          <Text style={[typography.caption, styles.pillText]}>{timeWindowStr}</Text>
        </View>

        <View style={styles.pillBadge}>
          <Ionicons name="git-branch-outline" size={13} color={colors.text.secondary} />
          <Text style={[typography.caption, styles.pillText]}>
            Max detour: {route.maxDetourMinutes} min
          </Text>
        </View>

        {matchCount > 0 && (
          <GlassBadge
            label={`${matchCount} Match${matchCount > 1 ? 'es' : ''}`}
            variant="success"
            size="small"
          />
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  noRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noRouteIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRouteContent: {
    flex: 1,
  },
  noRouteTitle: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  noRouteSubtitle: {
    color: colors.text.muted,
  },
  setRouteBtn: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  setRouteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.success,
  },
  activeStatusText: {
    color: colors.status.success,
    fontWeight: '700',
  },
  editActionText: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  trajectoryContainer: {
    marginVertical: spacing.xs,
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectorLine: {
    width: 2,
    height: 12,
    backgroundColor: colors.surface.border,
    marginLeft: 7,
    marginVertical: 2,
  },
  waypointText: {
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  pillText: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
