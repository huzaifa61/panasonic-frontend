import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { ExpenseService } from '../../core/services/expense.service';
import { BudgetPlanningService } from '../../core/services/budget-planning.service';
import { ApplianceCategory, Store } from '../../core/models/store.model';
import { BulkExpenseRow, Expense, ExpenseStatus } from '../../core/models/expense.model';
import { CategoryIconComponent } from '../../shared/icons/category-icon.component';
import { StoreIconComponent } from '../../shared/illustrations/store-icon.component';
import { LoadingIndicatorComponent } from '../../shared/loading/loading-indicator.component';
import { downloadCsv } from '../../shared/utils/csv-export.util';
import { parseCsv } from '../../shared/utils/csv-import.util';
import { ToastService } from '../../core/services/toast.service';

interface LineItemOption {
  id: number;
  glCode: string;
  description: string;
}

type StatusFilter = 'All' | ExpenseStatus;

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryIconComponent, StoreIconComponent, LoadingIndicatorComponent],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss'
})
export class ExpensesComponent implements OnInit {
  stores = signal<Store[]>([]);
  categories = signal<ApplianceCategory[]>([]);
  expenses = signal<Expense[]>([]);
  lineItems = signal<LineItemOption[]>([]);
  loading = signal(true);
  submitting = signal(false);
  bulkUploading = signal(false);

  // Budget Planning's line items are fiscal-year-scoped; the demo's "current" period
  // matches the rest of the app (Jul-2026), not the real system clock.
  private readonly fiscalYear = 2026;
  private readonly asOf = '2026-07-15';

  statusFilter = signal<StatusFilter>('All');
  dateFrom = signal<string | null>(null);
  dateTo = signal<string | null>(null);
  glCodeFilter = signal<string | 'All'>('All');
  filteredExpenses = computed(() => {
    const status = this.statusFilter();
    const from = this.dateFrom();
    const to = this.dateTo();
    const glCode = this.glCodeFilter();
    return this.expenses().filter((e) => {
      if (status !== 'All' && e.status !== status) return false;
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      if (glCode !== 'All' && (e.glCode ?? 'Unallocated') !== glCode) return false;
      return true;
    });
  });

  filteredTotal = computed(() => this.filteredExpenses().reduce((sum, e) => sum + e.amount, 0));

  // Distinct GL codes present in the currently loaded (store/date-filtered)
  // expense list, so the dropdown only ever shows codes that actually appear.
  availableGlCodes = computed(() => {
    const codes = new Set(this.expenses().map((e) => e.glCode ?? 'Unallocated'));
    return Array.from(codes).sort();
  });

  // Store/year/month filter, driven by the URL so a link from the Dashboard
  // (click a store row) lands here pre-filtered, and also editable directly
  // via the Store dropdown in the toolbar.
  filterStoreId = signal<number | null>(null);
  filterYear: number | null = null;
  filterMonth: number | null = null;

  form = {
    storeId: null as number | null,
    categoryId: null as number | null,
    lineItemId: null as number | null,
    description: '',
    amount: null as number | null,
    date: '2026-07-15'
  };

