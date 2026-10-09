/**
 * RescueAIOrganizationMatchCard Component
 * Reusable integration card for Coordinator module to view explainable organization match suggestions.
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
import { OrganizationMatchResult } from '../../types/rescue-ai';

export interface RescueAIOrganizationMatchCardProps {
  matchResult: OrganizationMatchResult;
  onReserveManual?: () => void;
  isReserved?: boolean;
}

export const RescueAIOrganizationMatchCard: React.FC<RescueAIOrganizationMatchCardProps> = ({
  matchResult,
  onReserveManual,
  isReserved = false,
}) => {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      <GlassCard variant="standard" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <Ionicons name="sparkles" size={16} color={colors.brand.primary} />
            <Text style={[typography.caption, styles.aiLabel]}>RescueAI</Text>
          </View>
          <RescueAIBadge label={matchResult.label} level={matchResult.label} size="small" />
        </View>

        <RescueAIReasonList
          reasons={matchResult.reasons}
          warnings={matchResult.warnings}
          attention={matchResult.attention}
          maxItems={3}
        />

        <View style={styles.actionRow}>
          <GlassButton
            title="Why this match?"
            variant="tertiary"
            size="small"
            icon="information-circle-outline"
            onPress={() => setShowSheet(true)}
          />

          {onReserveManual && !isReserved && matchResult.isEligible && (
            <GlassButton
              title="Reserve Donation"
              variant="primary"
              size="small"
              onPress={onReserveManual}
            />
          )}
        </View>
      </GlassCard>

      <RescueAIInsightSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        title="Organization Fit Analysis"
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
