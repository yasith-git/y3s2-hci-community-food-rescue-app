/**
 * Coordinator Role Workspace Placeholder
 * Reserved for Coordinator Feature Branch (Community Coordination Module)
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

export default function CoordinatorHomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <ScreenContainer scrollable={true} testID="coordinator-placeholder-screen">
      <GlassHeader title="Coordinator Workspace" />
      <View style={styles.content}>
        <EmptyState
          icon="business-outline"
          title="Coordinator Workspace"
          description="Community food pantry distribution oversight, bulk delivery confirmation, and collection hub management will be developed in the Coordinator feature branch."
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
