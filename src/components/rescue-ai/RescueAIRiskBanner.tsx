/**
 * RescueAIRiskBanner Component
 * Subtle, non-alarmist warning banner displayed when active rescue encounters delay or impending deadline.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { RescueAIInsightSheet } from './RescueAIInsightSheet';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { RescueRiskAssessment } from '../../types/rescue-ai';

export interface RescueAIRiskBannerProps {
  assessment: RescueRiskAssessment;
}

export const RescueAIRiskBanner: React.FC<RescueAIRiskBannerProps> = ({ assessment }) => {
  const [showSheet, setShowSheet] = useState(false);

  if (assessment.riskLevel === 'NORMAL') return null;

  const isUrgent = assessment.riskLevel === 'URGENT';
  const bannerBg = isUrgent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(217, 119, 6, 0.1)';
  const borderColor = isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'rgba(217, 119, 6, 0.3)';
  const textColor = isUrgent ? colors.status.error : colors.status.warning;

  return (
    <>
      <GlassCard
        variant="elevated"
        style={[styles.card, { backgroundColor: bannerBg, borderColor }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Ionicons
              name={isUrgent ? 'alert-circle' : 'warning-outline'}
              size={18}
              color={textColor}
            />
            <Text style={[typography.titleSmall, { color: textColor }]}>
              {isUrgent ? 'Rescue Urgently at Risk' : 'Rescue Timeline Attention'}
            </Text>
          </View>

          <GlassButton
            title="Details"
            variant="tertiary"
            size="small"
            onPress={() => setShowSheet(true)}
          />
        </View>

        <Text style={[typography.bodySmall, styles.summaryText]}>
          {assessment.summary}
        </Text>

        {assessment.recommendedAction && (
          <View style={styles.actionRow}>
            <Text style={[typography.caption, styles.actionLabel]}>Recommendation: </Text>
            <Text style={[typography.caption, styles.actionText]}>
              {assessment.recommendedAction}
            </Text>
          </View>
        )}
      </GlassCard>

      <RescueAIInsightSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        title="Rescue Risk Assessment"
        badgeLabel={assessment.riskLevel}
        badgeLevel={assessment.riskLevel}
        insight={assessment}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    color: colors.text.primary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  actionLabel: {
    color: colors.text.muted,
    fontWeight: '700',
  },
  actionText: {
    color: colors.text.secondary,
  },
});
