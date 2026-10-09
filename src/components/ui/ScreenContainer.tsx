/**
 * ScreenContainer Component
 * Unified standard screen wrapper with safe areas, keyboard handling, and background
 */

import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppBackground } from './AppBackground';
import { spacing } from '../../design-system/spacing';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  statusBarStyle?: 'auto' | 'inverted' | 'light' | 'dark';
  withPadding?: boolean;
  backgroundVariant?: 'default' | 'warm' | 'clean';
  keyboardVerticalOffset?: number;
  testID?: string;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  statusBarStyle = 'dark',
  withPadding = true,
  backgroundVariant = 'default',
  keyboardVerticalOffset = 0,
  testID,
}) => {
  const insets = useSafeAreaInsets();

  const containerPadding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: withPadding ? spacing.screenHorizontal : 0,
    paddingRight: withPadding ? spacing.screenHorizontal : 0,
  };

  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : undefined;

  return (
    <AppBackground variant={backgroundVariant}>
      <StatusBar style={statusBarStyle} />
      <KeyboardAvoidingView
        behavior={keyboardBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.keyboardAvoid}
      >
        {scrollable ? (
          <ScrollView
            testID={testID}
            style={[styles.scroll, style]}
            contentContainerStyle={[
              styles.scrollContent,
              containerPadding,
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View
            testID={testID}
            style={[styles.fixedContainer, containerPadding, style]}
          >
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  fixedContainer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
