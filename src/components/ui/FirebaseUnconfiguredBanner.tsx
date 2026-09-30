/**
 * Unconfigured Firebase Warning Component
 * Clear, user-friendly guidance when Firebase environment variables are missing
 */

import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { GlassCard } from './GlassCard';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';

export const FirebaseUnconfiguredBanner: React.FC = () => {
  return (
    <GlassCard
      variant="elevated"
      leadingIcon="cloud-outline"
      title="Firebase Setup Required"
      subtitle="Follow instructions below to connect Firebase Console"
      style={styles.container}
    >
      <View style={styles.body}>
        <Text style={[typography.bodySmall, styles.explanation]}>
          Authentication & profile persistence require your Firebase project environment variables in{' '}
          <Text style={styles.bold}>.env</Text>.
        </Text>

        <View style={styles.codeBox}>
          <Text style={[typography.caption, styles.codeText]}>
            EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key{'\n'}
            EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com{'\n'}
            EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id{'\n'}
            EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com{'\n'}
            EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789{'\n'}
            EXPO_PUBLIC_FIREBASE_APP_ID=1:123456:web:abcdef
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    borderColor: colors.status.warningBorder,
  },
  body: {
    paddingTop: spacing.xs,
  },
  explanation: {
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  bold: {
    fontWeight: '700',
    color: colors.brand.dark,
  },
  codeBox: {
    backgroundColor: 'rgba(23, 61, 57, 0.06)',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  codeText: {
    fontFamily: 'monospace',
    color: colors.brand[900],
    fontSize: 10,
    lineHeight: 15,
  },
});
