/**
 * AppBackground Component
 * Shared ambient brand-tinted atmospheric background
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../design-system/colors';

const { width } = Dimensions.get('window');

export interface AppBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'warm' | 'clean';
}

export const AppBackground: React.FC<AppBackgroundProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (variant) {
      case 'warm':
        return [colors.background.warm, '#F4EFEA', colors.background.app];
      case 'clean':
        return [colors.background.pure, colors.background.app, colors.background.app];
      case 'default':
      default:
        return [colors.background.app, '#F0F5F2', '#EFF3F0', colors.background.warm];
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Base ambient gradient */}
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Soft atmospheric mint glow blob (top-right) */}
      <View style={styles.topMintBlob} />

      {/* Soft warm peach glow blob (bottom-left) */}
      <View style={styles.bottomPeachBlob} />

      {/* Content wrapper */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.app,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  topMintBlob: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: 'rgba(221, 242, 235, 0.45)',
    transform: [{ scaleX: 1.2 }],
    opacity: 0.7,
  },
  bottomPeachBlob: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: (width * 0.65) / 2,
    backgroundColor: 'rgba(248, 217, 196, 0.25)',
    transform: [{ scaleY: 1.1 }],
    opacity: 0.6,
  },
});
