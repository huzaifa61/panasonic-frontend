import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ExpensesComponent } from './features/expenses/expenses.component';
import { RevenueComponent } from './features/revenue/revenue.component';
import { ApprovalsComponent } from './features/approvals/approvals.component';
import { LoginComponent } from './features/login/login.component';
import { StoreManagementComponent } from './features/store-management/store-management.component';
import { BudgetPlanningComponent } from './features/budget-planning/budget-planning.component';
import { GlobalPlanningComponent } from './features/global-planning/global-planning.component';
import { authGuard, regionalManagerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'expenses', component: ExpensesComponent, canActivate: [authGuard] },
  { path: 'revenue', component: RevenueComponent, canActivate: [authGuard] },
  { path: 'approvals', component: ApprovalsComponent, canActivate: [authGuard] },
  { path: 'store-management', component: StoreManagementComponent, canActivate: [authGuard, regionalManagerGuard] },
  { path: 'budget-planning', component: BudgetPlanningComponent, canActivate: [authGuard, regionalManagerGuard] },
  { path: 'global-planning', component: GlobalPlanningComponent, canActivate: [authGuard, regionalManagerGuard] }
];
