import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GlobalPlanningCellSave, GlobalPlanningStore } from '../models/global-planning.model';

@Injectable({ providedIn: 'root' })
export class GlobalPlanningService {
  private readonly baseUrl = `${environment.apiBaseUrl}/global-planning`;

  constructor(private http: HttpClient) {}

  getGrid(fiscalYear: number, asOf: string, storeId: number | null): Observable<GlobalPlanningStore[]> {
    let params = new HttpParams().set('fiscalYear', fiscalYear).set('asOf', asOf);
    if (storeId != null) params = params.set('storeId', storeId);
    return this.http.get<GlobalPlanningStore[]>(`${this.baseUrl}/grid`, { params });
  }

  saveCells(cells: GlobalPlanningCellSave[], asOf: string): Observable<void> {
    const params = new HttpParams().set('asOf', asOf);
    return this.http.put<void>(`${this.baseUrl}/cells`, { cells }, { params });
  }
}
