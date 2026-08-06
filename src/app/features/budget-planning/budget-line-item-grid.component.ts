import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
import { BudgetCellSave, LineItemGridRow, StoreBudgetGrid } from '../../core/models/budget-planning.model';

interface EditableMonth {
  calendarYear: number;
  calendarMonth: number;
  isLocked: boolean;
  budget: number;
  forecast: number;
  result: number;
  isBudgetInvalid: boolean;
  isDeviated: boolean;
  hasPendingApproval: boolean;
  pendingForecastAmount: number | null;
}

interface EditableRow {
  lineItemId: number;
  glCode: string;
  description: string;
  approvedAmount: number;
  months: EditableMonth[];
  budgetTotal: number;
  hasDeviation: boolean;
}

// A soft planning-discipline signal, not a hard rule - flags a Forecast cell that has
// drifted more than 15% from its original Budget for that month.
const DEVIATION_THRESHOLD = 0.15;
const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

@Component({
  selector: 'app-budget-line-item-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget-line-item-grid.component.html',
  styleUrl: './budget-line-item-grid.component.scss'
})
export class BudgetLineItemGridComponent implements OnChanges {
  @Input() grid: StoreBudgetGrid | null = null;
  @Output() saveBudget = new EventEmitter<BudgetCellSave[]>();
  @Output() proposeForecast = new EventEmitter<BudgetCellSave[]>();

  monthLabels = MONTH_LABELS;
  rows = signal<EditableRow[]>([]);

  private dirtyBudget = new Set<string>();
  private dirtyForecast = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['grid'] && this.grid) {
      this.rows.set(this.grid.lineItems.map((li) => this.toEditableRow(li)));
      this.dirtyBudget.clear();
      this.dirtyForecast.clear();
    }
  }

  private toEditableRow(li: LineItemGridRow): EditableRow {
    const months: EditableMonth[] = li.months.map((m) => ({
      calendarYear: m.calendarYear,
      calendarMonth: m.calendarMonth,
      isLocked: m.isLocked,
      budget: m.budget,
      forecast: m.forecast,
      result: m.result,
      isBudgetInvalid: false,
      isDeviated: this.computeDeviated(m.isLocked, m.budget, m.forecast),
      hasPendingApproval: m.hasPendingForecastApproval,
      pendingForecastAmount: m.pendingForecastAmount
    }));

    return {
      lineItemId: li.lineItemId,
      glCode: li.glCode,
      description: li.description,
      approvedAmount: li.approvedAmount,
      months,
      budgetTotal: months.reduce((sum, m) => sum + m.budget, 0),
      hasDeviation: months.some((m) => m.isDeviated)
    };
  }

  private computeDeviated(isLocked: boolean, budget: number, forecast: number): boolean {
    return !isLocked && budget > 0 && Math.abs(forecast - budget) / budget > DEVIATION_THRESHOLD;
  }

  onBudgetChange(row: EditableRow, month: EditableMonth, value: string): void {
    month.budget = Number(value) || 0;
    row.budgetTotal = row.months.reduce((sum, m) => sum + m.budget, 0);
    month.isBudgetInvalid = row.budgetTotal > row.approvedAmount;
    this.dirtyBudget.add(this.cellKey(row.lineItemId, month.calendarYear, month.calendarMonth));
    this.rows.set([...this.rows()]);
  }

  onForecastChange(row: EditableRow, month: EditableMonth, value: string): void {
    month.forecast = Number(value) || 0;
    month.isDeviated = this.computeDeviated(month.isLocked, month.budget, month.forecast);
    row.hasDeviation = row.months.some((m) => m.isDeviated);
    this.dirtyForecast.add(this.cellKey(row.lineItemId, month.calendarYear, month.calendarMonth));
    this.rows.set([...this.rows()]);
  }

  private cellKey(lineItemId: number, year: number, month: number): string {
    return `${lineItemId}:${year}:${month}`;
  }

  hasDirtyBudget(): boolean {
    return this.dirtyBudget.size > 0;
  }

  hasDirtyForecast(): boolean {
    return this.dirtyForecast.size > 0;
  }

  onSaveBudget(): void {
    const cells = this.collectDirty(this.dirtyBudget, (m) => m.budget);
    this.saveBudget.emit(cells);
    this.dirtyBudget.clear();
  }

  onProposeForecast(): void {
    const cells = this.collectDirty(this.dirtyForecast, (m) => m.forecast);
    this.proposeForecast.emit(cells);
    this.dirtyForecast.clear();
  }

  private collectDirty(dirtySet: Set<string>, valueOf: (m: EditableMonth) => number): BudgetCellSave[] {
    const cells: BudgetCellSave[] = [];
    for (const row of this.rows()) {
      for (const m of row.months) {
        if (dirtySet.has(this.cellKey(row.lineItemId, m.calendarYear, m.calendarMonth))) {
          cells.push({ lineItemId: row.lineItemId, calendarYear: m.calendarYear, calendarMonth: m.calendarMonth, amount: valueOf(m) });
        }
      }
    }
    return cells;
  }
}
