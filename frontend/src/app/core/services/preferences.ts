import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum Priority {
  INDISPENSABLE = 'INDISPENSABLE',
  SI_POSSIBLE = 'SI_POSSIBLE',
  BONUS = 'BONUS',
}

export interface UserPreference {
  userId: number;
  suggestionId: number;
  selected: boolean;
  priority: Priority;
  user?: any; // User object for avatars
}

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private apiUrl = `${environment.apiUrl}/preferences`;

  constructor(private http: HttpClient) { }

  getMyVotes(): Observable<UserPreference[]> {
    return this.http.get<UserPreference[]>(`${this.apiUrl}/my-votes`);
  }

  updateVote(suggestionId: number, data: { selected?: boolean; priority?: Priority }): Observable<UserPreference> {
    return this.http.patch<UserPreference>(`${this.apiUrl}/${suggestionId}`, data);
  }
}
