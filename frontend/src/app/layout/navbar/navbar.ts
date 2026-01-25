import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  template: `
    <nav class="glass" style="margin-top: 1rem; margin-bottom: 2rem; padding: 1rem 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <a routerLink="/" class="brand">
          <span style="font-size: 1.5rem; display: block;">🗾</span>
        </a>
        
        <div class="nav-links" *ngIf="isAuthenticated$ | async">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">Accueil</a>
          <a routerLink="/suggestions" routerLinkActive="active" class="nav-link">Suggestions</a>
          
          <ng-container *ngIf="currentUser$ | async as user">
            <a *ngIf="user.role === 'super_admin'" routerLink="/trip-config" routerLinkActive="active" class="nav-link" style="color: var(--color-accent);">
              ⚙️ Config
            </a>
          </ng-container>
        </div>

        <div *ngIf="isAuthenticated$ | async; else loginBtn">
          <button (click)="logout()" class="btn btn-ghost btn-sm">Déconnexion</button>
        </div>
        
        <ng-template #loginBtn>
          <a routerLink="/auth/login" class="btn btn-primary btn-sm">Connexion</a>
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .nav-links {
      display: flex;
      gap: 2rem;
    }
    .nav-link {
      color: var(--color-text-secondary);
      font-weight: 500;
      position: relative;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--color-text-primary);
    }
    .nav-link.active::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 0;
      width: 100%;
      height: 2px;
      background: var(--color-primary);
      border-radius: var(--radius-full);
      box-shadow: var(--shadow-glow);
    }
    .brand {
      transition: transform var(--transition-base);
    }
    .brand:hover {
      transform: scale(1.1) rotate(10deg);
    }
  `]
})
export class NavbarComponent {
  isAuthenticated$;
  currentUser$;

  constructor(private authService: AuthService) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
  }

  logout() {
    this.authService.logout();
  }
}
