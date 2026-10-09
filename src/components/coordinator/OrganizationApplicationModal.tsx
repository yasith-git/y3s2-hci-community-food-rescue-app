/**
 * Organization Application Modal / Screen for Coordinators
 * 4-step mobile wizard for submitting Verified Community Organization credentials.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GlassCard,
  GlassButton,
  PrimaryTextInput,
  GlassChip,
  SectionHeader,
  LoadingOverlay,
} from '../ui';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { haptic } from '../../design-system/haptics';
import { submitOrganizationApplication } from '../../services/organization/organization.service';

const ORG_TYPES = [
  'Food Bank',
  'Charity',
  'Community Pantry',
  'Shelter',
  'Religious Welfare',
  'Community Kitchen',
  'Other',
];

const STORAGE_OPTIONS = ['Ambient', 'Refrigerated', 'Chilled', 'Frozen'];

interface OrganizationApplicationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultEmail?: string;
  defaultName?: string;
}

export const OrganizationApplicationModal: React.FC<OrganizationApplicationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  defaultEmail = '',
  defaultName = '',
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Organization Info
  const [orgName, setOrgName] = useState(defaultName);
  const [orgType, setOrgType] = useState('Community Pantry');
  const [regNumber, setRegNumber] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Contact & Location
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cityArea, setCityArea] = useState('Colombo');

  // Step 3: Distribution Capacity & Storage
  const [capacityPeople, setCapacityPeople] = useState('50');
  const [serviceRadiusKm, setServiceRadiusKm] = useState('15');
  const [selectedStorage, setSelectedStorage] = useState<string[]>(['Ambient', 'Refrigerated']);

  const toggleStorage = (option: string) => {
    haptic.selection();
    if (selectedStorage.includes(option)) {
      if (selectedStorage.length > 1) {
        setSelectedStorage(selectedStorage.filter((s) => s !== option));
      }
    } else {
      setSelectedStorage([...selectedStorage, option]);
    }
  };

  const handleNext = () => {
    setError('');
    haptic.selection();
    if (step === 1) {
      if (!orgName.trim()) {
        setError('Please enter your organization name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!contactEmail.trim() || !contactPhone.trim() || !address.trim()) {
        setError('Please complete all contact and address fields.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const cap = parseInt(capacityPeople, 10);
      if (isNaN(cap) || cap <= 0) {
        setError('Please enter a valid distribution capacity.');
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    setError('');
    haptic.selection();
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await submitOrganizationApplication({
        name: orgName.trim(),
        organizationType: orgType,
        registrationNumber: regNumber.trim() || undefined,
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        address: address.trim(),
        cityArea: cityArea.trim(),
        serviceRadiusKm: parseFloat(serviceRadiusKm) || 15,
        description: description.trim() || undefined,
        distributionCapacityPeople: parseInt(capacityPeople, 10) || 50,
        storageCapabilities: selectedStorage,
        acceptedFoodCategories: ['All'],
      });
      haptic.success();
      Alert.alert(
        'Application Submitted',
        'Your verified organization application has been submitted for platform review.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to submit application.');
      haptic.error();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <LoadingOverlay visible={isSubmitting} message="Submitting organization application..." />

          {/* Header with Progress Steps */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[typography.headingSmall, styles.title]}>Organization Application</Text>
              <Text style={[typography.caption, styles.subtitle]}>
                Step {step} of 4 — {step === 1 ? 'Details' : step === 2 ? 'Location' : step === 3 ? 'Capacity' : 'Review'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressRow}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressBar,
                  i <= step ? styles.progressBarActive : styles.progressBarInactive,
                ]}
              />
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.status.error} />
                <Text style={[typography.bodySmall, styles.errorText]}>{error}</Text>
              </View>
            )}

            {/* STEP 1: Organization Information */}
            {step === 1 && (
              <View>
                <PrimaryTextInput
                  label="Organization / Community Name"
                  placeholder="e.g. Hope Community Food Pantry"
                  value={orgName}
                  onChangeText={setOrgName}
                  leftIcon="business-outline"
                  required
                />

                <Text style={[typography.labelMedium, styles.fieldLabel]}>Organization Type</Text>
                <View style={styles.chipGrid}>
                  {ORG_TYPES.map((type) => (
                    <GlassChip
                      key={type}
                      label={type}
                      selected={orgType === type}
                      onPress={() => {
                        haptic.selection();
                        setOrgType(type);
                      }}
                    />
                  ))}
                </View>

                <PrimaryTextInput
                  label="Registration / Trust Reference (Optional)"
                  placeholder="e.g. NGO-LK-8921 or Campus Student Org"
                  value={regNumber}
                  onChangeText={setRegNumber}
                  leftIcon="document-text-outline"
                />

                <PrimaryTextInput
                  label="Brief Description of Activities"
                  placeholder="e.g. Distributes evening meals to low-income university students."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            {/* STEP 2: Contact & Location */}
            {step === 2 && (
              <View>
                <PrimaryTextInput
                  label="Official Contact Email"
                  placeholder="e.g. coordinator@hopepantry.org"
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                  required
                />

                <PrimaryTextInput
                  label="Official Contact Phone"
                  placeholder="e.g. +94 77 123 4567"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                  required
                />

                <PrimaryTextInput
                  label="Physical Hub Address"
                  placeholder="e.g. 42 Main St, Colombo 03"
                  value={address}
                  onChangeText={setAddress}
                  leftIcon="location-outline"
                  required
                />

                <PrimaryTextInput
                  label="City / Service Area"
                  placeholder="e.g. Colombo & Suburbs"
                  value={cityArea}
                  onChangeText={setCityArea}
                  leftIcon="navigate-outline"
                  required
                />
              </View>
            )}

            {/* STEP 3: Distribution Capacity & Storage */}
            {step === 3 && (
              <View>
                <PrimaryTextInput
                  label="Typical Distribution Capacity (People Served per Batch)"
                  placeholder="e.g. 50"
                  value={capacityPeople}
                  onChangeText={setCapacityPeople}
                  keyboardType="number-pad"
                  leftIcon="people-outline"
                  required
                />

                <PrimaryTextInput
                  label="Service Radius (km)"
                  placeholder="e.g. 15"
                  value={serviceRadiusKm}
                  onChangeText={setServiceRadiusKm}
                  keyboardType="number-pad"
                  leftIcon="map-outline"
                  required
                />

                <Text style={[typography.labelMedium, styles.fieldLabel]}>Storage Capabilities Available</Text>
                <View style={styles.chipGrid}>
                  {STORAGE_OPTIONS.map((opt) => (
                    <GlassChip
                      key={opt}
                      label={opt}
                      selected={selectedStorage.includes(opt)}
                      onPress={() => toggleStorage(opt)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* STEP 4: Review & Submit */}
            {step === 4 && (
              <View>
                <GlassCard variant="standard" style={styles.reviewCard}>
                  <SectionHeader title="Application Summary" />
                  <Text style={[typography.labelMedium, styles.reviewLabel]}>Organization</Text>
                  <Text style={[typography.bodyMedium, styles.reviewValue]}>{orgName} ({orgType})</Text>

                  <Text style={[typography.labelMedium, styles.reviewLabel]}>Contact & Location</Text>
                  <Text style={[typography.bodyMedium, styles.reviewValue]}>{contactPhone} • {contactEmail}</Text>
                  <Text style={[typography.bodySmall, styles.reviewSubValue]}>{address}, {cityArea}</Text>

                  <Text style={[typography.labelMedium, styles.reviewLabel]}>Distribution Capacity</Text>
                  <Text style={[typography.bodyMedium, styles.reviewValue]}>
                    ~{capacityPeople} people served • Storage: {selectedStorage.join(', ')}
                  </Text>
                </GlassCard>

                <View style={styles.trustCallout}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.brand.primary} />
                  <Text style={[typography.caption, styles.trustText]}>
                    By submitting, you certify that food rescues will be distributed safely to community beneficiaries without commercial resale.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modal Navigation Buttons */}
          <View style={styles.footerRow}>
            {step > 1 && (
              <View style={styles.footerBtnHalf}>
                <GlassButton title="Back" variant="secondary" onPress={handleBack} />
              </View>
            )}

            <View style={styles.footerBtnHalf}>
              {step < 4 ? (
                <GlassButton title="Next Step" variant="primary" onPress={handleNext} />
              ) : (
                <GlassButton title="Submit Application" variant="primary" onPress={handleSubmit} />
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.text.secondary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: radius.xs,
  },
  progressBarActive: {
    backgroundColor: colors.brand.primary,
  },
  progressBarInactive: {
    backgroundColor: colors.surface.border,
  },
  scrollBody: {
    paddingBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.status.error,
    flex: 1,
  },
  reviewCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reviewLabel: {
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  reviewValue: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  reviewSubValue: {
    color: colors.text.secondary,
  },
  trustCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brand[50],
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand[100],
    marginBottom: spacing.md,
  },
  trustText: {
    color: colors.brand[800],
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  footerBtnHalf: {
    flex: 1,
  },
});
