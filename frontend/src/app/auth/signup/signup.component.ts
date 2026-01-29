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
    <div class="signup-container">
      <div class="card glass signup-card">
        <div class="signup-header">
          <h1>✨ Rejoignez l'aventure</h1>
          <p>Créez votre compte et votre groupe de voyage</p>
        </div>

        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="username">Nom d'utilisateur</label>
            <input id="username" type="text" formControlName="username" class="form-input" placeholder="Choisissez un pseudo">
          </div>

          <div class="form-group">
            <label class="form-label" for="email">E-mail</label>
            <input id="email" type="email" formControlName="email" class="form-input" placeholder="votre@email.com">
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Mot de passe</label>
            <input id="password" type="password" formControlName="password" class="form-input" placeholder="6 caractères minimum">
          </div>

          <div class="form-group">
            <label class="form-label" for="countryId">Destination</label>
            <select formControlName="countryId" id="countryId" class="form-input select-field">
              <option [ngValue]="null" disabled>Sélectionnez un pays</option>
              <option *ngFor="let country of countries" [ngValue]="country.id">{{ country.name }}</option>
              <option [ngValue]="'new'">+ Ajouter une autre destination</option>
            </select>
          </div>

          <div *ngIf="signupForm.get('countryId')?.value === 'new'" class="form-group fade-in">
             <label class="form-label" for="newCountryName">Nom du pays</label>
             <input id="newCountryName" type="text" formControlName="newCountryName" class="form-input" placeholder="Ex: France, Italie...">
          </div>

          <div class="error-alert" *ngIf="error">
            {{ error }}
          </div>

          <button type="submit" [disabled]="signupForm.invalid || loading" class="btn btn-primary btn-lg full-width">
            <span *ngIf="!loading">Créer mon compte</span>
            <span *ngIf="loading">Création en cours...</span>
          </button>
          
          <div class="signup-footer">
            <p>Vous avez déjà un compte ? <a routerLink="/auth/login" class="link">Se connecter</a></p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .signup-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    .signup-card {
      width: 100%;
      max-width: 500px;
      padding: 3rem 2.5rem;
    }
    .signup-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .signup-header h1 {
      font-size: 2.2rem;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .signup-header p {
        color: var(--color-text-secondary);
        font-size: 0.95rem;
    }
    .full-width {
      width: 100%;
      margin-top: 1.5rem;
    }
    .select-field {
        cursor: pointer;
        appearance: none;
        background-color: rgba(255, 255, 255, 0.05); /* Matching other inputs */
    }
    .select-field option {
        background: #1a1a1a;
        color: white;
    }
    .fade-in {
        animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .signup-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.85rem;
      opacity: 0.8;
      border-top: 1px solid var(--color-glass-border);
      padding-top: 1.5rem;
    }
    .link {
        color: var(--color-primary);
        font-weight: 500;
        text-decoration: none;
    }
    .link:hover {
        text-decoration: underline;
    }
    .error-alert {
      background: rgba(255, 107, 107, 0.1);
      border: 1px solid var(--color-error);
      color: var(--color-error);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      text-align: center;
    }
  `]
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
      newCountryName: ['']
    });

    this.fetchCountries();
  }

  fetchCountries() {
    this.http.get<any[]>(`${environment.apiUrl}/countries`).subscribe({
      next: (data) => this.countries = data,
      error: (err) => {
        console.error('Failed to fetch countries', err);
        this.error = 'Impossible de charger la liste des pays. Veuillez réessayer.';
      }
    });
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

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
        this.router.navigate(['/groups']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la création du compte';
        this.loading = false;
      }
    });
  }
}
