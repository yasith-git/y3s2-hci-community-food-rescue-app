/**
 * EmptyState Component
 * Welcoming glass card for zero-data views, search misses, and clean inboxes
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  primaryActionTitle?: string;
  onPrimaryAction?: () => void;
  secondaryActionTitle?: string;
  onSecondaryAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'leaf-outline',
  title,
  description,
  primaryActionTitle,
  onPrimaryAction,
  secondaryActionTitle,
  onSecondaryAction,
  style,
  testID,
}) => {
  return (
    <View testID={testID} style={[styles.container, style]}>
      <GlassCard variant="standard" style={styles.card}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={36} color={colors.brand.primary} />
          </View>

          <Text style={[typography.headingMedium, styles.title]}>{title}</Text>
          <Text style={[typography.bodyMedium, styles.description]}>
            {description}
          </Text>

          {primaryActionTitle && onPrimaryAction && (
            <GlassButton
              title={primaryActionTitle}
              onPress={onPrimaryAction}
              variant="primary"
              size="medium"
              style={styles.primaryButton}
            />
          )}

          {secondaryActionTitle && onSecondaryAction && (
            <GlassButton
              title={secondaryActionTitle}
              onPress={onSecondaryAction}
              variant="tertiary"
              size="small"
              style={styles.secondaryButton}
            />
          )}
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: spacing.md,
  },
  card: {
    width: '100%',
  },
  content: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.round,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.lg,
    maxWidth: 280,
  },
  primaryButton: {
    minWidth: 180,
  },
  secondaryButton: {
    marginTop: spacing.xs,
  },
});
