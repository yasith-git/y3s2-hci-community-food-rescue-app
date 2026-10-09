/**
 * SectionHeader Component
 * Standardized section title with optional subtitle and action button
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
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  style,
  titleStyle,
  testID,
}) => {
  return (
    <View testID={testID} style={[styles.container, style]}>
      <View style={styles.textColumn}>
        <Text style={[typography.headingSmall, styles.title, titleStyle]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[typography.bodySmall, styles.subtitle]}>
            {subtitle}
          </Text>
        )}
      </View>
      {action && <View style={styles.actionColumn}>{action}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
    width: '100%',
  },
  textColumn: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.muted,
    marginTop: 2,
  },
  actionColumn: {
    marginLeft: spacing.sm,
  },
});
