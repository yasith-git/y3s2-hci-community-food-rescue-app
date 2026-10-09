/**
 * Notification Preferences & Quiet Hours Screen
 * Allows users to toggle event notification categories and customize quiet hours.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassButton,
  PrimaryTextInput,
} from '../../src/components/ui';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../../src/types/notification';
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  registerForPushNotifications,
} from '../../src/services/notifications/notification.service';

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      getUserNotificationPreferences(user.uid).then((prefs) => {
        setPreferences(prefs);
      });
    }
  }, [user?.uid]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    haptic.selection();
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleEnablePush = async () => {
    if (!user?.uid) return;
    setIsEnablingPush(true);
    haptic.selection();

    const token = await registerForPushNotifications(user.uid);
    setIsEnablingPush(false);

    if (token) {
      haptic.success();
      Alert.alert('Push Notifications Enabled! 🔔', 'Your device is now registered for operational rescue alerts.');
    } else {
      haptic.warning();
      Alert.alert(
        'Permission Notice',
        'Push notifications require permission or a physical device development build.'
      );
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    haptic.selection();

    try {
      await updateUserNotificationPreferences(user.uid, preferences);
      haptic.success();
      Alert.alert('Preferences Saved', 'Your notification settings have been updated.');
      router.back();
    } catch (err) {
      haptic.warning();
      Alert.alert('Save Failed', 'Unable to update preferences. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable={false} testID="notification-preferences-screen">
      <GlassHeader
        title="Notification Settings"
        subtitle="Manage alerts, reminders, and quiet hours"
        onBack={() => router.back()}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Remote Push Token Activation Card */}
        <GlassCard variant="elevated" style={styles.card}>
          <View style={styles.pushHeaderRow}>
            <View style={styles.pushIconCircle}>
              <Ionicons name="notifications-outline" size={22} color={colors.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelLarge, styles.pushTitle]}>Device Push Alerts</Text>
              <Text style={[typography.bodySmall, styles.pushSubtitle]}>
                Receive instant alerts when a rescue matches your route.
              </Text>
            </View>
          </View>

          <GlassButton
            title="Enable Device Push Notifications"
            variant="secondary"
            loading={isEnablingPush}
            onPress={handleEnablePush}
          />
        </GlassCard>

        {/* Operational Categories */}
        <GlassCard variant="standard" style={styles.card}>
          <Text style={[typography.labelLarge, styles.sectionTitle]}>Alert Categories</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelMedium, styles.toggleLabel]}>Route Match Opportunities</Text>
              <Text style={[typography.caption, styles.toggleSubtext]}>
                Notify when published donations align with your active journey.
              </Text>
            </View>
            <Switch
              value={preferences.routeMatches}
              onValueChange={() => handleToggle('routeMatches')}
              trackColor={{ false: colors.surface.borderStrong, true: colors.brand.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelMedium, styles.toggleLabel]}>Pickup Reminders</Text>
              <Text style={[typography.caption, styles.toggleSubtext]}>
                Alert 30 minutes before your scheduled food pickup begins.
              </Text>
            </View>
            <Switch
              value={preferences.pickupReminders}
              onValueChange={() => handleToggle('pickupReminders')}
              trackColor={{ false: colors.surface.borderStrong, true: colors.brand.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelMedium, styles.toggleLabel]}>Delivery & Community Updates</Text>
              <Text style={[typography.caption, styles.toggleSubtext]}>
                Receipt confirmations from community coordinators.
              </Text>
            </View>
            <Switch
              value={preferences.deliveryUpdates}
              onValueChange={() => handleToggle('deliveryUpdates')}
              trackColor={{ false: colors.surface.borderStrong, true: colors.brand.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelMedium, styles.toggleLabel]}>Issue & Incident Alerts</Text>
              <Text style={[typography.caption, styles.toggleSubtext]}>
                Coordinator replies and mismatch resolution reports.
              </Text>
            </View>
            <Switch
              value={preferences.issueUpdates}
              onValueChange={() => handleToggle('issueUpdates')}
              trackColor={{ false: colors.surface.borderStrong, true: colors.brand.primary }}
            />
          </View>
        </GlassCard>

        {/* Quiet Hours */}
        <GlassCard variant="standard" style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.labelLarge, styles.sectionTitle]}>Quiet Hours</Text>
              <Text style={[typography.caption, styles.toggleSubtext]}>
                Mute non-urgent notifications during your rest hours.
              </Text>
            </View>
            <Switch
              value={preferences.quietHoursEnabled}
              onValueChange={() => handleToggle('quietHoursEnabled')}
              trackColor={{ false: colors.surface.borderStrong, true: colors.brand.primary }}
            />
          </View>

          {preferences.quietHoursEnabled && (
            <View style={styles.timeInputsRow}>
              <View style={{ flex: 1 }}>
                <PrimaryTextInput
                  label="Quiet Start"
                  value={preferences.quietHoursStart}
                  onChangeText={(val) => setPreferences((p) => ({ ...p, quietHoursStart: val }))}
                  placeholder="22:00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryTextInput
                  label="Quiet End"
                  value={preferences.quietHoursEnd}
                  onChangeText={(val) => setPreferences((p) => ({ ...p, quietHoursEnd: val }))}
                  placeholder="07:00"
                />
              </View>
            </View>
          )}
        </GlassCard>
      </ScrollView>

      <View style={styles.bottomBar}>
        <GlassButton
          title="Save Notification Settings"
          variant="primary"
          loading={isSaving}
          onPress={handleSave}
        />
      </View>
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
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  pushHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pushIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushTitle: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  pushSubtitle: {
    color: colors.text.muted,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  toggleLabel: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  toggleSubtext: {
    color: colors.text.muted,
    marginTop: 2,
    paddingRight: spacing.sm,
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
});
