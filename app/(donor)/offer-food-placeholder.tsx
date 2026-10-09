/**
 * Donor Offer Food Navigation Placeholder
 * Temporary destination proving Offer Food CTA routing before Phase 2 Smart Donation Creation
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  EmptyState,
} from '../../src/components/ui';
import { spacing } from '../../src/design-system/spacing';

export default function OfferFoodPlaceholderScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scrollable={true} testID="offer-food-placeholder">
      <GlassHeader
        title="Offer Food"
        onBack={() => router.back()}
      />
      <View style={styles.content}>
        <EmptyState
          icon="restaurant-outline"
          title="Smart Donation Creation"
          description="The AI-assisted smart donation creation form and food photo inspection will be developed in Phase 2."
          primaryActionTitle="Back to Dashboard"
          onPrimaryAction={() => router.back()}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.lg,
  },
});
