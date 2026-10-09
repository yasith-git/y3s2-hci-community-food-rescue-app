/**
 * RouteMap Component
 * Interactive map supporting route polyline, origin/destination markers, and rescue opportunity pins.
 */

import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { VolunteerRoute, RouteMatch } from '../../types/route';
import { haptic } from '../../design-system/haptics';

interface RouteMapProps {
  activeRoute: VolunteerRoute | null;
  matches: RouteMatch[];
  selectedMatchId: string | null;
  onSelectMatch: (match: RouteMatch) => void;
  userLocation: { latitude: number; longitude: number } | null;
  style?: object;
}

export function RouteMap({
  activeRoute,
  matches,
  selectedMatchId,
  onSelectMatch,
  userLocation,
  style,
}: RouteMapProps) {
  const mapRef = useRef<MapView>(null);

  // Default region: Colombo, Sri Lanka
  const initialRegion = {
    latitude: activeRoute?.origin.latitude || userLocation?.latitude || 6.9271,
    longitude: activeRoute?.origin.longitude || userLocation?.longitude || 79.8612,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const coordinatesToFit: Array<{ latitude: number; longitude: number }> = [];

    if (activeRoute) {
      coordinatesToFit.push(
        { latitude: activeRoute.origin.latitude, longitude: activeRoute.origin.longitude },
        { latitude: activeRoute.destination.latitude, longitude: activeRoute.destination.longitude }
      );
    }

    if (selectedMatchId) {
      const selected = matches.find((m) => m.donation.id === selectedMatchId);
      if (selected?.donation.pickup.latitude && selected?.donation.pickup.longitude) {
        coordinatesToFit.push({
          latitude: selected.donation.pickup.latitude,
          longitude: selected.donation.pickup.longitude,
        });
      }
    }

    if (coordinatesToFit.length >= 2) {
      mapRef.current.fitToCoordinates(coordinatesToFit, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  }, [activeRoute, selectedMatchId, matches]);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    haptic.selection();

    if (activeRoute) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: activeRoute.origin.latitude, longitude: activeRoute.origin.longitude },
          { latitude: activeRoute.destination.latitude, longitude: activeRoute.destination.longitude },
        ],
        { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true }
      );
    } else if (userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      });
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {/* Active Volunteer Route Polyline */}
        {activeRoute && (
          <>
            <Polyline
              coordinates={[
                { latitude: activeRoute.origin.latitude, longitude: activeRoute.origin.longitude },
                { latitude: activeRoute.destination.latitude, longitude: activeRoute.destination.longitude },
              ]}
              strokeColor={colors.brand.primary}
              strokeWidth={4}
              lineDashPattern={[0]}
            />

            {/* Route Origin Marker */}
            <Marker
              coordinate={{
                latitude: activeRoute.origin.latitude,
                longitude: activeRoute.origin.longitude,
              }}
              title="Start: Your Origin"
              description={activeRoute.origin.address}
            >
              <View style={[styles.endpointMarker, styles.originMarker]}>
                <Ionicons name="radio-button-on" size={16} color="#FFFFFF" />
              </View>
            </Marker>

            {/* Route Destination Marker */}
            <Marker
              coordinate={{
                latitude: activeRoute.destination.latitude,
                longitude: activeRoute.destination.longitude,
              }}
              title="End: Your Destination"
              description={activeRoute.destination.address}
            >
              <View style={[styles.endpointMarker, styles.destinationMarker]}>
                <Ionicons name="flag" size={16} color="#FFFFFF" />
              </View>
            </Marker>
          </>
        )}

        {/* Opportunity Markers */}
        {matches.map((match) => {
          const isSelected = selectedMatchId === match.donation.id;
          const lat = match.donation.pickup.latitude;
          const lon = match.donation.pickup.longitude;

          if (!lat || !lon) return null;

          return (
            <Marker
              key={match.donation.id}
              coordinate={{ latitude: lat, longitude: lon }}
              title={match.donation.food.name}
              description={`${match.donation.food.quantity} ${match.donation.food.unit} • ${match.explanation.detourText}`}
              onPress={() => {
                haptic.selection();
                onSelectMatch(match);
              }}
            >
              <View
                style={[
                  styles.rescueMarker,
                  isSelected && styles.rescueMarkerSelected,
                  match.fitCategory === 'EXCELLENT' && styles.rescueMarkerTopFit,
                ]}
              >
                <Ionicons
                  name="fast-food"
                  size={isSelected ? 18 : 14}
                  color={isSelected ? '#FFFFFF' : colors.brand.primary}
                />
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>
                      +{match.estimatedDetourMinutes}m
                    </Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Map Control Buttons */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenter}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={22} color={colors.brand[900]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 280,
    overflow: 'hidden',
    backgroundColor: colors.surface.secondary,
    borderRadius: radius.lg,
  },
  map: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  endpointMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  originMarker: {
    backgroundColor: colors.status.info,
  },
  destinationMarker: {
    backgroundColor: colors.brand.primary,
  },
  rescueMarker: {
    padding: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  rescueMarkerTopFit: {
    borderColor: colors.status.success,
  },
  rescueMarkerSelected: {
    backgroundColor: colors.brand.primary,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  selectedBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: colors.brand[900],
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  recenterButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
