import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersService } from '../../core/services/users';
import { SuggestionsService } from '../../core/services/suggestions';
import { GroupsService } from '../../core/services/groups.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-super-admin',
    standalone: true,
    imports: [CommonModule, RouterLink],
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
            <h3 class="text-xl font-bold">🌍 Pays & Suggestions</h3>
            <span class="text-2xl">⛩️</span>
          </div>
          <p class="text-text-secondary mb-6">Gérez les destinations disponibles et validez les suggestions d'activités.</p>
          <div class="space-y-3">
            <button class="btn btn-secondary full-width" routerLink="/suggestions">Liste des suggestions</button>
            <button class="btn btn-outline full-width" routerLink="/trip-config">Config Pays (Legacy)</button>
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

    constructor(
        private usersService: UsersService,
        private suggestionsService: SuggestionsService,
        private groupsService: GroupsService
    ) { }

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        // Assuming these services have count or list methods
        forkJoin({
            users: this.usersService.getAll(),
            suggestions: this.suggestionsService.getAll(),
            groups: this.groupsService.getMyGroups() // For now, super admin sees their own or we need a proper getAll
        }).subscribe({
            next: (data) => {
                this.userCount = data.users.length;
                this.suggestionCount = data.suggestions.length;
                this.groupCount = data.groups.length; // Placeholder, should be total groups for super admin
            }
        });
    }
}
