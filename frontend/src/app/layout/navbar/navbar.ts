import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  template: `
    <nav class="navbar glass">
      <div class="navbar-container">
        <a routerLink="/" class="brand">
          <span class="brand-icon">🗾</span>
        </a>
        
        <button 
          class="hamburger" 
          (click)="toggleMenu()" 
          [class.active]="menuOpen"
          *ngIf="isAuthenticated$ | async"
          aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div class="nav-links" [class.open]="menuOpen" *ngIf="isAuthenticated$ | async">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Accueil</a>
          <a routerLink="/suggestions" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Suggestions</a>
          <a routerLink="/itineraries" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Itinéraires</a>
          <a routerLink="/help" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Guide</a>
          
          <ng-container *ngIf="currentUser$ | async as user">
            <a *ngIf="user.role === 'super_admin'" 
               routerLink="/trip-config" 
               routerLinkActive="active" 
               class="nav-link admin-link" 
               (click)="closeMenu()">
              ⚙️ Config
            </a>
          </ng-container>
          
          <button (click)="logout()" class="btn btn-ghost btn-sm logout-btn-mobile">Déconnexion</button>
        </div>

        <div class="auth-actions">
          <div *ngIf="isAuthenticated$ | async; else loginBtn">
            <button (click)="logout()" class="btn btn-ghost btn-sm logout-btn-desktop">Déconnexion</button>
          </div>
          
          <ng-template #loginBtn>
            <a routerLink="/auth/login" class="btn btn-primary btn-sm">Connexion</a>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      margin-top: 1rem;
      margin-bottom: 2rem;
      padding: 1rem 2rem;
      position: relative;
      z-index: 100;
    }
    
    .navbar-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
    }
    
    .brand {
      transition: transform var(--transition-base);
      z-index: 1001;
    }
    
    .brand-icon {
      font-size: 1.5rem;
      display: block;
    }
    
    .brand:hover {
      transform: scale(1.1) rotate(10deg);
    }
    
    .nav-links {
      display: flex;
      gap: 2rem;
      align-items: center;
    }
    
    .nav-link {
      color: var(--color-text-secondary);
      font-weight: 500;
      position: relative;
      white-space: nowrap;
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
    
    .admin-link {
      color: var(--color-accent);
    }
    
    .hamburger {
      display: none;
      flex-direction: column;
      gap: 4px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      z-index: 1001;
    }
    
    .hamburger span {
      width: 24px;
      height: 2px;
      background: var(--color-text-primary);
      transition: all 0.3s ease;
      border-radius: 2px;
    }
    
    .hamburger.active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    .hamburger.active span:nth-child(2) {
      opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }
    
    .logout-btn-mobile {
      display: none;
    }
    
    .logout-btn-desktop {
      display: inline-block;
    }
    
    .auth-actions {
      z-index: 1001;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      .navbar {
        padding: 0.75rem 1rem;
      }
      
      .hamburger {
        display: flex;
      }
      
      .nav-links {
        position: fixed;
        top: 0;
        right: -100%;
        height: 100vh;
        width: 70%;
        max-width: 300px;
        background: var(--color-bg-secondary);
        flex-direction: column;
        gap: 0;
        padding: 5rem 2rem 2rem;
        transition: right 0.3s ease;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        align-items: flex-start;
      }
      
      .nav-links.open {
        right: 0;
      }
      
      .nav-link {
        width: 100%;
        padding: 1rem 0;
        border-bottom: 1px solid var(--color-border);
      }
      
      .nav-link.active::after {
        bottom: 0;
        left: 0;
        width: 3px;
        height: 100%;
      }
      
      .logout-btn-mobile {
        display: block;
        width: 100%;
        margin-top: 1rem;
      }
      
      .logout-btn-desktop {
        display: none;
      }
      
      .auth-actions {
        display: none;
      }
    }
    
    @media (max-width: 480px) {
      .nav-links {
        width: 80%;
      }
    }
  `]
})
export class NavbarComponent {
  isAuthenticated$;
  currentUser$;
  menuOpen = false;

  constructor(private authService: AuthService) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
  }
}
