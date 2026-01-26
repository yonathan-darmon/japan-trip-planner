import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Suggestion } from './suggestions';

export interface ItineraryActivity {
    suggestionId: number;
    orderInDay: number;
    suggestion: Suggestion;
}

export interface ItineraryDay {
    dayNumber: number;
    date: string | null;
    activities: ItineraryActivity[];
    accommodation: Suggestion | null;
}

export interface Itinerary {
    id: number;
    name: string;
    totalDays: number;
    totalCost: number;
    createdById: number;
    generatedAt: string;
    days: ItineraryDay[];
}

export interface GenerateItineraryRequest {
    name?: string;
    maxActivitiesPerDay?: number;
}

export interface ReorderRequest {
    dayNumber: number;
    newOrder: number[];
}

@Injectable({
    providedIn: 'root'
})
export class ItineraryService {
    private apiUrl = `${environment.apiUrl}/itinerary`;

    constructor(private http: HttpClient) { }

    generate(data: GenerateItineraryRequest): Observable<Itinerary> {
        return this.http.post<Itinerary>(`${this.apiUrl}/generate`, data);
    }

    getAll(): Observable<Itinerary[]> {
        return this.http.get<Itinerary[]>(this.apiUrl);
    }

    getOne(id: number): Observable<Itinerary> {
        return this.http.get<Itinerary>(`${this.apiUrl}/${id}`);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    reorder(id: number, data: ReorderRequest): Observable<Itinerary> {
        return this.http.patch<Itinerary>(`${this.apiUrl}/${id}/reorder`, data);
    }

    updateAccommodation(id: number, dayNumber: number, suggestionId: number | null): Observable<Itinerary> {
        return this.http.patch<Itinerary>(`${this.apiUrl}/${id}/days/${dayNumber}/accommodation`, { suggestionId });
    }
}
