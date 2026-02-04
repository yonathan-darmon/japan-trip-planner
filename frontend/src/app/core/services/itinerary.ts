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
    createdBy?: {
        id: number;
        username: string;
        email: string;
        role: string;
    };
}

export interface GenerateItineraryRequest {
    name?: string;
    maxActivitiesPerDay?: number;
    groupId?: number;
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

    getAll(groupId?: number): Observable<Itinerary[]> {
        const params: any = {};
        if (groupId) params.groupId = groupId;
        // Use root endpoint which supports filtering, instead of /all which is public only
        return this.http.get<Itinerary[]>(`${this.apiUrl}`, { params });
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

    reorderAll(id: number, data: { days: { dayNumber: number; activities: { suggestionId: number; orderInDay: number }[] }[] }): Observable<Itinerary> {
        return this.http.patch<Itinerary>(`${this.apiUrl}/${id}/reorder-all`, data);
    }

    updateAccommodation(id: number, dayNumber: number, suggestionId: number | null): Observable<Itinerary> {
        return this.http.patch<Itinerary>(`${this.apiUrl}/${id}/days/${dayNumber}/accommodation`, { suggestionId });
    }

    addActivity(id: number, dayNumber: number, suggestionId: number): Observable<Itinerary> {
        return this.http.post<Itinerary>(`${this.apiUrl}/${id}/days/${dayNumber}/activities`, { suggestionId });
    }
}
