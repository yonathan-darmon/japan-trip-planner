import { Injectable, computed, signal } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Itinerary, ItineraryDay, ItineraryService } from './itinerary';
import { Suggestion } from './suggestions';
import { ReorderRequest } from './itinerary';

@Injectable({
    providedIn: 'root'
})
export class ItineraryStateService {
    // Main Source of Truth
    private _itinerary = new BehaviorSubject<Itinerary | null>(null);
    itinerary$ = this._itinerary.asObservable();

    // Loading state
    private _loading = new BehaviorSubject<boolean>(false);
    loading$ = this._loading.asObservable();

    // Selection state
    private _selectedDay = new BehaviorSubject<ItineraryDay | null>(null);
    selectedDay$ = this._selectedDay.asObservable();

    // Computed state (Cost)
    costBreakdown$ = this.itinerary$.pipe(
        map(itinerary => {
            if (!itinerary) return {};
            const breakdown: { [key: string]: number } = {
                'Transport': 0,
                'Logement': 0,
                'Nourriture': 0,
                'Activité': 0,
                'Autre': 0
            };

            itinerary.days.forEach(day => {
                day.activities.forEach(act => {
                    const type = act.suggestion.category || 'Autre';
                    const price = parseFloat(act.suggestion.price as any) || 0;
                    breakdown[type] = (breakdown[type] || 0) + price;
                });
                if (day.accommodation) {
                    const price = parseFloat(day.accommodation.price as any) || 0;
                    breakdown['Logement'] += price;
                }
            });
            return breakdown;
        })
    );

    constructor(private itineraryService: ItineraryService) { }

    setItinerary(itinerary: Itinerary | null) {
        const currentSelected = this._selectedDay.value;
        this._itinerary.next(itinerary);

        // If something was selected, try to find the new reference of that day 
        // to keep the UI (Map, Highlight) in sync after data update
        if (itinerary && currentSelected) {
            const found = itinerary.days.find(d => d.dayNumber === currentSelected.dayNumber);
            this._selectedDay.next(found || null);
        }
    }

    getItinerary(): Itinerary | null {
        return this._itinerary.value;
    }

    selectDay(day: ItineraryDay | null) {
        this._selectedDay.next(day);
    }

    /**
     * Optimistically update reorder in state, then sync with backend
     */
    async reorderActivities(
        id: number,
        dayNumber: number,
        newOrder: number[]
    ) {
        const current = this.getItinerary();
        if (!current) return;

        // Call backend
        try {
            this._loading.next(true);
            const updated = await this.itineraryService.reorder(id, { dayNumber, newOrder }).toPromise();
            if (updated) {
                this.setItinerary(updated);
            }
        } catch (err) {
            console.error('Failed to reorder', err);
            // Revert state if we had implemented optimistic UI here
        } finally {
            this._loading.next(false);
        }
    }

    async updateAccommodation(
        id: number,
        dayNumber: number,
        suggestionId: number | null
    ) {
        const current = this.getItinerary();
        if (!current) return;

        try {
            this._loading.next(true);
            const updated = await this.itineraryService.updateAccommodation(id, dayNumber, suggestionId).toPromise();
            if (updated) {
                this.setItinerary(updated);
            }
        } catch (err) {
            console.error('Failed to update accommodation', err);
        } finally {
            this._loading.next(false);
        }
    }

    async reorderAll(
        id: number,
        days: { dayNumber: number; activities: { suggestionId: number; orderInDay: number }[] }[]
    ) {
        try {
            // Optimistic update could happen here for super fast UI
            // but complicated with drag & drop across days

            const updated = await this.itineraryService.reorderAll(id, { days }).toPromise();
            if (updated) {
                this.setItinerary(updated);
            }
        } catch (err) {
            console.error('Failed to reorder all', err);
        }
    }
}
