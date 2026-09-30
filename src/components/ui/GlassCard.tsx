/**
 * GlassCard Component
 * Versatile glass card with standard, elevated, interactive, and compact variants
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from './GlassSurface';
import { AnimatedPressable } from './AnimatedPressable';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { GlassVariant } from '../../design-system/glass';

export type CardVariant = 'standard' | 'interactive' | 'elevated' | 'compact';

export interface GlassCardProps {
  children?: React.ReactNode;
  variant?: CardVariant;
  title?: string;
  subtitle?: string;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  trailingAction?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'standard',
  title,
  subtitle,
  leadingIcon,
  trailingAction,
  onPress,
  style,
  contentStyle,
  titleStyle,
  subtitleStyle,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const getGlassVariant = (): GlassVariant => {
    switch (variant) {
      case 'elevated':
        return 'elevated';
      case 'compact':
        return 'subtle';
      case 'interactive':
      case 'standard':
      default:
        return 'standard';
    }
  };

  const cardPadding =
    variant === 'compact' ? spacing.cardPaddingCompact : spacing.cardPadding;

  const cardContent = (
    <View style={[styles.inner, { padding: cardPadding }, contentStyle]}>
      {(title || subtitle || leadingIcon || trailingAction) && (
        <View style={styles.headerRow}>
          {leadingIcon && (
            <View style={styles.leadingIconBox}>
              <Ionicons
                name={leadingIcon}
                size={20}
                color={colors.brand.primary}
              />
            </View>
          )}

          <View style={styles.titleColumn}>
            {title && (
              <Text style={[typography.titleMedium, styles.title, titleStyle]}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[
                  typography.bodySmall,
                  styles.subtitle,
                  subtitleStyle,
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {trailingAction && (
            <View style={styles.trailingActionBox}>{trailingAction}</View>
          )}
        </View>
      )}

      {children}
    </View>
  );

  if (variant === 'interactive' && onPress) {
    return (
      <AnimatedPressable
        testID={testID}
        onPress={onPress}
        hapticType="light"
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        style={[styles.container, style]}
      >
        <GlassSurface variant={getGlassVariant()} style={styles.surface}>
          {cardContent}
        </GlassSurface>
      </AnimatedPressable>
    );
  }

  return (
    <View testID={testID} style={[styles.container, style]}>
      <GlassSurface variant={getGlassVariant()} style={styles.surface}>
        {cardContent}
      </GlassSurface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    marginVertical: spacing.xs,
  },
  surface: {
    borderRadius: radius.xl,
  },
  inner: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leadingIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.muted,
    marginTop: 2,
  },
  trailingActionBox: {
    marginLeft: spacing.sm,
  },
});
