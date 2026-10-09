/**
 * AnimatedPressable Component
 * Accessible, spring-animated pressable supporting reduced motion and haptics
 */

import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../../design-system/motion';
import { haptic } from '../../design-system/haptics';

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  enableHaptic?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
  reduceMotion?: boolean;
  children: React.ReactNode;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  scaleTo = motion.scale.pressed,
  enableHaptic = true,
  hapticType = 'light',
  reduceMotion = false,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  accessibilityRole = 'button',
  accessibilityState,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = (e: any) => {
    if (disabled) return;

    if (enableHaptic) {
      if (hapticType === 'light') haptic.light();
      else if (hapticType === 'medium') haptic.medium();
      else if (hapticType === 'heavy') haptic.heavy();
      else if (hapticType === 'selection') haptic.selection();
    }

    if (!reduceMotion) {
      scale.value = withSpring(scaleTo, motion.spring.press);
      opacity.value = withTiming(0.92, { duration: motion.duration.fast });
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (disabled) return;
    if (!reduceMotion) {
      scale.value = withSpring(1, motion.spring.gentle);
      opacity.value = withTiming(1, { duration: motion.duration.fast });
    }
    onPressOut?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {};
    }
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessible={true}
      style={style}
      {...rest}
    >
      <Animated.View style={[{ width: '100%', alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
