import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ItineraryViewerComponent } from './itinerary-viewer';
import { ItineraryStateService } from '../core/services/itinerary-state.service';
import { ItineraryService, Itinerary } from '../core/services/itinerary';
import { SuggestionsService } from '../core/services/suggestions';
import { AuthService } from '../core/services/auth';
import { CurrencyService } from '../core/services/currency.service';

const mockItinerary: Itinerary = {
    id: 57,
    name: 'Tokyo Trip',
    totalDays: 1,
    totalCost: 0,
    createdById: 1,
    generatedAt: new Date().toISOString(),
    groupId: 5,
    days: [
        { dayNumber: 1, date: '2026-10-14', activities: [], accommodation: null }
    ]
} as Itinerary;

class MockItineraryService {
    getOne(id: number) { return of(mockItinerary); }
    getBudgetSummary(id: number) { return of(null); }
    addActivity(id: number, dayNumber: number, suggestionId: number) { return of(mockItinerary); }
    delete(id: number) { return of(void 0); }
}

class MockAuthService {
    currentUserValue = { id: 1, role: 'user' };
}

class MockCurrencyService {
    format(amount: number | string, currency: string) { return `${amount} ${currency}`; }
    convert(amount: number, from: string, to: string) { return amount; }
}

describe('ItineraryViewerComponent', () => {
    let suggestionsGetAllSpy: jasmine.Spy;

    beforeEach(async () => {
        const suggestionsServiceMock = {
            getAll: jasmine.createSpy('getAll').and.returnValue(of([]))
        };
        suggestionsGetAllSpy = suggestionsServiceMock.getAll;

        await TestBed.configureTestingModule({
            imports: [ItineraryViewerComponent],
            providers: [
                ItineraryStateService,
                { provide: ItineraryService, useClass: MockItineraryService },
                { provide: SuggestionsService, useValue: suggestionsServiceMock },
                { provide: AuthService, useClass: MockAuthService },
                { provide: CurrencyService, useClass: MockCurrencyService },
                { provide: ActivatedRoute, useValue: { params: of({ id: '57' }) } },
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
            ]
        }).compileComponents();
    });

    it('should load suggestions with the itinerary groupId (bug: empty add-activity dropdown)', () => {
        const fixture = TestBed.createComponent(ItineraryViewerComponent);
        fixture.componentInstance.ngOnInit();

        // The backend returns [] when no groupId/countryId context is provided,
        // which leaves the "add activity" dropdown empty.
        expect(suggestionsGetAllSpy).toHaveBeenCalledWith({ groupId: 5 });
    });
});
