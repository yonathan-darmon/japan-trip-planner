import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SuggestionDetailComponent } from './suggestion-detail.component';
import { SuggestionsService, SuggestionCategory } from '../../core/services/suggestions';
import { CurrencyService } from '../../core/services/currency.service';

const mockSuggestion = {
    id: 42,
    name: 'Universal Studio Japon',
    category: SuggestionCategory.ACTIVITE,
    location: 'Osaka, Japon',
    description: 'Parc',
    price: 21938,
    durationHours: 8,
    // No lat/lon so the Leaflet map is not initialized in tests
    latitude: null,
    longitude: null,
    country: {
        id: 1,
        name: 'Japon',
        code: 'JPN',
        currencyCode: 'JPY',
        currencySymbol: '¥'
    }
} as any;

class MockCurrencyService {
    format(amount: number | string, currency: string): string {
        const symbols: Record<string, string> = { 'JPY': '¥', 'EUR': '€', 'USD': '$' };
        return `${symbols[currency] || currency}${Number(amount).toFixed(2)}`;
    }
}

describe('SuggestionDetailComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SuggestionDetailComponent],
            providers: [
                provideRouter([]),
                { provide: SuggestionsService, useValue: { getOne: () => of(mockSuggestion) } },
                { provide: CurrencyService, useClass: MockCurrencyService },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ id: '42' }),
                            queryParamMap: convertToParamMap({})
                        }
                    }
                }
            ]
        }).compileComponents();
    });

    it('should display the price in the suggestion country currency, not hardcoded EUR', () => {
        const fixture = TestBed.createComponent(SuggestionDetailComponent);
        fixture.detectChanges();

        const priceBox = (fixture.nativeElement as HTMLElement).querySelector('.price-box');
        expect(priceBox?.textContent).toContain('¥21938.00');
        expect(priceBox?.textContent).not.toContain('€');
    });
});
