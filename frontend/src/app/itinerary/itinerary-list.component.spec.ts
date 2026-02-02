import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItineraryListComponent } from './itinerary-list.component';
import { ItineraryService } from '../core/services/itinerary';
import { CurrencyService } from '../core/services/currency.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

class MockItineraryService {
    getAll(groupId?: number) { return of([]); }
}

class MockCurrencyService {
    format(amount: number | string, currency: string) { return '¥' + amount; }
}

class MockRouter {
    navigate() { }
}

describe('ItineraryListComponent', () => {
    let component: ItineraryListComponent;
    let fixture: ComponentFixture<ItineraryListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItineraryListComponent],
            providers: [
                { provide: ItineraryService, useClass: MockItineraryService },
                { provide: CurrencyService, useClass: MockCurrencyService },
                { provide: Router, useClass: MockRouter }
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ItineraryListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
