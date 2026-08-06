export type ExpenseStatus = 'Approved' | 'PendingLevel1Approval' | 'PendingLevel2Approval' | 'Rejected';
export type ApprovalDecisionState = 'Pending' | 'Approved' | 'Rejected';

export interface Approval {
  id: number;
  level: number;
  approverRole: string;
  approverName: string | null;
  decision: ApprovalDecisionState;
  decidedAt: string | null;
  comments: string | null;
}

export interface Expense {
  id: number;
  storeId: number;
  storeName: string;
  categoryName: string;
  description: string;
  amount: number;
  date: string;
  status: ExpenseStatus;
  approvals: Approval[];
  lineItemId: number | null;
  glCode: string | null;
  approvalReason: string | null;
}

export interface CreateExpenseRequest {
  storeId: number;
  categoryId: number;
  description: string;
  amount: number;
  date: string;
  lineItemId?: number | null;
}

export interface DecideApprovalRequest {
  approve: boolean;
  comments?: string;
}

export interface BulkExpenseRow {
  storeName: string;
  categoryName: string;
  lineItemGLCode?: string;
  description: string;
  amount: number;
  date: string;
}

export interface BulkExpenseRowResult {
  rowIndex: number;
  success: boolean;
  error: string | null;
  expense: Expense | null;
}

export type PendingApprovalType = 'Expense' | 'Discount' | 'ForecastRevision';

export interface PendingApproval {
  id: number;
  type: PendingApprovalType;
  level: number;
  approverRole: string;
  approverName: string | null;
  expenseId: number | null;
  saleId: number | null;
  storeId: number;
  storeName: string;
  categoryName: string | null;
  description: string | null;
  amount: number;
  date: string;
  customerName: string | null;
  requestedDiscountPercent: number | null;
  lineItemId: number | null;
  glCode: string | null;
  previousAmount: number | null;
}
