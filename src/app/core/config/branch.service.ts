import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from '@core/config/api.config';

export interface Branch {
  id: string;
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private readonly http = inject(HttpClient);

  findAll() {
    return this.http.get<Branch[]>(`${API_BASE_URL}/branches`);
  }
}
