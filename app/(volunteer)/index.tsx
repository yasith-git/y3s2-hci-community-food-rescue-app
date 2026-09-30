/**
 * Volunteer Role Workspace Placeholder
 * Reserved for Volunteer Feature Branch (Smart Routing & Rescue Modules)
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  EmptyState,
} from '../../src/components/ui';
import { useAuth } from '../../src/contexts/AuthContext';
import { spacing } from '../../src/design-system/spacing';

export default function VolunteerHomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <ScreenContainer scrollable={true} testID="volunteer-placeholder-screen">
      <GlassHeader title="Volunteer Workspace" />
      <View style={styles.content}>
        <EmptyState
          icon="bicycle-outline"
          title="Volunteer Workspace"
          description="Your volunteer experience, real-time rescue assignments, and interactive route matching will be developed in the Volunteer feature branch."
          primaryActionTitle="Sign Out"
          onPrimaryAction={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xl,
  },
});
