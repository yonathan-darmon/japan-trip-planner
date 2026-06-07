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

    describe('day/evening load gauges', () => {
        // Helper: activities at the same location (no travel time), explicit durations
        const makeDayWithDurations = (durations: number[]): ItineraryDay => ({
            dayNumber: 1,
            date: '2026-04-01',
            accommodation: null,
            activities: durations.map((durationHours, i) => ({
                suggestionId: 200 + i,
                orderInDay: i + 1,
                suggestion: {
                    id: 200 + i,
                    name: `Activity ${i}`,
                    category: SuggestionCategory.ACTIVITE,
                    latitude: 35.0,
                    longitude: 139.0,
                    durationHours,
                    price: 0
                } as any
            }))
        });

        it('should report 0% on both gauges for an empty day', () => {
            component.day = makeDayWithDurations([]);
            expect(component.dayLoadPercent).toBe(0);
            expect(component.eveningLoadPercent).toBe(0);
        });

        it('should fill only the day gauge when activities fit before 17h', () => {
            // 2h starting at 7:00 → occupies 7:00-9:00 → 2/10 = 20% day, 0% evening
            component.day = makeDayWithDurations([2]);
            expect(component.dayLoadPercent).toBe(20);
            expect(component.eveningLoadPercent).toBe(0);
        });

        it('should overflow into the evening gauge past 18h', () => {
            // 12h starting at 7:00 → occupies 7:00-19:00
            // Day window 7-17 → 10h/10h = 100%; evening window 18-23 → 1h/5h = 20%
            component.day = makeDayWithDurations([12]);
            expect(component.dayLoadPercent).toBe(100);
            expect(component.eveningLoadPercent).toBe(20);
        });

        it('should start the next activity at 18h when the previous ends between 17h and 18h', () => {
            // 10.5h → ends 17:30 (day: 10h = 100%), next 2h pushed to 18:00-20:00 → 2/5 = 40%
            component.day = makeDayWithDurations([10.5, 2]);
            expect(component.dayLoadPercent).toBe(100);
            expect(component.eveningLoadPercent).toBe(40);
        });

        it('should report evening overload beyond 23h', () => {
            // 18h from 7:00 → ends 25:00 → evening occupied 18h→25h = 7h / 5h = 140%
            component.day = makeDayWithDurations([18]);
            expect(component.eveningLoadPercent).toBeGreaterThan(100);
        });
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
