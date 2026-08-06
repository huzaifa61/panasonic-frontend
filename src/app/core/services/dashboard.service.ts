import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryBreakdown, CategoryMargin, MonthlyTrend, Overview, StoreDashboard } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = `${environment.apiBaseUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getOverview(year: number, month: number): Observable<Overview> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<Overview>(`${this.baseUrl}/overview`, { params });
  }

  getStoreDashboard(storeId: number, year: number, month: number): Observable<StoreDashboard> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<StoreDashboard>(`${this.baseUrl}/store/${storeId}`, { params });
  }

  getTrend(year: number, month: number, monthsBack = 4): Observable<MonthlyTrend[]> {
    const params = new HttpParams().set('year', year).set('month', month).set('monthsBack', monthsBack);
    return this.http.get<MonthlyTrend[]>(`${this.baseUrl}/trend`, { params });
  }

  getCategoryBreakdown(year: number, month: number): Observable<CategoryBreakdown[]> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<CategoryBreakdown[]>(`${this.baseUrl}/category-breakdown`, { params });
  }

  getCategoryMargin(year: number, month: number): Observable<CategoryMargin[]> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<CategoryMargin[]>(`${this.baseUrl}/category-margin`, { params });
  }
}
