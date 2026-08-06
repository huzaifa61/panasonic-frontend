export interface GlobalPlanningMonthCell {
  calendarYear: number;
  calendarMonth: number;
  budget: number;
  isBudgetEditable: boolean;
  forecastedExpense: number;
  isForecastEditable: boolean;
  isMonthLocked: boolean;
}

export interface GlobalPlanningStore {
  storeId: number;
  storeName: string;
  months: GlobalPlanningMonthCell[];
}

export interface GlobalPlanningCellSave {
  storeId: number;
  calendarYear: number;
  calendarMonth: number;
  budget?: number;
  forecastedExpense?: number;
}
