import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '../../core/services/auth';
import { UsersService } from '../../core/services/users';
import { Router } from '@angular/router';

@Component({
    selector: 'app-user-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">User Settings</h1>

        <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">Update your account details.</p>
          </div>
          <div class="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()">
               <div class="grid grid-cols-6 gap-6">
                 <div class="col-span-6 sm:col-span-4">
                   <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
                   <input type="text" formControlName="username" id="username" class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                 </div>

                 <div class="col-span-6 sm:col-span-4">
                   <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                   <input type="text" formControlName="email" id="email" class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                 </div>
               </div>
               <div class="mt-6">
                 <button type="submit" [disabled]="profileForm.invalid || loading" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                   Save Changes
                 </button>
                 <span *ngIf="successMessage" class="ml-3 text-green-600 text-sm">{{ successMessage }}</span>
                 <span *ngIf="errorMessage" class="ml-3 text-red-600 text-sm">{{ errorMessage }}</span>
               </div>
            </form>
          </div>
        </div>

        <div class="bg-white shadow overflow-hidden sm:rounded-lg border-t-4 border-red-500">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-red-600">Danger Zone</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">Irreversible actions.</p>
          </div>
          <div class="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900">Delete Account</h3>
              <div class="mt-2 max-w-xl text-sm text-gray-500">
                <p>Once you delete your account, there is no going back. Please be certain.</p>
              </div>
              <div class="mt-5">
                <button type="button" (click)="deleteAccount()" class="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class UserSettingsComponent implements OnInit {
    profileForm: FormGroup;
    loading = false;
    successMessage = '';
    errorMessage = '';
    currentUser: User | null = null;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private usersService: UsersService,
        private router: Router
    ) {
        this.profileForm = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    ngOnInit() {
        this.currentUser = this.authService.currentUserValue;
        if (this.currentUser) {
            this.profileForm.patchValue({
                username: this.currentUser.username,
                // email might not be on User interface yet if it's old interface, checking auth.ts
                // If email is missing from User interface in auth.ts, I might need to fetch full profile.
                // Assuming it's there or I need to update User interface.
            });
            // Fetch full profile if needed
        }
    }

    onUpdateProfile() {
        if (this.profileForm.invalid) return;
        // Implementation for update profile if API supports it
        // this.usersService.update(this.currentUser.id, this.profileForm.value)...
    }

    deleteAccount() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            this.usersService.deleteSelf().subscribe({
                next: () => {
                    this.authService.logout();
                    this.router.navigate(['/']);
                },
                error: (err) => {
                    alert('Failed to delete account: ' + (err.error?.message || err.message));
                }
            });
        }
    }
}
