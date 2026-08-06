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

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `<span class="avatar" [style.background]="gradient" [style.width.px]="size" [style.height.px]="size" [style.fontSize.px]="size * 0.38">{{ initials }}</span>`,
  styles: [
    `
      .avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: #fff;
        font-weight: 700;
        flex-shrink: 0;
        letter-spacing: -0.02em;
      }
    `
  ]
})
export class AvatarComponent {
  @Input() name = '';
  @Input() size = 28;

  get initials(): string {
    return initialsOf(this.name);
  }

  get gradient(): string {
    const [from, to] = GRADIENTS[hashString(this.name) % GRADIENTS.length];
    return `linear-gradient(135deg, ${from}, ${to})`;
  }
}
