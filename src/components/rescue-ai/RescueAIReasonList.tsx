/**
 * RescueAIReasonList Component
 * Renders concise, explainable bullet points with positive checks, warnings, and attention items.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

export interface RescueAIReasonListProps {
  reasons: string[];
  warnings?: string[];
  attention?: string[];
  maxItems?: number;
}

export const RescueAIReasonList: React.FC<RescueAIReasonListProps> = ({
  reasons,
  warnings = [],
  attention = [],
  maxItems = 4,
}) => {
  const visibleReasons = reasons.slice(0, maxItems);
  const visibleWarnings = warnings.slice(0, 2);
  const visibleAttention = attention.slice(0, 2);

  return (
    <View style={styles.container}>
      {visibleReasons.map((reason, idx) => (
        <View key={`r-${idx}`} style={styles.itemRow}>
          <Ionicons name="checkmark-circle" size={14} color={colors.status.success} style={styles.icon} />
          <Text style={[typography.bodySmall, styles.reasonText]}>{reason}</Text>
        </View>
      ))}

      {visibleWarnings.map((warning, idx) => (
        <View key={`w-${idx}`} style={styles.itemRow}>
          <Ionicons name="alert-circle" size={14} color={colors.status.warning} style={styles.icon} />
          <Text style={[typography.bodySmall, styles.warningText]}>{warning}</Text>
        </View>
      ))}

      {visibleAttention.map((att, idx) => (
        <View key={`a-${idx}`} style={styles.itemRow}>
          <Ionicons name="information-circle" size={14} color={colors.brand.primary} style={styles.icon} />
          <Text style={[typography.bodySmall, styles.attentionText]}>{att}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginVertical: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  icon: {
    marginTop: 2,
  },
  reasonText: {
    color: colors.text.primary,
    flex: 1,
    lineHeight: 18,
  },
  warningText: {
    color: colors.status.warning,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  attentionText: {
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
});
