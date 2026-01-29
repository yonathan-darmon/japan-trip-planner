import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router, RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterModule],
  template: `
    <div class="login-container">
      <div class="card glass login-card">
        <div class="login-header">
          <h1>🗾 Japan Trip</h1>
          <p>Connectez-vous pour planifier votre voyage</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="username">Nom d'utilisateur</label>
            <input 
              id="username" 
              type="text" 
              class="form-input" 
              formControlName="username"
              placeholder="Nom d'utilisateur"
            >
            <div class="error-msg" *ngIf="loginForm.get('username')?.touched && loginForm.get('username')?.invalid">
              Nom d'utilisateur requis
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Mot de passe</label>
            <input 
              id="password" 
              type="password" 
              class="form-input" 
              formControlName="password"
              placeholder="Votre mot de passe"
            >
            <div class="error-msg" *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid">
              Mot de passe requis (6 caractères min)
            </div>
          </div>

          <div class="error-alert" *ngIf="error">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg full-width" [disabled]="loginForm.invalid || isLoading">
            <span *ngIf="!isLoading">Se connecter</span>
            <span *ngIf="isLoading">Connexion...</span>
          </button>
          
          <div class="login-footer">
            <p>Pas encore de compte ? <a routerLink="/auth/signup" class="text-indigo-600 hover:text-indigo-500 font-medium">Créer un compte</a></p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .login-card {
      width: 100%;
      max-width: 450px;
      padding: 3rem 2.5rem;
    }
    .login-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .login-header h1 {
      font-size: 2.5rem;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .full-width {
      width: 100%;
      margin-top: 1rem;
    }
    .error-msg {
      color: var(--color-error);
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }
    .error-alert {
      background: rgba(255, 107, 107, 0.1);
      border: 1px solid var(--color-error);
      color: var(--color-error);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    .login-footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.8rem;
      opacity: 0.7;
      border-top: 1px solid var(--color-glass-border);
      padding-top: 1rem;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/groups']);
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.error?.message || 'Erreur de connexion';
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
