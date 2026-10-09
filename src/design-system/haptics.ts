/**
 * Centralized Haptic Feedback Utilities
 * Community Food Rescue App - Shared Design System
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const haptic = {
  /**
   * Subtle tap for light interactive items (tabs, toggles, chips)
   */
  light: async () => {
    if (isWeb) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Graceful fallback on unsupported platforms
    }
  },

  /**
   * Medium impact for buttons, card presses, selection changes
   */
  medium: async () => {
    if (isWeb) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Heavy impact for critical operations or modal triggers
   */
  heavy: async () => {
    if (isWeb) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Success notification feedback for completed rescue, submitted form, etc.
   */
  success: async () => {
    if (isWeb) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Warning notification feedback for limits, timeouts, critical prompts
   */
  warning: async () => {
    if (isWeb) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Error notification feedback for form errors, failed operations
   */
  error: async () => {
    if (isWeb) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Graceful fallback
    }
  },

  /**
   * Selection feedback for pickers, stepped controls
   */
  selection: async () => {
    if (isWeb) return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Graceful fallback
    }
  },
};
