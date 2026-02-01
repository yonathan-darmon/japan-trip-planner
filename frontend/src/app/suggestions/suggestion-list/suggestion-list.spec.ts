import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuggestionListComponent } from './suggestion-list';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SuggestionsService } from '../../core/services/suggestions';
import { PreferencesService } from '../../core/services/preferences';
import { AuthService } from '../../core/services/auth';
import { WebSocketService } from '../../core/services/websocket.service';
import { CurrencyService } from '../../core/services/currency.service';
import { of } from 'rxjs';

describe('SuggestionListComponent', () => {
    let component: SuggestionListComponent;
    let fixture: ComponentFixture<SuggestionListComponent>;
    let mockSuggestionsService: any;
    let mockAuthService: any;
    let mockWsService: any;

    beforeEach(async () => {
        mockSuggestionsService = {
            getAll: jasmine.createSpy('getAll').and.returnValue(of([])),
            delete: jasmine.createSpy('delete')
        };

        mockAuthService = {
            currentUser$: of({ id: 1, role: 'user' })
        };

        mockWsService = {
            onSuggestionChange: jasmine.createSpy('onSuggestionChange').and.returnValue(of({ action: 'none' })),
            onVoteChange: jasmine.createSpy('onVoteChange').and.returnValue(of({ suggestionId: 0, data: {} }))
        };

        await TestBed.configureTestingModule({
            imports: [SuggestionListComponent, HttpClientTestingModule, RouterTestingModule],
            providers: [
                { provide: SuggestionsService, useValue: mockSuggestionsService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: WebSocketService, useValue: mockWsService },
                CurrencyService
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(SuggestionListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should convert price correctly', () => {
        const suggestion: any = {
            price: 3250,
            country: { currencyCode: 'JPY' }
        };
        // 3250 JPY / 162.5 = 20 EUR
        const converted = component.getConvertedPrice(suggestion);
        expect(converted).toContain('20.00 €');
    });

    it('should return null if currency is EUR', () => {
        const suggestion: any = {
            price: 20,
            country: { currencyCode: 'EUR' }
        };
        const converted = component.getConvertedPrice(suggestion);
        expect(converted).toBeNull();
    });
});
