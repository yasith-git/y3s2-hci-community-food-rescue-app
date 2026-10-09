/**
 * GlassIconButton Component
 * Accessible circular/rounded glass button for actions, headers, and quick toggles
 */

import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from './GlassSurface';
import { AnimatedPressable } from './AnimatedPressable';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { GlassVariant } from '../../design-system/glass';

export interface GlassIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'standard' | 'primary' | 'subtle' | 'danger';
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  accessibilityHint?: string;
  testID?: string;
}

export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  icon,
  onPress,
  size = 'medium',
  variant = 'standard',
  color,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const getGlassVariant = (): GlassVariant => {
    switch (variant) {
      case 'primary':
        return 'buttonPrimary';
      case 'danger':
        return 'buttonDanger';
      case 'subtle':
        return 'subtle';
      case 'standard':
      default:
        return 'buttonSecondary';
    }
  };

  const getIconColor = (): string => {
    if (color) return color;
    if (disabled) return colors.text.disabled;
    if (variant === 'primary' || variant === 'danger') return colors.text.inverse;
    return colors.brand.dark;
  };

  const dimensions = {
    small: { container: 38, icon: 18, radius: radius.md },
    medium: { container: 48, icon: 22, radius: radius.lg },
    large: { container: 56, icon: 26, radius: radius.xl },
  }[size];

  return (
    <AnimatedPressable
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      hapticType="light"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        { width: dimensions.container, height: dimensions.container },
        disabled && styles.disabled,
        style,
      ]}
    >
      <GlassSurface
        variant={getGlassVariant()}
        style={[
          styles.surface,
          {
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: dimensions.radius,
          },
        ]}
      >
        <View style={styles.center}>
          <Ionicons
            name={icon}
            size={dimensions.icon}
            color={getIconColor()}
          />
        </View>
      </GlassSurface>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
