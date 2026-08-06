import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

@Component({
  selector: 'app-period-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="period-picker">
      <span class="period-icon">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
          <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
          <path d="M3 8.5h14M7 2.5v3M13 2.5v3" stroke-linecap="round" />
        </svg>
      </span>
      <label class="period-field">
        <span class="period-label">Month</span>
        <select
          class="period-select"
          [ngModel]="month"
          (ngModelChange)="onMonthChange($event)"
          [disabled]="disabled"
          [title]="disabled ? 'Not applicable in Year view' : ''">
          @for (m of months; track m.value) {
            <option [value]="m.value">{{ m.label }}</option>
          }
        </select>
      </label>
      <span class="period-divider"></span>
      <label class="period-field">
        <span class="period-label">Year</span>
        <input
          type="number"
          class="period-input"
          [ngModel]="year"
          (ngModelChange)="onYearChange($event)"
          min="2020"
          max="2100"
          [disabled]="disabled"
          [title]="disabled ? 'Not applicable in Year view' : ''" />
      </label>
    </div>
  `,
  styles: [`
    .period-picker {
      display: flex;
      align-items: stretch;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
    }

    .period-picker:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-primary);
    }

    .period-picker:hover .period-icon {
      color: var(--color-primary);
      transform: scale(1.15) rotate(-6deg);
    }

    .period-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px 0 12px;
      color: var(--color-text-faint);
      transition: color 0.2s ease, transform 0.2s ease;
    }

    .period-icon svg {
      width: 16px;
      height: 16px;
    }

    .period-field {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
      padding: 6px 14px;
    }

    .period-label {
      font-size: 10px;
      color: var(--color-text-faint);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .period-divider {
      width: 1px;
      margin: 7px 0;
      background: var(--color-border);
    }

    .period-input,
    .period-select {
      border: none;
      padding: 0;
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text);
      background: transparent;
      box-shadow: none;
    }

    .period-input:focus,
    .period-select:focus {
      outline: none;
      box-shadow: none;
    }

    .period-input:disabled,
    .period-select:disabled {
      cursor: not-allowed;
      color: var(--color-text-faint);
    }

    .period-picker:has(:disabled) {
      opacity: 0.6;
    }

    .period-picker:has(:disabled):hover {
      transform: none;
      box-shadow: var(--shadow-sm);
      border-color: var(--color-border);
    }

    .period-input {
      width: 56px;
    }

    .period-select {
      appearance: none;
      width: 98px;
      padding-right: 16px;
      cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%236b7290' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 7.5 10 12.5 15 7.5'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0 center;
      background-size: 11px;
    }
  `]
})
export class PeriodPickerComponent {
  @Input() year!: number;
  @Input() month!: number;
  @Input() disabled = false;
  @Output() yearChange = new EventEmitter<number>();
  @Output() monthChange = new EventEmitter<number>();
  @Output() periodChange = new EventEmitter<void>();

  months = MONTHS;

  onYearChange(value: number): void {
    this.yearChange.emit(value);
    this.periodChange.emit();
  }

  onMonthChange(value: number): void {
    this.monthChange.emit(Number(value));
    this.periodChange.emit();
  }
}
