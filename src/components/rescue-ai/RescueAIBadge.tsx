/**
 * RescueAIBadge Component
 * Subtle, light/glassmorphic visual badge for priority, match quality, and risk levels.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';

export interface RescueAIBadgeProps {
  label: string;
  variant?: 'priority' | 'match' | 'risk' | 'neutral';
  level?: 'HIGH' | 'CRITICAL' | 'MODERATE' | 'LOW' | 'BEST FIT' | 'SUITABLE' | 'EXCELLENT MATCH' | 'GOOD MATCH' | 'AT RISK' | 'URGENT' | string;
  size?: 'small' | 'medium';
}

export const RescueAIBadge: React.FC<RescueAIBadgeProps> = ({
  label,
  variant = 'priority',
  level,
  size = 'small',
}) => {
  const isHigh =
    level === 'HIGH' ||
    level === 'CRITICAL' ||
    level === 'BEST FIT' ||
    level === 'EXCELLENT MATCH' ||
    level === 'URGENT';
  const isWarning =
    level === 'AT RISK' ||
    level === 'WATCH' ||
    level === 'SUITABLE' ||
    level === 'DESTINATION PENDING';

  const badgeBg = isHigh
    ? 'rgba(46, 125, 50, 0.12)'
    : isWarning
    ? 'rgba(217, 119, 6, 0.12)'
    : 'rgba(23, 61, 57, 0.08)';

  const textColor = isHigh
    ? colors.brand.primary
    : isWarning
    ? colors.status.warning
    : colors.brand.dark;

  const iconName: any = isWarning
    ? 'warning-outline'
    : 'sparkles';

  return (
    <View style={[styles.container, { backgroundColor: badgeBg }, size === 'small' ? styles.smallPad : styles.medPad]}>
      <Ionicons name={iconName} size={size === 'small' ? 12 : 14} color={textColor} />
      <Text style={[typography.caption, styles.text, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    gap: 4,
    alignSelf: 'flex-start',
  },
  smallPad: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  medPad: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
