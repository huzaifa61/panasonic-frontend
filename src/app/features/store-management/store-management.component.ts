import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { StoreService } from '../../core/services/store.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { HeadcountService } from '../../core/services/headcount.service';
import { StoreManagementService } from '../../core/services/store-management.service';
import { ApprovalSettingsService } from '../../core/services/approval-settings.service';
import { StoreIconComponent } from '../../shared/illustrations/store-icon.component';
import { ToastService } from '../../core/services/toast.service';
import { PeriodPickerComponent } from '../../shared/period-picker/period-picker.component';
import { LoadingIndicatorComponent } from '../../shared/loading/loading-indicator.component';

interface ManagedStoreRow {
  id: number;
  name: string;
  city: string;
  regionName: string;
  storeManagerName: string;
  regionalManagerName: string;
  budget: number;
  targetProfitAmount: number;
  forecastedRevenue: number;
  forecastedExpense: number;
  currentHeadcount: number;
  forecastedHeadcountNeed: number;
  totalAllocatedBudget: number;
  saving: boolean;
}

@Component({
  selector: 'app-store-management',
  standalone: true,
  imports: [CommonModule, FormsModule, StoreIconComponent, PeriodPickerComponent, LoadingIndicatorComponent],
  templateUrl: './store-management.component.html',
  styleUrl: './store-management.component.scss'
})
export class StoreManagementComponent implements OnInit {
  rows = signal<ManagedStoreRow[]>([]);
  loading = signal(true);
  deletingId = signal<number | null>(null);

  showAddForm = signal(false);
  addSubmitting = signal(false);

  expenseApprovalThreshold = 0;
  thresholdSaving = signal(false);

  year = 2026;
  month = 7;

  // Budget Planning's Total Allocated Budget is fiscal-year-scoped, separate
  // from this page's calendar year/month picker - fixed to match the same
  // demo fiscal year used across Budget Planning and Expenses.
  readonly fiscalYear = 2026;

  newStore = {
    name: '',
    city: '',
    regionName: '',
    storeManagerName: '',
    regionalManagerName: 'Fatima Al Suwaidi',
    managerUsername: '',
    managerPassword: ''
  };

  constructor(
    private storeService: StoreService,
    private dashboardService: DashboardService,
    private headcountService: HeadcountService,
    private storeManagementService: StoreManagementService,
    private approvalSettingsService: ApprovalSettingsService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
    this.approvalSettingsService.getThreshold().subscribe({
      next: (settings) => (this.expenseApprovalThreshold = settings.expenseApprovalThreshold)
    });
  }

  saveThreshold(): void {
    this.thresholdSaving.set(true);
    this.approvalSettingsService.updateThreshold(this.expenseApprovalThreshold).subscribe({
      next: () => {
        this.thresholdSaving.set(false);
        this.toastService.success('Approval threshold saved.');
      },
      error: () => {
        this.thresholdSaving.set(false);
        this.toastService.error('Failed to save the approval threshold.');
      }
    });
  }

  load(): void {
    this.loading.set(true);

    forkJoin({
      stores: this.storeService.getStores(),
      overview: this.dashboardService.getOverview(this.year, this.month),
      headcount: this.headcountService.getHeadcount(this.year, this.month)
    }).subscribe({
      next: ({ stores, overview, headcount }) => {
        forkJoin(stores.map((s) => this.storeManagementService.getAllocatedBudget(s.id, this.fiscalYear))).subscribe({
          next: (allocatedBudgets) => {
            const rows: ManagedStoreRow[] = stores.map((store, i) => {
              const dashboard = overview.stores.find((s) => s.storeId === store.id);
              const hc = headcount.find((h) => h.storeId === store.id);
              return {
                id: store.id,
                name: store.name,
                city: store.city,
                regionName: store.regionName,
                storeManagerName: store.storeManagerName,
                regionalManagerName: store.regionalManagerName,
                budget: dashboard?.budget ?? 0,
                targetProfitAmount: dashboard?.targetProfitAmount ?? 0,
                forecastedRevenue: dashboard?.forecastedRevenue ?? 0,
                forecastedExpense: dashboard?.forecastedExpense ?? 0,
                currentHeadcount: hc?.currentHeadcount ?? 0,
                forecastedHeadcountNeed: hc?.forecastedHeadcountNeed ?? 0,
                totalAllocatedBudget: allocatedBudgets[i]?.totalAllocatedBudget ?? 0,
                saving: false
              };
            });
            this.rows.set(rows);
            this.loading.set(false);
          },
          error: () => {
            this.toastService.error('Could not load allocated budgets.');
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.toastService.error('Could not load store management data.');
        this.loading.set(false);
      }
    });
  }

  onPeriodChange(): void {
    this.load();
  }

  saveRow(row: ManagedStoreRow): void {
    row.saving = true;

    forkJoin({
      store: this.storeManagementService.updateStore(row.id, {
        name: row.name,
        city: row.city,
        regionName: row.regionName,
        storeManagerName: row.storeManagerName,
        regionalManagerName: row.regionalManagerName
      }),
      budget: this.storeManagementService.upsertBudget(row.id, { year: this.year, month: this.month, amount: row.budget }),
      target: this.storeManagementService.upsertTarget(row.id, {
        year: this.year,
        month: this.month,
        targetProfitAmount: row.targetProfitAmount,
        forecastedRevenue: row.forecastedRevenue,
        forecastedExpense: row.forecastedExpense
      }),
      headcount: this.storeManagementService.upsertHeadcount(row.id, {
        year: this.year,
        month: this.month,
        currentHeadcount: row.currentHeadcount,
        forecastedHeadcountNeed: row.forecastedHeadcountNeed
      }),
      allocatedBudget: this.storeManagementService.upsertAllocatedBudget(row.id, {
        fiscalYear: this.fiscalYear,
        totalAllocatedBudget: row.totalAllocatedBudget
      })
    }).subscribe({
      next: () => {
        row.saving = false;
        this.toastService.success(`Saved ${row.name}.`);
      },
      error: () => {
        row.saving = false;
        this.toastService.error(`Failed to save ${row.name}.`);
      }
    });
  }

  deleteStore(row: ManagedStoreRow): void {
    if (!confirm(`Delete ${row.name}? This removes all its budgets, expenses, sales, and history.`)) {
      return;
    }
    this.deletingId.set(row.id);
    this.storeManagementService.deleteStore(row.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.toastService.success(`Deleted ${row.name}.`);
        this.load();
      },
      error: () => {
        this.deletingId.set(null);
        this.toastService.error(`Failed to delete ${row.name}.`);
      }
    });
  }

  submitAddStore(): void {
    const s = this.newStore;
    if (!s.name || !s.city || !s.regionName || !s.storeManagerName || !s.managerUsername || !s.managerPassword) {
      this.toastService.error('Please fill in all fields.');
      return;
    }

    this.addSubmitting.set(true);
    this.storeManagementService.createStore({ ...s }).subscribe({
      next: () => {
        this.addSubmitting.set(false);
        this.showAddForm.set(false);
        this.toastService.success(`Created ${s.name}.`);
        this.newStore = {
          name: '',
          city: '',
          regionName: '',
          storeManagerName: '',
          regionalManagerName: 'Fatima Al Suwaidi',
          managerUsername: '',
          managerPassword: ''
        };
        this.load();
      },
      error: (err) => {
        this.addSubmitting.set(false);
        this.toastService.error(err?.error?.error ?? 'Failed to create store.');
      }
    });
  }
}
