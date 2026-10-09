/**
 * Step 4: Review & Publish Donation
 * Community Food Rescue App - Smart Donation Creation
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassCard,
  GlassButton,
  GlassHeader,
  GlassBadge,
  ProgressStepper,
  Divider,
  LoadingOverlay,
} from '../../../src/components/ui';
import { colors, typography, spacing, radius } from '../../../src/design-system';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useDonationForm } from '../../../src/contexts/DonationFormContext';
import { createAndPublishDonation } from '../../../src/services/donations/donation.service';
import { validateFullDonation } from '../../../src/services/donations/donation.validation';
import { formatDateTime } from '../../../src/utils/dateTime';

const STEPS = [
  { key: 'food', label: 'Food Info' },
  { key: 'safety', label: 'Safety' },
  { key: 'pickup', label: 'Pickup' },
  { key: 'review', label: 'Review' },
];

export default function CreateReviewStepScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { formData, resetForm } = useDonationForm();
  const { food, safety, pickup } = formData;

  const [isPublishing, setIsPublishing] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handlePublish = async () => {
    setGeneralError(null);
    const validation = validateFullDonation(formData);
    if (!validation.isValid) {
      setGeneralError('Please complete all required fields in the previous steps.');
      return;
    }

    if (!user) {
      setGeneralError('You must be signed in to publish a donation.');
      return;
    }

    setIsPublishing(true);
    try {
      const created = await createAndPublishDonation(user.uid, {
        ...formData,
        donorName: profile?.fullName || user.displayName || 'Donor Member',
        donorOrganization: profile?.organizationName,
      });

      resetForm();
      router.replace({
        pathname: '/(donor)/create/success',
        params: { donationId: created.id, foodName: created.food.name },
      } as any);
    } catch (err: any) {
      console.warn('[Publish Donation Error]:', err);
      const rawMsg = err?.message || '';
      const cleanMsg =
        rawMsg.includes('bad URL') || rawMsg.includes('fetch failed')
          ? 'Network connection error. Please check your internet connection and retry.'
          : rawMsg || 'Failed to publish donation. Please check connection and retry.';
      setGeneralError(cleanMsg);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <ScreenContainer scrollable={true} testID="create-review-step">
      <LoadingOverlay visible={isPublishing} message="Publishing your surplus donation..." />

      <GlassHeader
        title="Offer Food"
        subtitle="Step 4 of 4: Review & Confirm"
        onBack={() => router.back()}
      />

      <ProgressStepper steps={STEPS} currentStepIndex={3} />

      <View style={styles.content}>
        {generalError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.status.error} />
            <Text style={[typography.bodySmall, styles.errorText]}>{generalError}</Text>
          </View>
        )}

        {/* Section 1: Food Summary */}
        <GlassCard variant="standard" style={styles.summaryCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[typography.titleMedium, styles.cardHeading]}>1. Food Details</Text>
            <GlassButton
              title="Edit"
              variant="tertiary"
              size="small"
              onPress={() => router.push('/(donor)/create' as any)}
            />
          </View>

          <View style={styles.foodRow}>
            {food.imageUrl ? (
              <Image source={{ uri: food.imageUrl }} style={styles.thumbnail} />
            ) : (
              <View style={styles.thumbnailFallback}>
                <Ionicons name="restaurant-outline" size={24} color={colors.brand.primary} />
              </View>
            )}

            <View style={styles.foodInfoCol}>
              <Text style={[typography.titleLarge, styles.foodName]}>{food.name}</Text>
              <Text style={[typography.bodyMedium, styles.foodQty]}>
                {food.quantity} {food.unit}
              </Text>
              <GlassBadge label={food.category} variant="brand" size="small" />
            </View>
          </View>

          {food.description ? (
            <Text style={[typography.bodySmall, styles.descriptionText]}>
              "{food.description}"
            </Text>
          ) : null}
        </GlassCard>

        {/* Section 2: Safety & Handling Summary */}
        <GlassCard variant="standard" style={styles.summaryCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[typography.titleMedium, styles.cardHeading]}>2. Food Condition</Text>
            <GlassButton
              title="Edit"
              variant="tertiary"
              size="small"
              onPress={() => router.push('/(donor)/create/safety' as any)}
            />
          </View>

          <View style={styles.specRow}>
            <Text style={[typography.labelSmall, styles.specLabel]}>Storage:</Text>
            <Text style={[typography.bodySmall, styles.specValue]}>{safety.storageCondition}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[typography.labelSmall, styles.specLabel]}>Packaging:</Text>
            <Text style={[typography.bodySmall, styles.specValue]}>{safety.packagingCondition}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[typography.labelSmall, styles.specLabel]}>Allergens:</Text>
            <Text style={[typography.bodySmall, styles.specValue]}>
              {safety.allergens.join(', ')}
            </Text>
          </View>

          <Divider spacingSize="xs" />

          <View style={styles.declarationCheckRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
            <Text style={[typography.caption, styles.declarationConfirmedText]}>
              Information confirmed by donor
            </Text>
          </View>
        </GlassCard>

        {/* Section 3: Pickup Location & Timings */}
        <GlassCard variant="standard" style={styles.summaryCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[typography.titleMedium, styles.cardHeading]}>3. Pickup Details</Text>
            <GlassButton
              title="Edit"
              variant="tertiary"
              size="small"
              onPress={() => router.push('/(donor)/create/pickup' as any)}
            />
          </View>

          <View style={styles.specRow}>
            <Text style={[typography.labelSmall, styles.specLabel]}>Location:</Text>
            <Text style={[typography.bodySmall, styles.specValue]}>{pickup.address}</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[typography.labelSmall, styles.specLabel]}>Pickup From:</Text>
            <Text style={[typography.bodySmall, styles.specValue]}>
              {formatDateTime(pickup.pickupStartAt)}
            </Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[typography.labelSmall, styles.specLabel]}>Pickup Until:</Text>
            <Text style={[typography.bodySmall, styles.specValue]}>
              {formatDateTime(pickup.pickupDeadlineAt)}
            </Text>
          </View>

          {pickup.instructions ? (
            <View style={styles.specRow}>
              <Text style={[typography.labelSmall, styles.specLabel]}>Arrival Notes:</Text>
              <Text style={[typography.bodySmall, styles.specValue]}>{pickup.instructions}</Text>
            </View>
          ) : null}
        </GlassCard>

        {/* Publish Action Button */}
        <GlassButton
          title="Publish Donation to Network"
          variant="primary"
          size="large"
          icon="send"
          iconPosition="right"
          loading={isPublishing}
          onPress={handlePublish}
          style={styles.publishBtn}
          fullWidth
        />

        <View style={{ height: 40 }} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorBg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderColor: colors.status.errorBorder,
    borderWidth: 1,
    gap: spacing.xs,
  },
  errorText: {
    color: colors.status.error,
    flex: 1,
  },
  summaryCard: {
    marginVertical: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardHeading: {
    color: colors.brand.dark,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
  },
  thumbnailFallback: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodInfoCol: {
    flex: 1,
    marginLeft: spacing.sm,
    gap: 2,
  },
  foodName: {
    color: colors.text.primary,
  },
  foodQty: {
    color: colors.text.muted,
  },
  descriptionText: {
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  specRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  specLabel: {
    width: 90,
    color: colors.text.muted,
  },
  specValue: {
    flex: 1,
    color: colors.text.primary,
  },
  declarationCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  declarationConfirmedText: {
    color: colors.status.success,
  },
  publishBtn: {
    marginTop: spacing.md,
  },
});
