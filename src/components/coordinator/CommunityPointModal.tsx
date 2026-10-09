/**
 * Community Collection Point Modal
 * Form for creating or editing community collection hubs with location support.
 */

import React, { useState, useEffect } from 'react';
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
import {
  GlassCard,
  GlassButton,
  PrimaryTextInput,
  GlassHeader,
} from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { haptic } from '../../design-system/haptics';
import { CommunityPoint, CreateCommunityPointInput } from '../../types/coordinator';
import { getCurrentGeoPosition } from '../../services/location/location.service';

interface CommunityPointModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: CreateCommunityPointInput) => Promise<void>;
  initialPoint?: CommunityPoint | null;
  organizationName?: string;
}

export const CommunityPointModal: React.FC<CommunityPointModalProps> = ({
  visible,
  onClose,
  onSave,
  initialPoint,
  organizationName = 'Community Partner Hub',
}) => {
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(6.9271); // Default Colombo
  const [longitude, setLongitude] = useState(79.8612);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialPoint) {
      setLabel(initialPoint.label);
      setAddress(initialPoint.address);
      setLatitude(initialPoint.latitude);
      setLongitude(initialPoint.longitude);
      setContactName(initialPoint.contactName);
      setContactPhone(initialPoint.contactPhone);
      setOperatingHours(initialPoint.operatingHours || '');
      setInstructions(initialPoint.instructions || '');
    } else {
      setLabel('');
      setAddress('');
      setLatitude(6.9271);
      setLongitude(79.8612);
      setContactName('');
      setContactPhone('');
      setOperatingHours('8:00 AM - 8:00 PM');
      setInstructions('');
    }
  }, [initialPoint, visible]);

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    haptic.selection();
    try {
      const geo = await getCurrentGeoPosition();
      if (geo) {
        setLatitude(geo.latitude);
        setLongitude(geo.longitude);
        if (geo.address) {
          setAddress(geo.address);
        }
        haptic.success();
      } else {
        Alert.alert('Location Unavailable', 'Could not retrieve GPS coordinates. You can enter the address manually.');
      }
    } catch {
      Alert.alert('Location Error', 'Unable to fetch current GPS location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert('Missing Field', 'Please enter a name or label for this collection hub.');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Missing Field', 'Please enter the physical drop-off address.');
      return;
    }
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      Alert.alert('Invalid Coordinate', 'Latitude must be between -90 and 90 degrees.');
      return;
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      Alert.alert('Invalid Coordinate', 'Longitude must be between -180 and 180 degrees.');
      return;
    }

    setIsSaving(true);
    haptic.selection();

    try {
      await onSave({
        coordinatorId: initialPoint?.coordinatorId || '',
        organizationName,
        label: label.trim(),
        address: address.trim(),
        latitude,
        longitude,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        operatingHours: operatingHours.trim(),
        instructions: instructions.trim(),
        isActive: true,
      });
      haptic.success();
      onClose();
    } catch (error: any) {
      console.warn('[CommunityPointModal] Save error:', error);
      Alert.alert('Save Failed', error?.message || 'Could not save collection hub.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <GlassHeader
          title={initialPoint ? 'Edit Collection Point' : 'New Collection Point'}
          subtitle="Community Food Hub"
          onBack={onClose}
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard variant="standard" style={styles.card}>
            <Text style={[typography.headingSmall, styles.sectionTitle]}>Hub Details</Text>

            <PrimaryTextInput
              label="Hub Name / Label"
              placeholder="e.g. Hope Community Centre Hub"
              value={label}
              onChangeText={setLabel}
              leftIcon="business-outline"
            />

            <PrimaryTextInput
              label="Physical Drop-Off Address"
              placeholder="Street address, building, floor..."
              value={address}
              onChangeText={setAddress}
              leftIcon="location-outline"
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.xs }}>
              <View style={{ flex: 1 }}>
                <PrimaryTextInput
                  label="Latitude (-90 to 90)"
                  placeholder="e.g. 6.9271"
                  value={latitude.toString()}
                  onChangeText={(val) => {
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed)) setLatitude(parsed);
                  }}
                  keyboardType="numeric"
                  leftIcon="navigate-outline"
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryTextInput
                  label="Longitude (-180 to 180)"
                  placeholder="e.g. 79.8612"
                  value={longitude.toString()}
                  onChangeText={(val) => {
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed)) setLongitude(parsed);
                  }}
                  keyboardType="numeric"
                  leftIcon="navigate-outline"
                />
              </View>
            </View>

            <GlassButton
              title={isLocating ? 'Locating...' : 'Use Current GPS Location'}
              variant="secondary"
              icon="locate-outline"
              size="small"
              loading={isLocating}
              onPress={handleUseCurrentLocation}
            />
          </GlassCard>

          <GlassCard variant="standard" style={styles.card}>
            <Text style={[typography.headingSmall, styles.sectionTitle]}>On-Site Contact & Hours</Text>

            <PrimaryTextInput
              label="Contact Person Name"
              placeholder="e.g. Sarah Perera (Pantry Lead)"
              value={contactName}
              onChangeText={setContactName}
              leftIcon="person-outline"
            />

            <PrimaryTextInput
              label="Contact Phone Number"
              placeholder="e.g. 077 123 4567"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />

            <PrimaryTextInput
              label="Operating Receiving Hours"
              placeholder="e.g. Mon-Sat 8:00 AM - 7:00 PM"
              value={operatingHours}
              onChangeText={setOperatingHours}
              leftIcon="time-outline"
            />

            <PrimaryTextInput
              label="Handover Instructions for Volunteers"
              placeholder="e.g. Ring bell at Side Entrance #2. Ask for Kitchen Coordinator."
              value={instructions}
              onChangeText={setInstructions}
              multiline={true}
              numberOfLines={3}
              leftIcon="information-circle-outline"
            />
          </GlassCard>

          <View style={styles.footer}>
            <GlassButton
              title={initialPoint ? 'Update Collection Hub' : 'Save Collection Hub'}
              variant="primary"
              icon="save-outline"
              loading={isSaving}
              onPress={handleSave}
            />
            <GlassButton
              title="Cancel / Back"
              variant="secondary"
              icon="arrow-back-outline"
              disabled={isSaving}
              onPress={() => {
                haptic.selection();
                onClose();
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
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
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
});
