/**
 * Location Service using Expo Location with fallbacks & permission handling
 * Community Food Rescue App
 */

import * as Location from 'expo-location';
import { GeoPointData } from '../../types/route';

export interface LocationPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

/**
 * Checks current location permission without triggering system prompt.
 */
export async function checkLocationPermission(): Promise<LocationPermissionState> {
  try {
    const { status, canAskAgain, granted } = await Location.getForegroundPermissionsAsync();
    return {
      status,
      canAskAgain,
      granted,
    };
  } catch (error) {
    return {
      status: Location.PermissionStatus.UNDETERMINED,
      canAskAgain: true,
      granted: false,
    };
  }
}

/**
 * Requests foreground location permission on demand (e.g., when user taps 'Use Current Location').
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch (error) {
    console.warn('[LocationService] Permission request failed:', error);
    return false;
  }
}

/**
 * Retrieves the current GPS position with safe timeouts and reverse geocodes to an address.
 */
export async function getCurrentGeoPosition(): Promise<GeoPointData | null> {
  try {
    const isGranted = await requestLocationPermission();
    if (!isGranted) {
      return null;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = pos.coords;

    // Attempt reverse geocoding
    let formattedAddress = 'Current Location';
    try {
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverse && reverse.length > 0) {
        const item = reverse[0];
        const parts = [
          item.name || item.street,
          item.district || item.subregion || item.city,
          item.region,
        ].filter(Boolean);
        if (parts.length > 0) {
          formattedAddress = parts.join(', ');
        }
      }
    } catch {
      // Keep 'Current Location' fallback
    }

    return {
      address: formattedAddress,
      latitude,
      longitude,
    };
  } catch (error) {
    console.warn('[LocationService] getCurrentGeoPosition failed:', error);
    return null;
  }
}

/**
 * Geocodes a manual text address into latitude and longitude coordinates.
 */
export async function geocodeManualAddress(address: string): Promise<GeoPointData | null> {
  const trimmed = address.trim();
  if (!trimmed || trimmed.length < 3) {
    return null;
  }

  try {
    const results = await Location.geocodeAsync(trimmed);
    if (results && results.length > 0) {
      return {
        address: trimmed,
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
    }
    return null;
  } catch (error) {
    console.warn('[LocationService] Geocoding error for address:', address, error);
    return null;
  }
}
