import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Approval, DecideApprovalRequest, PendingApproval, PendingApprovalType } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private readonly baseUrl = `${environment.apiBaseUrl}/approvals`;

  constructor(private http: HttpClient) {}

  getPending(storeId?: number): Observable<PendingApproval[]> {
    let params = new HttpParams();
    if (storeId != null) params = params.set('storeId', storeId);
    return this.http.get<PendingApproval[]>(`${this.baseUrl}/pending`, { params });
  }

  decide(approvalId: number, type: PendingApprovalType, request: DecideApprovalRequest): Observable<Approval> {
    const params = new HttpParams().set('type', type.toLowerCase());
    return this.http.post<Approval>(`${this.baseUrl}/${approvalId}/decide`, request, { params });
  }
}
