/**
 * Root Layout with Centralized AuthProvider and Role-Aware Route Protection
 * Community Food Rescue App
 */

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { AppBackground } from '../src/components/ui';
import { colors } from '../src/design-system/colors';
import { typography } from '../src/design-system/typography';
import { radius } from '../src/design-system/radius';
import { Ionicons } from '@expo/vector-icons';

function RootNavigation() {
  const { isAuthenticated, isLoading, isEmailVerified, role, isConfigured } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const segArray = segments as string[];
    const inAuthGroup = segArray[0] === '(auth)';
    const inDonorGroup = segArray[0] === '(donor)';
    const inVolunteerGroup = segArray[0] === '(volunteer)';
    const inCoordinatorGroup = segArray[0] === '(coordinator)';

    const isAtRoot = segArray.length === 0 || segArray[0] === undefined || segArray[0] === 'index';

    // If unauthenticated, redirect to onboarding if trying to access protected role areas or at root
    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(auth)/onboarding');
      }
      return;
    }

    // If authenticated but email is not verified, require verification
    if (!isEmailVerified) {
      if (segArray[1] !== 'verify-email') {
        router.replace('/(auth)/verify-email');
      }
      return;
    }

    // If authenticated + verified but no role chosen, require role selection
    if (!role) {
      if (segArray[1] !== 'role-selection') {
        router.replace('/(auth)/role-selection');
      }
      return;
    }

    // If authenticated + verified + role chosen, route to correct module if in auth group or at root
    if (inAuthGroup || isAtRoot) {
      if (role === 'DONOR') {
        router.replace('/(donor)');
      } else if (role === 'VOLUNTEER') {
        router.replace('/(volunteer)');
      } else if (role === 'COORDINATOR') {
        router.replace('/(coordinator)');
      }
    }
  }, [isAuthenticated, isLoading, isEmailVerified, role, segments]);

  if (isLoading) {
    return (
      <AppBackground>
        <View style={styles.splashContainer}>
          <View style={styles.splashLogo}>
            <Ionicons name="leaf" size={44} color={colors.brand.primary} />
          </View>
          <Text style={[typography.headingLarge, styles.splashTitle]}>Food Rescue</Text>
          <Text style={[typography.bodyMedium, styles.splashSubtitle]}>
            Connecting Surplus to Community
          </Text>
          <ActivityIndicator
            size="small"
            color={colors.brand.primary}
            style={styles.splashSpinner}
          />
        </View>
      </AppBackground>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(donor)" />
        <Stack.Screen name="(volunteer)" />
        <Stack.Screen name="(coordinator)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashLogo: {
    width: 84,
    height: 84,
    borderRadius: radius['2xl'],
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashTitle: {
    color: colors.brand[900],
    marginBottom: 4,
  },
  splashSubtitle: {
    color: colors.text.muted,
    marginBottom: 24,
  },
  splashSpinner: {
    marginTop: 8,
  },
});
