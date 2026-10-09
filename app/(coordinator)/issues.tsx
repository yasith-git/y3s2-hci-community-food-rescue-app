/**
 * Coordinator Rescue Issue Management Screen
 * Allows reviewing, investigating, and resolving operational issues and quantity discrepancies.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ScreenContainer,
  GlassHeader,
  GlassChip,
  EmptyState,
  Skeleton,
} from '../../src/components/ui';
import {
  CoordinatorIssueCard,
  IssueResolutionModal,
} from '../../src/components/coordinator';
import { colors } from '../../src/design-system/colors';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { RescueIssue, RescueIssueStatus } from '../../src/types/rescue';
import {
  subscribeToAllIssues,
  updateRescueIssueStatus,
} from '../../src/services/issues/issue.service';

type FilterTab = 'ALL' | 'OPEN' | 'REVIEWING' | 'RESOLVED';

export default function CoordinatorIssuesScreen() {
  const router = useRouter();
  const { donationId } = useLocalSearchParams<{ donationId?: string }>();
  const { user } = useAuth();

  const [issues, setIssues] = useState<RescueIssue[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('ALL');
  const [activeResolvingIssue, setActiveResolvingIssue] = useState<RescueIssue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAllIssues((list) => {
      setIssues(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    haptic.selection();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const filteredIssues = issues.filter((issue) => {
    if (donationId && issue.donationId !== donationId) {
      return false;
    }
    if (selectedFilter === 'ALL') return true;
    return issue.status === selectedFilter;
  });

  const handleResolve = async (issueId: string, resolutionNotes: string) => {
    if (!user) return;
    await updateRescueIssueStatus(issueId, user.uid, 'RESOLVED', resolutionNotes);
  };

  const handleStatusChange = async (issue: RescueIssue, newStatus: 'REVIEWING' | 'RESOLVED') => {
    if (!user) return;
    await updateRescueIssueStatus(issue.id, user.uid, newStatus);
    haptic.selection();
  };

  return (
    <ScreenContainer scrollable={false} testID="coordinator-issues-screen">
      <GlassHeader
        title="Rescue Issue Management"
        subtitle="Review & Resolve Logistics Issues"
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <GlassChip
          label="All Issues"
          selected={selectedFilter === 'ALL'}
          onPress={() => {
            haptic.selection();
            setSelectedFilter('ALL');
          }}
        />
        <GlassChip
          label="Open"
          selected={selectedFilter === 'OPEN'}
          onPress={() => {
            haptic.selection();
            setSelectedFilter('OPEN');
          }}
        />
        <GlassChip
          label="In Review"
          selected={selectedFilter === 'REVIEWING'}
          onPress={() => {
            haptic.selection();
            setSelectedFilter('REVIEWING');
          }}
        />
        <GlassChip
          label="Resolved"
          selected={selectedFilter === 'RESOLVED'}
          onPress={() => {
            haptic.selection();
            setSelectedFilter('RESOLVED');
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
            <Skeleton width="100%" height={140} borderRadius={radius.lg} />
            <Skeleton width="100%" height={140} borderRadius={radius.lg} />
          </View>
        ) : filteredIssues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="checkmark-circle-outline"
              title="No Issues Reported"
              description={
                selectedFilter === 'ALL'
                  ? 'All food rescue handovers and deliveries are running smoothly without any reported issues.'
                  : `No issues in "${selectedFilter}" status.`
              }
            />
          </View>
        ) : (
          filteredIssues.map((issue) => (
            <CoordinatorIssueCard
              key={issue.id}
              issue={issue}
              onResolve={(iss) => setActiveResolvingIssue(iss)}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </ScrollView>

      {/* Issue Resolution Modal */}
      <IssueResolutionModal
        visible={!!activeResolvingIssue}
        issue={activeResolvingIssue}
        onClose={() => setActiveResolvingIssue(null)}
        onResolve={handleResolve}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
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
