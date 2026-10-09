/**
 * Notification Service Layer
 * In-app notification center, unread counters, push token registration, local reminders, and preferences.
 * Community Food Rescue App (Supabase Backend)
 */

import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  AppNotification,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DevicePushRegistration,
  NotificationType,
  NotificationPriority,
} from '../../types/notification';

export type Unsubscribe = () => void;

// Check if running inside Expo Go client
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Platform.OS === 'android' && Constants.appOwnership === 'expo');

// Dynamically load expo-notifications only when NOT in Expo Go to avoid SDK 53+ module evaluation error
let Notifications: any = null;
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e) {
    // Graceful fallback
  }
}

function mapRowToNotification(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: (row.type as NotificationType) || 'SYSTEM',
    title: row.title,
    body: row.message || '',
    deepLinkRoute: row.action_url || undefined,
    priority: (row.priority as NotificationPriority) || 'NORMAL',
    readAt: row.is_read ? row.created_at : null,
    createdAt: row.created_at,
  };
}

/**
 * Registers device push token contextually and updates Supabase devices registration.
 * Gracefully handles Expo Go SDK 53+ where remote notifications were decoupled.
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  if (isExpoGo || !Notifications) {
    return null;
  }

  if (!Device.isDevice) {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (isSupabaseConfigured && supabase && userId) {
      const deviceId = Device.modelName || 'device-primary';
      await supabase.from('devices').upsert({
        user_id: userId,
        device_id: deviceId,
        push_token: token,
        platform: Platform.OS,
        enabled: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return token;
  } catch (error) {
    console.warn('[NotificationService] Push registration notice:', error);
    return null;
  }
}

/**
 * Subscribes to real-time in-app notifications for the current user.
 */
export function subscribeToUserNotifications(
  userId: string,
  onUpdate: (notifications: AppNotification[], unreadCount: number) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([], 0);
    return () => {};
  }

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[NotificationService] Fetch notifications error:', error);
        return;
      }

      const list = (data || []).map(mapRowToNotification);
      const unread = list.filter((n) => !n.readAt).length;
      onUpdate(list, unread);
    } catch (e) {
      console.warn('[NotificationService] Exception fetching notifications:', e);
    }
  };

  fetchNotifications();

  const channel = supabase
    .channel(`realtime:notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      () => fetchNotifications()
    )
  .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Marks a single in-app notification as read.
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllNotificationsAsRead(
  userId: string,
  notifications: AppNotification[]
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);
}

/**
 * Schedules a local device reminder before pickup time.
 */
export async function scheduleLocalPickupReminder(
  donationId: string,
  foodName: string,
  pickupStartIso: string
): Promise<string | null> {
  if (isExpoGo || !Notifications) {
    return null;
  }

  try {
    const pickupTime = new Date(pickupStartIso).getTime();
    const reminderTime = pickupTime - 30 * 60 * 1000;
    const now = Date.now();

    if (reminderTime <= now) {
      return null;
    }

    const secondsFromNow = Math.round((reminderTime - now) / 1000);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Food Rescue Pickup Reminder',
        body: `Your pickup for ${foodName} begins in 30 minutes.`,
        data: { donationId, type: 'PICKUP_REMINDER' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn('[NotificationService] Local reminder schedule error:', error);
    return null;
  }
}

/**
 * Creates an in-app operational notification document directly for a user.
 */
export async function createInAppNotification(
  userId: string,
  notification: Omit<AppNotification, 'id' | 'createdAt'>
): Promise<AppNotification> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Idempotency / Duplicate protection (within 15 seconds)
      const recentWindow = new Date(Date.now() - 15000).toISOString();
      const { data: existing } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('title', notification.title)
        .gte('created_at', recentWindow)
        .limit(1);

      if (existing && existing.length > 0) {
        return mapRowToNotification(existing[0]);
      }

      const { data } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notification.title,
          message: notification.body,
          type: notification.type,
          priority: notification.priority,
          action_url: notification.deepLinkRoute || null,
          is_read: false,
        })
        .select()
        .single();

      if (data) {
        return mapRowToNotification(data);
      }
    } catch (err) {
      console.warn('[NotificationService] Insert notification notice:', err);
    }
  }

  return {
    ...notification,
    id: `notif-${Date.now()}`,
    createdAt: now,
  };
}

/**
 * Retrieves user notification preferences.
 */
export async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

/**
 * Updates user notification preferences.
 */
export async function updateUserNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<void> {
  // Can be saved in profile metadata
}
