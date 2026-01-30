import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './auth';
import { UserPreference } from './preferences';
import { Country } from './countries.service';

export enum SuggestionCategory {
  RESTAURANT = 'Restaurant',
  TEMPLE = 'Temple',
  MUSEE = 'Musée',
  NATURE = 'Nature',
  SHOPPING = 'Shopping',
  ACTIVITE = 'Activité',
  HEBERGEMENT = 'Hébergement',
  TRANSPORT = 'Transport',
  AUTRE = 'Autre',
}

export interface Suggestion {
  id: number;
  name: string;
  location: string;
  description: string;
  photoUrl: string;
  price: number;
  category: SuggestionCategory;
  latitude: number;
  longitude: number;
  durationHours: number;
  createdBy: User;
  createdById: number;
  createdAt: string;
  preferences?: UserPreference[];
  countryId?: number;
  country?: Country;
  isGlobal: boolean;
  groupId?: number;
}

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SuggestionsService {
  private apiUrl = `${environment.apiUrl}/suggestions`;

  constructor(private http: HttpClient) { }

  getAll(options: { countryId?: number; isGlobal?: boolean; groupId?: number } = {}): Observable<Suggestion[]> {
    let params: any = {};
    if (options.countryId) params.countryId = options.countryId;
    if (options.isGlobal !== undefined) params.isGlobal = options.isGlobal;
    if (options.groupId) params.groupId = options.groupId;

    return this.http.get<Suggestion[]>(this.apiUrl, { params });
  }

  getOne(id: number): Observable<Suggestion> {
    return this.http.get<Suggestion>(`${this.apiUrl}/${id}`);
  }

  create(data: FormData): Observable<Suggestion> {
    return this.http.post<Suggestion>(this.apiUrl, data);
  }

  update(id: number, data: FormData): Observable<Suggestion> {
    return this.http.patch<Suggestion>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  retryGeocode(id: number): Observable<Suggestion> {
    return this.http.patch<Suggestion>(`${this.apiUrl}/${id}/retry-geocode`, {});
  }
}
