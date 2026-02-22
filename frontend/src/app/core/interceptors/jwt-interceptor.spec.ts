import { TestBed } from '@angular/core/testing';
import {
    HttpClient,
    HttpErrorResponse,
    provideHttpClient,
    withInterceptors,
} from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { jwtInterceptor } from './jwt-interceptor';
import { AuthService } from '../services/auth';

describe('jwtInterceptor', () => {
    let httpClient: HttpClient;
    let httpMock: HttpTestingController;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([jwtInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });

        httpClient = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('devrait ajouter le header Authorization si un token est présent', () => {
        authServiceSpy.getToken.and.returnValue('mon-token-jwt');

        httpClient.get('/api/test').subscribe();

        const req = httpMock.expectOne('/api/test');
        expect(req.request.headers.get('Authorization')).toBe('Bearer mon-token-jwt');
        req.flush({});
    });

    it("ne devrait PAS ajouter le header Authorization s'il n'y a pas de token", () => {
        authServiceSpy.getToken.and.returnValue(null);

        httpClient.get('/api/test').subscribe({ error: () => { } });

        const req = httpMock.expectOne('/api/test');
        expect(req.request.headers.has('Authorization')).toBeFalse();
        req.flush({});
    });

    it('devrait appeler logout() si une erreur 401 est reçue et qu\'un token existe', () => {
        authServiceSpy.getToken.and.returnValue('token-expiré');

        httpClient.get('/api/données-protégées').subscribe({ error: () => { } });

        const req = httpMock.expectOne('/api/données-protégées');
        req.flush('Non autorisé', { status: 401, statusText: 'Unauthorized' });

        expect(authServiceSpy.logout).toHaveBeenCalledTimes(1);
    });

    it("ne devrait PAS appeler logout() sur une erreur 401 sans token (ex: mauvais mot de passe)", () => {
        authServiceSpy.getToken.and.returnValue(null);

        httpClient.post('/api/auth/login', {}).subscribe({ error: () => { } });

        const req = httpMock.expectOne('/api/auth/login');
        req.flush('Identifiants invalides', { status: 401, statusText: 'Unauthorized' });

        expect(authServiceSpy.logout).not.toHaveBeenCalled();
    });

    it("ne devrait PAS appeler logout() pour une erreur 403 (token valide mais accès refusé)", () => {
        authServiceSpy.getToken.and.returnValue('token-valide');

        httpClient.get('/api/admin').subscribe({ error: () => { } });

        const req = httpMock.expectOne('/api/admin');
        req.flush('Accès refusé', { status: 403, statusText: 'Forbidden' });

        expect(authServiceSpy.logout).not.toHaveBeenCalled();
    });

    it('devrait propager les erreurs pour que les composants puissent les gérer', () => {
        authServiceSpy.getToken.and.returnValue('mon-token-jwt');
        let capturedError: HttpErrorResponse | undefined;

        httpClient.get('/api/serveur-en-panne').subscribe({
            error: (err: HttpErrorResponse) => { capturedError = err; }
        });

        const req = httpMock.expectOne('/api/serveur-en-panne');
        req.flush('Erreur interne', { status: 500, statusText: 'Internal Server Error' });

        expect(capturedError).toBeDefined();
        expect(capturedError!.status).toBe(500);
    });
});
