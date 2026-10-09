/**
 * SuccessState Component
 * Delightful confirmation card with celebration accent
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

export interface SuccessStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  primaryActionTitle?: string;
  onPrimaryAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  icon = 'checkmark-circle-outline',
  title = 'Action Completed!',
  description,
  primaryActionTitle = 'Continue',
  onPrimaryAction,
  style,
  testID,
}) => {
  return (
    <View testID={testID} style={[styles.container, style]}>
      <GlassCard variant="elevated" style={styles.card}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={40} color={colors.status.success} />
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
              style={styles.actionButton}
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: radius.round,
    backgroundColor: colors.status.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.status.success,
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
  actionButton: {
    minWidth: 180,
  },
});
