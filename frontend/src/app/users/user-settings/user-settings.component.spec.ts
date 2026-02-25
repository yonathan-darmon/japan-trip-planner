import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserSettingsComponent } from './user-settings.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { UsersService } from '../../core/services/users';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('UserSettingsComponent', () => {
    let component: UserSettingsComponent;
    let fixture: ComponentFixture<UserSettingsComponent>;

    const mockAuthService = {
        currentUserValue: { id: 1, username: 'testuser', email: 'test@test.com' },
        updateUser: jasmine.createSpy('updateUser'),
        logout: jasmine.createSpy('logout')
    };

    const mockUsersService = {
        updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of({})),
        updatePassword: jasmine.createSpy('updatePassword').and.returnValue(of({})),
        uploadAvatar: jasmine.createSpy('uploadAvatar').and.returnValue(of({})),
        deleteSelf: jasmine.createSpy('deleteSelf').and.returnValue(of({}))
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserSettingsComponent, ReactiveFormsModule, RouterTestingModule],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: UsersService, useValue: mockUsersService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UserSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize profile form with current user data', () => {
        expect(component.profileForm.value).toEqual({
            username: 'testuser',
            email: 'test@test.com'
        });
    });

    describe('Password Form', () => {
        it('should initialize password form empty', () => {
            expect(component.passwordForm.value).toEqual({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        });

        it('should validate matching passwords', () => {
            component.passwordForm.patchValue({
                oldPassword: 'old',
                newPassword: 'StrongPassword1!',
                confirmPassword: 'StrongPassword1!'
            });
            expect(component.passwordForm.hasError('passwordMismatch')).toBeFalsy();
            expect(component.passwordForm.valid).toBeTruthy();
        });

        it('should invalidate non-matching passwords', () => {
            component.passwordForm.patchValue({
                oldPassword: 'old',
                newPassword: 'StrongPassword1!',
                confirmPassword: 'DifferentPassword1!'
            });
            expect(component.passwordForm.hasError('passwordMismatch')).toBeTruthy();
            expect(component.passwordForm.valid).toBeFalsy();
        });

        it('should call updatePassword on submit if valid', () => {
            component.passwordForm.patchValue({
                oldPassword: 'old',
                newPassword: 'StrongPassword1!',
                confirmPassword: 'StrongPassword1!'
            });
            component.onUpdatePassword();
            expect(mockUsersService.updatePassword).toHaveBeenCalledWith({
                oldPassword: 'old',
                newPassword: 'StrongPassword1!'
            });
        });
    });
});
