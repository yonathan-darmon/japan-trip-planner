import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar';
import { AuthService } from '../../core/services/auth';
import { provideRouter } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';

class MockAuthService {
    isAuthenticated$ = of(true);
    currentUser$ = new BehaviorSubject<any>({ username: 'testuser', role: 'user', avatarUrl: null });
    logout() { }
}

describe('NavbarComponent', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NavbarComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useClass: MockAuthService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NavbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('devrait être créé', () => {
        expect(component).toBeTruthy();
    });

    it('menuOpen est false par défaut', () => {
        expect(component.menuOpen).toBe(false);
    });

    it('toggleMenu() devrait ouvrir le menu', () => {
        component.toggleMenu();
        expect(component.menuOpen).toBe(true);
    });

    it('toggleMenu() deux fois devrait refermer le menu', () => {
        component.toggleMenu();
        component.toggleMenu();
        expect(component.menuOpen).toBe(false);
    });

    it('closeMenu() devrait toujours fermer le menu', () => {
        component.menuOpen = true;
        component.closeMenu();
        expect(component.menuOpen).toBe(false);
    });
});
