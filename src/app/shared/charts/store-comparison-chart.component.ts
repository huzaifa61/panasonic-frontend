import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { CHART_CHROME, SERIES_COLORS } from '../palette';

export interface StoreComparisonPoint {
  storeName: string;
  seriesA: number;
  seriesB: number;
}

// Generic "two values per store" grouped bar chart - used for both Revenue vs
// Forecast and Actuals vs Forecast on the Dashboard, distinguished only by the
// data and series labels passed in.
@Component({
  selector: 'app-store-comparison-chart',
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
export class StoreComparisonChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: StoreComparisonPoint[] = [];
  @Input() seriesALabel = 'Series A';
  @Input() seriesBLabel = 'Series B';
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['seriesALabel'] || changes['seriesBLabel']) && this.canvasRef) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    const labels = this.data.map((s) => s.storeName);
    const aData = this.data.map((s) => s.seriesA);
    const bData = this.data.map((s) => s.seriesB);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = aData;
      this.chart.data.datasets[0].label = this.seriesALabel;
      this.chart.data.datasets[1].data = bData;
      this.chart.data.datasets[1].label = this.seriesBLabel;
      this.chart.update();
      return;
    }

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: this.seriesALabel,
            data: aData,
            backgroundColor: SERIES_COLORS[0],
            borderRadius: 4,
            maxBarThickness: 36
          },
          {
            label: this.seriesBLabel,
            data: bData,
            backgroundColor: SERIES_COLORS[1],
            borderRadius: 4,
            maxBarThickness: 36
          }
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
