export interface MonthCell {
  calendarYear: number;
  calendarMonth: number;
  budget: number;
  forecast: number;
  result: number;
  isLocked: boolean;
  hasPendingForecastApproval: boolean;
  pendingForecastAmount: number | null;
}

export interface LineItemGridRow {
  lineItemId: number;
  glCode: string;
  description: string;
  costCenter: string;
  expenseCategory: string;
  units: number;
  rate: number;
  startDate: string;
  endDate: string;
  noOfMonths: number;
  totalCost: number;
  approvedAmount: number;
  months: MonthCell[];
}

export interface CategoryRollupRow {
  expenseCategory: string;
  monthlyBudget: number[];
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  h1: number;
  h2: number;
  fiscalYearTotal: number;
}

export interface StoreBudgetGrid {
  storeId: number;
  fiscalYear: number;
  asOfCalendarYear: number;
  asOfCalendarMonth: number;
  currentForecastVersionId: number | null;
  currentForecastLabel: string | null;
  lineItems: LineItemGridRow[];
  categoryRollup: CategoryRollupRow[];
  grandTotalMonthlyBudget: number[];
  grandTotalFiscalYearBudget: number;
  grandTotalMonthlyForecast: number[];
  grandTotalFiscalYearForecast: number;
  grandTotalMonthlyActual: number[];
  grandTotalFiscalYearActual: number;
  totalAllocatedBudget: number | null;
}

export interface UpsertLineItemRequest {
  glCode: string;
  description: string;
  costCenter: string;
  expenseCategory: string;
  units: number;
  rate: number;
  startDate: string;
  endDate: string;
  noOfMonths: number;
  approvedAmount: number;
}

export interface BudgetCellSave {
  lineItemId: number;
  calendarYear: number;
  calendarMonth: number;
  amount: number;
}

export interface ForecastRevisionApproval {
  id: number;
  storeId: number;
  lineItemId: number;
  glCode: string;
  description: string;
  calendarYear: number;
  calendarMonth: number;
  proposedAmount: number;
  previousAmount: number;
  level: number;
  approverRole: string;
  approverName: string | null;
  decision: string;
  decidedAt: string | null;
  comments: string | null;
  createdAt: string;
}

export interface ForecastRevisionResult {
  appliedImmediately: BudgetCellSave[];
  pendingApprovals: ForecastRevisionApproval[];
}

export interface ForecastVersion {
  id: number;
  label: string;
  asOfCalendarYear: number;
  asOfCalendarMonth: number;
  createdAt: string;
  isCurrent: boolean;
}
