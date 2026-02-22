import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItineraryDayComponent } from './itinerary-day.component';
import { ItineraryDay } from '../../../core/services/itinerary';
import { SuggestionCategory } from '../../../core/services/suggestions';
import { CurrencyService } from '../../../core/services/currency.service';
import { WeatherService } from '../../../core/services/weather.service';
import { of } from 'rxjs';

class MockCurrencyService {
    format(amount: number | string, currency: string): string {
        const val = Number(amount);
        const symbols: Record<string, string> = { 'JPY': '¥', 'EUR': '€', 'USD': '$' };
        const symbol = symbols[currency] || currency;
        return `${symbol}${val.toFixed(2)}`;
    }

    convert(amount: number, from: string, to: string): number {
        return amount; // Mock conversion 1:1
    }
}

class MockWeatherService {
    getWeatherForDate() {
        return of(null);
    }
    getWeatherEmoji() {
        return '☀️';
    }
}

const makeMockDay = (): ItineraryDay => ({
    dayNumber: 1,
    date: '2026-04-01',
    activities: [
        {
            suggestionId: 101,
            orderInDay: 1,
            suggestion: {
                id: 101,
                name: 'Sushi Restaurant',
                category: SuggestionCategory.RESTAURANT,
                location: 'Tokyo',
                description: 'Best sushi',
                latitude: 35.0,
                longitude: 139.0,
                price: 3000,
                durationHours: 1.5,
                createdById: 1,
                isGlobal: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                country: {
                    id: 1,
                    name: 'Japan',
                    code: 'JPN',
                    currencySymbol: '¥',
                    currencyCode: 'JPY'
                }
            } as any
        }
    ],
    accommodation: null
});

describe('ItineraryDayComponent', () => {
    let component: ItineraryDayComponent;
    let fixture: ComponentFixture<ItineraryDayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItineraryDayComponent],
            providers: [
                { provide: CurrencyService, useClass: MockCurrencyService },
                { provide: WeatherService, useClass: MockWeatherService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ItineraryDayComponent);
        component = fixture.componentInstance;
        component.day = makeMockDay();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display activity name', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.activity-name')?.textContent).toContain('Sushi Restaurant');
    });

    it('should display price with correct currency symbol (¥)', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const priceElement = compiled.querySelector('.price');
        // Our mock returns ¥3000.00
        expect(priceElement?.textContent).toContain('¥3000.00');
    });

    it('should default to JPY/EUR if currency is missing (fallback logic)', () => {
        // Ce test mute la suggestion, mais le `makeMockDay()` dans beforeEach isole cela
        component.day.activities[0].suggestion.country = undefined;
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        // La clé est de ne pas crasher ; le prix doit tout de même s'afficher
        const priceElement = compiled.querySelector('.price');
        expect(priceElement).toBeTruthy();
    });

    it('should calculate dayTotal from activity prices (converted to EUR)', () => {
        // MockCurrencyService.convert is 1:1, so 3000 JPY => 3000 EUR in mock
        expect(component.dayTotal).toBe(3000);
    });

    it('should include accommodation price in dayTotal', () => {
        const base = makeMockDay();
        component.day = {
            ...base,
            activities: [...base.activities],
            accommodation: {
                id: 200,
                name: 'Tokyo Hotel',
                category: SuggestionCategory.HEBERGEMENT,
                price: 500,
                location: 'Tokyo',
                description: 'Nice hotel',
                latitude: 35.0,
                longitude: 139.0,
                durationHours: 0,
                createdById: 1,
                isGlobal: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                country: {
                    id: 1,
                    name: 'Japan',
                    code: 'JPN',
                    currencySymbol: '¥',
                    currencyCode: 'JPY'
                }
            } as any
        };
        fixture.detectChanges();
        // 3000 (activity) + 500 (accommodation) = 3500
        expect(component.dayTotal).toBe(3500);
    });
});
