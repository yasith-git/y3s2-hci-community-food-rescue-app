/**
 * Step 1: Food Information
 * Community Food Rescue App - Smart Donation Creation
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassCard,
  GlassButton,
  GlassIconButton,
  GlassHeader,
  PrimaryTextInput,
  GlassChip,
  ProgressStepper,
} from '../../../src/components/ui';
import { colors, typography, spacing, radius } from '../../../src/design-system';
import { useDonationForm } from '../../../src/contexts/DonationFormContext';
import { validateFoodStep } from '../../../src/services/donations/donation.validation';
import { FoodCategory, QuantityUnit } from '../../../src/types/donation';
import { RescueAIDonorAssistCard } from '../../../src/components/rescue-ai/RescueAIDonorAssistCard';
import { rescueAIService } from '../../../src/services/rescue-ai/rescueAI.service';
import { DonationPhotoAnalysisResult } from '../../../src/types/rescue-ai';

const CATEGORIES: FoodCategory[] = [
  'Prepared Meals',
  'Bakery',
  'Rice & Curry',
  'Vegetables',
  'Fruit',
  'Dairy',
  'Packaged Food',
  'Beverages',
  'Other',
];

const UNITS: QuantityUnit[] = [
  'portions',
  'packs',
  'boxes',
  'loaves',
  'kg',
  'containers',
];

const STEPS = [
  { key: 'food', label: 'Food Info' },
  { key: 'safety', label: 'Safety' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'review', label: 'Review' },
];

export default function CreateFoodStepScreen() {
  const router = useRouter();
  const { formData, updateFood } = useDonationForm();
  const { food } = formData;

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DonationPhotoAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAnalyzePhoto = async () => {
    if (!food.imageUrl) return;
    setIsAnalyzing(true);
    setAiError(null);

    try {
      const result = await rescueAIService.analyzeDonationPhoto(food.imageUrl, {
        title: food.name,
        description: food.description,
      });
      setAnalysisResult(result);
    } catch (err: any) {
      setAiError(err?.message || 'We could not analyze this photo right now. You can continue manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAllSuggestions = () => {
    if (!analysisResult) return;
    const updates: any = {};
    if (analysisResult.suggestedName) updates.name = analysisResult.suggestedName;
    if (analysisResult.suggestedCategory) updates.category = analysisResult.suggestedCategory;
    if (analysisResult.suggestedUnit) updates.unit = analysisResult.suggestedUnit;
    if (analysisResult.suggestedDescription) updates.description = analysisResult.suggestedDescription;
    updateFood(updates);
    setAnalysisResult(null);
  };

  const handleApplyField = (field: 'name' | 'category' | 'unit' | 'description', value: any) => {
    updateFood({ [field]: value });
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera roll permission is needed to upload a food photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      updateFood({ imageUrl: imageUri });
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is needed to take a food photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      updateFood({ imageUrl: imageUri });
    }
  };

  const handleNext = () => {
    const validation = validateFoodStep(food);
    setErrors(validation.errors);

    if (validation.isValid) {
      router.push('/(donor)/create/safety' as any);
    }
  };

  return (
    <ScreenContainer scrollable={true} testID="create-food-step">
      <GlassHeader
        title="Offer Food"
        subtitle="Step 1 of 4: Food Details"
        onBack={() => router.back()}
      />

      <ProgressStepper steps={STEPS} currentStepIndex={0} />

      <View style={styles.content}>
        <GlassCard variant="standard">
          <Text style={[typography.headingSmall, styles.sectionTitle]}>
            Food Details
          </Text>
          <Text style={[typography.bodySmall, styles.sectionSubtitle]}>
            Please share what food you have available for rescue.
          </Text>

          {/* Question 5: Add a photo */}
          <Text style={[typography.labelMedium, styles.questionLabel]}>
            Add a photo <Text style={{ color: colors.text.muted, fontWeight: '400' }}>(Recommended)</Text>
          </Text>
          <View style={styles.imagePickerSection}>
            {food.imageUrl ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: food.imageUrl }} style={styles.previewImage} />
                <GlassIconButton
                  icon="trash-outline"
                  size="small"
                  variant="danger"
                  onPress={() => updateFood({ imageUrl: undefined })}
                  accessibilityLabel="Remove photo"
                  style={styles.removeImageBtn}
                />
              </View>
            ) : (
              <View style={styles.emptyImageCard}>
                <Ionicons name="camera-outline" size={32} color={colors.brand.primary} />
                <Text style={[typography.labelMedium, styles.photoPrompt]}>
                  Snap or upload a photo of the food
                </Text>
                <View style={styles.photoActionRow}>
                  <GlassButton
                    title="Take Photo"
                    variant="secondary"
                    size="small"
                    icon="camera"
                    onPress={handleTakePhoto}
                  />
                  <View style={{ width: spacing.sm }} />
                  <GlassButton
                    title="Choose from Gallery"
                    variant="secondary"
                    size="small"
                    icon="images"
                    onPress={handlePickImage}
                  />
                </View>
              </View>
            )}
          </View>

          {/* RescueAI Smart Donation Photo Assist */}
          <RescueAIDonorAssistCard
            hasPhoto={Boolean(food.imageUrl)}
            isAnalyzing={isAnalyzing}
            analysisResult={analysisResult}
            errorMessage={aiError}
            onAnalyze={handleAnalyzePhoto}
            onApplyAll={handleApplyAllSuggestions}
            onApplyField={handleApplyField}
            onDismiss={() => {
              setAnalysisResult(null);
              setAiError(null);
            }}
          />

          {/* Question 1: What food are you donating? */}
          <PrimaryTextInput
            label="What food are you donating?"
            placeholder="e.g. 20 Vegetable Fried Rice Boxes, Fresh Bread Rolls"
            value={food.name}
            onChangeText={(text) => {
              updateFood({ name: text });
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
            }}
            leftIcon="fast-food-outline"
            error={errors.name}
            required
          />

          {/* Question 2: What category of food is this? */}
          <Text style={[typography.labelMedium, styles.questionLabel]}>
            What category of food is this? <Text style={{ color: colors.status.error }}>*</Text>
          </Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((cat) => (
              <GlassChip
                key={cat}
                label={cat}
                selected={food.category === cat}
                onPress={() => {
                  updateFood({ category: cat });
                  if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
                }}
              />
            ))}
          </View>
          {errors.category && (
            <Text style={[typography.caption, styles.errorText]}>{errors.category}</Text>
          )}

          {/* Question 3: How much food is available? */}
          <Text style={[typography.labelMedium, styles.questionLabel]}>
            How much food is available? <Text style={{ color: colors.status.error }}>*</Text>
          </Text>
          <View style={styles.quantityRow}>
            <View style={styles.quantityCol}>
              <PrimaryTextInput
                label="Quantity"
                placeholder="e.g. 15"
                value={food.quantity ? String(food.quantity) : ''}
                onChangeText={(text) => {
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  updateFood({ quantity: isNaN(num) ? 0 : num });
                  if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
                }}
                leftIcon="cube-outline"
                keyboardType="numeric"
                error={errors.quantity}
                required
              />
            </View>

            <View style={styles.unitCol}>
              <Text style={[typography.labelMedium, styles.unitLabel]}>
                Unit <Text style={{ color: colors.status.error }}>*</Text>
              </Text>
              <View style={styles.unitChipsWrap}>
                {UNITS.map((u) => (
                  <GlassChip
                    key={u}
                    label={u}
                    selected={food.unit === u}
                    onPress={() => updateFood({ unit: u })}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Optional: Anything else volunteers should know? */}
          <PrimaryTextInput
            label="Anything else volunteers should know? (Optional)"
            placeholder="e.g. Packaged in individual boxes, ready for immediate distribution"
            value={food.description}
            onChangeText={(text) => updateFood({ description: text })}
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 70 }}
          />

          {/* Next Button */}
          <GlassButton
            title="Continue to Food Condition"
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
  imagePickerSection: {
    marginBottom: spacing.md,
  },
  emptyImageCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(35, 132, 113, 0.35)',
  },
  photoPrompt: {
    color: colors.brand[900],
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  photoActionRow: {
    flexDirection: 'row',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: radius.xl,
    overflow: 'hidden',
    height: 180,
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  questionLabel: {
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipLabel: {
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  quantityRow: {
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  quantityCol: {
    width: '100%',
  },
  unitCol: {
    width: '100%',
  },
  unitLabel: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  unitChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  errorText: {
    color: colors.status.error,
    marginBottom: spacing.xs,
  },
  nextBtn: {
    marginTop: spacing.md,
  },
});
