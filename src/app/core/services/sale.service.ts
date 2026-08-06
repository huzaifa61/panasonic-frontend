import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateSaleRequest, Sale } from '../models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly baseUrl = `${environment.apiBaseUrl}/sales`;

  constructor(private http: HttpClient) {}

  getSales(storeId?: number, year?: number, month?: number): Observable<Sale[]> {
    let params = new HttpParams();
    if (storeId != null) params = params.set('storeId', storeId);
    if (year != null) params = params.set('year', year);
    if (month != null) params = params.set('month', month);
    return this.http.get<Sale[]>(this.baseUrl, { params });
  }

  createSale(request: CreateSaleRequest): Observable<Sale> {
    return this.http.post<Sale>(this.baseUrl, request);
  }
}
