/**
 * RescueAIVolunteerRouteCard Component
 * Reusable integration card for Volunteer module to view explainable route detour matches.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { RescueAIBadge } from './RescueAIBadge';
import { RescueAIReasonList } from './RescueAIReasonList';
import { RescueAIInsightSheet } from './RescueAIInsightSheet';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { VolunteerRouteMatchResult } from '../../types/rescue-ai';

export interface RescueAIVolunteerRouteCardProps {
  matchResult: VolunteerRouteMatchResult;
  onAcceptRescue?: () => void;
  isAssigned?: boolean;
}

export const RescueAIVolunteerRouteCard: React.FC<RescueAIVolunteerRouteCardProps> = ({
  matchResult,
  onAcceptRescue,
  isAssigned = false,
}) => {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <GlassCard variant="standard" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <Ionicons name="sparkles" size={16} color={colors.brand.primary} />
            <Text style={[typography.caption, styles.aiLabel]}>Recommended for Your Route</Text>
          </View>
          <RescueAIBadge label={matchResult.label} level={matchResult.label} size="small" />
        </View>

        {matchResult.pickupDistanceKm !== undefined && (
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Ionicons name="navigate-outline" size={14} color={colors.brand.primary} />
              <Text style={[typography.bodySmall, styles.statText]}>
                Pickup: ~{matchResult.pickupDistanceKm.toFixed(1)} km from route
              </Text>
            </View>

            {matchResult.detourKm !== undefined && (
              <View style={styles.statBox}>
                <Ionicons name="map-outline" size={14} color={colors.text.muted} />
                <Text style={[typography.bodySmall, styles.statText]}>
                  Detour: ~+{matchResult.detourKm.toFixed(1)} km
                </Text>
              </View>
            )}
          </View>
        )}

        <RescueAIReasonList
          reasons={matchResult.reasons}
          warnings={matchResult.warnings}
          attention={matchResult.attention}
          maxItems={3}
        />

        <View style={styles.actionRow}>
          <GlassButton
            title="Why this route?"
            variant="tertiary"
            size="small"
            icon="information-circle-outline"
            onPress={() => setShowSheet(true)}
          />

          {onAcceptRescue && !isAssigned && matchResult.isEligible && (
            <GlassButton
              title="Accept Rescue"
              variant="primary"
              size="small"
              onPress={onAcceptRescue}
            />
          )}
        </View>
      </GlassCard>

      <RescueAIInsightSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        title="Volunteer Route Match Analysis"
        badgeLabel={matchResult.label}
        badgeLevel={matchResult.label}
        insight={matchResult}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    padding: spacing.md,
    backgroundColor: 'rgba(240, 249, 246, 0.7)',
    borderColor: 'rgba(46, 125, 50, 0.18)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiLabel: {
    fontWeight: '700',
    color: colors.brand.primary,
    letterSpacing: 0.3,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: 4,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: colors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surface.divider,
  },
});
