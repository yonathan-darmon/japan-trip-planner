import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Start your journey by creating a group
          </p>
        </div>
        <form class="mt-8 space-y-6" [formGroup]="signupForm" (ngSubmit)="onSubmit()">
          
          <div class="rounded-md shadow-sm -space-y-px">
            <div class="mb-4">
              <label for="username" class="sr-only">Username</label>
              <input id="username" type="text" formControlName="username" class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Username">
            </div>
            <div class="mb-4">
              <label for="email" class="sr-only">Email address</label>
              <input id="email" type="email" formControlName="email" class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email address">
            </div>
            <div class="mb-4">
              <label for="password" class="sr-only">Password</label>
              <input id="password" type="password" formControlName="password" class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password">
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Destination Country</label>
            <select formControlName="countryId" class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              <option [ngValue]="null">Select a country</option>
              <option *ngFor="let country of countries" [ngValue]="country.id">{{ country.name }}</option>
              <option [ngValue]="'new'">+ Create New Country</option>
            </select>
          </div>

          <div *ngIf="signupForm.get('countryId')?.value === 'new'" class="mb-4">
             <label for="newCountryName" class="sr-only">New Country Name</label>
             <input id="newCountryName" type="text" formControlName="newCountryName" class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Enter Country Name (e.g. France)">
          </div>

          <div>
            <button type="submit" [disabled]="signupForm.invalid || loading" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <!-- Lock Icon -->
                <svg class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
              </span>
              {{ loading ? 'Creating Account...' : 'Sign up' }}
            </button>
          </div>
          
          <div *ngIf="error" class="text-red-500 text-sm text-center mt-2">
            {{ error }}
          </div>

          <div class="text-sm text-center">
            <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class SignupComponent {
    signupForm: FormGroup;
    countries: any[] = [];
    loading = false;
    error = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private http: HttpClient
    ) {
        this.signupForm = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            countryId: [null, Validators.required],
            newCountryName: [''] // Conditional validator could be added
        });

        this.fetchCountries();
    }

    fetchCountries() {
        this.http.get<any[]>(`${environment.apiUrl}/countries`).subscribe({
            next: (data) => this.countries = data,
            error: (err) => console.error('Failed to fetch countries', err)
        });
    }

    onSubmit() {
        if (this.signupForm.invalid) return;

        this.loading = true;
        this.error = '';

        const val = this.signupForm.value;
        const payload = {
            username: val.username,
            email: val.email,
            password: val.password,
            countryId: val.countryId === 'new' ? null : val.countryId,
            newCountryName: val.countryId === 'new' ? val.newCountryName : null
        };

        this.authService.register(payload).subscribe({
            next: () => {
                this.router.navigate(['/']); // Redirect to dashboard
            },
            error: (err) => {
                this.error = err.error?.message || 'Registration failed';
                this.loading = false;
            }
        });
    }
}
