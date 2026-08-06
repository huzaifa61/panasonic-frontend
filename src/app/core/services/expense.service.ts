import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BulkExpenseRow, BulkExpenseRowResult, CreateExpenseRequest, Expense } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly baseUrl = `${environment.apiBaseUrl}/expenses`;

  constructor(private http: HttpClient) {}

  getExpenses(storeId?: number, year?: number, month?: number): Observable<Expense[]> {
    let params = new HttpParams();
    if (storeId != null) params = params.set('storeId', storeId);
    if (year != null) params = params.set('year', year);
    if (month != null) params = params.set('month', month);
    return this.http.get<Expense[]>(this.baseUrl, { params });
  }

  createExpense(request: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(this.baseUrl, request);
  }

  bulkCreate(rows: BulkExpenseRow[]): Observable<BulkExpenseRowResult[]> {
    return this.http.post<BulkExpenseRowResult[]>(`${this.baseUrl}/bulk`, rows);
  }
}
