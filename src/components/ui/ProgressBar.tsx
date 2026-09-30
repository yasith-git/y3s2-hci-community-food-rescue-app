/**
 * ProgressBar Component
 * Smooth brand-colored progress indicator with percentage support
 */

import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';

export interface ProgressBarProps {
  progress: number; // 0.0 to 1.0
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = colors.brand.primary,
  trackColor = 'rgba(23, 61, 57, 0.08)',
  height = 6,
  style,
  testID,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View
      testID={testID}
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius: radius.pill,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            borderRadius: radius.pill,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
