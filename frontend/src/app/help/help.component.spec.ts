import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpComponent } from './help.component';
import { provideRouter } from '@angular/router';

describe('HelpComponent', () => {
    let component: HelpComponent;
    let fixture: ComponentFixture<HelpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HelpComponent],
            providers: [provideRouter([])]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HelpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('devrait être créé', () => {
        expect(component).toBeTruthy();
    });

    it('devrait avoir 8 questions dans la FAQ', () => {
        expect(component.faqItems.length).toBe(8);
    });

    it('toutes les questions FAQ sont fermées par défaut', () => {
        const anyOpen = component.faqItems.some(item => item.open);
        expect(anyOpen).toBe(false);
    });

    it('devrait ouvrir un élément FAQ au clic (toggle open)', () => {
        component.faqItems[0].open = true;
        expect(component.faqItems[0].open).toBe(true);
    });

    it('devrait fermer un élément FAQ déjà ouvert (toggle close)', () => {
        component.faqItems[0].open = true;
        component.faqItems[0].open = !component.faqItems[0].open;
        expect(component.faqItems[0].open).toBe(false);
    });

    it('chaque question FAQ a un texte non vide', () => {
        component.faqItems.forEach(item => {
            expect(item.question.trim().length).toBeGreaterThan(0);
            expect(item.answer.trim().length).toBeGreaterThan(0);
        });
    });
});
