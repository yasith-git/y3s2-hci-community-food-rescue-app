/**
 * GlassButton Component
 * Core interactive button with glassmorphic aesthetics, tactile haptics, and micro-interactions
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from './GlassSurface';
import { AnimatedPressable } from './AnimatedPressable';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';
import { GlassVariant } from '../../design-system/glass';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const getGlassVariant = (): GlassVariant => {
    switch (variant) {
      case 'primary':
      case 'success':
        return 'buttonPrimary';
      case 'secondary':
        return 'buttonSecondary';
      case 'danger':
        return 'buttonDanger';
      case 'tertiary':
        return 'buttonTertiary';
      default:
        return 'buttonPrimary';
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.text.disabled;
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return colors.text.inverse;
      case 'secondary':
        return colors.brand.dark;
      case 'tertiary':
        return colors.brand.primary;
      default:
        return colors.text.inverse;
    }
  };

  const getHapticType = () => {
    if (variant === 'danger') return 'heavy';
    if (variant === 'primary' || variant === 'success') return 'medium';
    return 'light';
  };

  const sizeStyles = {
    small: styles.sizeSmall,
    medium: styles.sizeMedium,
    large: styles.sizeLarge,
  }[size];

  const fontStyle = {
    small: typography.labelMedium,
    medium: typography.labelLarge,
    large: typography.titleMedium,
  }[size];

  const iconSize = size === 'small' ? 16 : size === 'medium' ? 18 : 22;
  const textColor = getTextColor();

  return (
    <AnimatedPressable
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      hapticType={getHapticType()}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.baseButton,
        fullWidth && styles.fullWidth,
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      <GlassSurface
        variant={getGlassVariant()}
        style={[styles.glassWrapper, sizeStyles]}
        showHighlight={variant === 'primary' || variant === 'danger' || variant === 'success'}
      >
        <View style={styles.innerContent}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={textColor}
              style={styles.spinner}
            />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <Ionicons
                  name={icon}
                  size={iconSize}
                  color={textColor}
                  style={styles.iconLeft}
                />
              )}
              <Text
                style={[
                  fontStyle,
                  { color: textColor },
                  styles.buttonText,
                  textStyle,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {icon && iconPosition === 'right' && (
                <Ionicons
                  name={icon}
                  size={iconSize}
                  color={textColor}
                  style={styles.iconRight}
                />
              )}
            </>
          )}
        </View>
      </GlassSurface>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    minHeight: 48,
    borderRadius: radius.lg,
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  glassWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSmall: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 42,
  },
  sizeMedium: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 50,
  },
  sizeLarge: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    minHeight: 58,
  },
  buttonText: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  spinner: {
    paddingVertical: 2,
  },
  disabledContainer: {
    opacity: 0.55,
  },
});
