import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ItineraryHeaderComponent } from './itinerary-header.component';
import { CurrencyService } from '../../../core/services/currency.service';

class MockCurrencyService {
    format(amount: number | string, currency: string): string {
        return `¥${Number(amount).toFixed(2)}`;
    }
}

describe('ItineraryHeaderComponent', () => {
    let component: ItineraryHeaderComponent;
    let fixture: ComponentFixture<ItineraryHeaderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CommonModule, ItineraryHeaderComponent],
            providers: [
                { provide: CurrencyService, useClass: MockCurrencyService }
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ItineraryHeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
