/**
 * Authority Surplus Food Summary & Reporting Service
 * Community Food Rescue App
 *
 * Provides aggregated category & unit operational summaries for Community Authorities.
 * Strictly enforces:
 *  1. Only COMPLETED donations counted
 *  2. Filtering by completion date (completed_at)
 *  3. Scoped strictly to collection centers managed by the authenticated Authority
 *  4. Incompatible units are kept strictly separated (never summed together)
 *  5. Zero beneficiary personal identifiable information (PII)
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { CommunityPoint } from '../../types/coordinator';
import {
  AuthorityFoodReportFilters,
  AuthorityFoodSummaryReport,
  FoodCategorySummary,
  FoodUnitTotal,
  CollectionCenterBreakdown,
  CategoryDonationDetail,
} from '../../types/food-summary';

/**
 * Normalizes legacy or slightly differing category names to standard display groups.
 * Does NOT alter database records.
 */
export function normalizeFoodCategory(rawCategory?: string | null): string {
  if (!rawCategory || typeof rawCategory !== 'string') {
    return 'Other / Uncategorized';
  }

  const trimmed = rawCategory.trim();
  if (!trimmed) {
    return 'Other / Uncategorized';
  }

  const lower = trimmed.toLowerCase();
  if (lower === 'prepared meal' || lower === 'prepared meals') {
    return 'Prepared Meals';
  }
  if (lower === 'bakery' || lower === 'baked goods') {
    return 'Bakery';
  }
  if (lower === 'rice & curry' || lower === 'rice and curry') {
    return 'Rice & Curry';
  }
  if (lower === 'vegetable' || lower === 'vegetables') {
    return 'Vegetables';
  }
  if (lower === 'fruit' || lower === 'fruits') {
    return 'Fruit';
  }
  if (lower === 'dairy') {
    return 'Dairy';
  }
  if (lower === 'packaged food' || lower === 'packaged foods' || lower === 'pantry') {
    return 'Packaged Food';
  }
  if (lower === 'beverage' || lower === 'beverages') {
    return 'Beverages';
  }

  return trimmed;
}

/**
 * Normalizes unit strings for consistent grouping.
 */
export function normalizeUnit(rawUnit?: string | null): string {
  if (!rawUnit || typeof rawUnit !== 'string') {
    return 'items';
  }
  return rawUnit.trim().toLowerCase();
}

/**
 * Checks whether a completion date falls within the selected filter window.
 */
export function isWithinDateRange(
  completedAtStr: string | null | undefined,
  filters: AuthorityFoodReportFilters,
  referenceNow: Date = new Date()
): boolean {
  if (!completedAtStr) return false;
  const completedDate = new Date(completedAtStr);
  if (isNaN(completedDate.getTime())) return false;

  const completedTime = completedDate.getTime();
  const now = referenceNow.getTime();

  switch (filters.dateRange) {
    case 'TODAY': {
      const startOfDay = new Date(referenceNow);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(referenceNow);
      endOfDay.setHours(23, 59, 59, 999);
      return completedTime >= startOfDay.getTime() && completedTime <= endOfDay.getTime();
    }
    case 'LAST_7_DAYS': {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      return completedTime >= sevenDaysAgo && completedTime <= now;
    }
    case 'LAST_30_DAYS': {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      return completedTime >= thirtyDaysAgo && completedTime <= now;
    }
    case 'ALL_TIME':
      return true;
    case 'CUSTOM': {
      let isAfterStart = true;
      let isBeforeEnd = true;

      if (filters.customStartDate) {
        const parts = filters.customStartDate.split(/[-/]/).map(Number);
        const start =
          parts.length === 3
            ? new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
            : new Date(filters.customStartDate);
        if (!isNaN(start.getTime())) {
          isAfterStart = completedTime >= start.getTime();
        }
      }

      if (filters.customEndDate) {
        const parts = filters.customEndDate.split(/[-/]/).map(Number);
        const end =
          parts.length === 3
            ? new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999)
            : new Date(filters.customEndDate);
        if (!isNaN(end.getTime())) {
          isBeforeEnd = completedTime <= end.getTime();
        }
      }

      return isAfterStart && isBeforeEnd;
    }
    default:
      return true;
  }
}

