import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { StoreService } from '../../core/services/store.service';
import { GlobalPlanningService } from '../../core/services/global-planning.service';
import { StoreManagementService } from '../../core/services/store-management.service';
import { ToastService } from '../../core/services/toast.service';
import { Store } from '../../core/models/store.model';
import { GlobalPlanningCellSave, GlobalPlanningMonthCell, GlobalPlanningStore } from '../../core/models/global-planning.model';

const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

@Component({
  selector: 'app-global-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-planning.component.html',
  styleUrl: './global-planning.component.scss'
})
export class GlobalPlanningComponent implements OnInit {
  stores = signal<Store[]>([]);
  storesGrid = signal<GlobalPlanningStore[]>([]);
  loading = signal(true);
  saving = signal(false);

  selectedStoreId = signal<number | null>(null);
  allStores = signal(true);
  monthLabels = MONTH_LABELS;

  // Fixed to match the rest of the app's demo fiscal year / "current" period
  // (matches Budget Planning and Expenses), so locked/unlocked months line up
  // with the seeded data.
  readonly fiscalYear = 2026;
  private readonly asOf = '2026-07-15';

  private dirtyCells = new Map<string, GlobalPlanningCellSave>();
  private dirtyAllocatedBudgets = new Map<number, number>();
  private dirtyCount = signal(0);

  // Total Allocated Budget is the whole-fiscal-year ceiling Budget Planning
  // enforces across all GL codes (StoreAllocatedBudget table) - previously
  // only settable one store at a time via Store Management. Surfaced here too
  // so a Regional Manager can set it alongside the monthly Budget/Forecast
  // grid, per store, without leaving this page.
  allocatedBudgets = signal<Map<number, number>>(new Map());

  // Grand total across every store currently rendered (i.e. "All Stores"
  // view) - each month's Budget/Forecast summed across stores, plus an FY
  // total per metric. Only meaningful/shown when more than one store grid is
  // on screen.
  crossStoreTotals = computed(() => {
    const stores = this.storesGrid();
    if (stores.length < 2) return null;

    const months = stores[0].months.map((_, i) => {
      const calendarYear = stores[0].months[i].calendarYear;
      const calendarMonth = stores[0].months[i].calendarMonth;
      const budget = stores.reduce((sum, s) => sum + (s.months[i]?.budget ?? 0), 0);
      const forecastedExpense = stores.reduce((sum, s) => sum + (s.months[i]?.forecastedExpense ?? 0), 0);
      return { calendarYear, calendarMonth, budget, forecastedExpense };
    });

    return {
      months,
      fyBudgetTotal: months.reduce((sum, m) => sum + m.budget, 0),
      fyForecastTotal: months.reduce((sum, m) => sum + m.forecastedExpense, 0)
    };
  });

  constructor(
    private storeService: StoreService,
    private globalPlanningService: GlobalPlanningService,
    private storeManagementService: StoreManagementService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.storeService.getStores().subscribe((stores) => {
      this.stores.set(stores);
      if (stores.length && this.selectedStoreId() == null) {
        this.selectedStoreId.set(stores[0].id);
      }
      this.loadGrid();
    });
  }

  onStoreChange(storeId: number): void {
    this.selectedStoreId.set(Number(storeId));
    this.loadGrid();
  }

  onAllStoresChange(checked: boolean): void {
    this.allStores.set(checked);
    this.loadGrid();
  }

  loadGrid(): void {
    this.loading.set(true);
    this.dirtyCells.clear();
    this.dirtyAllocatedBudgets.clear();
    this.dirtyCount.set(0);
    const storeId = this.allStores() ? null : this.selectedStoreId();
    this.globalPlanningService.getGrid(this.fiscalYear, this.asOf, storeId).subscribe({
      next: (grid) => {
        this.storesGrid.set(grid);
        this.loading.set(false);
        this.loadAllocatedBudgets(grid);
      },
      error: () => {
        this.toastService.error('Could not load the global planning grid.');
        this.loading.set(false);
      }
    });
  }

  private loadAllocatedBudgets(grid: GlobalPlanningStore[]): void {
    if (grid.length === 0) {
      this.allocatedBudgets.set(new Map());
      return;
    }
    forkJoin(grid.map((s) => this.storeManagementService.getAllocatedBudget(s.storeId, this.fiscalYear))).subscribe(
      (results) => {
        const map = new Map<number, number>();
        results.forEach((r) => map.set(r.storeId, r.totalAllocatedBudget));
        this.allocatedBudgets.set(map);
      }
    );
  }

  private cellKey(storeId: number, year: number, month: number): string {
    return `${storeId}:${year}:${month}`;
  }

  fyTotal(months: GlobalPlanningMonthCell[], key: 'budget' | 'forecastedExpense'): number {
    return months.reduce((sum, m) => sum + m[key], 0);
  }

  onBudgetChange(storeId: number, month: GlobalPlanningMonthCell, value: string): void {
    const key = this.cellKey(storeId, month.calendarYear, month.calendarMonth);
    const existing = this.dirtyCells.get(key) ?? { storeId, calendarYear: month.calendarYear, calendarMonth: month.calendarMonth };
    existing.budget = Number(value) || 0;
    this.dirtyCells.set(key, existing);
    this.recomputeDirtyCount();
  }

  onForecastChange(storeId: number, month: GlobalPlanningMonthCell, value: string): void {
    const key = this.cellKey(storeId, month.calendarYear, month.calendarMonth);
    const existing = this.dirtyCells.get(key) ?? { storeId, calendarYear: month.calendarYear, calendarMonth: month.calendarMonth };
    existing.forecastedExpense = Number(value) || 0;
    this.dirtyCells.set(key, existing);
    this.recomputeDirtyCount();
  }

  onAllocatedBudgetChange(storeId: number, value: string): void {
    this.dirtyAllocatedBudgets.set(storeId, Number(value) || 0);
    this.recomputeDirtyCount();
  }

  remainingAllocatedBudget(store: GlobalPlanningStore): number {
    const allocated = this.allocatedBudgets().get(store.storeId) ?? 0;
    return allocated - this.fyTotal(store.months, 'budget');
  }

  private recomputeDirtyCount(): void {
    this.dirtyCount.set(this.dirtyCells.size + this.dirtyAllocatedBudgets.size);
  }

  hasDirty(): boolean {
    return this.dirtyCount() > 0;
  }

  onSave(): void {
    const cells = Array.from(this.dirtyCells.values());
    const allocatedEdits = Array.from(this.dirtyAllocatedBudgets.entries());
    if (cells.length === 0 && allocatedEdits.length === 0) return;

    this.saving.set(true);
    const requests = [
      cells.length > 0 ? this.globalPlanningService.saveCells(cells, this.asOf) : of(null),
      ...allocatedEdits.map(([storeId, totalAllocatedBudget]) =>
        this.storeManagementService.upsertAllocatedBudget(storeId, { fiscalYear: this.fiscalYear, totalAllocatedBudget })
      )
    ];

    forkJoin(requests).subscribe({
      next: () => {
        this.saving.set(false);
        const count = cells.length + allocatedEdits.length;
        this.toastService.success(`Saved ${count} change${count === 1 ? '' : 's'}.`);
        this.loadGrid();
      },
      error: (err) => {
        this.saving.set(false);
        this.toastService.error(err?.error?.error ?? 'Failed to save changes.');
      }
    });
  }
}
