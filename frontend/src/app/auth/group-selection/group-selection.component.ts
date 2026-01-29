import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService, User } from '../../core/services/auth';

interface Group {
    id: number;
    name: string;
    role: string;
    country?: { name: string; code: string };
}

@Component({
    selector: 'app-group-selection',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="selection-container fade-in">
      <div class="selection-header">
        <h1>✈️ Choisissez votre Voyage</h1>
        <p>Sélectionnez un groupe pour commencer la planification ou <a routerLink="/signup" class="create-link">créez-en un nouveau</a></p>
      </div>

      <div class="max-w-md mx-auto mt-8 px-4">
        <div class="card glass">
            <div *ngIf="loading" class="flex flex-col items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p class="mt-4 text-text-secondary">Chargement de vos voyages...</p>
            </div>
            
            <div *ngIf="!loading && groups.length === 0" class="text-center py-8">
                <div class="empty-state-icon">🏜️</div>
                <p class="text-text-secondary mb-6">Vous ne faites partie d'aucun groupe de voyage pour le moment.</p>
                <button routerLink="/signup" class="btn btn-primary w-full">
                    Créer mon premier voyage
                </button>
            </div>

            <div *ngIf="!loading && groups.length > 0" class="groups-list">
                <div *ngFor="let group of groups" (click)="selectGroup(group)" class="group-item glass hover:bg-white/10">
                    <div class="group-icon">
                        {{ group.country?.name === 'Japan' ? '🗾' : '🌍' }}
                    </div>
                    <div class="group-info">
                        <h3 class="group-name">{{ group.name }}</h3>
                        <div class="group-meta">
                            <span class="meta-item" *ngIf="group.country">📍 {{ group.country.name }}</span>
                            <span class="meta-item">👥 {{ group.role === 'admin' ? 'Administrateur' : 'Membre' }}</span>
                        </div>
                    </div>
                    <div class="group-arrow">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    `,
    styles: [`
        .selection-container {
            min-height: calc(100vh - 100px);
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 4rem 1rem;
        }
        .selection-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .selection-header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .create-link {
            color: var(--color-primary);
            font-weight: 600;
            text-decoration: underline;
        }
        .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .groups-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .group-item {
            display: flex;
            align-items: center;
            padding: 1.25rem;
            cursor: pointer;
            transition: all var(--transition-base);
            border: 1px solid rgba(255, 255, 255, 0.05);
            background: rgba(255, 255, 255, 0.03);
        }
        .group-item:hover {
            transform: translateX(8px);
            border-color: var(--color-primary);
            background: rgba(255, 255, 255, 0.08);
        }
        .group-icon {
            font-size: 2rem;
            margin-right: 1.25rem;
        }
        .group-info {
            flex: 1;
        }
        .group-name {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
            color: white;
        }
        .group-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.8rem;
            color: var(--color-text-tertiary);
        }
        .group-arrow {
            width: 24px;
            height: 24px;
            color: var(--color-text-tertiary);
            transition: transform var(--transition-fast);
        }
        .group-item:hover .group-arrow {
            color: var(--color-primary);
            transform: translateX(4px);
        }
        .group-arrow svg {
            width: 100%;
            height: 100%;
        }
        .text-text-secondary { color: var(--color-text-secondary); }
        .border-primary { border-color: var(--color-primary); }
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .fade-in {
            animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `]
})
export class GroupSelectionComponent implements OnInit {
    groups: Group[] = [];
    loading = true;

    constructor(
        private http: HttpClient,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.fetchGroups();
    }

    fetchGroups() {
        // We need an endpoint to get user's groups. 
        // Ideally GET /groups/my or similar.
        // If not exists, I might need to add it to backend GroupsController.
        this.http.get<any[]>(`${environment.apiUrl}/groups/my`).subscribe({
            next: (data) => {
                this.groups = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to fetch groups', err);
                this.loading = false;
            }
        });
    }

    selectGroup(group: Group) {
        // Store selected group context
        localStorage.setItem('currentGroupId', group.id.toString());
        // Also fetch context? Or just ID is enough?
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
    }
}
