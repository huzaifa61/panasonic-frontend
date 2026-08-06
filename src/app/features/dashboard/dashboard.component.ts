import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { DashboardService } from '../../core/services/dashboard.service';
import { ReportService } from '../../core/services/report.service';
import { HeadcountService } from '../../core/services/headcount.service';
import { BudgetPlanningService } from '../../core/services/budget-planning.service';
import { CategoryMargin, MonthlyTrend, Overview, StoreDashboard } from '../../core/models/dashboard.model';
import { Headcount } from '../../core/models/headcount.model';
import { StoreComparisonChartComponent, StoreComparisonPoint } from '../../shared/charts/store-comparison-chart.component';
import { TrendChartComponent } from '../../shared/charts/trend-chart.component';
import { MarginByCategoryChartComponent } from '../../shared/charts/margin-by-category-chart.component';
import { StoreIconComponent } from '../../shared/illustrations/store-icon.component';
import { ToastService } from '../../core/services/toast.service';
import { PeriodPickerComponent } from '../../shared/period-picker/period-picker.component';
import { ZeroDashPipe } from '../../shared/pipes/zero-dash.pipe';

export interface Delta {
  pct: number;
  isUp: boolean;
}

export interface QuarterFigures {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  h1: number;
  h2: number;
  fy: number;
}

export interface StoreQuarterlyRollup {
  storeId: number;
  storeName: string;
  plan: QuarterFigures;
  forecast: QuarterFigures;
  actual: QuarterFigures;
}

export interface StoreFySummary {
  storeId: number;
  storeName: string;
  monthlyPlan: number[];
  monthlyForecast: number[];
  monthlyActual: number[];
  monthlyLocked: boolean[];
  planFy: number;
  forecastFy: number;
  actualFy: number;
}

// Fiscal-year month labels in calendar order (Apr-Mar), matching the order
// StoreBudgetGrid.lineItems[].months is already returned in by the API.
const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

// A soft planning-discipline signal (same threshold as the Budget Planning
// grid's Forecast-vs-Budget flag) - flags a past/current month where actual
// spend has drifted more than 15% from what was planned.
const DEVIATION_THRESHOLD = 0.15;

export type DashboardViewMode = 'month' | 'year';

export interface YearKpis {
  totalBudget: number;
  totalApprovedExpense: number;
  totalEarnings: number;
  totalNetProfit: number;
  marginPercent: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    StoreComparisonChartComponent,
    TrendChartComponent,
    MarginByCategoryChartComponent,
    StoreIconComponent,
    PeriodPickerComponent,
    ZeroDashPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  overview = signal<Overview | null>(null);
  trend = signal<MonthlyTrend[]>([]);
  categoryMargin = signal<CategoryMargin[]>([]);
  headcount = signal<Headcount[]>([]);
  loading = signal(true);
  downloadingStoreId = signal<number | null>(null);

  storeFySummary = signal<StoreFySummary[] | null>(null);
  monthLabels = MONTH_LABELS;

  // Month/Year toggle for the KPI row and Monthly Trend chart. "Year" aggregates
  // across the full fiscal year (Apr-Mar) instead of just the selected month.
  viewMode = signal<DashboardViewMode>('year');
  yearTrend = signal<MonthlyTrend[]>([]);
  yearCategoryMargin = signal<CategoryMargin[]>([]);
  yearStoreDashboards = signal<StoreDashboard[]>([]);

  // Per-store bar chart data for the two comparison charts - reactively
  // switches source (this month's Overview vs the full-FY aggregate) with
  // the same Month/Year toggle everything else on the page uses.
  revenueVsForecastData = computed<StoreComparisonPoint[]>(() => {
    const stores = this.viewMode() === 'year' ? this.yearStoreDashboards() : this.overview()?.stores ?? [];
    return stores.map((s) => ({ storeName: s.storeName, seriesA: s.earnings, seriesB: s.forecastedRevenue }));
  });

  actualsVsForecastData = computed<StoreComparisonPoint[]>(() => {
    const stores = this.viewMode() === 'year' ? this.yearStoreDashboards() : this.overview()?.stores ?? [];
    return stores.map((s) => ({ storeName: s.storeName, seriesA: s.approvedExpense, seriesB: s.forecastedExpense }));
  });

  // Sum of every visible store's Forecasted Expense (a manually-set figure
  // from Store Management) - not returned pre-aggregated by the Overview API,
  // so summed client-side same as the per-store comparison charts above.
  totalForecastedExpense = computed(() => {
    const stores = this.viewMode() === 'year' ? this.yearStoreDashboards() : this.overview()?.stores ?? [];
    return stores.reduce((sum, s) => sum + s.forecastedExpense, 0);
  });

