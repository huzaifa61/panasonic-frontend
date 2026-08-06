import { Component, Input } from '@angular/core';

const GRADIENTS = [
  ['#5b7cfa', '#2a52d6'],
  ['#34d1a8', '#0f9d78'],
  ['#f7a94a', '#e0791e'],
  ['#f277a8', '#d43f7e'],
  ['#7c6ff0', '#4a3aa7']
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

@Component({
  selector: 'app-store-icon',
  standalone: true,
  template: `
    <span class="store-icon" [style.background]="gradient">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
        <path d="M4 9.5 5.2 4h13.6l1.2 5.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M4 9.5a2.3 2.3 0 0 0 4.6 0 2.3 2.3 0 0 0 4.6 0 2.3 2.3 0 0 0 4.6 0 2.3 2.3 0 0 0 4.6 0" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M5 9.5V20h14V9.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M9.5 20v-5.5h5V20" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  `,
  styles: [
    `
      .store-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        flex-shrink: 0;
      }

      svg {
        width: 18px;
        height: 18px;
      }
    `
  ]
})
export class StoreIconComponent {
  @Input() name = '';

  get gradient(): string {
    const [from, to] = GRADIENTS[hashString(this.name) % GRADIENTS.length];
    return `linear-gradient(135deg, ${from}, ${to})`;
  }
}
