import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Headcount } from '../models/headcount.model';

@Injectable({ providedIn: 'root' })
export class HeadcountService {
  private readonly baseUrl = `${environment.apiBaseUrl}/headcount`;

  constructor(private http: HttpClient) {}

  getHeadcount(year: number, month: number): Observable<Headcount[]> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<Headcount[]>(this.baseUrl, { params });
  }
}
