/**
 * ErrorState Component
 * Reusable error state with recovery action and accessible messaging
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

export interface ErrorStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  description: string;
  retryTitle?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  icon = 'alert-circle-outline',
  title = 'Something went wrong',
  description,
  retryTitle = 'Try Again',
  onRetry,
  style,
  testID,
}) => {
  return (
    <View testID={testID} style={[styles.container, style]}>
      <GlassCard variant="standard" style={styles.card}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={36} color={colors.status.error} />
          </View>

          <Text style={[typography.headingMedium, styles.title]}>{title}</Text>
          <Text style={[typography.bodyMedium, styles.description]}>
            {description}
          </Text>

          {onRetry && (
            <GlassButton
              title={retryTitle}
              onPress={onRetry}
              variant="secondary"
              size="medium"
              icon="refresh"
              style={styles.retryButton}
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
    width: 72,
    height: 72,
    borderRadius: radius.round,
    backgroundColor: colors.status.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.status.error,
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
  retryButton: {
    minWidth: 160,
  },
});
