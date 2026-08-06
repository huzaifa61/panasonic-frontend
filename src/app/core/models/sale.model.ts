export type SaleStatus = 'AutoApproved' | 'PendingLevel1Approval' | 'PendingLevel2Approval' | 'Approved' | 'Rejected';

export interface Sale {
  id: number;
  storeId: number;
  storeName: string;
  customerName: string;
  saleAmount: number;
  requestedDiscountPercent: number;
  date: string;
  status: SaleStatus;
}

export interface CreateSaleRequest {
  storeId: number;
  customerName: string;
  saleAmount: number;
  requestedDiscountPercent: number;
  date: string;
}
