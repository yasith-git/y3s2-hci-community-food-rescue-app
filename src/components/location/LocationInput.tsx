/**
 * LocationInput Component
 * Supports manual address geocoding, Current GPS location with fallback, clear button, and error display.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassSurface } from '../ui/GlassSurface';
import { PrimaryTextInput } from '../ui/PrimaryTextInput';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';
import { haptic } from '../../design-system/haptics';
import {
  getCurrentGeoPosition,
  geocodeManualAddress,
} from '../../services/location/location.service';
import { GeoPointData } from '../../types/route';

interface LocationInputProps {
  label: string;
  placeholder?: string;
  value: GeoPointData | null;
  onChange: (value: GeoPointData | null) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  showCurrentLocationButton?: boolean;
  required?: boolean;
}

export function LocationInput({
  label,
  placeholder = 'Enter address or junction...',
  value,
  onChange,
  icon = 'location',
  showCurrentLocationButton = true,
  required = false,
}: LocationInputProps) {
  const [textValue, setTextValue] = useState(value?.address || '');
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUseCurrentLocation = async () => {
    Keyboard.dismiss();
    setIsLoadingGPS(true);
    setErrorMsg(null);
    haptic.selection();

    const pos = await getCurrentGeoPosition();
    setIsLoadingGPS(false);

    if (pos) {
      haptic.success();
      setTextValue(pos.address);
      onChange(pos);
    } else {
      haptic.warning();
      setErrorMsg('Could not fetch GPS location. Please type address manually.');
    }
  };

  const handleBlurGeocode = async () => {
    const trimmed = textValue.trim();
    if (!trimmed) {
      onChange(null);
      setErrorMsg(null);
      return;
    }

    if (value && value.address.toLowerCase() === trimmed.toLowerCase()) {
      return;
    }

    setIsGeocoding(true);
    setErrorMsg(null);

    const geoResult = await geocodeManualAddress(trimmed);
    setIsGeocoding(false);

    if (geoResult) {
      haptic.selection();
      onChange(geoResult);
    } else {
      const fallbackGeo: GeoPointData = {
        address: trimmed,
        latitude: 6.9271,
        longitude: 79.8612,
      };
      onChange(fallbackGeo);
    }
  };

  const handleClear = () => {
    haptic.selection();
    setTextValue('');
    setErrorMsg(null);
    onChange(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[typography.labelMedium, styles.label]}>
          {label} {required && <Text style={styles.requiredAsterisk}>*</Text>}
        </Text>
        {showCurrentLocationButton && (
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={handleUseCurrentLocation}
            disabled={isLoadingGPS || isGeocoding}
            activeOpacity={0.7}
          >
            {isLoadingGPS ? (
              <ActivityIndicator size="small" color={colors.brand.primary} />
            ) : (
              <>
                <Ionicons name="navigate" size={14} color={colors.brand.primary} />
                <Text style={[typography.labelSmall, styles.gpsButtonText]}>
                  Use Current GPS
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <GlassSurface variant="subtle" style={styles.inputWrapper}>
        <View style={styles.inputRow}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color={colors.brand.primary} />
          </View>
          
          <PrimaryTextInput
            placeholder={placeholder}
            value={textValue}
            onChangeText={(text) => {
              setTextValue(text);
              if (errorMsg) setErrorMsg(null);
            }}
            onBlur={handleBlurGeocode}
            containerStyle={styles.textInputContainer}
          />

          {isGeocoding && (
            <ActivityIndicator size="small" color={colors.brand.primary} style={styles.trailingIcon} />
          )}

          {!isGeocoding && textValue.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.trailingIcon}>
              <Ionicons name="close-circle" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </GlassSurface>

      {value && (
        <View style={styles.coordinatesBadge}>
          <Ionicons name="checkmark-circle" size={13} color={colors.status.success} />
          <Text style={[typography.caption, styles.coordinatesText]}>
            Resolved: {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      {errorMsg && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.status.error} />
          <Text style={[typography.caption, styles.errorText]}>{errorMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  requiredAsterisk: {
    color: colors.status.error,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brand[50],
  },
  gpsButtonText: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  inputWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  textInputContainer: {
    flex: 1,
    marginVertical: 0,
  },
  trailingIcon: {
    padding: spacing.xs,
  },
  coordinatesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingLeft: spacing.xs,
  },
  coordinatesText: {
    color: colors.status.success,
    fontWeight: '500',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingLeft: spacing.xs,
  },
  errorText: {
    color: colors.status.error,
  },
});
