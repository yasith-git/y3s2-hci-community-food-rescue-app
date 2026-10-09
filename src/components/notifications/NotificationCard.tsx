/**
 * NotificationCard Component
 * Renders an in-app notification item with icon, title, timestamp, and unread pill.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { AppNotification, NotificationType } from '../../types/notification';
import { getRelativeTimeString } from '../../utils/dateTime';
import { haptic } from '../../design-system/haptics';

interface NotificationCardProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}

export function NotificationCard({
  notification,
  onPress,
}: NotificationCardProps) {
  const isUnread = !notification.readAt;

  const getIconForType = (type: NotificationType): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case 'ROUTE_MATCH':
        return { name: 'git-branch', color: colors.brand.primary };
      case 'RESCUE_ACCEPTED':
      case 'PICKUP_CONFIRMED':
      case 'DELIVERY_CONFIRMED':
        return { name: 'checkmark-circle', color: colors.status.success };
      case 'PICKUP_REMINDER':
      case 'DELIVERY_REMINDER':
        return { name: 'alarm', color: colors.status.warning };
      case 'ISSUE_REPORTED':
      case 'RESCUE_CANCELLED':
        return { name: 'alert-circle', color: colors.status.error };
      default:
        return { name: 'notifications', color: colors.brand.primary };
    }
  };

  const iconInfo = getIconForType(notification.type);
  const timeStr = getRelativeTimeString(notification.createdAt, '');

  return (
    <GlassCard
      variant={isUnread ? 'elevated' : 'standard'}
      style={[styles.card, isUnread && styles.unreadCard]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          haptic.selection();
          onPress(notification);
        }}
        style={styles.touchArea}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconInfo.color}18` }]}>
          <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={[typography.labelLarge, styles.title]} numberOfLines={1}>
              {notification.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>

          <Text style={[typography.bodySmall, styles.body]} numberOfLines={2}>
            {notification.body}
          </Text>

          <Text style={[typography.caption, styles.time]}>
            {timeStr || 'Just now'}
          </Text>
        </View>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
  },
  touchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
    marginLeft: 6,
  },
  body: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  time: {
    color: colors.text.muted,
    marginTop: 4,
  },
});
