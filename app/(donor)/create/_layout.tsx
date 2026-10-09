/**
 * Donation Creation Flow Layout
 * Wraps creation steps in DonationFormProvider
 */

import React from 'react';
import { Stack } from 'expo-router';
import { DonationFormProvider } from '../../../src/contexts/DonationFormContext';

export default function CreateDonationLayout() {
  return (
    <DonationFormProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="safety" />
        <Stack.Screen name="pickup" />
        <Stack.Screen name="review" />
        <Stack.Screen name="success" />
      </Stack>
    </DonationFormProvider>
  );
}
