/**
 * Community Collection Points Management Screen
 * Allows verified coordinators to create, view, edit, and deactivate their receiving hubs.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  GlassButton,
  GlassIconButton,
  EmptyState,
  Skeleton,
} from '../../src/components/ui';
import {
  CommunityPointCard,
  CommunityPointModal,
} from '../../src/components/coordinator';
import { colors } from '../../src/design-system/colors';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { CommunityPoint, CreateCommunityPointInput } from '../../src/types/coordinator';
import {
  subscribeToCoordinatorCommunityPoints,
  createCommunityPoint,
  updateCommunityPoint,
  deactivateCommunityPoint,
  toggleCommunityPointActiveStatus,
} from '../../src/services/community-points/community-point.service';

export default function CoordinatorCommunityPointsScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const [points, setPoints] = useState<CommunityPoint[]>([]);
  const [editingPoint, setEditingPoint] = useState<CommunityPoint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToCoordinatorCommunityPoints(user.uid, (list) => {
      setPoints(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    haptic.selection();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSavePoint = async (input: CreateCommunityPointInput) => {
    if (!user) return;
    if (editingPoint) {
      await updateCommunityPoint(editingPoint.id, user.uid, input);
    } else {
      await createCommunityPoint(user.uid, input);
    }
  };

  const handleDeactivate = (point: CommunityPoint) => {
    const isActivating = !point.isActive;
    Alert.alert(
      isActivating ? 'Activate Collection Center?' : 'Deactivate Collection Center?',
      isActivating
        ? `Are you sure you want to activate "${point.label}"? It will become eligible for volunteer nearest-center routing.`
        : `Are you sure you want to deactivate "${point.label}"? Historical deliveries will retain records, but new rescues will not choose this center.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isActivating ? 'Activate' : 'Deactivate',
          style: isActivating ? 'default' : 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              if (isActivating) {
                await toggleCommunityPointActiveStatus(point.id, true);
              } else {
                await deactivateCommunityPoint(point.id, user.uid);
              }
              haptic.success();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not update center status.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from Community Authority account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          haptic.medium();
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScreenContainer scrollable={false} testID="coordinator-community-points-screen">
      <GlassHeader
        title="Collection Centers"
        subtitle="Manage Receiving Hub Locations"
        onBack={() => router.replace('/(coordinator)')}
        rightAction={
          <GlassIconButton
            icon="log-out-outline"
            size="small"
            variant="subtle"
            onPress={handleSignOut}
            accessibilityLabel="Sign Out"
          />
        }
      />

      <View style={styles.topActionBar}>
        <GlassButton
          title="+ Add Collection Center"
          variant="primary"
          icon="add-circle-outline"
          onPress={() => {
            setEditingPoint(null);
            setIsModalOpen(true);
          }}
        />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />}
      >
        {isLoading ? (
          <View style={{ padding: spacing.md, gap: 12 }}>
            <Skeleton width="100%" height={150} borderRadius={radius.lg} />
            <Skeleton width="100%" height={150} borderRadius={radius.lg} />
          </View>
        ) : points.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="business-outline"
              title="No Collection Centers Added"
              description="Add your community collection centers so volunteers know where to deliver rescued food."
              primaryActionTitle="Add First Center"
              onPrimaryAction={() => {
                setEditingPoint(null);
                setIsModalOpen(true);
              }}
            />
          </View>
        ) : (
          points.map((point) => (
            <CommunityPointCard
              key={point.id}
              point={point}
              onEdit={(p) => {
                setEditingPoint(p);
                setIsModalOpen(true);
              }}
              onDeactivate={(p) => handleDeactivate(p)}
            />
          ))
        )}
      </ScrollView>

      {/* Create / Edit Modal */}
      <CommunityPointModal
        visible={isModalOpen}
        initialPoint={editingPoint}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPoint(null);
        }}
        onSave={handleSavePoint}
        organizationName={profile?.organizationName}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topActionBar: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  emptyContainer: {
    padding: spacing.md,
    marginTop: spacing.xl,
  },
});
