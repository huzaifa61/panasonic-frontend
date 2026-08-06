import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BulkRevenueRow, BulkRevenueRowResult, CreateRevenueRequest, Revenue } from '../models/revenue.model';

@Injectable({ providedIn: 'root' })
export class RevenueService {
  private readonly baseUrl = `${environment.apiBaseUrl}/revenues`;

  constructor(private http: HttpClient) {}

  getRevenues(storeId?: number, year?: number, month?: number): Observable<Revenue[]> {
    let params = new HttpParams();
    if (storeId != null) params = params.set('storeId', storeId);
    if (year != null) params = params.set('year', year);
    if (month != null) params = params.set('month', month);
    return this.http.get<Revenue[]>(this.baseUrl, { params });
  }

  createRevenue(request: CreateRevenueRequest): Observable<Revenue> {
    return this.http.post<Revenue>(this.baseUrl, request);
  }

  bulkCreate(rows: BulkRevenueRow[]): Observable<BulkRevenueRowResult[]> {
    return this.http.post<BulkRevenueRowResult[]>(`${this.baseUrl}/bulk`, rows);
  }
}
