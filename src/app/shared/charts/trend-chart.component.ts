import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { CHART_CHROME, SERIES_COLORS } from '../palette';
import { MonthlyTrend } from '../../core/models/dashboard.model';

const MONTH_LABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  template: `<div class="chart-wrap"><canvas #canvas></canvas></div>`,
  styles: [
    `
      .chart-wrap {
        position: relative;
        height: 260px;
      }
    `
  ]
})
export class TrendChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() trend: MonthlyTrend[] = [];
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trend'] && this.canvasRef) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    const labels = this.trend.map((t) => `${MONTH_LABELS[t.month]} ${t.year}`);
    const budget = this.trend.map((t) => t.budget);
    const expense = this.trend.map((t) => t.approvedExpense);
    const forecastedExpense = this.trend.map((t) => t.forecastedExpense);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = budget;
      this.chart.data.datasets[1].data = expense;
      this.chart.data.datasets[2].data = forecastedExpense;
      this.chart.update();
      return;
    }

    const lineDataset = (label: string, data: number[], color: string) => ({
      label,
      data,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: false
    });

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          lineDataset('Planned Budget', budget, SERIES_COLORS[0]),
          lineDataset('Actuals Expense', expense, SERIES_COLORS[1]),
          lineDataset('Forecast Expense', forecastedExpense, SERIES_COLORS[2])
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: CHART_CHROME.textPrimary, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: CHART_CHROME.textPrimary,
            titleColor: '#fff',
            bodyColor: '#fff',
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw ?? 0).toLocaleString()} AED`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: CHART_CHROME.textSecondary }
          },
          y: {
            beginAtZero: true,
            grid: { color: CHART_CHROME.gridline },
            ticks: {
              color: CHART_CHROME.muted,
              callback: (value) => `${Number(value).toLocaleString()} AED`
            }
          }
        }
      }
    });
  }
}
