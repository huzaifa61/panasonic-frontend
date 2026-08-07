import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { RevenueService } from '../../core/services/revenue.service';
import { ApplianceCategory, Store } from '../../core/models/store.model';
import { BulkRevenueRow, Revenue } from '../../core/models/revenue.model';
import { StoreIconComponent } from '../../shared/illustrations/store-icon.component';
import { CategoryIconComponent } from '../../shared/icons/category-icon.component';
import { LoadingIndicatorComponent } from '../../shared/loading/loading-indicator.component';
import { downloadCsv } from '../../shared/utils/csv-export.util';
import { parseCsv } from '../../shared/utils/csv-import.util';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule, StoreIconComponent, CategoryIconComponent, LoadingIndicatorComponent],
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.scss'
})
export class RevenueComponent implements OnInit {
  stores = signal<Store[]>([]);
  categories = signal<ApplianceCategory[]>([]);
  revenues = signal<Revenue[]>([]);
  loading = signal(true);
  submitting = signal(false);
  bulkUploading = signal(false);

  // Store/year/month filter, driven by the URL so a link from the Dashboard
  // (click a store row) lands here pre-filtered, and also editable directly
  // via the Store dropdown in the toolbar.
  filterStoreId = signal<number | null>(null);
  filterYear: number | null = null;
  filterMonth: number | null = null;
  dateFrom = signal<string | null>(null);
  dateTo = signal<string | null>(null);

  filteredRevenues = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    return this.revenues().filter((r) => {
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      return true;
    });
  });

  filteredTotal = computed(() => this.filteredRevenues().reduce((sum, r) => sum + r.amount, 0));

  // When the filtered range spans more than one calendar month (e.g. arriving
  // from the Dashboard's Revenue Growth % KPI, which links here with a range
  // covering the two compared months), show a month-by-month sum with the
  // growth between each so the number behind the KPI is visible, not just
  // the raw list of entries.
  monthlyBreakdown = computed(() => {
    const totals = new Map<string, number>();
    for (const r of this.filteredRevenues()) {
      const key = r.date.slice(0, 7);
      totals.set(key, (totals.get(key) ?? 0) + r.amount);
    }
    const months = Array.from(totals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => ({ key, total }));
    return months.map((m, i) => ({
      ...m,
      growthPct: i === 0 || months[i - 1].total === 0 ? null : ((m.total - months[i - 1].total) / months[i - 1].total) * 100
    }));
  });

  form = {
    storeId: null as number | null,
    categoryId: null as number | null,
    description: '',
    amount: null as number | null,
    date: '2026-07-15'
  };

  constructor(
    private storeService: StoreService,
    private revenueService: RevenueService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.storeService.getStores().subscribe((stores) => {
      this.stores.set(stores);
      if (stores.length && this.form.storeId == null) {
        this.form.storeId = stores[0].id;
      }
    });
    this.storeService.getCategories().subscribe((categories) => {
      // Revenue is recorded against sellable products only, not overhead categories.
      const sellable = categories.filter((c) => c.name !== 'Operations Cost');
      this.categories.set(sellable);
      if (sellable.length && this.form.categoryId == null) {
        this.form.categoryId = sellable[0].id;
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      const storeId = params.get('storeId');
      const year = params.get('year');
      const month = params.get('month');
      this.filterStoreId.set(storeId ? Number(storeId) : null);
      this.filterYear = year ? Number(year) : null;
      this.filterMonth = month ? Number(month) : null;
      this.dateFrom.set(params.get('dateFrom'));
      this.dateTo.set(params.get('dateTo'));
      this.loadRevenues();
    });
  }

  onFilterStoreChange(storeId: number | null): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { storeId }, queryParamsHandling: 'merge' });
  }

  clearFilters(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  loadRevenues(): void {
    this.loading.set(true);
    this.revenueService.getRevenues(this.filterStoreId() ?? undefined, this.filterYear ?? undefined, this.filterMonth ?? undefined).subscribe({
      next: (revenues) => {
        this.revenues.set(revenues);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Could not load revenue entries.');
        this.loading.set(false);
      }
    });
  }

  submit(): void {
    if (!this.form.storeId || !this.form.categoryId || !this.form.amount || !this.form.date) {
      this.toastService.error('Please fill in all required fields.');
      return;
    }

    this.submitting.set(true);

    this.revenueService
      .createRevenue({
        storeId: this.form.storeId,
        categoryId: this.form.categoryId,
        amount: this.form.amount,
        date: this.form.date,
        description: this.form.description || undefined
      })
      .subscribe({
        next: (revenue) => {
          this.submitting.set(false);
          this.toastService.success(`Recorded ${revenue.amount.toLocaleString()} AED for ${revenue.storeName}.`);
          this.form.description = '';
          this.form.amount = null;
          this.loadRevenues();
        },
        error: () => {
          this.submitting.set(false);
          this.toastService.error('Failed to record revenue.');
        }
      });
  }

  downloadCsv(): void {
    const rows = this.filteredRevenues().map((r) => [r.date, r.storeName, r.categoryName, r.description || '', r.amount]);
    downloadCsv(
      `revenue-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Date', 'Store', 'Category', 'Description', 'Amount (AED)'],
      rows
    );
  }

  downloadUploadTemplate(): void {
    downloadCsv(
      'revenue-upload-template.csv',
      ['Date', 'Store', 'Category', 'Description', 'Amount'],
      [['2026-07-20', 'Panasonic Dubai Mall', 'Television', 'Weekend TV sales', 15000]]
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

    const bulkRows: BulkRevenueRow[] = dataRows
      .filter((r) => r.length >= 5 && r[0] && r[1] && r[2])
      .map((r) => ({
        date: r[0],
        storeName: r[1],
        categoryName: r[2],
        description: r[3] || undefined,
        amount: Number(r[4]) || 0
      }));

    if (bulkRows.length === 0) {
      this.toastService.error('No valid rows found in the CSV file.');
      return;
    }

    this.bulkUploading.set(true);
    this.revenueService.bulkCreate(bulkRows).subscribe({
      next: (results) => {
        this.bulkUploading.set(false);
        const succeeded = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success);
        if (failed.length === 0) {
          this.toastService.success(`Uploaded ${succeeded} revenue entr${succeeded === 1 ? 'y' : 'ies'}.`);
        } else {
          this.toastService.error(
            `${succeeded} succeeded, ${failed.length} failed. Row ${failed[0].rowIndex + 1}: ${failed[0].error}`
          );
        }
        this.loadRevenues();
      },
      error: () => {
        this.bulkUploading.set(false);
        this.toastService.error('Bulk upload failed.');
      }
    });
  }
}
