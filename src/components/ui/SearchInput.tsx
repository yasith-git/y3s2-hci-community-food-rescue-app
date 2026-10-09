/**
 * SearchInput Component
 * Dedicated glass search input with quick clear and icon
 */

import React from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TextInputProps,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from './GlassSurface';
import { AnimatedPressable } from './AnimatedPressable';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';

export interface SearchInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  placeholder?: string;
  testID?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  onClear,
  containerStyle,
  placeholder = 'Search food, donors, or areas...',
  testID,
  ...rest
}) => {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <GlassSurface variant="subtle" style={styles.surface}>
        <View style={styles.inner}>
          <Ionicons
            name="search"
            size={18}
            color={colors.text.muted}
            style={styles.searchIcon}
          />
          <TextInput
            testID={testID}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.text.disabled}
            style={[typography.bodyMedium, styles.input]}
            accessibilityRole="search"
            accessibilityLabel={placeholder}
            returnKeyType="search"
            clearButtonMode="never"
            {...rest}
          />
          {value.length > 0 && (
            <AnimatedPressable
              onPress={handleClear}
              hapticType="light"
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.text.muted}
              />
            </AnimatedPressable>
          )}
        </View>
      </GlassSurface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: spacing.xs,
  },
  surface: {
    borderRadius: radius.pill,
    minHeight: 44,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  clearButton: {
    marginLeft: spacing.xs,
    padding: 4,
  },
});
