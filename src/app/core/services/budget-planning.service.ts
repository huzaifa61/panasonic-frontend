import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BudgetCellSave,
  ForecastRevisionResult,
  ForecastVersion,
  StoreBudgetGrid,
  UpsertLineItemRequest
} from '../models/budget-planning.model';

@Injectable({ providedIn: 'root' })
export class BudgetPlanningService {
  private readonly baseUrl = `${environment.apiBaseUrl}/budget-planning`;

  constructor(private http: HttpClient) {}

  getGrid(storeId: number, fiscalYear: number, asOf: string): Observable<StoreBudgetGrid> {
    const params = new HttpParams().set('fiscalYear', fiscalYear).set('asOf', asOf);
    return this.http.get<StoreBudgetGrid>(`${this.baseUrl}/${storeId}/grid`, { params });
  }

  createLineItem(storeId: number, fiscalYear: number, request: UpsertLineItemRequest): Observable<unknown> {
    const params = new HttpParams().set('fiscalYear', fiscalYear);
    return this.http.post(`${this.baseUrl}/${storeId}/line-items`, request, { params });
  }

  updateLineItem(storeId: number, lineItemId: number, request: UpsertLineItemRequest): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/${storeId}/line-items/${lineItemId}`, request);
  }

  saveBudgetGrid(storeId: number, fiscalYear: number, asOf: string, cells: BudgetCellSave[]): Observable<StoreBudgetGrid> {
    const params = new HttpParams().set('fiscalYear', fiscalYear).set('asOf', asOf);
    return this.http.put<StoreBudgetGrid>(`${this.baseUrl}/${storeId}/grid`, { cells }, { params });
  }

  proposeForecastChanges(
    storeId: number, fiscalYear: number, asOf: string, cells: BudgetCellSave[]
  ): Observable<ForecastRevisionResult> {
    const params = new HttpParams().set('fiscalYear', fiscalYear).set('asOf', asOf);
    return this.http.post<ForecastRevisionResult>(`${this.baseUrl}/${storeId}/forecast-revisions`, { cells }, { params });
  }

  lockForecastVersion(storeId: number, fiscalYear: number, asOf: string, label?: string): Observable<ForecastVersion> {
    const params = new HttpParams().set('fiscalYear', fiscalYear).set('asOf', asOf);
    return this.http.post<ForecastVersion>(`${this.baseUrl}/${storeId}/forecast-versions/lock`, { label }, { params });
  }

  getForecastVersions(storeId: number, fiscalYear: number): Observable<ForecastVersion[]> {
    const params = new HttpParams().set('fiscalYear', fiscalYear);
    return this.http.get<ForecastVersion[]>(`${this.baseUrl}/${storeId}/forecast-versions`, { params });
  }
}
