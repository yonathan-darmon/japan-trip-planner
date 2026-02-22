import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BudgetChartComponent, BudgetData } from './budget-chart.component';
import { PLATFORM_ID } from '@angular/core';

describe('BudgetChartComponent', () => {
    let component: BudgetChartComponent;
    let fixture: ComponentFixture<BudgetChartComponent>;

    const mockBudgetData: BudgetData = {
        dailyTotals: [
            { dayNumber: 1, date: new Date('2026-04-01'), totalEur: 120 },
            { dayNumber: 2, date: new Date('2026-04-02'), totalEur: 80 },
        ],
        totalEur: 200,
        currencySymbol: '€'
    };

    const emptyBudgetData: BudgetData = {
        dailyTotals: [],
        totalEur: 0,
        currencySymbol: '€'
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BudgetChartComponent],
            providers: [
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BudgetChartComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not render budget container when budgetData is null', () => {
        component.budgetData = null;
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.budget-container')).toBeNull();
    });

    it('should display the total budget amount when data is provided', () => {
        component.budgetData = mockBudgetData;
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        const amountEl = compiled.querySelector('.total-budget .amount');
        expect(amountEl?.textContent).toContain('200');
        expect(amountEl?.textContent).toContain('€');
    });

    it('should show empty state when totalEur is 0', () => {
        component.budgetData = emptyBudgetData;
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.empty-state')).toBeTruthy();
    });

    it('should not show empty state when totalEur > 0', () => {
        component.budgetData = mockBudgetData;
        fixture.detectChanges();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.empty-state')).toBeNull();
    });

    it('should destroy chart on ngOnDestroy', () => {
        component.budgetData = mockBudgetData;
        fixture.detectChanges();
        // Ensure no error is thrown on destroy
        expect(() => component.ngOnDestroy()).not.toThrow();
    });
});
