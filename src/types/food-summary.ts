/**
 * Authority Surplus Food Summary & Reporting Types
 * Community Food Rescue App
 * Zero Beneficiary PII - Factual Operational Reporting
 */

export type FoodSummaryDateRangeOption =
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'ALL_TIME'
  | 'CUSTOM';

export interface AuthorityFoodReportFilters {
  dateRange: FoodSummaryDateRangeOption;
  customStartDate?: string; // YYYY-MM-DD
  customEndDate?: string; // YYYY-MM-DD
  communityPointId?: string; // specific center ID or 'ALL'
}

export interface FoodUnitTotal {
  unit: string;
  totalQuantity: number;
}

export interface CategoryUnitSummary {
  unit: string;
  totalQuantity: number;
  rescueCount: number;
}

export interface CategoryDonationDetail {
  id: string;
  foodName: string;
  quantity: number;
  unit: string;
  communityPointId?: string;
  communityPointName?: string;
  completedAt: string;
}

export interface FoodCategorySummary {
  category: string;
  units: CategoryUnitSummary[];
  completedRescueCount: number;
  centerCount: number;
  centerNames: string[];
  donations: CategoryDonationDetail[];
}

export interface CollectionCenterBreakdown {
  centerId: string;
  centerName: string;
  completedRescueCount: number;
  unitTotals: FoodUnitTotal[];
  categories: {
    category: string;
    units: FoodUnitTotal[];
  }[];
}

export interface AuthorityFoodSummaryReport {
  kpis: {
    completedRescues: number;
    foodCategoriesCount: number;
    centersCount: number;
  };
  totalsByUnit: FoodUnitTotal[];
  categorySummaries: FoodCategorySummary[];
  centerBreakdowns: CollectionCenterBreakdown[];
  periodLabel: string;
  centerFilterLabel: string;
  generatedAt: string;
  authorityName: string;
  authorityOrganization?: string;
}