  // Quarterly (Q1-Q4/H1/H2/FY) roll-up of the FY Store Summary above, grouped
  // by store instead of by month - a more condensed view of the same
  // Plan/Forecast/Actual data, plus a grand total across all stores.
  storeQuarterlyRollup = computed<StoreQuarterlyRollup[] | null>(() => {
    const summary = this.storeFySummary();
    if (!summary) return null;
    return summary.map((row) => ({
      storeId: row.storeId,
      storeName: row.storeName,
      plan: this.quartersFromMonthly(row.monthlyPlan),
      forecast: this.quartersFromMonthly(row.monthlyForecast),
      actual: this.quartersFromMonthly(row.monthlyActual)
    }));
  });

  storeQuarterlyTotals = computed<{ plan: QuarterFigures; forecast: QuarterFigures; actual: QuarterFigures } | null>(() => {
    const rows = this.storeQuarterlyRollup();
    if (!rows) return null;
    const sum = (pick: (r: StoreQuarterlyRollup) => QuarterFigures): QuarterFigures => ({
      q1: rows.reduce((s, r) => s + pick(r).q1, 0),
      q2: rows.reduce((s, r) => s + pick(r).q2, 0),
      q3: rows.reduce((s, r) => s + pick(r).q3, 0),
      q4: rows.reduce((s, r) => s + pick(r).q4, 0),
      h1: rows.reduce((s, r) => s + pick(r).h1, 0),
      h2: rows.reduce((s, r) => s + pick(r).h2, 0),
      fy: rows.reduce((s, r) => s + pick(r).fy, 0)
    });
    return { plan: sum((r) => r.plan), forecast: sum((r) => r.forecast), actual: sum((r) => r.actual) };
  });
  yearKpis = computed<YearKpis | null>(() => {
    const t = this.yearTrend();
    if (t.length === 0) return null;
    const totalBudget = t.reduce((s, m) => s + m.budget, 0);
    const totalApprovedExpense = t.reduce((s, m) => s + m.approvedExpense, 0);
    const totalEarnings = t.reduce((s, m) => s + m.earnings, 0);
    const totalNetProfit = totalEarnings - totalApprovedExpense;
    return {
      totalBudget,
      totalApprovedExpense,
      totalEarnings,
      totalNetProfit,
      marginPercent: totalEarnings === 0 ? 0 : (totalNetProfit / totalEarnings) * 100
    };
  });

