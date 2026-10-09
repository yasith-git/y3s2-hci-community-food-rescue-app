/**
 * GlassBadge Component
 * Compact count indicator, pill label, or numeric tag
 */

import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';

export type GlassBadgeVariant = 'brand' | 'neutral' | 'accent' | 'success' | 'warning' | 'error';

export interface GlassBadgeProps {
  label: string | number;
  variant?: GlassBadgeVariant;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  label,
  variant = 'brand',
  size = 'small',
  style,
  textStyle,
  testID,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'brand':
        return { bg: colors.brand[100], text: colors.brand[900], border: 'rgba(11, 61, 53, 0.12)' };
      case 'accent':
        return { bg: colors.accent.softPeach, text: colors.brand[900], border: 'rgba(244, 162, 97, 0.25)' };
      case 'success':
        return { bg: colors.status.successBg, text: colors.status.success, border: colors.status.successBorder };
      case 'warning':
        return { bg: colors.status.warningBg, text: colors.status.warning, border: colors.status.warningBorder };
      case 'error':
        return { bg: colors.status.errorBg, text: colors.status.error, border: colors.status.errorBorder };
      case 'neutral':
      default:
        return { bg: colors.surface.subtle, text: colors.text.secondary, border: colors.surface.border };
    }
  };

  const currentColors = getColors();
  const isSmall = size === 'small';

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          backgroundColor: currentColors.bg,
          borderColor: currentColors.border,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 12,
        },
        style,
      ]}
    >
      <Text
        style={[
          isSmall ? typography.labelSmall : typography.labelMedium,
          styles.text,
          { color: currentColors.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