  constructor(
    private storeService: StoreService,
    private expenseService: ExpenseService,
    private budgetPlanningService: BudgetPlanningService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.storeService.getStores().subscribe((stores) => {
      this.stores.set(stores);
      if (stores.length && this.form.storeId == null) {
        this.form.storeId = stores[0].id;
        this.onStoreChange();
      }
    });
    this.storeService.getCategories().subscribe((categories) => {
      this.categories.set(categories);
      if (categories.length && this.form.categoryId == null) {
        this.form.categoryId = categories[0].id;
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      const storeId = params.get('storeId');
      const year = params.get('year');
      const month = params.get('month');
      this.filterStoreId.set(storeId ? Number(storeId) : null);
      this.filterYear = year ? Number(year) : null;
      this.filterMonth = month ? Number(month) : null;
      this.loadExpenses();
    });
  }

  // Updates just the storeId query param, leaving any year/month filter that
  // arrived via a Dashboard link untouched.
  onFilterStoreChange(storeId: number | null): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { storeId }, queryParamsHandling: 'merge' });
  }

  clearFilters(): void {
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.glCodeFilter.set('All');
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  // The line item dropdown is optional and scoped to whichever store is selected -
  // reload it whenever the store changes.
  onStoreChange(): void {
    this.form.lineItemId = null;
    if (this.form.storeId == null) {
      this.lineItems.set([]);
      return;
    }
    this.budgetPlanningService.getGrid(this.form.storeId, this.fiscalYear, this.asOf).subscribe({
      next: (grid) => {
        // lineItemId 0 is the synthetic "Unallocated / Other" row the grid uses to
        // surface untagged spend - it isn't a real BudgetLineItem, so it can't be
        // picked here when recording a new expense.
        this.lineItems.set(
          grid.lineItems
            .filter((li) => li.lineItemId > 0)
            .map((li) => ({ id: li.lineItemId, glCode: li.glCode, description: li.description }))
        );
      },
      error: () => this.lineItems.set([])
    });
  }

  loadExpenses(): void {
    this.loading.set(true);
    this.expenseService.getExpenses(this.filterStoreId() ?? undefined, this.filterYear ?? undefined, this.filterMonth ?? undefined).subscribe({
      next: (expenses) => {
        this.expenses.set(expenses);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Could not load expenses.');
        this.loading.set(false);
      }
    });
  }

  submit(): void {
    if (!this.form.storeId || !this.form.categoryId || !this.form.description || !this.form.amount || !this.form.date) {
      this.toastService.error('Please fill in all fields.');
      return;
    }

    this.submitting.set(true);

    this.expenseService
      .createExpense({
        storeId: this.form.storeId,
        categoryId: this.form.categoryId,
        description: this.form.description,
        amount: this.form.amount,
        date: this.form.date,
        lineItemId: this.form.lineItemId
      })
      .subscribe({
        next: (expense) => {
          this.submitting.set(false);
          this.toastService.success(
            expense.status === 'Approved'
              ? `Expense "${expense.description}" auto-approved (within budget and threshold).`
              : `Expense "${expense.description}" needs Store Manager approval. ${expense.approvalReason ?? ''}`
          );
          this.form.description = '';
          this.form.amount = null;
          this.form.lineItemId = null;
          this.loadExpenses();
        },
        error: () => {
          this.submitting.set(false);
          this.toastService.error('Failed to create expense.');
        }
      });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Approved':
        return 'Approved';
      case 'PendingLevel1Approval':
        return 'Pending: Store Manager';
      case 'PendingLevel2Approval':
        return 'Pending: Regional Manager';
      case 'Rejected':
        return 'Rejected';
      default:
        return status;
    }
  }

  downloadCsv(): void {
    const rows = this.filteredExpenses().map((e) => [
      e.date,
      e.storeName,
      e.categoryName,
      e.glCode ?? '',
      e.description,
      e.amount,
      this.statusLabel(e.status)
    ]);
    downloadCsv(
      `expenses-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Date', 'Store', 'Category', 'GL Code', 'Description', 'Amount (AED)', 'Status'],
      rows
    );
  }

  statusClass(status: string): string {
    if (status === 'Approved') return 'ok';
    if (status === 'Rejected') return 'rejected';
    return '';
  }

  downloadUploadTemplate(): void {
    downloadCsv(
      'expenses-upload-template.csv',
      ['Date', 'Store', 'Category', 'Line Item (GL Code)', 'Description', 'Amount'],
      [['2026-07-20', 'Panasonic Dubai Mall', 'Operations Cost', 'OPX-STAFF', 'Weekend overtime', 1200]]
    );
  }

  onBulkFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.processBulkUpload(reader.result as string);
      input.value = '';
    };
    reader.readAsText(file);
  }

  private processBulkUpload(text: string): void {
    const rows = parseCsv(text);
    if (rows.length === 0) {
      this.toastService.error('The CSV file is empty.');
      return;
    }

    // Skip a header row if the first cell isn't a date (matches the downloaded template).
    const dataRows = /^\d{4}-\d{2}-\d{2}$/.test(rows[0][0]) ? rows : rows.slice(1);

    const bulkRows: BulkExpenseRow[] = dataRows
      .filter((r) => r.length >= 6 && r[0] && r[1] && r[2])
      .map((r) => ({
        date: r[0],
        storeName: r[1],
        categoryName: r[2],
        lineItemGLCode: r[3] || undefined,
        description: r[4],
        amount: Number(r[5]) || 0
      }));

    if (bulkRows.length === 0) {
      this.toastService.error('No valid rows found in the CSV file.');
      return;
    }

    this.bulkUploading.set(true);
    this.expenseService.bulkCreate(bulkRows).subscribe({
      next: (results) => {
        this.bulkUploading.set(false);
        const succeeded = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success);
        if (failed.length === 0) {
          this.toastService.success(`Uploaded ${succeeded} expense${succeeded === 1 ? '' : 's'}.`);
        } else {
          this.toastService.error(
            `${succeeded} succeeded, ${failed.length} failed. Row ${failed[0].rowIndex + 1}: ${failed[0].error}`
          );
        }
        this.loadExpenses();
      },
      error: () => {
        this.bulkUploading.set(false);
        this.toastService.error('Bulk upload failed.');
      }
    });
  }
}
