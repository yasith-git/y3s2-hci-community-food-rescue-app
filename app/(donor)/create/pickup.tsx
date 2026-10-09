/**
 * Step 3: Pickup Details & Scheduling
 * Community Food Rescue App - Smart Donation Creation
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassCard,
  GlassButton,
  GlassHeader,
  PrimaryTextInput,
  GlassChip,
  ProgressStepper,
} from '../../../src/components/ui';
import { colors, typography, spacing, radius } from '../../../src/design-system';
import { useDonationForm } from '../../../src/contexts/DonationFormContext';
import { validatePickupStep } from '../../../src/services/donations/donation.validation';
import { formatTime } from '../../../src/utils/dateTime';

const STEPS = [
  { key: 'food', label: 'Food Info' },
  { key: 'safety', label: 'Safety' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'review', label: 'Review' },
];

export default function CreatePickupStepScreen() {
  const router = useRouter();
  const { formData, updatePickup } = useDonationForm();
  const { pickup } = formData;

  const [isLocating, setIsLocating] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is needed to auto-detect current address.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const [geocoded] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocoded) {
        const address = `${geocoded.name || geocoded.street || ''}, ${geocoded.city || ''} ${geocoded.postalCode || ''}`.replace(/^,\s*/, '').trim();
        updatePickup({
          address: address || 'Current Location',
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          locationSource: 'GPS',
        });
        if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
      }
    } catch (err) {
      console.warn('[Location] Reverse geocode notice:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const handleAdjustWindow = (durationHours: number) => {
    const start = new Date();
    const deadline = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    updatePickup({
      pickupStartAt: start.toISOString(),
      pickupDeadlineAt: deadline.toISOString(),
    });
    if (errors.pickupDeadlineAt) {
      setErrors((prev) => ({ ...prev, pickupDeadlineAt: '' }));
    }
  };

  const handleNext = () => {
    const validation = validatePickupStep(pickup);
    setErrors(validation.errors);

    if (validation.isValid) {
      router.push('/(donor)/create/review' as any);
    }
  };

  return (
    <ScreenContainer scrollable={true} testID="create-pickup-step">
      <GlassHeader
        title="Pickup Details"
        subtitle="Step 3 of 4: Location & Window"
        onBack={() => router.back()}
      />

      <ProgressStepper steps={STEPS} currentStepIndex={2} />

      <View style={styles.content}>
        <GlassCard variant="standard">
          <Text style={[typography.headingSmall, styles.sectionTitle]}>
            Pickup Information
          </Text>
          <Text style={[typography.bodySmall, styles.sectionSubtitle]}>
            Where and when can a volunteer collect this donation?
          </Text>

          {/* Pickup Address */}
          <PrimaryTextInput
            label="Where should the volunteer collect it?"
            placeholder="e.g. Student Union Dining Hall, Room 102"
            value={pickup.address}
            onChangeText={(text) => {
              updatePickup({ address: text, locationSource: 'MANUAL' });
              if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
            }}
            leftIcon="location-outline"
            error={errors.address}
            required
          />

          <GlassButton
            title="Use Current Location"
            variant="secondary"
            size="small"
            icon="navigate-outline"
            loading={isLocating}
            onPress={handleUseCurrentLocation}
            style={styles.locationBtn}
          />

          {/* Pickup Window Presets */}
          <Text style={[typography.labelMedium, styles.fieldLabel]}>
            When can a volunteer pick it up? <Text style={{ color: colors.status.error }}>*</Text>
          </Text>
          <View style={styles.chipsWrap}>
            {[
              { label: '2 Hours', hours: 2 },
              { label: '3 Hours (Recommended)', hours: 3 },
              { label: '5 Hours', hours: 5 },
              { label: 'Until End of Day', hours: 8 },
            ].map((preset) => (
              <GlassChip
                key={preset.label}
                label={preset.label}
                selected={true}
                onPress={() => handleAdjustWindow(preset.hours)}
              />
            ))}
          </View>

          {/* Timing Window Summary Display */}
          <View style={styles.timingCard}>
            <View style={styles.timingRow}>
              <Ionicons name="time-outline" size={20} color={colors.brand.primary} />
              <View style={styles.timingTexts}>
                <Text style={[typography.labelMedium, styles.timingTitle]}>
                  Ready from {formatTime(pickup.pickupStartAt)} until {formatTime(pickup.pickupDeadlineAt)}
                </Text>
                <Text style={[typography.caption, styles.timingSub]}>
                  Surplus uncollected by {formatTime(pickup.pickupDeadlineAt)} will be automatically marked expired.
                </Text>
              </View>
            </View>
          </View>
          {errors.pickupDeadlineAt && (
            <Text style={[typography.caption, styles.errorText]}>
              {errors.pickupDeadlineAt}
            </Text>
          )}

          {/* Pickup Instructions */}
          <PrimaryTextInput
            label="Anything the volunteer should know when arriving? (Optional)"
            placeholder="e.g. Call when you arrive, use the side entrance, or ask for reception."
            value={pickup.instructions}
            onChangeText={(text) => updatePickup({ instructions: text })}
            multiline
            numberOfLines={2}
          />

          {/* Next Button */}
          <GlassButton
            title="Review & Confirm Donation"
            variant="primary"
            size="large"
            icon="arrow-forward"
            iconPosition="right"
            onPress={handleNext}
            style={styles.nextBtn}
            fullWidth
          />
        </GlassCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.primary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  locationBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  timingCard: {
    backgroundColor: colors.brand[50],
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(35, 132, 113, 0.2)',
    marginVertical: spacing.sm,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingTexts: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  timingTitle: {
    color: colors.brand[900],
  },
  timingSub: {
    color: colors.text.muted,
    marginTop: 2,
  },
  errorText: {
    color: colors.status.error,
    marginBottom: spacing.xs,
  },
  nextBtn: {
    marginTop: spacing.md,
  },
});
