/**
 * In-App Notification Centre Screen
 * Unified notification hub with real-time updates, read/unread status, and deep linking.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  EmptyState,
} from '../../src/components/ui';
import { NotificationCard } from '../../src/components/notifications/NotificationCard';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { AppNotification } from '../../src/types/notification';
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../src/services/notifications/notification.service';

export default function NotificationCenterScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let unsub: () => void = () => {};

    if (user?.uid) {
      unsub = subscribeToUserNotifications(user.uid, (list, unread) => {
        setNotifications(list);
        setUnreadCount(unread);
      });
    }

    return () => unsub();
  }, [user?.uid]);

  const handleNotificationPress = async (item: AppNotification) => {
    if (user?.uid && !item.readAt) {
      await markNotificationAsRead(user.uid, item.id);
    }

    // Deep Link Navigation
    if (item.deepLinkRoute) {
      router.push(item.deepLinkRoute as any);
    } else if (item.resourceType === 'donation' && item.resourceId) {
      router.push({
        pathname: '/(volunteer)/opportunity/[id]',
        params: { id: item.resourceId },
      });
    } else if (item.resourceType === 'assignment' && item.resourceId) {
      router.push({
        pathname: '/(volunteer)/active-rescue',
        params: { id: item.resourceId },
      });
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.uid || notifications.length === 0) return;
    haptic.selection();
    await markAllNotificationsAsRead(user.uid, notifications);
    haptic.success();
  };

  return (
    <ScreenContainer scrollable={false} testID="notification-center-screen">
      <GlassHeader
        title="Notification Centre"
        subtitle={unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
        onBack={() => router.back()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[typography.labelSmall, styles.markAllReadText]}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(false)}
            tintColor={colors.brand.primary}
          />
        }
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="No Notifications"
            description="You will be alerted when new food rescues match your route or when active mission statuses update."
          />
        ) : (
          notifications.map((item) => (
            <NotificationCard
              key={item.id}
              notification={item}
              onPress={handleNotificationPress}
            />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing['4xl'],
  },
  markAllReadText: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
});
