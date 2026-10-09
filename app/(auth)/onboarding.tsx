/**
 * Onboarding Screen
 * 3-step interactive carousel with glass cards, paging dots, and get started CTA
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassCard,
  GlassButton,
  GlassIconButton,
  ProgressStepper,
} from '../../src/components/ui';
import { colors, typography, spacing, radius } from '../../src/design-system';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  tag: string;
}

const steps: OnboardingStep[] = [
  {
    title: 'Rescue Good Food',
    subtitle: 'Help surplus fresh food and prepared meals reach local campus communities instead of going to waste.',
    icon: 'restaurant-outline',
    tag: 'Step 1 • Food Rescue',
  },
  {
    title: 'Make Every Journey Matter',
    subtitle: 'Volunteers seamlessly collect and move available food along routes they are already travelling.',
    icon: 'bicycle-outline',
    tag: 'Step 2 • Smart Routing',
  },
  {
    title: 'Community First. Privacy Always.',
    subtitle: 'Food is safely coordinated through trusted community collection points with complete dignity.',
    icon: 'shield-checkmark-outline',
    tag: 'Step 3 • Trusted Network',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const isLast = currentStep === steps.length - 1;
  const current = steps[currentStep];

  const handleNext = () => {
    if (isLast) {
      router.push('/(auth)/register');
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  return (
    <ScreenContainer scrollable={true} testID="onboarding-screen">
      {/* Top Bar with Skip */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={styles.miniLogoBox}>
            <Ionicons name="leaf" size={16} color={colors.brand.primary} />
          </View>
          <Text style={[typography.titleMedium, styles.appName]}>FoodRescue</Text>
        </View>

        <GlassButton
          title="Skip"
          variant="tertiary"
          size="small"
          onPress={handleSkip}
        />
      </View>

      <View style={styles.body}>
        {/* Visual Hero Glass Card */}
        <GlassCard variant="elevated" style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.iconCircle}>
              <Ionicons name={current.icon} size={48} color={colors.brand.primary} />
            </View>

            <View style={styles.tagBadge}>
              <Text style={[typography.labelSmall, styles.tagText]}>{current.tag}</Text>
            </View>

            <Text style={[typography.headingLarge, styles.stepTitle]}>
              {current.title}
            </Text>

            <Text style={[typography.bodyMedium, styles.stepSubtitle]}>
              {current.subtitle}
            </Text>
          </View>
        </GlassCard>

        {/* Paging Indicator Dots */}
        <View style={styles.paginationRow}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Action Controls */}
        <View style={styles.actionContainer}>
          <GlassButton
            title={isLast ? 'Get Started' : 'Next Step'}
            variant="primary"
            size="large"
            icon={isLast ? 'arrow-forward' : 'chevron-forward'}
            iconPosition="right"
            onPress={handleNext}
            fullWidth
          />

          <View style={styles.signInPromptRow}>
            <Text style={[typography.bodySmall, styles.signInPromptText]}>
              Already have an account?
            </Text>
            <GlassButton
              title="Sign In"
              variant="tertiary"
              size="small"
              onPress={() => router.push('/(auth)/login')}
            />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogoBox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  appName: {
    color: colors.brand[900],
    fontWeight: '700',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  heroCard: {
    marginVertical: spacing.md,
  },
  heroContent: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.round,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  tagBadge: {
    backgroundColor: 'rgba(35, 132, 113, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  tagText: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  stepTitle: {
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  dot: {
    height: 6,
    borderRadius: radius.pill,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.brand.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(23, 61, 57, 0.15)',
  },
  actionContainer: {
    marginTop: spacing.sm,
  },
  signInPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 4,
  },
  signInPromptText: {
    color: colors.text.muted,
  },
});
