import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { BudgetPlanningService } from '../../core/services/budget-planning.service';
import { ToastService } from '../../core/services/toast.service';
import { Store } from '../../core/models/store.model';
import { BudgetCellSave, StoreBudgetGrid, UpsertLineItemRequest } from '../../core/models/budget-planning.model';
import { BudgetLineItemGridComponent } from './budget-line-item-grid.component';
import { LoadingIndicatorComponent } from '../../shared/loading/loading-indicator.component';

@Component({
  selector: 'app-budget-planning',
  standalone: true,
  imports: [CommonModule, FormsModule, BudgetLineItemGridComponent, LoadingIndicatorComponent],
  templateUrl: './budget-planning.component.html',
  styleUrl: './budget-planning.component.scss'
})
export class BudgetPlanningComponent implements OnInit {
  stores = signal<Store[]>([]);
  selectedStoreId = signal<number | null>(null);
  fiscalYear = 2026;

  // Fixed to match the rest of the app's demo "current" period (Jul-2026) rather than
  // the real system clock, so locked/unlocked months line up with the seeded data.
  asOf = '2026-07-15';

  grid = signal<StoreBudgetGrid | null>(null);
  loading = signal(true);

  showAddForm = signal(false);
  addSubmitting = signal(false);
  newLineItem = this.blankLineItem();

  grandTotals = computed(() => {
    const g = this.grid();
    if (!g) return null;
    const sum = (key: 'q1' | 'q2' | 'q3' | 'q4') => g.categoryRollup.reduce((s, c) => s + c[key], 0);
    const q1 = sum('q1');
    const q2 = sum('q2');
    const q3 = sum('q3');
    const q4 = sum('q4');
    return { q1, q2, q3, q4, h1: q1 + q2, h2: q3 + q4, fy: g.grandTotalFiscalYearBudget };
  });

  constructor(
    private storeService: StoreService,
    private budgetPlanningService: BudgetPlanningService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.storeService.getStores().subscribe((stores) => {
      this.stores.set(stores);
      if (stores.length && this.selectedStoreId() == null) {
        this.selectedStoreId.set(stores[0].id);
        this.loadGrid();
      }
    });
  }

  onStoreChange(): void {
    this.loadGrid();
  }

  loadGrid(): void {
    const storeId = this.selectedStoreId();
    if (storeId == null) return;
    this.loading.set(true);
    this.budgetPlanningService.getGrid(storeId, this.fiscalYear, this.asOf).subscribe({
      next: (grid) => {
        this.grid.set(grid);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Could not load the budget planning grid.');
        this.loading.set(false);
      }
    });
  }

  onSaveBudget(cells: BudgetCellSave[]): void {
    const storeId = this.selectedStoreId();
    if (storeId == null || cells.length === 0) return;
    this.budgetPlanningService.saveBudgetGrid(storeId, this.fiscalYear, this.asOf, cells).subscribe({
      next: (grid) => {
        this.grid.set(grid);
        this.toastService.success(`Saved ${cells.length} budget change${cells.length === 1 ? '' : 's'}.`);
      },
      error: (err) => {
        this.toastService.error(err?.error?.error ?? 'Failed to save the budget.');
      }
    });
  }

  onProposeForecast(cells: BudgetCellSave[]): void {
    const storeId = this.selectedStoreId();
    if (storeId == null || cells.length === 0) return;
    this.budgetPlanningService.proposeForecastChanges(storeId, this.fiscalYear, this.asOf, cells).subscribe({
      next: (result) => {
        if (result.pendingApprovals.length > 0) {
          this.toastService.success(
            `${result.pendingApprovals.length} forecast change${result.pendingApprovals.length === 1 ? '' : 's'} ` +
              `exceed the approved cap and now need Regional Manager sign-off in the Approvals inbox.`
          );
        } else {
          this.toastService.success('Forecast updated.');
        }
        this.loadGrid();
      },
      error: (err) => {
        this.toastService.error(err?.error?.error ?? 'Failed to propose forecast changes.');
      }
    });
  }

  lockForecastVersion(): void {
    const storeId = this.selectedStoreId();
    if (storeId == null) return;
    this.budgetPlanningService.lockForecastVersion(storeId, this.fiscalYear, this.asOf).subscribe({
      next: () => {
        this.toastService.success('Forecast locked. A new version is now active.');
        this.loadGrid();
      },
      error: (err) => {
        this.toastService.error(err?.error?.error ?? 'Failed to lock the forecast.');
      }
    });
  }

  submitAddLineItem(): void {
    const storeId = this.selectedStoreId();
    const f = this.newLineItem;
    if (storeId == null || !f.glCode || !f.description || !f.costCenter || !f.expenseCategory || f.rate == null || f.approvedAmount == null) {
      this.toastService.error('Please fill in all fields.');
      return;
    }

    this.addSubmitting.set(true);
    const request: UpsertLineItemRequest = {
      glCode: f.glCode,
      description: f.description,
      costCenter: f.costCenter,
      expenseCategory: f.expenseCategory,
      units: f.units,
      rate: f.rate,
      startDate: f.startDate,
      endDate: f.endDate,
      noOfMonths: f.noOfMonths,
      approvedAmount: f.approvedAmount
    };

    this.budgetPlanningService.createLineItem(storeId, this.fiscalYear, request).subscribe({
      next: () => {
        this.addSubmitting.set(false);
        this.showAddForm.set(false);
        this.toastService.success(`Added line item ${f.glCode}.`);
        this.newLineItem = this.blankLineItem();
        this.loadGrid();
      },
      error: (err) => {
        this.addSubmitting.set(false);
        this.toastService.error(err?.error?.error ?? 'Failed to add the line item.');
      }
    });
  }

  private blankLineItem() {
    return {
      glCode: '',
      description: '',
      costCenter: '',
      expenseCategory: '',
      units: 1,
      rate: null as number | null,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      noOfMonths: 12,
      approvedAmount: null as number | null
    };
  }
}
