/**
 * Skeleton Component
 * High-performance, subtle shimmer-like loading placeholder
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = radius.md,
  style,
  testID,
}) => {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, { duration: 900 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
      accessibilityRole="none"
      accessibilityLabel="Loading content"
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(23, 61, 57, 0.10)',
  },
});
