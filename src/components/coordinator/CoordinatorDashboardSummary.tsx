/**
 * Coordinator Dashboard Summary Metrics
 * Real-time operational metrics for active centers, incoming rescues, and completed deliveries.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, AnimatedPressable } from '../ui';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { haptic } from '../../design-system/haptics';
import { CoordinatorStats } from '../../types/coordinator';

interface CoordinatorDashboardSummaryProps {
  stats: CoordinatorStats;
  activeCentersCount?: number;
  onPressCenters?: () => void;
  onPressIncoming?: () => void;
  onPressCompleted?: () => void;
}

export const CoordinatorDashboardSummary: React.FC<CoordinatorDashboardSummaryProps> = ({
  stats,
  activeCentersCount = 0,
  onPressCenters,
  onPressIncoming,
  onPressCompleted,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Row: Active Centers & Incoming Rescues */}
      <View style={styles.topRow}>
        {/* 1. Active Centers */}
        <AnimatedPressable
          style={styles.halfCardWrapper}
          onPress={() => {
            haptic.selection();
            onPressCenters?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Active Centers: ${activeCentersCount}`}
        >
          <GlassCard variant="standard" style={styles.statCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: colors.brand[50] }]}>
                <Ionicons name="business" size={24} color={colors.brand.primary} />
              </View>
              <View style={styles.statusIndicator}>
                <View style={styles.greenPulse} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.statNumber} numberOfLines={1}>
                {activeCentersCount}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                Active Centers
              </Text>
              <Text style={styles.statSublabel} numberOfLines={1}>
                {activeCentersCount === 1 ? '1 Hub ready' : `${activeCentersCount} Hubs ready`}
              </Text>
            </View>
          </GlassCard>
        </AnimatedPressable>

        {/* 2. Incoming Rescues */}
        <AnimatedPressable
          style={styles.halfCardWrapper}
          onPress={() => {
            haptic.selection();
            onPressIncoming?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Incoming Rescues: ${stats.incomingCount}`}
        >
          <GlassCard variant="standard" style={styles.statCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: colors.status.infoBg }]}>
                <Ionicons name="bicycle" size={24} color={colors.status.info} />
              </View>
              {stats.incomingCount > 0 ? (
                <View style={styles.livePill}>
                  <View style={styles.bluePulse} />
                  <Text style={styles.livePillText}>Live</Text>
                </View>
              ) : (
                <View style={styles.neutralIndicator}>
                  <Text style={styles.neutralText}>Standby</Text>
                </View>
              )}
            </View>
            <View style={styles.cardBody}>
              <Text
                style={[
                  styles.statNumber,
                  stats.incomingCount > 0 && { color: colors.status.info },
                ]}
                numberOfLines={1}
              >
                {stats.incomingCount}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                Incoming Rescues
              </Text>
              <Text style={styles.statSublabel} numberOfLines={1}>
                {stats.incomingCount > 0 ? 'Rescues in transit' : 'Awaiting transit'}
              </Text>
            </View>
          </GlassCard>
        </AnimatedPressable>
      </View>

      {/* Bottom Card: Completed Rescues */}
      <AnimatedPressable
        style={styles.fullCardWrapper}
        onPress={() => {
          haptic.selection();
          onPressCompleted?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Completed Rescues: ${stats.completedCount}`}
      >
        <GlassCard variant="standard" style={styles.completedCard}>
          <View style={styles.completedContent}>
            <View style={[styles.iconBadgeLarge, { backgroundColor: colors.status.successBg }]}>
              <Ionicons name="checkmark-done-circle" size={26} color={colors.status.success} />
            </View>
            <View style={styles.completedTextContainer}>
              <View style={styles.completedTitleRow}>
                <Text style={styles.completedNumber}>{stats.completedCount}</Text>
                <Text style={styles.completedTitle}>Completed Rescues</Text>
              </View>
              <Text style={styles.completedSubtitle}>
                Successful collection-center handovers
              </Text>
            </View>
            <View style={styles.chevronCircle}>
              <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
            </View>
          </View>
        </GlassCard>
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  halfCardWrapper: {
    flex: 1,
  },
  fullCardWrapper: {
    width: '100%',
  },
  statCard: {
    padding: spacing.md,
    minHeight: 128,
    justifyContent: 'space-between',
    marginVertical: 0,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brand[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.status.infoBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.status.infoBorder,
  },
  bluePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.status.info,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.status.info,
    textTransform: 'uppercase',
  },
  neutralIndicator: {
    backgroundColor: colors.surface.subtle,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  neutralText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.muted,
  },
  cardBody: {
    marginTop: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  statSublabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 1,
  },
  completedCard: {
    padding: spacing.md,
    marginVertical: 0,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  completedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadgeLarge: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTextContainer: {
    flex: 1,
  },
  completedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  completedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  completedSubtitle: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});



