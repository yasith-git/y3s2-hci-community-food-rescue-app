/**
 * Surplus Food Category Summary & PDF Export Screen
 * Community Authority (Coordinator) Portal
 *
 * Provides real-time operational category totals, unit breakdowns,
 * and high-fidelity A4 PDF report export for community collection centers.
 * Privacy-first: Zero beneficiary PII.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  GlassHeader,
  GlassCard,
  GlassButton,
  GlassBadge,
  GlassIconButton,
  EmptyState,
  Skeleton,
} from '../../src/components/ui';
import { colors } from '../../src/design-system/colors';
import { typography } from '../../src/design-system/typography';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { haptic } from '../../src/design-system/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { CommunityPoint } from '../../src/types/coordinator';
import {
  FoodSummaryDateRangeOption,
  AuthorityFoodReportFilters,
  AuthorityFoodSummaryReport,
  FoodCategorySummary,
} from '../../src/types/food-summary';
import {
  getAuthorityManagedCenters,
  getAuthorityFoodCategorySummary,
} from '../../src/services/coordinator/food-summary.service';
import { exportAndSharePdfReport } from '../../src/utils/pdfReportGenerator';

const DATE_RANGE_OPTIONS: { id: FoodSummaryDateRangeOption; label: string }[] = [
  { id: 'TODAY', label: 'Today' },
  { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
  { id: 'ALL_TIME', label: 'All Time' },
  { id: 'CUSTOM', label: 'Custom' },
];

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  const cat = category.toLowerCase();
  if (cat.includes('bake') || cat.includes('bread')) return 'nutrition-outline';
  if (cat.includes('meal') || cat.includes('prepared')) return 'restaurant-outline';
  if (cat.includes('rice') || cat.includes('curry')) return 'fast-food-outline';
  if (cat.includes('veg') || cat.includes('fruit') || cat.includes('produce')) return 'leaf-outline';
  if (cat.includes('dairy') || cat.includes('milk')) return 'water-outline';
  if (cat.includes('pack') || cat.includes('pantry')) return 'cube-outline';
  if (cat.includes('bev') || cat.includes('drink')) return 'cafe-outline';
  return 'basket-outline';
}

export default function SurplusFoodSummaryScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  // Filter state
  const [dateRange, setDateRange] = useState<FoodSummaryDateRangeOption>('LAST_30_DAYS');
  const [selectedCenterId, setSelectedCenterId] = useState<string>('ALL');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isCenterPickerOpen, setIsCenterPickerOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Expanded category detail accordions
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Data & loading state
  const [managedCenters, setManagedCenters] = useState<CommunityPoint[]>([]);
  const [report, setReport] = useState<AuthorityFoodSummaryReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const filters: AuthorityFoodReportFilters = useMemo(
    () => ({
      dateRange,
      customStartDate: customStart.trim() || undefined,
      customEndDate: customEnd.trim() || undefined,
      communityPointId: selectedCenterId,
    }),
    [dateRange, customStart, customEnd, selectedCenterId]
  );

  const loadData = useCallback(
    async (isMounted = true) => {
      if (!user) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const [centers, summary] = await Promise.all([
          getAuthorityManagedCenters(user.uid),
          getAuthorityFoodCategorySummary(
            user.uid,
            filters,
            profile?.fullName || 'Community Authority',
            profile?.organizationName || undefined
          ),
        ]);
        if (!isMounted) return;
        setManagedCenters(centers);
        setReport(summary);
      } catch (err) {
        console.warn('[SurplusFoodSummaryScreen] Error loading data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [user, profile, filters]
  );

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      loadData(isMounted);
      return () => {
        isMounted = false;
      };
    }, [loadData])
  );

  const onRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    haptic.selection();
    await loadData(true);
  };

  const handleDateRangeSelect = (option: FoodSummaryDateRangeOption) => {
    haptic.selection();
    if (option === 'CUSTOM') {
      setIsCustomModalOpen(true);
    } else {
      setDateRange(option);
    }
  };

  const handleApplyCustomDates = () => {
    haptic.medium();
    setDateRange('CUSTOM');
    setIsCustomModalOpen(false);
  };

  const handleCenterSelect = (centerId: string) => {
    haptic.selection();
    setSelectedCenterId(centerId);
    setIsCenterPickerOpen(false);
  };

  const toggleCategoryExpand = (cat: string) => {
    haptic.light();
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleExportPdf = async () => {
    if (!report || report.kpis.completedRescues === 0 || isExportingPdf) return;
    haptic.medium();
    setIsExportingPdf(true);
    try {
      await exportAndSharePdfReport(report);
    } catch (err) {
      console.error('[SurplusFoodSummaryScreen] Export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Selected center label
  const selectedCenterLabel = useMemo(() => {
    if (selectedCenterId === 'ALL') return 'All My Centers';
    const found = managedCenters.find((c) => c.id === selectedCenterId);
    return found ? found.label : 'Selected Center';
  }, [selectedCenterId, managedCenters]);

  // Max rescues for visual bar comparison
  const maxRescuesInCategory = useMemo(() => {
    if (!report || report.categorySummaries.length === 0) return 1;
    return Math.max(...report.categorySummaries.map((c) => c.completedRescueCount), 1);
  }, [report]);

  return (
    <ScreenContainer scrollable={false} testID="food-summary-screen">
      <GlassHeader
        title="Surplus Food Summary"
        subtitle="See what food your collection centers have received."
        onBack={() => {
          haptic.light();
          router.back();
        }}
        rightAction={
          <GlassIconButton
            icon="refresh-outline"
            size="small"
            variant="subtle"
            onPress={onRefresh}
            accessibilityLabel="Refresh Summary"
          />
        }
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {/* ===================== FILTERS SECTION ===================== */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Report Period & Scope</Text>

          {/* Date Range Horizontal Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datePillsContainer}
          >
            {DATE_RANGE_OPTIONS.map((opt) => {
              const isSelected = dateRange === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.datePill, isSelected && styles.datePillActive]}
                  onPress={() => handleDateRangeSelect(opt.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.datePillText, isSelected && styles.datePillTextActive]}>
                    {opt.id === 'CUSTOM' && customStart && customEnd && dateRange === 'CUSTOM'
                      ? `${customStart.slice(5)} to ${customEnd.slice(5)}`
                      : opt.label}
                  </Text>
                  {opt.id === 'CUSTOM' && (
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={isSelected ? '#FFFFFF' : colors.text.secondary}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Collection Center Filter Dropdown / Pill */}
          <TouchableOpacity
            style={styles.centerSelector}
            onPress={() => {
              haptic.light();
              setIsCenterPickerOpen(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.centerSelectorLeft}>
              <Ionicons name="business-outline" size={16} color={colors.brand.primary} />
              <Text style={styles.centerSelectorLabel}>Collection Center:</Text>
              <Text style={styles.centerSelectorValue} numberOfLines={1}>
                {selectedCenterLabel}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* ===================== EXPORT PDF ACTION ===================== */}
        <View style={styles.pdfActionContainer}>
          <GlassButton
            title={isExportingPdf ? 'Generating Report...' : 'Download PDF Report'}
            icon="document-text-outline"
            variant="primary"
            size="large"
            disabled={isExportingPdf || !report || report.kpis.completedRescues === 0}
            loading={isExportingPdf}
            onPress={handleExportPdf}
            accessibilityLabel="Download PDF Report"
          />
          {report && report.kpis.completedRescues === 0 && !isLoading && (
            <Text style={styles.pdfDisabledHint}>
              Report export is available when completed rescues exist for the selected filters.
            </Text>
          )}
        </View>

        {/* ===================== SUMMARY KPIS ===================== */}
        {isLoading ? (
          <View style={styles.loadingSkeletonContainer}>
            <Skeleton width="100%" height={100} borderRadius={radius.lg} />
            <Skeleton width="100%" height={120} borderRadius={radius.lg} />
          </View>
        ) : (
          <>
            <View style={styles.kpiRow}>
              {/* Completed Rescues */}
              <GlassCard variant="standard" style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="checkmark-done" size={20} color={colors.brand.primary} />
                </View>
                <Text style={styles.kpiNumber}>{report?.kpis.completedRescues || 0}</Text>
                <Text style={styles.kpiLabel}>Completed Rescues</Text>
              </GlassCard>

              {/* Food Categories */}
              <GlassCard variant="standard" style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="apps-outline" size={20} color="#2563EB" />
                </View>
                <Text style={[styles.kpiNumber, { color: '#2563EB' }]}>
                  {report?.kpis.foodCategoriesCount || 0}
                </Text>
                <Text style={styles.kpiLabel}>Food Categories</Text>
              </GlassCard>

              {/* Collection Centers */}
              <GlassCard variant="standard" style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#FDF4FF' }]}>
                  <Ionicons name="business" size={20} color="#9333EA" />
                </View>
                <Text style={[styles.kpiNumber, { color: '#9333EA' }]}>
                  {report?.kpis.centersCount || 0}
                </Text>
                <Text style={styles.kpiLabel}>Centers Received Food</Text>
              </GlassCard>
            </View>

            {/* ===================== TOTAL RECEIVED BY UNIT ===================== */}
            <View style={styles.unitTotalsSection}>
              <Text style={styles.sectionHeading}>Total Received by Unit</Text>
              {report && report.totalsByUnit.length > 0 ? (
                <View style={styles.unitPillsRow}>
                  {report.totalsByUnit.map((u) => (
                    <View key={u.unit} style={styles.unitTotalPill}>
                      <Text style={styles.unitTotalValue}>{u.totalQuantity.toLocaleString()}</Text>
                      <Text style={styles.unitTotalName}>{u.unit}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyUnitNotice}>No food received in this period.</Text>
              )}
            </View>

            {/* ===================== PROPORTIONAL COMPARISON BAR ===================== */}
            {report && report.categorySummaries.length > 0 && (
              <GlassCard variant="standard" style={styles.visualBarCard}>
                <Text style={styles.visualBarTitle}>Rescue Distribution by Category</Text>
                <Text style={styles.visualBarSubtitle}>
                  Proportion of completed rescues across received categories
                </Text>
                <View style={styles.barsList}>
                  {report.categorySummaries.map((cat) => {
                    const pct = Math.max(
                      8,
                      Math.round((cat.completedRescueCount / maxRescuesInCategory) * 100)
                    );
                    return (
                      <View key={cat.category} style={styles.barItem}>
                        <View style={styles.barHeader}>
                          <Text style={styles.barCatName} numberOfLines={1}>
                            {cat.category}
                          </Text>
                          <Text style={styles.barCatCount}>
                            {cat.completedRescueCount} {cat.completedRescueCount === 1 ? 'rescue' : 'rescues'}
                          </Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${pct}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </GlassCard>
            )}

            {/* ===================== CATEGORY CARDS SECTION ===================== */}
            <View style={styles.categoriesSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Food Received by Category</Text>
                {report && report.categorySummaries.length > 0 && (
                  <GlassBadge
                    label={`${report.categorySummaries.length} Categories`}
                    variant="neutral"
                    size="small"
                  />
                )}
              </View>

              {report && report.categorySummaries.length === 0 ? (
                <EmptyState
                  icon="nutrition-outline"
                  title="No Completed Food Rescues"
                  description="No completed food rescues were found for this period. Handover records will appear here as soon as deliveries are completed."
                />
              ) : (
                <View style={styles.categoryCardList}>
                  {report?.categorySummaries.map((item: FoodCategorySummary) => {
                    const isExpanded = Boolean(expandedCategories[item.category]);
                    const catIcon = getCategoryIcon(item.category);

                    return (
                      <GlassCard
                        key={item.category}
                        variant="standard"
                        style={styles.categoryCard}
                      >
                        {/* Header: Name and Total Rescues */}
                        <View style={styles.categoryCardHeader}>
                          <View style={styles.categoryTitleGroup}>
                            <View style={styles.categoryIconCircle}>
                              <Ionicons name={catIcon} size={20} color={colors.brand.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.categoryNameText}>{item.category}</Text>
                              <Text style={styles.categoryRescueCount}>
                                {item.completedRescueCount}{' '}
                                {item.completedRescueCount === 1
                                  ? 'completed rescue'
                                  : 'completed rescues'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Quantities by Unit (Strict Separation) */}
                        <View style={styles.unitBreakdownWrap}>
                          <Text style={styles.unitBreakdownLabel}>Quantities Received:</Text>
                          <View style={styles.unitTagsContainer}>
                            {item.units.map((u) => (
                              <View key={u.unit} style={styles.categoryUnitTag}>
                                <Text style={styles.categoryUnitTagQty}>
                                  {u.totalQuantity.toLocaleString()}
                                </Text>
                                <Text style={styles.categoryUnitTagUnit}>{u.unit}</Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* Center scope metadata */}
                        <View style={styles.categoryMetaRow}>
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color={colors.text.secondary}
                          />
                          <Text style={styles.categoryMetaText}>
                            Received at: {item.centerCount}{' '}
                            {item.centerCount === 1 ? 'collection center' : 'collection centers'}
                            {item.centerNames.length > 0
                              ? ` (${item.centerNames.slice(0, 2).join(', ')}${item.centerNames.length > 2 ? '...' : ''})`
                              : ''}
                          </Text>
                        </View>

                        {/* Expandable Details Button */}
                        {item.donations && item.donations.length > 0 && (
                          <TouchableOpacity
                            style={styles.detailsToggleBtn}
                            onPress={() => toggleCategoryExpand(item.category)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.detailsToggleText}>
                              {isExpanded ? 'Hide Item Details' : 'View Item Details'}
                            </Text>
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={14}
                              color={colors.brand.primary}
                            />
                          </TouchableOpacity>
                        )}

                        {/* Expanded Item List (Zero Beneficiary PII) */}
                        {isExpanded && item.donations && (
                          <View style={styles.donationDetailsList}>
                            {item.donations.map((d, dIdx) => (
                              <View key={d.id || dIdx} style={styles.donationDetailItem}>
                                <View style={styles.donationDetailTop}>
                                  <Text style={styles.donationDetailFoodName} numberOfLines={1}>
                                    {d.foodName}
                                  </Text>
                                  <Text style={styles.donationDetailQty}>
                                    {d.quantity} {d.unit}
                                  </Text>
                                </View>
                                <View style={styles.donationDetailBottom}>
                                  <Text style={styles.donationDetailCenter} numberOfLines={1}>
                                    📍 {d.communityPointName || 'Collection Center'}
                                  </Text>
                                  <Text style={styles.donationDetailDate}>
                                    {new Date(d.completedAt).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                    })}
                                  </Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </GlassCard>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ===================== CENTER SELECTOR MODAL ===================== */}
      <Modal
        visible={isCenterPickerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCenterPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCenterPickerOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Collection Center</Text>
              <TouchableOpacity onPress={() => setIsCenterPickerOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {/* Option: All My Centers */}
              <TouchableOpacity
                style={[
                  styles.centerOptionItem,
                  selectedCenterId === 'ALL' && styles.centerOptionItemActive,
                ]}
                onPress={() => handleCenterSelect('ALL')}
              >
                <View>
                  <Text
                    style={[
                      styles.centerOptionText,
                      selectedCenterId === 'ALL' && styles.centerOptionTextActive,
                    ]}
                  >
                    All My Centers
                  </Text>
                  <Text style={styles.centerOptionSub}>
                    Combined reporting for all managed collection points
                  </Text>
                </View>
                {selectedCenterId === 'ALL' && (
                  <Ionicons name="checkmark" size={18} color={colors.brand.primary} />
                )}
              </TouchableOpacity>

              {/* Managed Centers List */}
              {managedCenters.map((center) => {
                const isSelected = selectedCenterId === center.id;
                return (
                  <TouchableOpacity
                    key={center.id}
                    style={[
                      styles.centerOptionItem,
                      isSelected && styles.centerOptionItemActive,
                    ]}
                    onPress={() => handleCenterSelect(center.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.centerOptionText,
                          isSelected && styles.centerOptionTextActive,
                        ]}
                      >
                        {center.label} {!center.isActive ? '(Inactive)' : ''}
                      </Text>
                      <Text style={styles.centerOptionSub} numberOfLines={1}>
                        {center.address}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={colors.brand.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===================== CUSTOM DATE MODAL ===================== */}
      <Modal
        visible={isCustomModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCustomModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCustomModalOpen(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Custom Date Range</Text>
              <TouchableOpacity onPress={() => setIsCustomModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.customDateHint}>
              Filter by completed rescue dates (YYYY-MM-DD):
            </Text>

            <View style={styles.customInputGroup}>
              <Text style={styles.inputLabel}>From Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.customTextInput}
                value={customStart}
                onChangeText={setCustomStart}
                placeholder="2026-10-01"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.customInputGroup}>
              <Text style={styles.inputLabel}>To Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.customTextInput}
                value={customEnd}
                onChangeText={setCustomEnd}
                placeholder="2026-10-31"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.customModalBtnRow}>
              <GlassButton
                title="Cancel"
                variant="tertiary"
                size="medium"
                onPress={() => setIsCustomModalOpen(false)}
              />
              <GlassButton
                title="Apply Range"
                variant="primary"
                size="medium"
                onPress={handleApplyCustomDates}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  filterSectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  datePillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  datePillActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  datePillText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
  },
  datePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: 8,
  },
  centerSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  centerSelectorLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  centerSelectorValue: {
    ...typography.caption,
    color: colors.brand.dark,
    fontWeight: '700',
    flex: 1,
  },
  pdfActionContainer: {
    marginBottom: spacing.md,
  },
  pdfDisabledHint: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: 6,
    fontSize: 11,
  },
  loadingSkeletonContainer: {
    gap: 12,
    marginVertical: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  kpiNumber: {
    ...typography.h3,
    fontWeight: '800',
    color: colors.brand.primary,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 13,
  },
  unitTotalsSection: {
    marginBottom: spacing.md,
  },
  sectionHeading: {
    ...typography.subtitle1,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  unitPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitTotalPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  unitTotalValue: {
    ...typography.body2,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  unitTotalName: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  emptyUnitNotice: {
    ...typography.caption,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  visualBarCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  visualBarTitle: {
    ...typography.subtitle2,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  visualBarSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  barsList: {
    gap: 8,
  },
  barItem: {
    gap: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barCatName: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
    maxWidth: '70%',
  },
  barCatCount: {
    ...typography.caption,
    color: colors.brand.primary,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: 4,
  },
  categoriesSection: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryCardList: {
    gap: 12,
  },
  categoryCard: {
    padding: spacing.md,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryNameText: {
    ...typography.subtitle1,
    fontWeight: '700',
    color: colors.text.primary,
  },
  categoryRescueCount: {
    ...typography.caption,
    color: colors.brand.dark,
    fontWeight: '600',
  },
  unitBreakdownWrap: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 8,
  },
  unitBreakdownLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  unitTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryUnitTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  categoryUnitTagQty: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  categoryUnitTagUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
  },
  categoryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryMetaText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  detailsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: 8,
  },
  detailsToggleText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  donationDetailsList: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: radius.sm,
    padding: 8,
    gap: 6,
    marginTop: 6,
  },
  donationDetailItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 6,
    padding: 8,
  },
  donationDetailTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  donationDetailFoodName: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  donationDetailQty: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  donationDetailBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donationDetailCenter: {
    fontSize: 11,
    color: colors.text.secondary,
    flex: 1,
  },
  donationDetailDate: {
    fontSize: 11,
    color: colors.text.muted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 420,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.subtitle1,
    fontWeight: '700',
    color: colors.text.primary,
  },
  centerOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  centerOptionItemActive: {
    backgroundColor: '#ECFDF5',
    borderRadius: radius.sm,
  },
  centerOptionText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
  },
  centerOptionTextActive: {
    color: colors.brand.dark,
    fontWeight: '700',
  },
  centerOptionSub: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  customDateHint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  customInputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  customTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body2,
    color: colors.text.primary,
  },
  customModalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: spacing.md,
  },
});
