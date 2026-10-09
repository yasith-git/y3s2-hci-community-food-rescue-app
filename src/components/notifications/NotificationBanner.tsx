/**
 * NotificationBanner Component
 * Foreground in-app floating banner for instant operational alerts.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from '../ui/GlassSurface';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { AppNotification } from '../../types/notification';
import { haptic } from '../../design-system/haptics';

interface NotificationBannerProps {
  notification: AppNotification | null;
  onPress: (notification: AppNotification) => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function NotificationBanner({
  notification,
  onPress,
  onDismiss,
  autoDismissMs = 5000,
}: NotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const topOffset = Math.max(insets.top, spacing.xs) + spacing.sm;
  const slideAnim = React.useRef(new Animated.Value(-160)).current;

  useEffect(() => {
    if (notification) {
      haptic.light();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-160);
    }
  }, [notification]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -160,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <GlassSurface variant="elevated" style={styles.banner}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            haptic.selection();
            onPress(notification);
          }}
          style={styles.contentRow}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="notifications" size={18} color="#FFFFFF" />
          </View>

          <View style={styles.infoCol}>
            <Text style={[typography.labelMedium, styles.title]} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={[typography.caption, styles.body]} numberOfLines={1}>
              {notification.body}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        </TouchableOpacity>
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  banner: {
    borderRadius: radius.xl,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  title: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  body: {
    color: colors.text.secondary,
  },
  closeBtn: {
    padding: 4,
  },
});
