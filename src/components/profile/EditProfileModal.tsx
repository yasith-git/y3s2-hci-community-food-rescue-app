/**
 * EditProfileModal
 * Shared self-service profile editor for Donor & Volunteer accounts.
 *
 * Lets the signed-in user update:
 *   - Profile photo (gallery / camera / remove)
 *   - Full name
 *   - Date of birth (DD/MM/YYYY with live formatting + validation)
 *   - Mobile number
 *
 * Email & role are shown read-only. Self-contained: reads/writes via
 * `useAuth().saveProfileDetails` and does not depend on any screen state.
 */

import React, { useMemo, useState } from 'react';
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
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { PrimaryTextInput } from '../ui/PrimaryTextInput';
import { Avatar } from '../ui/Avatar';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { haptic } from '../../design-system/haptics';
import { useAuth } from '../../contexts/AuthContext';
import { AvatarChange } from '../../services/profile/profile.service';
import {
  ProfileDetailsErrors,
  calculateAge,
  dobDisplayToIso,
  formatDobInput,
  isoToDobDisplay,
  sanitizePhoneInput,
  validateProfileDetails,
} from '../../services/profile/profile.validation';

export interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called after a successful save */
  onSaved?: () => void;
  testID?: string;
}

export function EditProfileModal({ visible, onClose, onSaved, testID }: EditProfileModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {visible && <EditProfileSheet onClose={onClose} onSaved={onSaved} testID={testID} />}
    </Modal>
  );
}

interface EditProfileSheetProps {
  onClose: () => void;
  onSaved?: () => void;
  testID?: string;
}