  // The date range that backs the Revenue Growth % figure - the two compared
  // months in Month view, or the whole fiscal year in Year view - so linking
  // there from the KPI can show the actual entries/monthly breakdown behind
  // the percentage instead of just the current month.
  revenueGrowthDateRange = computed<{ from: string; to: string }>(() => {
    if (this.viewMode() === 'year') {
      return { from: `${this.fiscalYear}-04-01`, to: `${this.fiscalYear + 1}-03-31` };
    }
    const prevMonth = this.month === 1 ? 12 : this.month - 1;
    const prevYear = this.month === 1 ? this.year - 1 : this.year;
    const lastDay = new Date(this.year, this.month, 0).getDate();
    return {
      from: `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`,
      to: `${this.year}-${String(this.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    };
  });

  // Average of the month-over-month Revenue % change across every elapsed
  // month in the fiscal year (future months are still 0 and excluded, since
  // there's no prior-FY data to compare April's Revenue against).
  revenueGrowthYearPercent = computed<number | null>(() => {
    const elapsed = this.yearTrend().filter((m) => m.earnings > 0);
    if (elapsed.length < 2) return null;
    const growthRates: number[] = [];
    for (let i = 1; i < elapsed.length; i++) {
      const previous = elapsed[i - 1].earnings;
      if (previous === 0) continue;
      growthRates.push(((elapsed[i].earnings - previous) / previous) * 100);
    }
    if (growthRates.length === 0) return null;
    return growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  });

  // Budget Planning is fiscal-year (Apr-Mar), separate from this page's calendar
  // year/month picker. Fixed to the same FY/asOf convention used across Budget
  // Planning and Expenses so the rollup matches what those pages show.
  private readonly fiscalYear = 2026;
  private readonly budgetPlanningAsOf = '2026-07-15';

  year = 2026;
  month = 7;

  constructor(
    private dashboardService: DashboardService,
    private reportService: ReportService,
    private headcountService: HeadcountService,
    private budgetPlanningService: BudgetPlanningService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    // Shared across yearStoreDashboards and the FY Store Summary's Actual
    // column below - shareReplay(1) means both subscribers trigger only one
    // round of the 12 underlying HTTP calls, not two.
    const fiscalOverviews$ = forkJoin(this.fiscalMonths().map((m) => this.dashboardService.getOverview(m.year, m.month))).pipe(
      shareReplay(1)
    );

    this.dashboardService.getOverview(this.year, this.month).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
        this.loadStoreFySummary(
          data.stores.map((s) => ({ id: s.storeId, name: s.storeName })),
          fiscalOverviews$
        );
      },
      error: () => {
        this.toastService.error('Could not load dashboard data. Is the API reachable?');
        this.loading.set(false);
      }
    });

    this.dashboardService.getTrend(this.year, this.month, 4).subscribe({
      next: (data) => this.trend.set(data)
    });

    // Full fiscal year (Apr-2026 -> Mar-2027) trend, ending at March of the
    // following year - powers the Year-view KPIs and trend chart.
    this.dashboardService.getTrend(this.fiscalYear + 1, 3, 12).subscribe({
      next: (data) => this.yearTrend.set(data)
    });

    this.dashboardService.getCategoryMargin(this.year, this.month).subscribe({
      next: (data) => this.categoryMargin.set(data)
    });

    // Year-view version of the Margin % by Product chart - fetched
    // per-fiscal-month and aggregated client-side, same pattern as yearTrend.
    const fiscalMonths = this.fiscalMonths();

    forkJoin(fiscalMonths.map((m) => this.dashboardService.getCategoryMargin(m.year, m.month))).subscribe({
      next: (lists) => this.yearCategoryMargin.set(this.aggregateCategoryMargin(lists))
    });

    fiscalOverviews$.subscribe({
      next: (overviews) => this.yearStoreDashboards.set(this.aggregateStoreDashboards(overviews))
    });

    this.headcountService.getHeadcount(this.year, this.month).subscribe({
      next: (data) => this.headcount.set(data)
    });
  }

  onPeriodChange(): void {
    this.load();
  }

  setViewMode(mode: DashboardViewMode): void {
    this.viewMode.set(mode);
  }

  // The 12 fiscal months (Apr-Mar) for the configured fiscal year, expressed
  // as calendar year/month pairs - used to fetch and sum per-month data into
  // full fiscal-year totals for the Year-view charts.
  private fiscalMonths(): { year: number; month: number }[] {
    const months: { year: number; month: number }[] = [];
    for (let m = 4; m <= 12; m++) months.push({ year: this.fiscalYear, month: m });
    for (let m = 1; m <= 3; m++) months.push({ year: this.fiscalYear + 1, month: m });
    return months;
  }

  private aggregateCategoryMargin(lists: CategoryMargin[][]): CategoryMargin[] {
    const totals = new Map<string, { revenue: number; costOfSales: number }>();
    for (const list of lists) {
      for (const item of list) {
        const entry = totals.get(item.categoryName) ?? { revenue: 0, costOfSales: 0 };
        entry.revenue += item.revenue;
        entry.costOfSales += item.costOfSales;
        totals.set(item.categoryName, entry);
      }
    }
    // Margin must be recomputed from the summed revenue/cost, not averaged
    // month-to-month - averaging percentages directly would be wrong.
    return Array.from(totals.entries()).map(([categoryName, { revenue, costOfSales }]) => ({
      categoryName,
      revenue,
      costOfSales,
      marginPercent: revenue === 0 ? 0 : ((revenue - costOfSales) / revenue) * 100
    }));
  }

  private aggregateStoreDashboards(overviews: Overview[]): StoreDashboard[] {
    const totals = new Map<number, StoreDashboard>();
    for (const ov of overviews) {
      for (const s of ov.stores) {
        const entry = totals.get(s.storeId);
        if (!entry) {
          totals.set(s.storeId, { ...s });
          continue;
        }
        entry.budget += s.budget;
        entry.approvedExpense += s.approvedExpense;
        entry.pendingExpense += s.pendingExpense;
        entry.earnings += s.earnings;
        entry.forecastedRevenue += s.forecastedRevenue;
        entry.forecastedExpense += s.forecastedExpense;
        entry.netProfit += s.netProfit;
        entry.targetProfitAmount += s.targetProfitAmount;
        entry.projectedRevenue += s.projectedRevenue;
        entry.projectedExpense += s.projectedExpense;
        entry.pendingApprovalsCount = s.pendingApprovalsCount;
      }
    }
    for (const entry of totals.values()) {
      entry.budgetVariance = entry.budget - entry.approvedExpense;
      entry.marginPercent = entry.earnings === 0 ? 0 : (entry.netProfit / entry.earnings) * 100;
      entry.metProfitTarget = entry.netProfit >= entry.targetProfitAmount;
    }
    return Array.from(totals.values());
  }

  // Builds each visible store's Plan/Forecast/Actual whole-year summary (a
  // Store Manager only ever has one store here, so this naturally reduces to
  // just their own store's figures) - the "not month-wise, all stores" view.
  private loadStoreFySummary(stores: { id: number; name: string }[], fiscalOverviews$: Observable<Overview[]>): void {
    if (stores.length === 0) {
      this.storeFySummary.set(null);
      return;
    }

    forkJoin({
      grids: forkJoin(stores.map((s) => this.budgetPlanningService.getGrid(s.id, this.fiscalYear, this.budgetPlanningAsOf))),
      overviews: fiscalOverviews$
    }).subscribe({
      next: ({ grids, overviews }) => {
        // Actual is sourced from the real Expense ledger (every approved expense
        // for the store/month, via the same Overview the rest of the dashboard
        // uses) rather than the Budget Planning grid's line-item "result" field,
        // which only counts expenses explicitly tagged to a budget line item and
        // so understates spend that was recorded without a line item.
        const actualByStore = new Map<number, number[]>();
        overviews.forEach((ov, i) => {
          for (const s of ov.stores) {
            const arr = actualByStore.get(s.storeId) ?? new Array(12).fill(0);
            arr[i] = s.approvedExpense;
            actualByStore.set(s.storeId, arr);
          }
        });

        const nameById = new Map(stores.map((s) => [s.id, s.name]));
        this.storeFySummary.set(
          grids.map((grid) => {
            const monthlyPlan = new Array(12).fill(0);
            const monthlyForecast = new Array(12).fill(0);
            const monthlyLocked = new Array(12).fill(false);
            // Skip the synthetic "Unallocated / Other" row (lineItemId 0) - it's
            // always isLocked:true regardless of month, which would otherwise
            // overwrite the real locked/unlocked status for every month.
            for (const li of grid.lineItems) {
              if (li.lineItemId === 0) continue;
              li.months.forEach((m, i) => {
                monthlyPlan[i] += m.budget;
                monthlyForecast[i] += m.forecast;
                monthlyLocked[i] = m.isLocked;
              });
            }
            const monthlyActual = actualByStore.get(grid.storeId) ?? new Array(12).fill(0);
            return {
              storeId: grid.storeId,
              storeName: nameById.get(grid.storeId) ?? '',
              monthlyPlan,
              monthlyForecast,
              monthlyActual,
              monthlyLocked,
              planFy: monthlyPlan.reduce((a, b) => a + b, 0),
              forecastFy: monthlyForecast.reduce((a, b) => a + b, 0),
              actualFy: monthlyActual.reduce((a, b) => a + b, 0)
            };
          })
        );
      },
      error: () => {
        this.storeFySummary.set(null);
      }
    });
  }

  // Only flags a deviation once a month is locked (i.e. it's already passed
  // and has a real Actual figure) - a future month's Actual is always 0
  // because no expense has been recorded yet, which isn't a deviation.
  isMonthDeviated(plan: number, actual: number, isLocked: boolean): boolean {
    return isLocked && plan > 0 && Math.abs(actual - plan) / plan > DEVIATION_THRESHOLD;
  }

  private quartersFromMonthly(monthly: number[]): QuarterFigures {
    const q1 = monthly[0] + monthly[1] + monthly[2];
    const q2 = monthly[3] + monthly[4] + monthly[5];
    const q3 = monthly[6] + monthly[7] + monthly[8];
    const q4 = monthly[9] + monthly[10] + monthly[11];
    return { q1, q2, q3, q4, h1: q1 + q2, h2: q3 + q4, fy: q1 + q2 + q3 + q4 };
  }

  // Simple month-over-month delta vs the previous point in the trend series,
  // used for the small up/down indicator on the KPI cards.
  private delta(pick: (t: MonthlyTrend) => number): Delta | null {
    const t = this.trend();
    if (t.length < 2) return null;
    const current = pick(t[t.length - 1]);
    const previous = pick(t[t.length - 2]);
    if (previous === 0) return null;
    const pct = ((current - previous) / Math.abs(previous)) * 100;
    return { pct, isUp: pct >= 0 };
  }

  budgetDelta(): Delta | null {
    return this.delta((t) => t.budget);
  }

  approvedExpenseDelta(): Delta | null {
    return this.delta((t) => t.approvedExpense);
  }

  earningsDelta(): Delta | null {
    return this.delta((t) => t.earnings);
  }

  downloadReport(storeId: number): void {
    this.downloadingStoreId.set(storeId);
    this.reportService.downloadStoreReport(storeId, this.year, this.month).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `store-${storeId}-report-${this.year}-${String(this.month).padStart(2, '0')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloadingStoreId.set(null);
      },
      error: () => {
        this.downloadingStoreId.set(null);
        this.toastService.error('Failed to download report.');
      }
    });
  }
}
