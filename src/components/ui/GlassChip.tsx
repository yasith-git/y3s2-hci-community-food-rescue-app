/**
 * GlassChip Component
 * Filter chips, selection tags, and mini toggles with glass aesthetics
 */

import React from 'react';
import {
  StyleSheet,
  Text,
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

export interface GlassChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export const GlassChip: React.FC<GlassChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const content = (
    <GlassSurface
      variant={selected ? 'buttonPrimary' : 'subtle'}
      style={[
        styles.surface,
        selected && styles.selectedSurface,
        disabled && styles.disabledSurface,
      ]}
      showHighlight={selected}
    >
      <View style={styles.inner}>
        {icon && (
          <Ionicons
            name={icon}
            size={14}
            color={selected ? colors.text.inverse : colors.text.secondary}
            style={styles.icon}
          />
        )}
        <Text
          style={[
            typography.labelMedium,
            {
              color: selected ? colors.text.inverse : colors.text.secondary,
              fontWeight: selected ? '600' : '500',
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      </View>
    </GlassSurface>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        testID={testID}
        disabled={disabled}
        onPress={onPress}
        hapticType="light"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected, disabled }}
        accessibilityLabel={accessibilityLabel || label}
        style={[styles.container, style]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View testID={testID} style={[styles.container, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
    marginBottom: 8,
  },
  surface: {
    borderRadius: radius.pill,
  },
  selectedSurface: {
    borderColor: colors.brand.primary,
  },
  disabledSurface: {
    opacity: 0.5,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 6,
  },
});
