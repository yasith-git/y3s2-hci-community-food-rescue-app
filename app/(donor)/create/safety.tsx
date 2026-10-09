/**
 * Step 2: Food Safety & Storage
 * Community Food Rescue App - Smart Donation Creation
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassCard,
  GlassButton,
  GlassHeader,
  PrimaryTextInput,
  GlassChip,
  ProgressStepper,
  AnimatedPressable,
} from '../../../src/components/ui';
import { AllergenSelector } from '../../../src/components/donation/AllergenSelector';
import { colors, typography, spacing, radius } from '../../../src/design-system';
import { useDonationForm } from '../../../src/contexts/DonationFormContext';
import { validateSafetyStep } from '../../../src/services/donations/donation.validation';
import { StorageCondition, PackagingCondition, Allergen } from '../../../src/types/donation';

const STORAGE_OPTIONS: StorageCondition[] = [
  'Room Temperature',
  'Refrigerated',
  'Frozen',
  'Warm / Heated',
  'Other',
];

const PACKAGING_OPTIONS: PackagingCondition[] = [
  'Individually Sealed',
  'Covered Trays',
  'Food-Safe Containers',
  'Original Packaging',
  'Other',
];

const STEPS = [
  { key: 'food', label: 'Food Info' },
  { key: 'safety', label: 'Safety' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'review', label: 'Review' },
];

export default function CreateSafetyStepScreen() {
  const router = useRouter();
  const { formData, updateSafety } = useDonationForm();
  const { safety } = formData;

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleToggleAllergen = (allergen: Allergen) => {
    let current = [...safety.allergens];
    if (allergen === 'None' || allergen === 'Unknown') {
      current = [allergen];
    } else {
      current = current.filter((a) => a !== 'None' && a !== 'Unknown');
      if (current.includes(allergen)) {
        current = current.filter((a) => a !== allergen);
      } else {
        current.push(allergen);
      }
      if (current.length === 0) current = ['None'];
    }
    updateSafety({ allergens: current });
    if (errors.allergens) setErrors((prev) => ({ ...prev, allergens: '' }));
  };

  const handleNext = () => {
    const validation = validateSafetyStep(safety);
    setErrors(validation.errors);

    if (validation.isValid) {
      router.push('/(donor)/create/pickup' as any);
    }
  };

  return (
    <ScreenContainer scrollable={true} testID="create-safety-step">
      <GlassHeader
        title="Food Condition"
        subtitle="Step 2 of 4: Handling & Packaging"
        onBack={() => router.back()}
      />

      <ProgressStepper steps={STEPS} currentStepIndex={1} />

      <View style={styles.content}>
        <GlassCard variant="standard">
          <Text style={[typography.headingSmall, styles.sectionTitle]}>
            Food Condition & Handling
          </Text>
          <Text style={[typography.bodySmall, styles.sectionSubtitle]}>
            Help volunteers handle and transport this food safely.
          </Text>

          {/* Storage Condition */}
          <Text style={[typography.labelMedium, styles.fieldLabel]}>
            How is the food currently stored? <Text style={{ color: colors.status.error }}>*</Text>
          </Text>
          <View style={styles.chipsWrap}>
            {STORAGE_OPTIONS.map((item) => (
              <GlassChip
                key={item}
                label={item}
                selected={safety.storageCondition === item}
                onPress={() => updateSafety({ storageCondition: item })}
              />
            ))}
          </View>

          {/* Packaging Condition */}
          <Text style={[typography.labelMedium, styles.fieldLabel]}>
            How is the food packed? <Text style={{ color: colors.status.error }}>*</Text>
          </Text>
          <View style={styles.chipsWrap}>
            {PACKAGING_OPTIONS.map((item) => (
              <GlassChip
                key={item}
                label={item}
                selected={safety.packagingCondition === item}
                onPress={() => updateSafety({ packagingCondition: item })}
              />
            ))}
          </View>

          {/* Ingredients */}
          <PrimaryTextInput
            label="Ingredients / Notes (Optional)"
            placeholder="e.g. Rice, lentils, tomatoes, coconut milk, curry spices"
            value={safety.ingredients}
            onChangeText={(text) => updateSafety({ ingredients: text })}
            multiline
            numberOfLines={2}
          />

          {/* Allergens Selector */}
          <Text style={[typography.labelMedium, styles.fieldLabel]}>
            Any known allergens?
          </Text>
          <AllergenSelector
            selectedAllergens={safety.allergens}
            onToggleAllergen={handleToggleAllergen}
          />
          {errors.allergens && (
            <Text style={[typography.caption, styles.errorText]}>{errors.allergens}</Text>
          )}

          {/* Food Safety & Accuracy Donor Declaration */}
          <View style={styles.declarationBox}>
            <AnimatedPressable
              onPress={() => {
                const nextState = !safety.donorDeclarationAccepted;
                updateSafety({ donorDeclarationAccepted: nextState });
                if (errors.donorDeclaration) {
                  setErrors((prev) => ({ ...prev, donorDeclaration: '' }));
                }
              }}
              style={styles.checkboxRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: safety.donorDeclarationAccepted }}
            >
              <View
                style={[
                  styles.checkbox,
                  safety.donorDeclarationAccepted && styles.checkboxActive,
                ]}
              >
                {safety.donorDeclarationAccepted && (
                  <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
                )}
              </View>

              <Text style={[typography.bodySmall, styles.declarationText]}>
                I confirm that the information provided about this food is accurate.
              </Text>
            </AnimatedPressable>

            <View style={styles.disclaimerRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.text.muted} />
              <Text style={[typography.caption, styles.disclaimerText]}>
                Information is donor-declared to assist with food rescue handling.
              </Text>
            </View>
          </View>
          {errors.donorDeclaration && (
            <Text style={[typography.caption, styles.errorText]}>
              {errors.donorDeclaration}
            </Text>
          )}

          {/* Next Button */}
          <GlassButton
            title="Continue to Pickup Details"
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
  fieldLabel: {
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  declarationBox: {
    backgroundColor: colors.brand[50],
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(35, 132, 113, 0.2)',
    marginVertical: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.brand.primary,
  },
  declarationText: {
    flex: 1,
    color: colors.brand[900],
    lineHeight: 18,
    fontWeight: '500',
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  disclaimerText: {
    color: colors.text.muted,
    flex: 1,
  },
  errorText: {
    color: colors.status.error,
    marginBottom: spacing.xs,
  },
  nextBtn: {
    marginTop: spacing.sm,
  },
});
