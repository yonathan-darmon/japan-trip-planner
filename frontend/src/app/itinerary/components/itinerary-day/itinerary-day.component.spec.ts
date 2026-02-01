import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItineraryDayComponent } from './itinerary-day.component';
import { ItineraryDay } from '../../../core/services/itinerary';
import { SuggestionCategory } from '../../../core/services/suggestions';

describe('ItineraryDayComponent', () => {
    let component: ItineraryDayComponent;
    let fixture: ComponentFixture<ItineraryDayComponent>;

    const mockDay: ItineraryDay = {
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
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItineraryDayComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ItineraryDayComponent);
        component = fixture.componentInstance;
        component.day = mockDay;
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
        expect(priceElement?.textContent).toContain('3000 ¥');
    });

    it('should default to € if currency is missing', () => {
        // Modify mock for this test
        component.day.activities[0].suggestion.country = undefined;
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        const priceElement = compiled.querySelector('.price');
        expect(priceElement?.textContent).toContain('€');
    });
});