function EditProfileSheet({ onClose, onSaved, testID }: EditProfileSheetProps) {
  const { profile, user, saveProfileDetails } = useAuth();

  const initialName = profile?.fullName || user?.user_metadata?.full_name || '';
  const initialPhone = profile?.phoneNumber || '';
  const initialDob = isoToDobDisplay(profile?.dateOfBirth);
  const currentAvatarUrl = profile?.avatarUrl || null;

  const [fullName, setFullName] = useState(initialName);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [dobText, setDobText] = useState(initialDob);
  const [avatarChange, setAvatarChange] = useState<AvatarChange>({ kind: 'keep' });
  const [errors, setErrors] = useState<ProfileDetailsErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const previewUri =
    avatarChange.kind === 'replace'
      ? avatarChange.uri
      : avatarChange.kind === 'remove'
      ? undefined
      : currentAvatarUrl || undefined;

  React.useEffect(() => {
    setImageLoadError(false);
  }, [previewUri]);

  const isDirty = useMemo(
    () =>
      fullName.trim() !== initialName.trim() ||
      phoneNumber.trim() !== initialPhone.trim() ||
      dobText.trim() !== initialDob.trim() ||
      avatarChange.kind !== 'keep',
    [fullName, phoneNumber, dobText, avatarChange, initialName, initialPhone, initialDob]
  );

  const agePreview = useMemo(() => {
    const iso = dobDisplayToIso(dobText);
    if (!iso) return null;
    const age = calculateAge(iso);
    return age >= 0 && age <= 120 ? age : null;
  }, [dobText]);

  // -------------------------------------------------------------------------
  // Photo selection
  // -------------------------------------------------------------------------

  const applyPickerResult = (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setAvatarChange({
        kind: 'replace',
        uri: asset.uri,
        base64: asset.base64 ?? null,
        mimeType: asset.mimeType ?? null,
      });
      setSubmitError(null);
      haptic.light();
    }
  };

  const pickFromLibrary = async () => {
    if (isPicking || isSaving) return;
    setIsPicking(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setSubmitError('Photo library permission is needed to choose a profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      applyPickerResult(result);
    } catch (err) {
      console.warn('[EditProfile] Library picker error:', err);
      setSubmitError('Could not open your photo library. Please try again.');
    } finally {
      setIsPicking(false);
    }
  };

  const takePhoto = async () => {
    if (isPicking || isSaving) return;
    setIsPicking(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setSubmitError('Camera permission is needed to take a profile photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      applyPickerResult(result);
    } catch (err) {
      console.warn('[EditProfile] Camera error:', err);
      setSubmitError('Could not open the camera. Please try again.');
    } finally {
      setIsPicking(false);
    }
  };

  const removePhoto = () => {
    haptic.selection();
    // If the user only picked a new (unsaved) photo, just discard it
    if (avatarChange.kind === 'replace' && !currentAvatarUrl) {
      setAvatarChange({ kind: 'keep' });
      return;
    }
    setAvatarChange({ kind: 'remove' });
  };

  // -------------------------------------------------------------------------
  // Close / Save
  // -------------------------------------------------------------------------

  const requestClose = () => {
    if (isSaving) return;
    if (!isDirty) {
      onClose();
      return;
    }
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Discard your unsaved profile changes?')) {
        onClose();
      }
      return;
    }
    Alert.alert('Discard changes?', 'Your unsaved profile changes will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onClose },
    ]);
  };

  const handleSave = async () => {
    setSubmitError(null);
    const { isValid, errors: validationErrors } = validateProfileDetails({
      fullName,
      phoneNumber,
      dateOfBirthText: dobText,
    });
    setErrors(validationErrors);
    if (!isValid) {
      haptic.warning();
      return;
    }
    if (!isDirty) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await saveProfileDetails({
        fullName,
        phoneNumber,
        dateOfBirth: dobText.trim() ? dobDisplayToIso(dobText) : null,
        avatar: avatarChange,
        currentAvatarUrl,
      });
      haptic.success();
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.warn('[EditProfile] Save failed:', err);
      haptic.error();
      setSubmitError(err?.message || 'Failed to save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = fullName.trim() || initialName || 'Member';
  const hasPhoto = Boolean(previewUri);

  return (
    <KeyboardAvoidingView
      style={styles.backdrop}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={requestClose} />

        <GlassCard variant="elevated" style={styles.sheet} testID={testID}>
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.headingSmall, styles.title]}>Edit Profile</Text>
              <Text style={[typography.caption, styles.subtitle]}>
                Keep your details up to date for smoother rescues
              </Text>
            </View>
            <TouchableOpacity
              onPress={requestClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close profile editor"
              testID="edit-profile-close"
            >
              <Ionicons name="close" size={22} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}
            keyboardShouldPersistTaps="handled"
          >
            {/* Photo section */}
            <View style={styles.photoSection}>
              <View style={styles.avatarWrapper}>
                {hasPhoto && !imageLoadError ? (
                  <Image
                    source={{ uri: previewUri }}
                    onError={() => setImageLoadError(true)}
                    style={styles.avatarImage}
                    accessibilityLabel="Profile photo preview"
                  />
                ) : (
                  <Avatar name={displayName} size="xlarge" />
                )}
                <TouchableOpacity
                  style={styles.cameraBadge}
                  onPress={pickFromLibrary}
                  disabled={isPicking || isSaving}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                  testID="edit-profile-photo-badge"
                >
                  {isPicking ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : (
                    <Ionicons name="camera" size={16} color={colors.text.inverse} />
                  )}
                </TouchableOpacity>
              </View>

              {avatarChange.kind !== 'keep' && (
                <Text style={[typography.caption, styles.photoHint]}>
                  {avatarChange.kind === 'replace' ? 'New photo selected — save to apply' : 'Photo will be removed on save'}
                </Text>
              )}

              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.photoActionBtn}
                  onPress={pickFromLibrary}
                  disabled={isPicking || isSaving}
                  testID="edit-profile-pick-gallery"
                >
                  <Ionicons name="images-outline" size={16} color={colors.brand.primary} />
                  <Text style={[typography.labelMedium, styles.photoActionText]}>Gallery</Text>
                </TouchableOpacity>

                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={styles.photoActionBtn}
                    onPress={takePhoto}
                    disabled={isPicking || isSaving}
                    testID="edit-profile-take-photo"
                  >
                    <Ionicons name="camera-outline" size={16} color={colors.brand.primary} />
                    <Text style={[typography.labelMedium, styles.photoActionText]}>Camera</Text>
                  </TouchableOpacity>
                )}

                {hasPhoto && (
                  <TouchableOpacity
                    style={[styles.photoActionBtn, styles.photoRemoveBtn]}
                    onPress={removePhoto}
                    disabled={isPicking || isSaving}
                    testID="edit-profile-remove-photo"
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.status.error} />
                    <Text style={[typography.labelMedium, { color: colors.status.error }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Details */}
            <PrimaryTextInput
              label="Full Name"
              required
              placeholder="e.g. Nimal Perera"
              value={fullName}
              onChangeText={(t) => {
                setFullName(t);
                if (errors.fullName) setErrors((e) => ({ ...e, fullName: undefined }));
              }}
              leftIcon="person-outline"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              maxLength={80}
              error={errors.fullName}
              editable={!isSaving}
              testID="edit-profile-name-input"
            />

            <PrimaryTextInput
              label="Date of Birth"
              placeholder="DD/MM/YYYY"
              value={dobText}
              onChangeText={(t) => {
                setDobText(formatDobInput(t));
                if (errors.dateOfBirth) setErrors((e) => ({ ...e, dateOfBirth: undefined }));
              }}
              leftIcon="calendar-outline"
              keyboardType="number-pad"
              maxLength={10}
              error={errors.dateOfBirth}
              helperText={agePreview !== null ? `Age: ${agePreview} years` : 'Optional · format DD/MM/YYYY'}
              editable={!isSaving}
              testID="edit-profile-dob-input"
            />

            <PrimaryTextInput
              label="Mobile Number"
              placeholder="+94 77 123 4567"
              value={phoneNumber}
              onChangeText={(t) => {
                setPhoneNumber(sanitizePhoneInput(t));
                if (errors.phoneNumber) setErrors((e) => ({ ...e, phoneNumber: undefined }));
              }}
              leftIcon="call-outline"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={20}
              error={errors.phoneNumber}
              helperText="Used by coordinators to contact you about rescues"
              editable={!isSaving}
              testID="edit-profile-phone-input"
            />

            <PrimaryTextInput
              label="Email"
              value={profile?.email || user?.email || ''}
              leftIcon="mail-outline"
              editable={false}
              helperText="Email is linked to your login and cannot be changed here"
              testID="edit-profile-email-input"
            />

            {submitError && (
              <View style={styles.errorBanner} testID="edit-profile-error">
                <Ionicons name="alert-circle" size={18} color={colors.status.error} />
                <Text style={[typography.bodySmall, styles.errorBannerText]}>{submitError}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <GlassButton
              title="Cancel"
              variant="secondary"
              onPress={requestClose}
              disabled={isSaving}
              style={styles.footerBtn}
              testID="edit-profile-cancel"
            />
            <GlassButton
              title={isSaving ? 'Saving...' : 'Save Changes'}
              variant="primary"
              icon="checkmark-circle-outline"
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving || isPicking}
              style={styles.footerBtn}
              testID="edit-profile-save"
            />
          </View>
        </GlassCard>
      </KeyboardAvoidingView>
  );
}

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '92%',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.muted,
    marginTop: 2,
  },
  scrollArea: {
    marginBottom: spacing.md,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.brand[100],
    backgroundColor: colors.surface.subtle,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.pure,
  },
  photoHint: {
    color: colors.brand[600],
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brand[50],
    borderWidth: 1,
    borderColor: colors.status.successBorder,
  },
  photoRemoveBtn: {
    backgroundColor: colors.status.errorBg,
    borderColor: colors.status.errorBorder,
  },
  photoActionText: {
    color: colors.brand.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.status.errorBg,
    borderColor: colors.status.errorBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    color: colors.status.error,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerBtn: {
    flex: 1,
  },
});
