/**
 * Coordinator Notification Preferences Screen
 * Manage alerts for reserved food, incoming deliveries, clarifications, and quiet hours.
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
} from '../../src/components/ui';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '../../src/types/notification';
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from '../../src/services/notifications/notification.service';

export default function CoordinatorNotificationPreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserNotificationPreferences(user.uid).then(setPrefs);
  }, [user]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    haptic.selection();
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    haptic.selection();
    try {
      await updateUserNotificationPreferences(user.uid, prefs);
      haptic.success();
      Alert.alert('Settings Saved', 'Your notification preferences have been updated.');
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable={false} testID="coordinator-notification-preferences-screen">
      <GlassHeader
        title="Notification Preferences"
        subtitle="Operational Alerts & Reminders"
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard variant="standard" style={styles.card}>
          <Text style={[typography.headingSmall, styles.sectionTitle]}>
            Delivery & Operational Alerts
          </Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, styles.toggleTitle]}>
                Incoming Delivery Updates
              </Text>
              <Text style={[typography.caption, styles.toggleSubtitle]}>
                Real-time alerts when volunteer starts pickup, collects food, and arrives at hub.
              </Text>
            </View>
            <Switch
              value={prefs.deliveryUpdates}
              onValueChange={() => handleToggle('deliveryUpdates')}
              trackColor={{ false: colors.surface.border, true: colors.brand.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, styles.toggleTitle]}>
                Clarification Answers
              </Text>
              <Text style={[typography.caption, styles.toggleSubtitle]}>
                Notify when a donor responds to your food safety or allergen question.
              </Text>
            </View>
            <Switch
              value={prefs.clarificationUpdates ?? true}
              onValueChange={() => handleToggle('clarificationUpdates' as any)}
              trackColor={{ false: colors.surface.border, true: colors.brand.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, styles.toggleTitle]}>
                Rescue Issue Notifications
              </Text>
              <Text style={[typography.caption, styles.toggleSubtitle]}>
                Instant operational alerts if quantity mismatch or packaging concern is reported.
              </Text>
            </View>
            <Switch
              value={prefs.issueUpdates}
              onValueChange={() => handleToggle('issueUpdates')}
              trackColor={{ false: colors.surface.border, true: colors.brand.primary }}
            />
          </View>
        </GlassCard>

        {/* Quiet Hours */}
        <GlassCard variant="standard" style={styles.card}>
          <Text style={[typography.headingSmall, styles.sectionTitle]}>Quiet Hours</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, styles.toggleTitle]}>Enable Quiet Hours</Text>
              <Text style={[typography.caption, styles.toggleSubtitle]}>
                Mute non-urgent sound and vibrations between 10:00 PM and 7:00 AM.
              </Text>
            </View>
            <Switch
              value={prefs.quietHoursEnabled}
              onValueChange={() => handleToggle('quietHoursEnabled')}
              trackColor={{ false: colors.surface.border, true: colors.brand.primary }}
            />
          </View>
        </GlassCard>

        <View style={styles.footer}>
          <GlassButton
            title="Save Notification Preferences"
            variant="primary"
            icon="save-outline"
            loading={isSaving}
            onPress={handleSave}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  toggleTitle: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  toggleSubtitle: {
    color: colors.text.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  footer: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
});