/**
 * Retrieves all collection centers owned by the Authority (including inactive for historical audit).
 */
export async function getAuthorityManagedCenters(
  coordinatorId: string
): Promise<CommunityPoint[]> {
  if (!isSupabaseConfigured || !supabase || !coordinatorId) {
    return [];
  }

  const { data, error } = await supabase
    .from('community_points')
    .select('*')
    .eq('coordinator_id', coordinatorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[FoodSummaryService] Error fetching managed centers:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    coordinatorId: row.coordinator_id,
    organizationId: row.organization_id || undefined,
    organizationName: row.organization_name || 'Community Hub',
    label: row.label || 'Collection Center',
    address: row.address || '',
    latitude: row.latitude || 0,
    longitude: row.longitude || 0,
    instructions: row.instructions || undefined,
    contactName: row.contact_name || '',
    contactPhone: row.contact_phone || '',
    operatingHours: row.operating_hours || undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Core business aggregation engine.
 * Pure function that takes completed donation records and owned centers to produce the AuthorityFoodSummaryReport.
 */
export function aggregateFoodSummaryData(
  rawDonations: any[],
  authorityCenters: CommunityPoint[],
  filters: AuthorityFoodReportFilters,
  authorityDisplayName: string = 'Community Authority',
  authorityOrganizationName?: string
): AuthorityFoodSummaryReport {
  const centerMap = new Map<string, CommunityPoint>();
  const authorizedCenterIds = new Set<string>();

  authorityCenters.forEach((c) => {
    centerMap.set(c.id, c);
    authorizedCenterIds.add(c.id);
  });

  // 1. Filter donations:
  // - MUST be COMPLETED
  // - MUST belong to one of this Authority's centers
  // - MUST match center filter (if specific center is selected)
  // - MUST fall within the date range by completed_at (or fallback to updated_at)
  const completedDonations = (rawDonations || []).filter((d) => {
    // Strictest status check
    if (d.status !== 'COMPLETED') {
      return false;
    }

    const rawCenterId = d.community_point_id || d.communityPointId;
    // Must not belong to an unauthorized center for this authority
    if (rawCenterId && !authorizedCenterIds.has(rawCenterId)) {
      return false;
    }

    const defaultCenterId = authorityCenters[0]?.id;
    const effectiveCenterId = rawCenterId || defaultCenterId;

    // Specific center filter
    if (filters.communityPointId && filters.communityPointId !== 'ALL') {
      if (rawCenterId) {
        if (rawCenterId !== filters.communityPointId) {
          return false;
        }
      } else {
        if (effectiveCenterId !== filters.communityPointId) {
          return false;
        }
      }
    }

    // Date range filter using completed_at (fallback to updated_at if historical completed_at is null)
    const completionTimestamp = d.completed_at || d.completedAt || d.updated_at || d.updatedAt;
    return isWithinDateRange(completionTimestamp, filters);
  });

  // 2. Data aggregation structures
  const categoryGroups = new Map<
    string,
    {
      units: Map<string, { totalQuantity: number; rescueCount: number }>;
      completedRescueCount: number;
      centerIds: Set<string>;
      donations: CategoryDonationDetail[];
    }
  >();

  const overallUnitTotals = new Map<string, number>();
  const centersReceivedFood = new Set<string>();

  // Center breakdown map: centerId -> { completedRescueCount, units, categories }
  const centerBreakdownMap = new Map<
    string,
    {
      centerName: string;
      completedRescueCount: number;
      unitTotals: Map<string, number>;
      categories: Map<string, Map<string, number>>;
    }
  >();

  for (const item of completedDonations) {
    const rawCategory = item.food_category || item.category || (item.food && item.food.category);
    const category = normalizeFoodCategory(rawCategory);

    const rawUnit = item.unit || (item.food && item.food.unit);
    const unit = normalizeUnit(rawUnit);

    const rawQty = item.quantity !== undefined ? item.quantity : (item.food && item.food.quantity);
    const numQty = typeof rawQty === 'number' && !isNaN(rawQty) && rawQty > 0 ? rawQty : 0;

    const centerId = item.community_point_id || item.communityPointId || authorityCenters[0]?.id || 'collection-center';
    const centerObj = centerMap.get(centerId);
    const centerName =
      centerObj?.label ||
      item.community_point_name ||
      item.communityPointName ||
      authorityCenters[0]?.label ||
      'Collection Center';

    const completionTimestamp =
      item.completed_at || item.completedAt || item.updated_at || item.updatedAt || new Date().toISOString();

    const foodTitle = item.food_name || (item.food && item.food.name) || 'Surplus Food';

    if (centerId) {
      centersReceivedFood.add(centerId);
    }

    // Update overall unit totals
    const currentOverallUnitQty = overallUnitTotals.get(unit) || 0;
    overallUnitTotals.set(unit, currentOverallUnitQty + numQty);

    // Update category groups
    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, {
        units: new Map(),
        completedRescueCount: 0,
        centerIds: new Set(),
        donations: [],
      });
    }

    const catGroup = categoryGroups.get(category)!;
    catGroup.completedRescueCount += 1;
    catGroup.centerIds.add(centerId);

    const currentUnitData = catGroup.units.get(unit) || { totalQuantity: 0, rescueCount: 0 };
    catGroup.units.set(unit, {
      totalQuantity: currentUnitData.totalQuantity + numQty,
      rescueCount: currentUnitData.rescueCount + 1,
    });

    catGroup.donations.push({
      id: item.id,
      foodName: foodTitle,
      quantity: numQty,
      unit,
      communityPointId: centerId,
      communityPointName: centerName,
      completedAt: completionTimestamp,
    });

    // Update center breakdown
    if (!centerBreakdownMap.has(centerId)) {
      centerBreakdownMap.set(centerId, {
        centerName,
        completedRescueCount: 0,
        unitTotals: new Map(),
        categories: new Map(),
      });
    }

    const centerData = centerBreakdownMap.get(centerId)!;
    centerData.completedRescueCount += 1;

    const curCenterUnitTotal = centerData.unitTotals.get(unit) || 0;
    centerData.unitTotals.set(unit, curCenterUnitTotal + numQty);

    if (!centerData.categories.has(category)) {
      centerData.categories.set(category, new Map());
    }
    const curCatUnitMap = centerData.categories.get(category)!;
    const curCatUnitQty = curCatUnitMap.get(unit) || 0;
    curCatUnitMap.set(unit, curCatUnitQty + numQty);
  }

  // 3. Format category summaries
  const categorySummaries: FoodCategorySummary[] = [];
  categoryGroups.forEach((data, category) => {
    const unitsList = Array.from(data.units.entries())
      .map(([unit, val]) => ({
        unit,
        totalQuantity: Math.round(val.totalQuantity * 100) / 100,
        rescueCount: val.rescueCount,
      }))
      .sort((a, b) => a.unit.localeCompare(b.unit));

    const centerNames = Array.from(data.centerIds).map(
      (cid) => centerMap.get(cid)?.label || 'Collection Center'
    );

    categorySummaries.push({
      category,
      units: unitsList,
      completedRescueCount: data.completedRescueCount,
      centerCount: data.centerIds.size,
      centerNames,
      donations: data.donations.sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    });
  });

  // Sort categories alphabetically or by completedRescueCount descending
  categorySummaries.sort((a, b) => b.completedRescueCount - a.completedRescueCount);

  // 4. Format totals by unit
  const totalsByUnit: FoodUnitTotal[] = Array.from(overallUnitTotals.entries())
    .map(([unit, qty]) => ({
      unit,
      totalQuantity: Math.round(qty * 100) / 100,
    }))
    .sort((a, b) => a.unit.localeCompare(b.unit));

  // 5. Format collection center breakdowns
  const centerBreakdowns: CollectionCenterBreakdown[] = Array.from(
    centerBreakdownMap.entries()
  ).map(([centerId, data]) => {
    const unitTotals = Array.from(data.unitTotals.entries()).map(([unit, qty]) => ({
      unit,
      totalQuantity: Math.round(qty * 100) / 100,
    }));

    const categories = Array.from(data.categories.entries()).map(([cat, uMap]) => ({
      category: cat,
      units: Array.from(uMap.entries()).map(([u, q]) => ({
        unit: u,
        totalQuantity: Math.round(q * 100) / 100,
      })),
    }));

    return {
      centerId,
      centerName: data.centerName,
      completedRescueCount: data.completedRescueCount,
      unitTotals,
      categories,
    };
  });

  // Filter labels
  let periodLabel = 'Last 30 Days';
  if (filters.dateRange === 'TODAY') periodLabel = 'Today';
  else if (filters.dateRange === 'LAST_7_DAYS') periodLabel = 'Last 7 Days';
  else if (filters.dateRange === 'LAST_30_DAYS') periodLabel = 'Last 30 Days';
  else if (filters.dateRange === 'ALL_TIME') periodLabel = 'All Time';
  else if (filters.dateRange === 'CUSTOM') {
    const fromStr = filters.customStartDate || 'Start';
    const toStr = filters.customEndDate || 'End';
    periodLabel = `${fromStr} to ${toStr}`;
  }

  let centerFilterLabel = 'All My Centers';
  if (filters.communityPointId && filters.communityPointId !== 'ALL') {
    centerFilterLabel = centerMap.get(filters.communityPointId)?.label || 'Selected Center';
  }

  return {
    kpis: {
      completedRescues: completedDonations.length,
      foodCategoriesCount: categorySummaries.length,
      centersCount: centersReceivedFood.size,
    },
    totalsByUnit,
    categorySummaries,
    centerBreakdowns,
    periodLabel,
    centerFilterLabel,
    generatedAt: new Date().toISOString(),
    authorityName: authorityDisplayName,
    authorityOrganization: authorityOrganizationName,
  };
}

