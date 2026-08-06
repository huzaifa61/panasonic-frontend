import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.type" (click)="toastService.dismiss(toast.id)">
          <span class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="m4 10.5 4 4L16 6" stroke-linecap="round" stroke-linejoin="round" /></svg> }
              @case ('error') { <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l8 8M14 6l-8 8" stroke-linecap="round" /></svg> }
              @default { <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="7.5" /><path d="M10 9v4.5M10 6.5v.01" stroke-linecap="round" /></svg> }
            }
          </span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 13px 16px;
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      box-shadow: var(--shadow-lg);
      border-left: 3px solid var(--color-text-faint);
      font-size: 13.5px;
      color: var(--color-text);
      cursor: pointer;
      animation: toast-in 0.18s ease;
    }

    .toast.success {
      border-left-color: var(--color-success);
    }

    .toast.error {
      border-left-color: var(--color-danger);
    }

    .toast-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      margin-top: 1px;
      color: var(--color-text-faint);
    }

    .toast.success .toast-icon {
      color: var(--color-success);
    }

    .toast.error .toast-icon {
      color: var(--color-danger);
    }

    .toast-icon svg {
      width: 100%;
      height: 100%;
    }

    .toast-message {
      flex: 1;
      line-height: 1.4;
    }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
