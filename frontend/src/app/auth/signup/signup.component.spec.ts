import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignupComponent } from './signup.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../core/services/auth';
import { of } from 'rxjs';

describe('SignupComponent', () => {
    let component: SignupComponent;
    let fixture: ComponentFixture<SignupComponent>;
    let authService: AuthService;

    const mockAuthService = {
        register: jasmine.createSpy('register').and.returnValue(of({}))
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SignupComponent, ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule],
            providers: [
                { provide: AuthService, useValue: mockAuthService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SignupComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should validate email format', () => {
        const emailControl = component.signupForm.get('email');

        emailControl?.setValue('invalidemail');
        expect(emailControl?.valid).toBeFalsy();

        emailControl?.setValue('valid@email.com');
        expect(emailControl?.valid).toBeTruthy();
    });

    it('should validate strong password format', () => {
        const passwordControl = component.signupForm.get('password');

        passwordControl?.setValue('weak');
        expect(passwordControl?.valid).toBeFalsy();

        passwordControl?.setValue('NoSpecial123'); // Missing special character
        expect(passwordControl?.valid).toBeFalsy();

        passwordControl?.setValue('StrongPassword1!'); // Valid
        expect(passwordControl?.valid).toBeTruthy();
    });

    it('should submit valid form data', () => {
        component.signupForm.patchValue({
            username: 'test',
            email: 'test@test.com',
            password: 'StrongPassword1!',
            countryId: 1
        });

        component.onSubmit();

        expect(mockAuthService.register).toHaveBeenCalled();
    });
});
