import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';
import { AuthService } from '../core/services/auth';
import { TripConfigService } from '../core/services/trip-config';
import { SuggestionsService } from '../core/services/suggestions';
import { UsersService } from '../core/services/users';
import { ItineraryService } from '../core/services/itinerary';
import { GroupsService } from '../core/services/groups.service';
import { ChangelogService } from '../core/services/changelog.service';
import { Router, provideRouter } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';

class MockAuthService {
    currentUser$ = new BehaviorSubject<any>({ username: 'testuser', lastViewedChangelogAt: null });
    isAuthenticated$ = of(true);
    updateUser(u: any) { }
}

class MockGroupsService {
    getMyGroups() { return of([]); }
}

class MockTripConfigService {
    getConfig(groupId: number) { return of({ durationDays: 21, startDate: null }); }
    updateConfig(groupId: number, data: any) { return of({ durationDays: data.durationDays, startDate: null }); }
}

class MockSuggestionsService {
    getAll(params: any) { return of([]); }
}

class MockUsersService {
    markChangelogRead() { return of({ username: 'testuser', lastViewedChangelogAt: new Date().toISOString() }); }
}

class MockItineraryService {
    getAll(groupId: number) { return of([]); }
    generate(params: any) { return of({ id: 1 }); }
    delete(id: number) { return of(void 0); }
}

class MockChangelogService {
    getLatest() { return of([]); }
}

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DashboardComponent],
            providers: [
                provideRouter([]),
                { provide: AuthService, useClass: MockAuthService },
                { provide: GroupsService, useClass: MockGroupsService },
                { provide: TripConfigService, useClass: MockTripConfigService },
                { provide: SuggestionsService, useClass: MockSuggestionsService },
                { provide: UsersService, useClass: MockUsersService },
                { provide: ItineraryService, useClass: MockItineraryService },
                { provide: ChangelogService, useClass: MockChangelogService },
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('devrait être créé', () => {
        expect(component).toBeTruthy();
    });

    it('devrait afficher groupCount à 0 par défaut (aucun groupe)', () => {
        expect(component.groupCount).toBe(0);
    });

    it('devrait afficher dataLoaded = true après chargement', () => {
        expect(component.dataLoaded).toBe(true);
    });

    it('devrait retourner "Konnichiwa" pour le code pays JP', () => {
        expect(component.getGreeting('JP')).toBe('Konnichiwa');
    });

    it('devrait retourner "Bonjour" pour le code pays FR', () => {
        expect(component.getGreeting('FR')).toBe('Bonjour');
    });

    it('devrait retourner "Bonjour" pour un code pays inconnu', () => {
        expect(component.getGreeting('ZZ')).toBe('Bonjour');
    });

    it('devrait retourner "Bonjour" si aucun code pays', () => {
        expect(component.getGreeting()).toBe('Bonjour');
    });

    it('ne devrait pas afficher le changelog si aucun changelog disponible', () => {
        expect(component.showChangelog).toBe(false);
    });
});
