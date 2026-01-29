import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersService } from '../../core/services/users';
import { SuggestionsService } from '../../core/services/suggestions';
import { GroupsService } from '../../core/services/groups.service';
import { CountriesService, Country } from '../../core/services/countries.service';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="dashboard-header fade-in">
      <h1>🛠️ Portail Super Admin</h1>
      <p>Gestion globale de la plateforme Japan Trip Planner.</p>
    </div>

    <div class="grid-stats fade-in" style="animation-delay: 100ms;">
      <div class="card glass stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value">{{ userCount }}</div>
        <div class="stat-label">Utilisateurs</div>
      </div>
      <div class="card glass stat-card">
        <div class="stat-icon">🏘️</div>
        <div class="stat-value">{{ groupCount }}</div>
        <div class="stat-label">Groupes</div>
      </div>
      <div class="card glass stat-card">
        <div class="stat-icon">⛩️</div>
        <div class="stat-value">{{ suggestionCount }}</div>
        <div class="stat-label">Suggestions</div>
      </div>
      <div class="card glass stat-card">
        <div class="stat-icon">🌍</div>
        <div class="stat-value">{{ countries.length }}</div>
        <div class="stat-label">Pays</div>
      </div>
    </div>

    <div class="admin-grid fade-in" style="animation-delay: 200ms;">
      <!-- USER MANAGEMENT -->
      <div class="card glass">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold">👤 Utilisateurs</h3>
            <span class="text-2xl">👥</span>
          </div>
          <p class="text-text-secondary mb-6">Gérez les comptes utilisateurs, les rôles et forcez les déconnexions si nécessaire.</p>
          <div class="space-y-3">
            <button class="btn btn-primary full-width" routerLink="/users">Voir tous les utilisateurs</button>
            <button class="btn btn-outline full-width" routerLink="/users/new">Créer un utilisateur</button>
          </div>
        </div>
      </div>

      <!-- COUNTRY & SUGGESTION MANAGEMENT -->
      <div class="card glass">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold">🌍 Destinations (Pays)</h3>
            <span class="text-2xl">⛩️</span>
          </div>
          
          <div class="countries-manager mb-6">
            <div class="countries-list max-h-40 overflow-y-auto mb-4 space-y-2 pr-2">
                <div *ngFor="let country of countries" class="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span>{{ country.name }} ({{ country.code }})</span>
                    <span class="text-xs opacity-50">ID: {{ country.id }}</span>
                </div>
            </div>

            <div class="country-form glass p-3 rounded-lg">
                <p class="text-xs font-bold mb-2 uppercase opacity-70">Nouveau Pays</p>
                <div class="flex gap-2">
                    <input type="text" [(ngModel)]="newCountry.name" placeholder="Nom (ex: Japon)" class="form-input-sm flex-1">
                    <input type="text" [(ngModel)]="newCountry.code" placeholder="Code (ex: JP)" class="form-input-sm w-20">
                    <button (click)="createCountry()" [disabled]="!newCountry.name || !newCountry.code || loadingCountry" class="btn btn-primary btn-sm">
                        {{ loadingCountry ? '...' : 'Ajouter' }}
                    </button>
                </div>
            </div>
          </div>

          <div class="space-y-3">
            <button class="btn btn-secondary full-width" routerLink="/suggestions">Gérer les suggestions</button>
          </div>
        </div>
      </div>

      <!-- SYSTEM LOGS & CONFIG -->
      <div class="card glass">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold">📊 Rapports & Logs</h3>
            <span class="text-2xl">📈</span>
          </div>
          <p class="text-text-secondary mb-6">Consultez l'activité récente et les statistiques de performance de l'application.</p>
          <div class="space-y-3">
              <div class="p-3 bg-white/5 rounded-md text-sm italic text-center">Bientôt disponible</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    .admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }
    .stat-card {
      text-align: center;
      padding: 1.5rem;
    }
    .stat-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--color-primary);
    }
    .stat-label {
      color: var(--color-text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 0.8rem;
    }
    .form-input-sm {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 0.5rem;
        color: white;
        font-size: 0.875rem;
    }
    .form-input-sm:focus {
        outline: none;
        border-color: var(--color-primary);
        background: rgba(255, 255, 255, 0.1);
    }
    .full-width { width: 100%; }
    .fade-in {
      animation: fadeIn 0.8s ease-out forwards;
      opacity: 0;
      transform: translateY(20px);
    }
    @keyframes fadeIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class SuperAdminComponent implements OnInit {
  userCount = 0;
  groupCount = 0;
  suggestionCount = 0;
  countries: Country[] = [];
  newCountry = { name: '', code: '' };
  loadingCountry = false;

  constructor(
    private usersService: UsersService,
    private suggestionsService: SuggestionsService,
    private groupsService: GroupsService,
    private countriesService: CountriesService
  ) { }

  ngOnInit() {
    this.loadStats();
    this.loadCountries();
  }

  loadStats() {
    forkJoin({
      users: this.usersService.getAll(),
      suggestions: this.suggestionsService.getAll(),
      groups: this.groupsService.getAllGroups() // Expecting an getAllGroups in GroupsService
    }).subscribe({
      next: (data) => {
        this.userCount = data.users.length;
        this.suggestionCount = data.suggestions.length;
        this.groupCount = data.groups.length;
      }
    });
  }

  loadCountries() {
    this.countriesService.findAll().subscribe(data => {
      this.countries = data;
    });
  }

  createCountry() {
    if (!this.newCountry.name || !this.newCountry.code) return;
    this.loadingCountry = true;
    this.countriesService.create(this.newCountry).subscribe({
      next: () => {
        this.newCountry = { name: '', code: '' };
        this.loadingCountry = false;
        this.loadCountries();
      },
      error: (err) => {
        console.error('Failed to create country', err);
        this.loadingCountry = false;
        alert('Erreur lors de la création du pays');
      }
    });
  }
}
