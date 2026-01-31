import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuggestionFormComponent } from './suggestion-form';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { SuggestionsService, SuggestionCategory } from '../../core/services/suggestions';
import { of } from 'rxjs';

describe('SuggestionFormComponent', () => {
    let component: SuggestionFormComponent;
    let fixture: ComponentFixture<SuggestionFormComponent>;
    let mockSuggestionsService: any;

    beforeEach(async () => {
        mockSuggestionsService = {
            getOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        };

        await TestBed.configureTestingModule({
            imports: [
                SuggestionFormComponent,
                ReactiveFormsModule,
                RouterTestingModule
            ],
            providers: [
                { provide: SuggestionsService, useValue: mockSuggestionsService }
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

        mockSuggestionsService.getOne.mockReturnValue(of(mockSuggestion));

        component.loadSuggestion(1);
        fixture.detectChanges();

        expect(component.suggestionForm.get('durationHours')?.value).toBe(5.5);
    });
});
