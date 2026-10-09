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
        return { size: 34, fontSize: 13, dotSize: 9 };
      case 'large':
        return { size: 60, fontSize: 22, dotSize: 15 };
      case 'xlarge':
        return { size: 84, fontSize: 30, dotSize: 18 };
      case 'medium':
      default:
        return { size: 48, fontSize: 18, dotSize: 12 };
    }
  };

  const getInitials = (text?: string): string => {
    if (!text) return 'U';
    const parts = text.trim().split(' ').filter(Boolean);
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

  const [imageError, setImageError] = React.useState(false);

  // Derive whether the provided source is a valid renderable image
  const imageSource = React.useMemo(() => {
    if (!source) return null;
    if (typeof source === 'string') {
      const trimmed = source.trim();
      if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('file:')) {
        return null;
      }
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return { uri: trimmed };
      }
      return null;
    }
    if (typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
      const trimmedUri = source.uri.trim();
      if (!trimmedUri || trimmedUri.startsWith('data:') || trimmedUri.startsWith('file:')) {
        return null;
      }
    }
    return source;
  }, [source]);

  // Reset error state if the image source changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageSource]);

  const shouldRenderImage = Boolean(imageSource && !imageError);

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
      {shouldRenderImage && imageSource ? (
        <Image
          source={imageSource}
          onError={() => setImageError(true)}
          style={{ width: dimSize, height: dimSize, borderRadius: radius.round }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: dimSize, height: dimSize, borderRadius: radius.round },
          ]}
        >
          <Text style={[typography.titleMedium, { fontSize, color: '#0F5145', fontWeight: '800', letterSpacing: 0.5 }]}>
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
    backgroundColor: '#D1EAE2',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1EAE2',
    borderWidth: 1.5,
    borderColor: 'rgba(35, 132, 113, 0.35)',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
});
