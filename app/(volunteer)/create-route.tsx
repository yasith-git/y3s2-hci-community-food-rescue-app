/**
 * Guided Volunteer Route Creation Screen
 * Step-by-step trajectory setup: Origin, Destination, Schedule, and Detour allowance.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassButton,
  GlassCard,
  GlassChip,
  PrimaryTextInput,
  ProgressStepper,
} from '../../src/components/ui';
import { LocationInput } from '../../src/components/location/LocationInput';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { GeoPointData, CreateVolunteerRouteInput } from '../../src/types/route';
import { createVolunteerRoute } from '../../src/services/routes/route.service';

const STEPS = [
  { key: 'locations', label: 'Route' },
  { key: 'schedule', label: 'Timing' },
  { key: 'detour', label: 'Detour' },
];

const DETOUR_OPTIONS = [5, 10, 15, 20, 30];

export default function CreateRouteScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [routeName, setRouteName] = useState('');
  const [origin, setOrigin] = useState<GeoPointData | null>(null);
  const [destination, setDestination] = useState<GeoPointData | null>(null);

  // Time & Detour
  const [availableFromHours, setAvailableFromHours] = useState('0'); // +0h from now
  const [availableDurationHours, setAvailableDurationHours] = useState('4'); // 4 hours window
  const [maxDetourMinutes, setMaxDetourMinutes] = useState<number>(15);
  const [isSavedRoute, setIsSavedRoute] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStepValid = () => {
    if (currentStepIndex === 0) {
      return origin !== null && destination !== null;
    }
    if (currentStepIndex === 1) {
      return Number(availableDurationHours) > 0;
    }
    return maxDetourMinutes > 0;
  };

  const handleNext = () => {
    if (!isStepValid()) {
      haptic.warning();
      Alert.alert('Incomplete Details', 'Please complete all required fields for this step.');
      return;
    }

    if (currentStepIndex < STEPS.length - 1) {
      haptic.selection();
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleSubmitRoute();
    }
  };

  const handleSubmitRoute = async () => {
    if (!origin || !destination) return;
    setIsSubmitting(true);
    haptic.selection();

    try {
      const now = new Date();
      const startAt = new Date(now.getTime() + Number(availableFromHours) * 60 * 60 * 1000).toISOString();
      const endAt = new Date(now.getTime() + (Number(availableFromHours) + Number(availableDurationHours)) * 60 * 60 * 1000).toISOString();

      const routeInput: CreateVolunteerRouteInput = {
        volunteerId: user?.uid || 'guest-volunteer',
        name: routeName.trim() || `${origin.address.split(',')[0]} → ${destination.address.split(',')[0]}`,
        origin,
        destination,
        availableFromAt: startAt,
        availableUntilAt: endAt,
        maxDetourMinutes,
        transportMode: 'DRIVING',
        routeType: isSavedRoute ? 'SAVED' : 'ONE_TIME',
        isActive: true,
      };

      if (user?.uid) {
        await createVolunteerRoute(user.uid, routeInput);
      }

      haptic.success();
      router.replace('/(volunteer)');
    } catch (error) {
      console.warn('[CreateRoute] Save error:', error);
      haptic.warning();
      // Fallback redirect for guest / offline mode
      router.replace('/(volunteer)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable={false} testID="create-route-screen">
      <GlassHeader
        title="Set Your Journey"
        subtitle="Match rescues along your daily route"
        onBack={() => {
          if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
          } else {
            router.back();
          }
        }}
      />

      <View style={styles.stepperContainer}>
        <ProgressStepper
          steps={STEPS}
          currentStepIndex={currentStepIndex}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentStepIndex === 0 && (
            <GlassCard variant="standard" style={styles.card}>
              <Text style={[typography.labelLarge, styles.stepHeader]}>
                Where are you travelling?
              </Text>
              <Text style={[typography.bodySmall, styles.stepSubtitle]}>
                Enter your start point and destination to define your travel corridor.
              </Text>

              <LocationInput
                label="Starting Point (Origin)"
                placeholder="e.g. Colombo Fort or Current Location"
                value={origin}
                onChange={setOrigin}
                icon="radio-button-on"
                showCurrentLocationButton
                required
              />

              <LocationInput
                label="Destination"
                placeholder="e.g. Borella Junction / Office"
                value={destination}
                onChange={setDestination}
                icon="flag"
                showCurrentLocationButton={false}
                required
              />

              <PrimaryTextInput
                label="Journey Label (Optional)"
                placeholder="e.g., Home → Campus"
                value={routeName}
                onChangeText={setRouteName}
              />
            </GlassCard>
          )}

          {currentStepIndex === 1 && (
            <GlassCard variant="standard" style={styles.card}>
              <Text style={[typography.labelLarge, styles.stepHeader]}>
                When are you travelling?
              </Text>
              <Text style={[typography.bodySmall, styles.stepSubtitle]}>
                Define your availability window so we only match active pickups.
              </Text>

              <Text style={[typography.labelMedium, styles.subSectionLabel]}>
                Start Journey In
              </Text>
              <View style={styles.chipRow}>
                {[
                  { label: 'Now', val: '0' },
                  { label: 'In 30m', val: '0.5' },
                  { label: 'In 1h', val: '1' },
                  { label: 'In 2h', val: '2' },
                ].map((item) => (
                  <GlassChip
                    key={item.val}
                    label={item.label}
                    selected={availableFromHours === item.val}
                    onPress={() => {
                      haptic.selection();
                      setAvailableFromHours(item.val);
                    }}
                  />
                ))}
              </View>

              <Text style={[typography.labelMedium, styles.subSectionLabel]}>
                Journey Window Duration
              </Text>
              <View style={styles.chipRow}>
                {[
                  { label: '2 Hours', val: '2' },
                  { label: '4 Hours', val: '4' },
                  { label: '6 Hours', val: '6' },
                  { label: 'All Day', val: '12' },
                ].map((item) => (
                  <GlassChip
                    key={item.val}
                    label={item.label}
                    selected={availableDurationHours === item.val}
                    onPress={() => {
                      haptic.selection();
                      setAvailableDurationHours(item.val);
                    }}
                  />
                ))}
              </View>
            </GlassCard>
          )}

          {currentStepIndex === 2 && (
            <GlassCard variant="standard" style={styles.card}>
              <Text style={[typography.labelLarge, styles.stepHeader]}>
                Maximum Detour Allowance
              </Text>
              <Text style={[typography.bodySmall, styles.stepSubtitle]}>
                How many extra minutes are you willing to add to your journey for food pickup?
              </Text>

              <View style={styles.detourGrid}>
                {DETOUR_OPTIONS.map((min) => {
                  const isSelected = maxDetourMinutes === min;
                  return (
                    <GlassChip
                      key={min}
                      label={`+${min} min`}
                      selected={isSelected}
                      onPress={() => {
                        haptic.selection();
                        setMaxDetourMinutes(min);
                      }}
                    />
                  );
                })}
              </View>

              <View style={styles.saveOptionRow}>
                <Ionicons name="bookmark-outline" size={20} color={colors.brand.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.labelMedium, styles.saveOptionTitle]}>
                    Save for future trips
                  </Text>
                  <Text style={[typography.caption, styles.saveOptionSubtitle]}>
                    Easily reactivate this journey anytime from your Saved Routes.
                  </Text>
                </View>
                <GlassChip
                  label={isSavedRoute ? 'Yes' : 'No'}
                  selected={isSavedRoute}
                  onPress={() => {
                    haptic.selection();
                    setIsSavedRoute((prev) => !prev);
                  }}
                />
              </View>
            </GlassCard>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <GlassButton
            title={currentStepIndex === STEPS.length - 1 ? 'Find Rescues Along Route' : 'Next Step'}
            variant="primary"
            icon={currentStepIndex === STEPS.length - 1 ? 'search' : 'arrow-forward'}
            iconPosition="right"
            loading={isSubmitting}
            disabled={!isStepValid() || isSubmitting}
            onPress={handleNext}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stepperContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  keyboardView: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
  },
  card: {
    padding: spacing.md,
  },
  stepHeader: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  stepSubtitle: {
    color: colors.text.muted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  subSectionLabel: {
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  detourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  saveOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    marginTop: spacing.sm,
  },
  saveOptionTitle: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  saveOptionSubtitle: {
    color: colors.text.muted,
  },
  bottomBar: {
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
});
