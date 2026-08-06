export interface CreateStoreRequest {
  name: string;
  city: string;
  regionName: string;
  storeManagerName: string;
  regionalManagerName: string;
  managerUsername: string;
  managerPassword: string;
}

export interface UpdateStoreRequest {
  name: string;
  city: string;
  regionName: string;
  storeManagerName: string;
  regionalManagerName: string;
}

export interface UpsertBudgetRequest {
  year: number;
  month: number;
  amount: number;
}

export interface UpsertTargetRequest {
  year: number;
  month: number;
  targetProfitAmount: number;
  forecastedRevenue?: number;
  forecastedExpense?: number;
}

export interface UpsertHeadcountRequest {
  year: number;
  month: number;
  currentHeadcount: number;
  forecastedHeadcountNeed: number;
}

export interface StoreAllocatedBudget {
  storeId: number;
  fiscalYear: number;
  totalAllocatedBudget: number;
}

export interface UpsertStoreAllocatedBudgetRequest {
  fiscalYear: number;
  totalAllocatedBudget: number;
}
