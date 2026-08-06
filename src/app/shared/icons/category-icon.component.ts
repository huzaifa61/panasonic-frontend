import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { categoryColor } from '../palette';

@Component({
  selector: 'app-category-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="icon-badge" [style.background]="bgGradient">
      <ng-container [ngSwitch]="name">
        <svg *ngSwitchCase="'Television'" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
          <rect x="3" y="4.5" width="18" height="12" rx="1.4" />
          <path d="M9 20h6M12 16.5V20" stroke-linecap="round" />
        </svg>
        <svg *ngSwitchCase="'Air Conditioner'" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
          <rect x="2.5" y="6" width="19" height="9" rx="1.6" />
          <path d="M6 15v2.5M10.5 15v3.5M15 15v2.5M19 15v3.5" stroke-linecap="round" />
          <path d="M6 9.5h9" stroke-linecap="round" />
        </svg>
        <svg *ngSwitchCase="'Refrigerator'" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
          <rect x="5" y="2.5" width="14" height="19" rx="1.6" />
          <path d="M5 9.5h14M8.5 5.5v2M8.5 12.5v2.2" stroke-linecap="round" />
        </svg>
        <svg *ngSwitchCase="'Washing Machine'" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
          <rect x="3" y="3" width="18" height="18" rx="1.8" />
          <circle cx="12" cy="13.5" r="5" />
          <circle cx="12" cy="13.5" r="2" />
          <path d="M6.2 5.7h.01M9.4 5.7h.01" stroke-linecap="round" />
        </svg>
        <svg *ngSwitchCase="'Microwave Oven'" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
          <rect x="2.5" y="5" width="19" height="14" rx="1.6" />
          <rect x="5" y="7.5" width="10.5" height="9" rx="1" />
          <path d="M18.5 10h1.6M18.5 12.5h1.6M18.5 15h1.6" stroke-linecap="round" />
        </svg>
        <svg *ngSwitchDefault viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
          <path d="M3 10.5 12 4l9 6.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M5 9.5V20h14V9.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M9.5 20v-5.5h5V20" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </ng-container>
    </span>
  `,
  styles: [
    `
      .icon-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        flex-shrink: 0;
      }

      svg {
        width: 17px;
        height: 17px;
      }
    `
  ]
})
export class CategoryIconComponent {
  @Input() name = '';

  get fgColor(): string {
    return categoryColor(this.name);
  }

  get bgGradient(): string {
    return `linear-gradient(135deg, ${this.fgColor}, color-mix(in srgb, ${this.fgColor} 65%, black))`;
  }
}
