/**
 * Design System Showcase Screen
 * Community Food Rescue App - Shared UI/UX Foundation Demo
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  ScreenContainer,
  GlassCard,
  GlassButton,
  GlassIconButton,
  GlassChip,
  GlassBadge,
  GlassHeader,
  GlassBottomBar,
  PrimaryTextInput,
  SearchInput,
  StatusBadge,
  Avatar,
  Divider,
  SectionHeader,
  ProgressBar,
  ProgressStepper,
  Skeleton,
  EmptyState,
  ErrorState,
  SuccessState,
} from '../src/components/ui';
import { colors, typography, spacing, radius } from '../src/design-system';

export default function ShowcaseScreen() {
  // Input states
  const [sampleText, setSampleText] = useState('');
  const [errorInput, setErrorInput] = useState('');
  const [searchText, setSearchText] = useState('');

  // Interactive chip selection
  const [selectedChip, setSelectedChip] = useState('All');

  // Bottom bar demo
  const [activeTab, setActiveTab] = useState('home');

  // Micro-interaction state
  const [buttonCount, setButtonCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<string | null>(null);

  const handleTestSubmit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowFeedbackModal('success');
    }, 1200);
  };

  return (
    <ScreenContainer scrollable={true} testID="showcase-screen">
      {/* Top Glass Header */}
      <GlassHeader
        title="Design System Showcase"
        subtitle="Shared UI Foundation v1.0"
        rightAction={
          <GlassIconButton
            icon="sparkles"
            size="small"
            variant="primary"
            onPress={() => setButtonCount((c) => c + 1)}
            accessibilityLabel="Showcase action"
          />
        }
      />

      <View style={styles.contentPadding}>
        {/* ============================================================ */}
        {/* SECTION 1: COMMUNITY IMPACT MOCK SUMMARY CARD */}
        {/* ============================================================ */}
        <SectionHeader
          title="Community Food Rescue"
          subtitle="Real-world food rescue simulation preview"
        />

        <GlassCard
          variant="elevated"
          leadingIcon="heart-circle"
          title="Good afternoon, Sarah"
          subtitle="Volunteer Coordinator • Central Campus Hub"
        >
          <View style={styles.impactGrid}>
            <View style={styles.impactMetric}>
              <Text style={[typography.displayMedium, styles.impactNumber]}>
                12
              </Text>
              <Text style={[typography.caption, styles.impactLabel]}>
                Rescues Today
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.impactMetric}>
              <Text style={[typography.displayMedium, styles.impactNumber]}>
                48
              </Text>
              <Text style={[typography.caption, styles.impactLabel]}>
                Meals Redirected
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.impactMetric}>
              <Text style={[typography.displayMedium, styles.impactNumber]}>
                36 kg
              </Text>
              <Text style={[typography.caption, styles.impactLabel]}>
                CO2 Saved
              </Text>
            </View>
          </View>

          <View style={styles.cardActionRow}>
            <GlassButton
              title="Offer Surplus Food"
              variant="primary"
              size="medium"
              icon="add-circle-outline"
              onPress={() => setButtonCount((c) => c + 1)}
              style={styles.flexButton}
            />
            <View style={styles.buttonGap} />
            <GlassButton
              title="View Map"
              variant="secondary"
              size="medium"
              icon="map-outline"
              onPress={() => setButtonCount((c) => c + 1)}
              style={styles.flexButton}
            />
          </View>
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 2: INTERACTIVE GLASS BUTTONS & FEEDBACK */}
        {/* ============================================================ */}
        <SectionHeader
          title="Glass Buttons & Micro-Interactions"
          subtitle="Animated spring, haptic tap, and accessible states"
        />

        <GlassCard variant="standard">
          <View style={styles.buttonStack}>
            <GlassButton
              title={`Primary Action (Taps: ${buttonCount})`}
              variant="primary"
              size="large"
              icon="flash"
              onPress={() => setButtonCount((c) => c + 1)}
              fullWidth
            />

            <View style={styles.buttonRow}>
              <GlassButton
                title="Secondary"
                variant="secondary"
                size="medium"
                icon="cube-outline"
                onPress={() => setButtonCount((c) => c + 1)}
                style={styles.flexButton}
              />
              <View style={styles.buttonGap} />
              <GlassButton
                title="Danger Glass"
                variant="danger"
                size="medium"
                icon="trash-outline"
                onPress={() => setButtonCount((c) => c + 1)}
                style={styles.flexButton}
              />
            </View>

            <View style={styles.buttonRow}>
              <GlassButton
                title="Async Loading Test"
                variant="primary"
                size="medium"
                loading={isProcessing}
                onPress={handleTestSubmit}
                style={styles.flexButton}
              />
              <View style={styles.buttonGap} />
              <GlassButton
                title="Disabled State"
                variant="secondary"
                size="medium"
                disabled
                onPress={() => {}}
                style={styles.flexButton}
              />
            </View>

            {/* Icon buttons in various sizes */}
            <View style={styles.iconButtonRow}>
              <GlassIconButton
                icon="leaf"
                size="small"
                variant="primary"
                onPress={() => setButtonCount((c) => c + 1)}
                accessibilityLabel="Leaf action"
              />
              <GlassIconButton
                icon="notifications"
                size="medium"
                variant="standard"
                onPress={() => setButtonCount((c) => c + 1)}
                accessibilityLabel="Notifications"
              />
              <GlassIconButton
                icon="heart"
                size="large"
                variant="danger"
                onPress={() => setButtonCount((c) => c + 1)}
                accessibilityLabel="Favorite action"
              />
            </View>
          </View>
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 3: FORM INPUTS & SEARCH */}
        {/* ============================================================ */}
        <SectionHeader
          title="Form Controls & Inputs"
          subtitle="Accessible, glassmorphic fields with focus borders"
        />

        <GlassCard variant="standard">
          <SearchInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search surplus donations, donors..."
          />

          <PrimaryTextInput
            label="Donation Title"
            required
            placeholder="e.g., 20 Sandwiches from Campus Cafe"
            value={sampleText}
            onChangeText={setSampleText}
            leftIcon="fast-food-outline"
            helperText="Provide a clear description of the food items."
          />

          <PrimaryTextInput
            label="Quantity Verification"
            placeholder="Enter unit or number"
            value={errorInput}
            onChangeText={setErrorInput}
            leftIcon="warning-outline"
            error={errorInput.length > 0 && isNaN(Number(errorInput)) ? 'Quantity must be a valid number' : undefined}
            helperText="Try typing letters above to trigger live validation feedback."
          />
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 4: CHIPS, BADGES & AVATARS */}
        {/* ============================================================ */}
        <SectionHeader
          title="Chips, Badges & Avatars"
          subtitle="Selection tags and identity components"
        />

        <GlassCard variant="standard">
          <Text style={[typography.titleSmall, styles.subHeader]}>
            Filter Chips (Interactive)
          </Text>
          <View style={styles.chipsRow}>
            {['All', 'Bakery', 'Produce', 'Cooked Meals', 'Beverages'].map((cat) => (
              <GlassChip
                key={cat}
                label={cat}
                selected={selectedChip === cat}
                onPress={() => setSelectedChip(cat)}
                icon="restaurant-outline"
              />
            ))}
          </View>

          <Divider spacingSize="md" />

          <Text style={[typography.titleSmall, styles.subHeader]}>
            Pill Badges & Avatars
          </Text>
          <View style={styles.avatarRow}>
            <Avatar name="Sarah Jenkins" size="large" statusIndicator="online" />
            <Avatar name="David Chen" size="medium" statusIndicator="busy" />
            <Avatar name="Food Bank" size="small" statusIndicator="offline" />

            <View style={styles.badgeColumn}>
              <GlassBadge label="Verified Donor" variant="brand" />
              <GlassBadge label="Pending Rescue" variant="warning" />
              <GlassBadge label="Completed" variant="success" />
            </View>
          </View>
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 5: ACCESSIBLE STATUS SYSTEM */}
        {/* ============================================================ */}
        <SectionHeader
          title="Status Design System"
          subtitle="Triple-encoded: Icon + Text + Semantic Color"
        />

        <GlassCard variant="standard">
          <View style={styles.statusWrap}>
            <StatusBadge status="available" />
            <StatusBadge status="reserved" />
            <StatusBadge status="assigned" />
            <StatusBadge status="pickup_soon" />
            <StatusBadge status="picked_up" />
            <StatusBadge status="in_transit" />
            <StatusBadge status="delivered" />
            <StatusBadge status="completed" />
            <StatusBadge status="cancelled" />
            <StatusBadge status="expired" />
            <StatusBadge status="issue_reported" />
          </View>
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 6: PROGRESSION & STEPPING */}
        {/* ============================================================ */}
        <SectionHeader
          title="Progress & Multi-Step Flow"
          subtitle="Visual indicators for live rescue tracking"
        />

        <GlassCard variant="standard">
          <Text style={[typography.titleSmall, styles.subHeader]}>
            Rescue Workflow Stepper
          </Text>
          <ProgressStepper
            steps={[
              { key: 'offered', label: 'Offered' },
              { key: 'claimed', label: 'Claimed' },
              { key: 'pickup', label: 'In Transit' },
              { key: 'delivered', label: 'Delivered' },
            ]}
            currentStepIndex={2}
          />

          <Divider spacingSize="md" />

          <Text style={[typography.titleSmall, styles.subHeader]}>
            Goal Progress (65% of Daily Target)
          </Text>
          <ProgressBar progress={0.65} />
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 7: LOADING SKELETONS */}
        {/* ============================================================ */}
        <SectionHeader
          title="Loading Skeleton Experience"
          subtitle="Non-distracting, smooth animated placeholders"
        />

        <GlassCard variant="standard">
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonHeaderRow}>
              <Skeleton width={44} height={44} borderRadius={radius.round} />
              <View style={styles.skeletonHeaderTexts}>
                <Skeleton width="70%" height={16} />
                <View style={{ height: 6 }} />
                <Skeleton width="40%" height={12} />
              </View>
            </View>
            <View style={{ height: 12 }} />
            <Skeleton width="100%" height={14} />
            <View style={{ height: 6 }} />
            <Skeleton width="85%" height={14} />
          </View>
        </GlassCard>

        {/* ============================================================ */}
        {/* SECTION 8: EMPTY, ERROR & SUCCESS STATES */}
        {/* ============================================================ */}
        <SectionHeader
          title="State Feedback Cards"
          subtitle="Consistent empty, error, and success presentations"
        />

        <SuccessState
          title="Surplus Donated Successfully!"
          description="Your donation has been registered and volunteers nearby have been alerted."
          primaryActionTitle="Done"
          onPrimaryAction={() => {}}
        />

        <EmptyState
          icon="leaf-outline"
          title="No Active Rescues Nearby"
          description="You are all caught up! New surplus listings in your area will appear right here."
          primaryActionTitle="Refresh Feed"
          onPrimaryAction={() => {}}
        />

        <ErrorState
          title="Network Connection Lost"
          description="We couldn't connect to the server. Please check your cellular connection."
          retryTitle="Retry Connection"
          onRetry={() => {}}
        />

        <View style={{ height: 100 }} />
      </View>

      {/* Floating Bottom Navigation Simulation */}
      <GlassBottomBar
        tabs={[
          { key: 'home', label: 'Explore', icon: 'compass-outline', activeIcon: 'compass' },
          { key: 'rescues', label: 'Rescues', icon: 'leaf-outline', activeIcon: 'leaf', badgeCount: 3 },
          { key: 'map', label: 'Map', icon: 'map-outline', activeIcon: 'map' },
          { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
        ]}
        activeKey={activeTab}
        onTabPress={setActiveTab}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  contentPadding: {
    paddingHorizontal: spacing.screenHorizontal,
  },
  subHeader: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  impactGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: colors.brand[50],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
  },
  impactMetric: {
    flex: 1,
    alignItems: 'center',
  },
  impactNumber: {
    color: colors.brand[900],
    fontSize: 22,
    lineHeight: 28,
  },
  impactLabel: {
    color: colors.brand[700],
    textAlign: 'center',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(35, 132, 113, 0.15)',
  },
  cardActionRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  buttonGap: {
    width: spacing.sm,
  },
  buttonStack: {
    gap: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  iconButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  badgeColumn: {
    gap: 4,
  },
  statusWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonCard: {
    padding: spacing.xs,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonHeaderTexts: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});
