import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuggestionFormComponent } from './suggestion-form';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SuggestionsService, SuggestionCategory } from '../../core/services/suggestions';
import { TripConfigService } from '../../core/services/trip-config';
import { GroupsService } from '../../core/services/groups.service';
import { CurrencyService } from '../../core/services/currency.service';
import { of } from 'rxjs';

describe('SuggestionFormComponent', () => {
    let component: SuggestionFormComponent;
    let fixture: ComponentFixture<SuggestionFormComponent>;
    let mockSuggestionsService: any;

    beforeEach(async () => {
        mockSuggestionsService = {
            getOne: jasmine.createSpy('getOne'),
            create: jasmine.createSpy('create'),
            update: jasmine.createSpy('update')
        };

        const mockTripConfigService = {
            getConfig: jasmine.createSpy('getConfig').and.returnValue(of({ group: { name: 'Test Group', country: { name: 'Japan' } } }))
        };

        const mockGroupsService = {
            getGroup: jasmine.createSpy('getGroup').and.returnValue(of({ name: 'Test Group', country: { name: 'Japan', currencySymbol: '¥' } })),
            getMyGroups: jasmine.createSpy('getMyGroups').and.returnValue(of([{ id: 1, name: 'Test Group', country: { name: 'Japan' } }]))
        };

        const mockCurrencyService = {
            convert: jasmine.createSpy('convert').and.callFake((val, from, to) => {
                if (from === 'EUR' && to === 'JPY') return val * 162.5;
                if (from === 'JPY' && to === 'EUR') return val / 162.5;
                return val;
            })
        };

        await TestBed.configureTestingModule({
            imports: [
                SuggestionFormComponent,
                ReactiveFormsModule,
                FormsModule,
                RouterTestingModule,
                HttpClientTestingModule
            ],
            providers: [
                { provide: SuggestionsService, useValue: mockSuggestionsService },
                { provide: TripConfigService, useValue: mockTripConfigService },
                { provide: GroupsService, useValue: mockGroupsService },
                { provide: CurrencyService, useValue: mockCurrencyService }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(SuggestionFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should disable duration and set to 0 when category is HEBERGEMENT', () => {
        const categoryControl = component.suggestionForm.get('category');
        const durationControl = component.suggestionForm.get('durationHours');

        // Initial state (ACTIVITE)
        expect(durationControl?.enabled).toBeTruthy();

        // Change to HEBERGEMENT
        categoryControl?.setValue(SuggestionCategory.HEBERGEMENT);
        fixture.detectChanges();

        expect(durationControl?.value).toBe(0);
        expect(durationControl?.disabled).toBeTruthy();
    });

    it('should re-enable duration when category is changed back', () => {
        const categoryControl = component.suggestionForm.get('category');
        const durationControl = component.suggestionForm.get('durationHours');

        // Change to HEBERGEMENT
        categoryControl?.setValue(SuggestionCategory.HEBERGEMENT);
        fixture.detectChanges();
        expect(durationControl?.disabled).toBeTruthy();

        // Change back to ACTIVITE
        categoryControl?.setValue(SuggestionCategory.ACTIVITE);
        fixture.detectChanges();

        expect(durationControl?.enabled).toBeTruthy();
        expect(durationControl?.value).toBe(2); // Default reset
    });

    it('should correctly load durationHours when loading an existing suggestion', () => {
        const mockSuggestion = {
            id: 1,
            name: 'Temple of Time',
            location: 'Kyoto',
            category: SuggestionCategory.ACTIVITE,
            price: 15,
            description: 'A great place',
            latitude: 35.0,
            longitude: 135.0,
            durationHours: 5.5,
            photoUrl: 'http://example.com/photo.jpg'
        };

        mockSuggestionsService.getOne.and.returnValue(of(mockSuggestion));

        component.loadSuggestion(1);
        fixture.detectChanges();

        expect(component.suggestionForm.get('durationHours')?.value).toBe(5.5);
    });

    it('should convert EUR price to JPY when submitting', () => {
        // Setup context
        component.contextGroup = { country: { currencyCode: 'JPY', currencySymbol: '¥' } };

        // Simulate user input: 20 EUR
        component.currencyMode = 'EUR';
        component.onPriceChange(20);

        // Check form value (should be JPY)
        // 20 * 162.5 = 3250
        expect(component.suggestionForm.get('price')?.value).toBe(3250);
    });

    it('should display hint when converting', () => {
        component.contextGroup = { country: { currencyCode: 'JPY', currencySymbol: '¥' } };

        component.currencyMode = 'EUR';
        component.onPriceChange(20);

        expect(component.convertedHint).toContain('3250 ¥');
    });
    it('should be valid after loading a standard suggestion', () => {
        const mockSuggestion = {
            id: 41,
            name: 'Test Suggestion',
            location: 'Tokyo',
            category: SuggestionCategory.ACTIVITE,
            price: 1000,
            description: 'Desc',
            latitude: 35.0,
            longitude: 139.0,
            durationHours: 2,
            photoUrl: '',
            country: { id: 1, name: 'Japan', currencyCode: 'JPY', currencySymbol: '¥' }
        };

        mockSuggestionsService.getOne.and.returnValue(of(mockSuggestion));
        component.loadSuggestion(41);
        fixture.detectChanges();

        expect(component.suggestionForm.get('price')?.value).toBe(1000);
        expect(component.suggestionForm.valid).toBeTrue();
    });
});
