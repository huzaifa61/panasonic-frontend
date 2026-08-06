import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { CHART_CHROME } from '../palette';
import { CategoryMargin } from '../../core/models/dashboard.model';

const POSITIVE_COLOR = '#16794b';
const NEGATIVE_COLOR = '#c22b3d';

@Component({
  selector: 'app-margin-by-category-chart',
  standalone: true,
  template: `<div class="chart-wrap"><canvas #canvas></canvas></div>`,
  styles: [`.chart-wrap { position: relative; height: 260px; }`]
})
export class MarginByCategoryChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() categoryMargins: CategoryMargin[] = [];
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryMargins'] && this.canvasRef) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    const labels = this.categoryMargins.map((c) => c.categoryName);
    const marginData = this.categoryMargins.map((c) => c.marginPercent);
    const colors = this.categoryMargins.map((c) => (c.marginPercent >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR));

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = marginData;
      this.chart.data.datasets[0].backgroundColor = colors;
      this.chart.update();
      return;
    }

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Margin %', data: marginData, backgroundColor: colors, borderRadius: 4, maxBarThickness: 36 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: CHART_CHROME.textPrimary,
            titleColor: '#fff',
            bodyColor: '#fff',
            callbacks: {
              label: (ctx) => {
                const row = this.categoryMargins[ctx.dataIndex];
                return `Margin: ${row.marginPercent.toFixed(1)}% (Rev ${row.revenue.toLocaleString()} / Cost ${row.costOfSales.toLocaleString()} AED)`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: CHART_CHROME.textSecondary } },
          y: { grid: { color: CHART_CHROME.gridline }, ticks: { color: CHART_CHROME.muted, callback: (value) => `${value}%` } }
        }
      }
    });
  }
}
