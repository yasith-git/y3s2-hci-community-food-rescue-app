/**
 * GlassHeader Component
 * Unified top bar with blur material, title, subtitle, back button, and actions
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from './GlassSurface';
import { GlassIconButton } from './GlassIconButton';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

export interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backIcon?: keyof typeof Ionicons.glyphMap;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backIcon = 'chevron-back',
  rightAction,
  style,
  titleStyle,
  testID,
}) => {
  return (
    <View testID={testID} style={[styles.wrapper, style]}>
      <GlassSurface variant="subtle" style={styles.surface}>
        <View style={styles.container}>
          {onBack ? (
            <GlassIconButton
              icon={backIcon}
              size="small"
              variant="subtle"
              onPress={onBack}
              accessibilityLabel="Go back"
              style={styles.backButton}
            />
          ) : (
            <View style={styles.placeholderButton} />
          )}

          <View style={styles.titleContainer}>
            <Text
              style={[typography.titleLarge, styles.title, titleStyle]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text style={[typography.caption, styles.subtitle]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          {rightAction ? (
            <View style={styles.rightActionContainer}>{rightAction}</View>
          ) : (
            <View style={styles.placeholderButton} />
          )}
        </View>
      </GlassSurface>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  surface: {
    borderRadius: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 52,
  },
  backButton: {
    marginRight: spacing.xs,
  },
  placeholderButton: {
    width: 38,
    height: 38,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  title: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 1,
  },
  rightActionContainer: {
    minWidth: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
