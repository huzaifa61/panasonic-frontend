import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Store } from '../models/store.model';
import {
  CreateStoreRequest,
  StoreAllocatedBudget,
  UpdateStoreRequest,
  UpsertBudgetRequest,
  UpsertHeadcountRequest,
  UpsertStoreAllocatedBudgetRequest,
  UpsertTargetRequest
} from '../models/store-management.model';

@Injectable({ providedIn: 'root' })
export class StoreManagementService {
  private readonly storesUrl = `${environment.apiBaseUrl}/stores`;
  private readonly mgmtUrl = `${environment.apiBaseUrl}/store-management`;

  constructor(private http: HttpClient) {}

  createStore(request: CreateStoreRequest): Observable<Store> {
    return this.http.post<Store>(this.storesUrl, request);
  }

  updateStore(storeId: number, request: UpdateStoreRequest): Observable<Store> {
    return this.http.put<Store>(`${this.storesUrl}/${storeId}`, request);
  }

  deleteStore(storeId: number): Observable<void> {
    return this.http.delete<void>(`${this.storesUrl}/${storeId}`);
  }

  upsertBudget(storeId: number, request: UpsertBudgetRequest): Observable<unknown> {
    return this.http.put(`${this.mgmtUrl}/${storeId}/budget`, request);
  }

  upsertTarget(storeId: number, request: UpsertTargetRequest): Observable<unknown> {
    return this.http.put(`${this.mgmtUrl}/${storeId}/target`, request);
  }

  upsertHeadcount(storeId: number, request: UpsertHeadcountRequest): Observable<unknown> {
    return this.http.put(`${this.mgmtUrl}/${storeId}/headcount`, request);
  }

  getAllocatedBudget(storeId: number, fiscalYear: number): Observable<StoreAllocatedBudget> {
    return this.http.get<StoreAllocatedBudget>(`${this.mgmtUrl}/${storeId}/allocated-budget`, { params: { fiscalYear } });
  }

  upsertAllocatedBudget(storeId: number, request: UpsertStoreAllocatedBudgetRequest): Observable<StoreAllocatedBudget> {
    return this.http.put<StoreAllocatedBudget>(`${this.mgmtUrl}/${storeId}/allocated-budget`, request);
  }
}
