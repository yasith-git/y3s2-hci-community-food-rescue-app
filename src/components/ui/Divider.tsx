/**
 * Divider Component
 * Subtle separation line conforming to design tokens
 */

import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { spacing } from '../../design-system/spacing';

export interface DividerProps {
  style?: StyleProp<ViewStyle>;
  vertical?: boolean;
  spacingSize?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
}

export const Divider: React.FC<DividerProps> = ({
  style,
  vertical = false,
  spacingSize = 'sm',
}) => {
  const getMargin = () => {
    switch (spacingSize) {
      case 'none':
        return 0;
      case 'xs':
        return spacing.xs;
      case 'md':
        return spacing.md;
      case 'lg':
        return spacing.lg;
      case 'sm':
      default:
        return spacing.sm;
    }
  };

  const margin = getMargin();

  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        vertical
          ? { marginHorizontal: margin }
          : { marginVertical: margin },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    backgroundColor: colors.surface.divider,
    width: '100%',
  },
  vertical: {
    width: 1,
    backgroundColor: colors.surface.divider,
    height: '100%',
  },
});
