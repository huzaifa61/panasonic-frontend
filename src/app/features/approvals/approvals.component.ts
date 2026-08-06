import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApprovalService } from '../../core/services/approval.service';
import { StoreService } from '../../core/services/store.service';
import { ToastService } from '../../core/services/toast.service';
import { PendingApproval } from '../../core/models/expense.model';
import { Store } from '../../core/models/store.model';
import { CategoryIconComponent } from '../../shared/icons/category-icon.component';
import { AvatarComponent } from '../../shared/illustrations/avatar.component';
import { EmptyStateComponent } from '../../shared/illustrations/empty-state.component';

type LevelFilter = 'All' | 1 | 2;

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryIconComponent, AvatarComponent, EmptyStateComponent],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.scss'
})
export class ApprovalsComponent implements OnInit {
  approvals = signal<PendingApproval[]>([]);
  stores = signal<Store[]>([]);
  loading = signal(true);
  actingOnKey = signal<string | null>(null);
  comments: Record<string, string> = {};
  storeId: number | null = null;

  levelFilter = signal<LevelFilter>('All');
  filteredApprovals = computed(() => {
    const filter = this.levelFilter();
    const all = this.approvals();
    return filter === 'All' ? all : all.filter((a) => a.level === filter);
  });

  constructor(
    private approvalService: ApprovalService,
    private storeService: StoreService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.storeService.getStores().subscribe((stores) => this.stores.set(stores));

    this.route.queryParamMap.subscribe((params) => {
      const raw = params.get('storeId');
      this.storeId = raw ? Number(raw) : null;
      this.load();
    });
  }

  onFilterStoreChange(storeId: number | null): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { storeId }, queryParamsHandling: 'merge' });
  }

  load(): void {
    this.loading.set(true);
    this.approvalService.getPending(this.storeId ?? undefined).subscribe({
      next: (approvals) => {
        this.approvals.set(approvals);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Could not load pending approvals.');
        this.loading.set(false);
      }
    });
  }

  clearStoreFilter(): void {
    this.router.navigate([], { queryParams: {} });
  }

  // Expense and discount approvals live in separate DB tables, so their numeric
  // ids can collide - key UI state (comments, in-flight tracking) by type+id.
  rowKey(approval: PendingApproval): string {
    return `${approval.type}-${approval.id}`;
  }

  decide(approval: PendingApproval, approve: boolean): void {
    const key = this.rowKey(approval);
    this.actingOnKey.set(key);
    this.approvalService.decide(approval.id, approval.type, { approve, comments: this.comments[key] || undefined }).subscribe({
      next: () => {
        this.actingOnKey.set(null);
        delete this.comments[key];
        this.toastService.success(approve ? 'Approved.' : 'Rejected.');
        this.load();
      },
      error: () => {
        this.actingOnKey.set(null);
        this.toastService.error('Failed to record the decision.');
      }
    });
  }

  levelLabel(level: number): string {
    return level === 1 ? 'Level 1 - Store Manager' : 'Level 2 - Regional Manager';
  }
}
