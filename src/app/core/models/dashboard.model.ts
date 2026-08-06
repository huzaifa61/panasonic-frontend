export type PaceStatus = 'OnTrack' | 'BehindPace' | 'OverPace' | 'NotStarted';

export interface StoreDashboard {
  storeId: number;
  storeName: string;
  year: number;
  month: number;
  budget: number;
  approvedExpense: number;
  pendingExpense: number;
  earnings: number;
  forecastedRevenue: number;
  forecastedExpense: number;
  netProfit: number;
  budgetVariance: number;
  pendingApprovalsCount: number;
  targetProfitAmount: number;
  metProfitTarget: boolean;
  marginPercent: number;
  projectedRevenue: number;
  projectedExpense: number;
  paceStatus: PaceStatus;
}

export interface Overview {
  year: number;
  month: number;
  totalBudget: number;
  totalApprovedExpense: number;
  totalEarnings: number;
  totalNetProfit: number;
  totalPendingApprovals: number;
  aggregateMarginPercent: number;
  storesMeetingTarget: number;
  storesTotal: number;
  stores: StoreDashboard[];
}

export interface MonthlyTrend {
  year: number;
  month: number;
  budget: number;
  approvedExpense: number;
  earnings: number;
  forecastedExpense: number;
}

export interface CategoryBreakdown {
  categoryName: string;
  amount: number;
}

export interface CategoryMargin {
  categoryName: string;
  revenue: number;
  costOfSales: number;
  marginPercent: number;
}
