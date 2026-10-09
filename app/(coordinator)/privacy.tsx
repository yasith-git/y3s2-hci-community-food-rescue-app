/**
 * Privacy & Data Minimization Architecture Screen
 * Full transparency regarding zero beneficiary profiling and operational trust models.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
} from '../../src/components/ui';
import { PrivacyTrustCard } from '../../src/components/coordinator';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';

export default function CoordinatorPrivacyScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scrollable={false} testID="coordinator-privacy-screen">
      <GlassHeader
        title="Privacy & Trust Architecture"
        subtitle="Data Minimization by Design"
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PrivacyTrustCard />

        <GlassCard variant="standard" style={styles.card}>
          <Text style={[typography.headingSmall, styles.title]}>
            Operational Guarantees
          </Text>

          <View style={styles.section}>
            <Text style={[typography.labelMedium, styles.subheading]}>
              1. Community Hub Receiving Model
            </Text>
            <Text style={[typography.bodySmall, styles.paragraph]}>
              All food rescues are consigned to registered community collection points, pantries, and dining halls. No beneficiary home addresses or household coordinates are ever stored or exposed.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.labelMedium, styles.subheading]}>
              2. Minimum Operational Data
            </Text>
            <Text style={[typography.bodySmall, styles.paragraph]}>
              The system collects only operational coordinates, contact names, and phone numbers required for volunteer delivery handovers.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.labelMedium, styles.subheading]}>
              3. Verification Code Secrecy
            </Text>
            <Text style={[typography.bodySmall, styles.paragraph]}>
              Delivery verification codes are never included in unencrypted push notifications or email previews, and are visible only to the authorized coordinator during active handover.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  subheading: {
    color: colors.brand.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  paragraph: {
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
