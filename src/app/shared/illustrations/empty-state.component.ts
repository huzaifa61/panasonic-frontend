import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <svg viewBox="0 0 160 120" fill="none">
        <ellipse cx="80" cy="104" rx="46" ry="8" fill="#eef1fd" />
        <rect x="34" y="30" width="92" height="62" rx="10" fill="#fff" stroke="#e7e9f0" stroke-width="2" />
        <rect x="34" y="30" width="92" height="22" rx="10" fill="url(#emptyHeader)" />
        <rect x="48" y="62" width="64" height="6" rx="3" fill="#e7e9f0" />
        <rect x="48" y="74" width="44" height="6" rx="3" fill="#eef0f6" />
        <circle cx="112" cy="42" r="34" fill="#e7f6ee" opacity="0.6" />
        <path d="M96 44 106 54 126 32" stroke="#16794b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <defs>
          <linearGradient id="emptyHeader" x1="34" y1="30" x2="126" y2="52" gradientUnits="userSpaceOnUse">
            <stop stop-color="#5b7cfa" />
            <stop offset="1" stop-color="#2a52d6" />
          </linearGradient>
        </defs>
      </svg>
      <p class="empty-title">{{ title }}</p>
      @if (subtitle) {
        <p class="empty-subtitle">{{ subtitle }}</p>
      }
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 32px 16px;
      }

      svg {
        width: 140px;
        height: auto;
        margin-bottom: 12px;
      }

      .empty-title {
        font-weight: 600;
        color: var(--color-text);
        margin: 0 0 4px;
        font-size: 14.5px;
      }

      .empty-subtitle {
        color: var(--color-text-muted);
        font-size: 13px;
        margin: 0;
      }
    `
  ]
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() subtitle = '';
}
