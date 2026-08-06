import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplianceCategory, Store } from '../models/store.model';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly baseUrl = `${environment.apiBaseUrl}/stores`;

  constructor(private http: HttpClient) {}

  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>(this.baseUrl);
  }

  getCategories(): Observable<ApplianceCategory[]> {
    return this.http.get<ApplianceCategory[]>(`${this.baseUrl}/categories`);
  }
}
