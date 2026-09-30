/**
 * GlassSurface Component
 * Central glass abstraction supporting iOS blur and polished Android/web fallback
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { glass, GlassVariant } from '../../design-system/glass';

export interface GlassSurfaceProps {
  variant?: GlassVariant;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  tint?: 'light' | 'dark' | 'default';
  showHighlight?: boolean;
  testID?: string;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  variant = 'standard',
  intensity,
  style,
  children,
  tint = 'light',
  showHighlight = true,
  testID,
}) => {
  const config = glass[variant] || glass.standard;
  const blurAmount = intensity !== undefined ? intensity : config.blurIntensity;
  const isIOS = Platform.OS === 'ios';

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          borderRadius: config.borderRadius,
          borderColor: config.borderColor,
          borderWidth: config.borderWidth,
          shadowColor: config.shadowColor,
          shadowOffset: config.shadowOffset,
          shadowOpacity: config.shadowOpacity,
          shadowRadius: config.shadowRadius,
          elevation: config.elevation,
        },
        style,
      ]}
    >
      {/* Background layer */}
      {isIOS ? (
        <BlurView
          intensity={blurAmount}
          tint={tint}
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: config.borderRadius,
              backgroundColor: config.backgroundColor,
            },
          ]}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: config.borderRadius,
              backgroundColor: config.androidFallbackBg,
            },
          ]}
        />
      )}

      {/* Subtle top-light gradient highlight for authentic liquid-glass feel */}
      {showHighlight && (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.35 }}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: config.borderRadius,
            },
          ]}
        />
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
