import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TripConfig {
    id: number;
    durationDays: number;
    startDate: string | null;
    endDate: string | null;
    updatedById: number | null;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class TripConfigService {
    private apiUrl = `${environment.apiUrl}/trip-config`;

    constructor(private http: HttpClient) { }

    getConfig(): Observable<TripConfig> {
        return this.http.get<TripConfig>(this.apiUrl);
    }

    updateConfig(data: Partial<TripConfig>): Observable<TripConfig> {
        return this.http.patch<TripConfig>(this.apiUrl, data);
    }
}
