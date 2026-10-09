/**
 * Notification System Types and Interfaces
 * Community Food Rescue App - Member 3 Feature
 */

export type NotificationType =
  | 'ROUTE_MATCH'
  | 'DONATION_RESERVED'
  | 'RESCUE_ACCEPTED'
  | 'PICKUP_REMINDER'
  | 'PICKUP_STARTED'
  | 'PICKUP_CONFIRMED'
  | 'DELIVERY_STARTED'
  | 'DELIVERY_REMINDER'
  | 'DELIVERY_CONFIRMED'
  | 'RECEIPT_ACKNOWLEDGED'
  | 'CLARIFICATION_REQUESTED'
  | 'CLARIFICATION_RESPONDED'
  | 'ISSUE_REPORTED'
  | 'ISSUE_RESOLVED'
  | 'RESCUE_COMPLETED'
  | 'RESCUE_CANCELLED'
  | 'RESERVATION_CANCELLED'
  | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'OPERATIONAL';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType?: 'donation' | 'assignment' | 'issue' | 'route' | 'clarification';
  resourceId?: string;
  deepLinkRoute?: string;
  priority: NotificationPriority;
  readAt?: string | null;
  createdAt: string;
  expiresAt?: string;
}

export interface DevicePushRegistration {
  deviceId: string;
  pushToken: string;
  platform: 'ios' | 'android' | 'web';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
}

export interface NotificationPreferences {
  routeMatches: boolean;
  pickupReminders: boolean;
  deliveryUpdates: boolean;
  issueUpdates: boolean;
  clarificationUpdates?: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string; // e.g. "07:00"
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  routeMatches: true,
  pickupReminders: true,
  deliveryUpdates: true,
  issueUpdates: true,
  clarificationUpdates: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};
