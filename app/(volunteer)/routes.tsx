/**
 * Saved Routes Management Screen
 * View saved journeys, switch active route, or delete routes with confirmation sheet.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassButton,
  GlassCard,
  EmptyState,
} from '../../src/components/ui';
import { SavedRouteCard } from '../../src/components/routes/SavedRouteCard';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { VolunteerRoute } from '../../src/types/route';
import {
  subscribeToSavedRoutes,
  setActiveVolunteerRoute,
  deleteVolunteerRoute,
} from '../../src/services/routes/route.service';
import { DEV_DEFAULT_VOLUNTEER_ROUTE } from '../../src/services/matching/dev.fixtures';

export default function VolunteerSavedRoutesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [savedRoutes, setSavedRoutes] = useState<VolunteerRoute[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<VolunteerRoute | null>(null);

  useEffect(() => {
    let unsub: () => void = () => {};

    if (user?.uid) {
      unsub = subscribeToSavedRoutes(user.uid, (routes) => {
        if (routes.length > 0) {
          setSavedRoutes(routes);
        } else {
          // Dev preview route
          setSavedRoutes([DEV_DEFAULT_VOLUNTEER_ROUTE]);
        }
      });
    } else {
      setSavedRoutes([DEV_DEFAULT_VOLUNTEER_ROUTE]);
    }

    return () => unsub();
  }, [user?.uid]);

  const handleActivate = async (route: VolunteerRoute) => {
    haptic.selection();
    if (user?.uid) {
      await setActiveVolunteerRoute(user.uid, route.id);
    }
    // Update local state
    setSavedRoutes((prev) =>
      prev.map((r) => ({ ...r, isActive: r.id === route.id }))
    );
    haptic.success();
    router.replace('/(volunteer)');
  };

  const handleConfirmDelete = async () => {
    if (!routeToDelete) return;
    haptic.selection();

    if (user?.uid) {
      await deleteVolunteerRoute(routeToDelete.id);
    }
    setSavedRoutes((prev) => prev.filter((r) => r.id !== routeToDelete.id));
    setRouteToDelete(null);
    haptic.success();
  };

  return (
    <ScreenContainer scrollable={false} testID="volunteer-routes-screen">
      <GlassHeader
        title="Saved Journeys"
        subtitle="Manage your routine travel routes"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(false)}
            tintColor={colors.brand.primary}
          />
        }
      >
        {savedRoutes.length === 0 ? (
          <EmptyState
            icon="git-branch-outline"
            title="No Saved Journeys"
            description="Save your daily commute or frequent travel routes to quickly find rescue opportunities on the go."
            primaryActionTitle="Create New Journey"
            onPrimaryAction={() => router.push('/(volunteer)/create-route')}
          />
        ) : (
          savedRoutes.map((route) => (
            <SavedRouteCard
              key={route.id}
              route={route}
              onActivate={handleActivate}
              onDelete={(r) => setRouteToDelete(r)}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Add Journey Button */}
      <View style={styles.floatingButtonContainer}>
        <GlassButton
          title="Add New Journey"
          variant="primary"
          icon="add"
          onPress={() => router.push('/(volunteer)/create-route')}
        />
      </View>

      {/* Deletion Confirmation Bottom Sheet */}
      <Modal
        visible={routeToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRouteToDelete(null)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard variant="elevated" style={styles.deleteModalCard}>
            <View style={styles.deleteModalIcon}>
              <Ionicons name="trash" size={28} color={colors.status.error} />
            </View>

            <Text style={[typography.headingSmall, styles.deleteModalTitle]}>
              Delete Saved Journey?
            </Text>
            <Text style={[typography.bodyMedium, styles.deleteModalMessage]}>
              Are you sure you want to remove "{routeToDelete?.name || 'this route'}"? You can create a new route anytime.
            </Text>

            <View style={styles.modalButtonRow}>
              <View style={{ flex: 1 }}>
                <GlassButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setRouteToDelete(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <GlassButton
                  title="Delete"
                  variant="danger"
                  onPress={handleConfirmDelete}
                />
              </View>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing['4xl'],
  },
  floatingButtonContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
    backgroundColor: colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  deleteModalCard: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: radius['2xl'],
    alignItems: 'center',
  },
  deleteModalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.status.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  deleteModalTitle: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  deleteModalMessage: {
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
});
