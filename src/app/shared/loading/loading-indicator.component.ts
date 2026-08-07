import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-indicator">
      <span class="coin-stack">
        <svg class="coin coin-back" viewBox="0 0 40 40" fill="none">
          <ellipse cx="20" cy="20" rx="16" ry="16" fill="url(#coinGradientBack)" stroke="#c99a2b" stroke-width="1.5" />
          <text x="20" y="26" text-anchor="middle" font-size="16" font-weight="700" fill="#8a6414" font-family="inherit">$</text>
        </svg>
        <svg class="coin coin-front" viewBox="0 0 40 40" fill="none">
          <ellipse cx="20" cy="20" rx="16" ry="16" fill="url(#coinGradientFront)" stroke="#c99a2b" stroke-width="1.5" />
          <text x="20" y="26" text-anchor="middle" font-size="16" font-weight="700" fill="#8a6414" font-family="inherit">$</text>
        </svg>
        <svg width="0" height="0">
          <defs>
            <linearGradient id="coinGradientBack" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stop-color="#fff3cf" />
              <stop offset="1" stop-color="#f0c65a" />
            </linearGradient>
            <linearGradient id="coinGradientFront" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ffe9a8" />
              <stop offset="1" stop-color="#e8b93f" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span class="loading-text">{{ text }}</span>
    </div>
  `,
  styles: [
    `
      .loading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 28px 20px;
      }

      .coin-stack {
        position: relative;
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        perspective: 120px;
      }

      .coin {
        position: absolute;
        top: 0;
        left: 0;
        width: 30px;
        height: 30px;
        transform-style: preserve-3d;
        animation: coin-flip 1.1s cubic-bezier(0.4, 0.1, 0.3, 1) infinite;
      }

      .coin-back {
        animation-delay: -0.55s;
        opacity: 0.6;
      }

      @keyframes coin-flip {
        0% {
          transform: rotateY(0deg) translateY(0);
        }
        50% {
          transform: rotateY(180deg) translateY(-5px);
        }
        100% {
          transform: rotateY(360deg) translateY(0);
        }
      }

      .loading-text {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-muted);
      }
    `
  ]
})
export class LoadingIndicatorComponent {
  @Input() text = 'Loading...';
}
