/**
 * Edit Donation Screen
 * Allows editing quantity, description, pickup times, and notes prior to courier assignment
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassButton,
  PrimaryTextInput,
  GlassChip,
  LoadingOverlay,
} from '../../src/components/ui';
import { colors, typography, spacing } from '../../src/design-system';
import {
  getDonationById,
  updateDonationDetails,
} from '../../src/services/donations/donation.service';
import { canEditDonation } from '../../src/services/donations/donation.state-machine';
import { Donation } from '../../src/types/donation';
import { formatTime } from '../../src/utils/dateTime';

export default function EditDonationScreen() {
  const router = useRouter();
  const { donationId } = useLocalSearchParams<{ donationId: string }>();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (!donationId) {
      setLoading(false);
      return;
    }

    getDonationById(donationId)
      .then((data) => {
        if (data) {
          setDonation(data);
          setName(data.food.name);
          setQuantity(String(data.food.quantity));
          setDescription(data.food.description || '');
          setAddress(data.pickup.address);
          setInstructions(data.pickup.instructions || '');
        }
      })
      .finally(() => setLoading(false));
  }, [donationId]);

  const handleSave = async () => {
    if (!donation) return;
    if (!canEditDonation(donation)) {
      Alert.alert('Cannot Edit', 'This donation is no longer editable.');
      return;
    }

    const num = parseInt(quantity.replace(/[^0-9]/g, ''), 10);
    if (!name.trim() || isNaN(num) || num <= 0 || !address.trim()) {
      Alert.alert('Invalid Input', 'Please provide a valid name, quantity, and address.');
      return;
    }

    setIsSaving(true);
    try {
      await updateDonationDetails(donation.id, {
        food: {
          ...donation.food,
          name: name.trim(),
          quantity: num,
          description: description.trim(),
        },
        pickup: {
          ...donation.pickup,
          address: address.trim(),
          instructions: instructions.trim(),
        },
      });

      Alert.alert('Updated', 'Donation details updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update donation.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !donation) {
    return (
      <ScreenContainer scrollable={true} testID="edit-loading">
        <GlassHeader title="Edit Donation" onBack={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} testID="edit-donation-screen">
      <LoadingOverlay visible={isSaving} message="Saving updates..." />

      <GlassHeader title="Edit Donation" onBack={() => router.back()} />

      <View style={styles.content}>
        <GlassCard variant="standard">
          <Text style={[typography.headingSmall, styles.heading]}>Update Details</Text>
          <Text style={[typography.bodySmall, styles.subheading]}>
            Changes will be reflected immediately in the volunteer matching feed.
          </Text>

          <PrimaryTextInput
            label="Food Title"
            value={name}
            onChangeText={setName}
            required
          />

          <PrimaryTextInput
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            helperText={`Unit: ${donation.food.unit}`}
            required
          />

          <PrimaryTextInput
            label="Description / Notes"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />

          <PrimaryTextInput
            label="Pickup Address"
            value={address}
            onChangeText={setAddress}
            required
          />

          <PrimaryTextInput
            label="Access Instructions"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={2}
          />

          <GlassButton
            title="Save Changes"
            variant="primary"
            size="large"
            icon="checkmark"
            loading={isSaving}
            onPress={handleSave}
            style={styles.saveBtn}
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
  heading: {
    color: colors.text.primary,
    marginBottom: 2,
  },
  subheading: {
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  saveBtn: {
    marginTop: spacing.md,
  },
});
