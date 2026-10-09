/**
 * Clarification Request Modal
 * Allows coordinators to ask targeted operational questions to the donor.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassCard,
  GlassButton,
  GlassChip,
  GlassHeader,
  PrimaryTextInput,
} from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { haptic } from '../../design-system/haptics';
import { ClarificationCategory } from '../../types/coordinator';
import { Donation } from '../../types/donation';

interface ClarificationModalProps {
  visible: boolean;
  donation: Donation | null;
  onClose: () => void;
  onSubmit: (category: ClarificationCategory, message: string) => Promise<void>;
}

const CATEGORIES: { key: ClarificationCategory; label: string; icon: any }[] = [
  { key: 'ALLERGENS', label: 'Allergens', icon: 'warning-outline' },
  { key: 'PREPARATION_TIME', label: 'Prep Time', icon: 'timer-outline' },
  { key: 'STORAGE', label: 'Storage', icon: 'snow-outline' },
  { key: 'PACKAGING', label: 'Packaging', icon: 'cube-outline' },
  { key: 'INGREDIENTS', label: 'Ingredients', icon: 'restaurant-outline' },
  { key: 'QUANTITY', label: 'Quantity', icon: 'layers-outline' },
  { key: 'PICKUP_DETAILS', label: 'Pickup', icon: 'location-outline' },
  { key: 'OTHER', label: 'Other', icon: 'chatbox-outline' },
];

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  visible,
  donation,
  onClose,
  onSubmit,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ClarificationCategory>('ALLERGENS');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!donation) return null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Question Required', 'Please type your operational question for the donor.');
      return;
    }

    if (message.trim().length > 500) {
      Alert.alert('Too Long', 'Please keep your message under 500 characters.');
      return;
    }

    setIsSubmitting(true);
    haptic.selection();

    try {
      await onSubmit(selectedCategory, message.trim());
      haptic.success();
      setMessage('');
      onClose();
      Alert.alert(
        'Question Sent',
        'Your question has been sent to the donor. You will receive an in-app notification as soon as they respond.'
      );
    } catch (error: any) {
      console.warn('[ClarificationModal] Error:', error);
      Alert.alert('Submission Error', error?.message || 'Could not send question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <GlassHeader
          title="Ask Donor a Question"
          subtitle={donation.food.name}
          onBack={onClose}
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Picker Card */}
          <GlassCard variant="standard" style={styles.card}>
            <Text style={[typography.labelLarge, styles.sectionTitle]}>
              Select Question Category
            </Text>
            <View style={styles.chipsContainer}>
              {CATEGORIES.map((cat) => (
                <GlassChip
                  key={cat.key}
                  label={cat.label}
                  icon={cat.icon}
                  selected={selectedCategory === cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                />
              ))}
            </View>
          </GlassCard>

          {/* Question Text Input */}
          <GlassCard variant="standard" style={styles.card}>
            <Text style={[typography.labelLarge, styles.sectionTitle]}>Your Question</Text>
            <PrimaryTextInput
              label="Operational Question for Donor"
              placeholder="e.g. Does this prepared dish contain any peanut oil or sesame seeds?"
              value={message}
              onChangeText={setMessage}
              multiline={true}
              numberOfLines={4}
              maxLength={500}
              leftIcon="chatbubble-ellipses-outline"
            />
            <Text style={[typography.caption, styles.counterText]}>
              {message.length} / 500 characters
            </Text>
          </GlassCard>

          <View style={styles.footer}>
            <GlassButton
              title="Send Question to Donor"
              variant="primary"
              icon="send-outline"
              loading={isSubmitting}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.primary,
  },
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
  },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  counterText: {
    color: colors.text.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
});
