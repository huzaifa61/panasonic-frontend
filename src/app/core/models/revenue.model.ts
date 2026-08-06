export interface Revenue {
  id: number;
  storeId: number;
  storeName: string;
  categoryId: number;
  categoryName: string;
  amount: number;
  date: string;
  description: string | null;
}

export interface CreateRevenueRequest {
  storeId: number;
  categoryId: number;
  amount: number;
  date: string;
  description?: string;
}

export interface BulkRevenueRow {
  storeName: string;
  categoryName: string;
  description?: string;
  amount: number;
  date: string;
}

export interface BulkRevenueRowResult {
  rowIndex: number;
  success: boolean;
  error: string | null;
  revenue: Revenue | null;
}