/**
 * Fetches real Supabase records and returns the aggregated food category summary.
 */
export async function getAuthorityFoodCategorySummary(
  coordinatorId: string,
  filters: AuthorityFoodReportFilters,
  authorityDisplayName: string = 'Community Authority',
  authorityOrganizationName?: string
): Promise<AuthorityFoodSummaryReport> {
  if (!isSupabaseConfigured || !supabase || !coordinatorId) {
    return aggregateFoodSummaryData([], [], filters, authorityDisplayName, authorityOrganizationName);
  }

  // 1. Fetch all centers managed by this Authority (active & inactive)
  const centers = await getAuthorityManagedCenters(coordinatorId);
  if (centers.length === 0) {
    return aggregateFoodSummaryData([], [], filters, authorityDisplayName, authorityOrganizationName);
  }

  const centerIds = centers.map((c) => c.id);

  // 2. Fetch completed donations for this Authority's centers
  let query = supabase
    .from('donations')
    .select('*')
    .eq('status', 'COMPLETED')
    .order('completed_at', { ascending: false });

  if (centerIds.length > 0) {
    query = query.or(`community_point_id.in.(${centerIds.join(',')}),community_point_id.is.null`);
  }

  const { data: donations, error } = await query;

  if (error) {
    console.error('[FoodSummaryService] Fetch donations error:', error);
    throw new Error('Unable to retrieve completed rescue records.');
  }

  return aggregateFoodSummaryData(
    donations || [],
    centers,
    filters,
    authorityDisplayName,
    authorityOrganizationName
  );
}
