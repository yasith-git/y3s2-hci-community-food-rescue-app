/**
 * Donation Creation Success Screen
 * Community Food Rescue App
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  SuccessState,
} from '../../../src/components/ui';
import { spacing } from '../../../src/design-system/spacing';

export default function CreateSuccessScreen() {
  const router = useRouter();
  const { donationId, foodName } = useLocalSearchParams<{
    donationId: string;
    foodName: string;
  }>();

  return (
    <ScreenContainer scrollable={true} testID="create-success-screen">
      <GlassHeader title="Donation Live" />

      <View style={styles.content}>
        <SuccessState
          title="Your Donation is Live!"
          description={`"${foodName || 'Your surplus food'}" has been published. RescueAI is actively analyzing urgency and notifying compatible community routes.`}
          primaryActionTitle="Track Live Rescue"
          onPrimaryAction={() => {
            if (donationId) {
              router.replace({
                pathname: '/(donor)/tracking',
                params: { donationId },
              } as any);
            } else {
              router.replace('/(donor)');
            }
          }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xl,
  },
});
