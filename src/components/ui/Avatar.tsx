/**
 * Avatar Component
 * Circular avatar supporting images, initials, role badges, and status dots
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';

export interface AvatarProps {
  source?: ImageSourcePropType | string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  statusIndicator?: 'online' | 'busy' | 'offline';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  statusIndicator,
  style,
  testID,
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { size: 32, fontSize: 12, dotSize: 8 };
      case 'large':
        return { size: 56, fontSize: 20, dotSize: 14 };
      case 'xlarge':
        return { size: 72, fontSize: 24, dotSize: 16 };
      case 'medium':
      default:
        return { size: 44, fontSize: 16, dotSize: 11 };
    }
  };

  const getInitials = (text?: string): string => {
    if (!text) return 'U';
    const parts = text.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const { size: dimSize, fontSize, dotSize } = getDimensions();

  const getStatusColor = () => {
    switch (statusIndicator) {
      case 'online':
        return colors.status.success;
      case 'busy':
        return colors.status.warning;
      case 'offline':
      default:
        return colors.text.disabled;
    }
  };

  const imageUri = typeof source === 'string' ? { uri: source } : source;

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { width: dimSize, height: dimSize, borderRadius: radius.round },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar for ${name}` : 'User avatar'}
    >
      {imageUri ? (
        <Image
          source={imageUri}
          style={{ width: dimSize, height: dimSize, borderRadius: radius.round }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: dimSize, height: dimSize, borderRadius: radius.round },
          ]}
        >
          <Text style={[typography.titleSmall, { fontSize, color: colors.brand.dark, fontWeight: '700' }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {statusIndicator && (
        <View
          style={[
            styles.statusDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: getStatusColor(),
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.brand[100],
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand[100],
    borderWidth: 1,
    borderColor: 'rgba(35, 132, 113, 0.2)',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.surface.primary,
  },
});
