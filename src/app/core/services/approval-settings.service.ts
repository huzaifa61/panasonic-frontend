import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApprovalSettings } from '../models/approval-settings.model';

@Injectable({ providedIn: 'root' })
export class ApprovalSettingsService {
  private readonly baseUrl = `${environment.apiBaseUrl}/settings/approval-threshold`;

  constructor(private http: HttpClient) {}

  getThreshold(): Observable<ApprovalSettings> {
    return this.http.get<ApprovalSettings>(this.baseUrl);
  }

  updateThreshold(expenseApprovalThreshold: number): Observable<ApprovalSettings> {
    return this.http.put<ApprovalSettings>(this.baseUrl, { expenseApprovalThreshold });
  }
}
