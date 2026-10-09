/**
 * Unconfigured Supabase Warning Component
 * Clear, user-friendly guidance when Supabase environment variables are missing
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GlassCard } from './GlassCard';
import { colors } from '../../design-system/colors';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { radius } from '../../design-system/radius';

export const SupabaseUnconfiguredBanner: React.FC = () => {
  return (
    <GlassCard
      variant="elevated"
      leadingIcon="cloud-outline"
      title="Supabase Setup Required"
      subtitle="Follow instructions below to connect Supabase backend"
      style={styles.container}
    >
      <View style={styles.body}>
        <Text style={[typography.bodySmall, styles.explanation]}>
          Authentication & profile persistence require your Supabase project environment variables in{' '}
          <Text style={styles.bold}>.env</Text>.
        </Text>

        <View style={styles.codeBox}>
          <Text style={[typography.caption, styles.codeText]}>
            EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co{'\n'}
            EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
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
