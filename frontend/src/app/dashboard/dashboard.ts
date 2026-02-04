import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { AuthService } from '../core/services/auth';
import { TripConfigService, TripConfig } from '../core/services/trip-config';
import { SuggestionsService } from '../core/services/suggestions';
import { UsersService } from '../core/services/users';
import { ItineraryService, Itinerary } from '../core/services/itinerary';
import { GroupsService, Group, GroupRole } from '../core/services/groups.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, take } from 'rxjs';
import { ChangelogService, Changelog } from '../core/services/changelog.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, RouterLink, CommonModule, FormsModule],
  template: `
    <div class="dashboard-header fade-in">
      <h1>👋 Konnichiwa, {{ (currentUser$ | async)?.username }} !</h1>
      <div class="subtitle-container">
        <p>Prêt à planifier votre voyage <span *ngIf="currentGroup?.country">en {{ currentGroup?.country?.name }}</span> ?</p>
        <div *ngIf="currentGroup" class="group-badge">
          {{ currentGroup.name }}
          <span *ngIf="isGroupAdmin" class="badge badge-primary">Admin</span>
        </div>
      </div>
    </div>

    <!-- ADMIN SECTION -->
    <div class="admin-section fade-in" *ngIf="isGroupAdmin" style="animation-delay: 50ms;">
      <div class="card glass admin-card">
        <div class="card-header">
          <h3>⚙️ Administration du Groupe</h3>
          <button class="btn btn-sm btn-outline" (click)="showConfigModal = true">Modifier configuration</button>
        </div>
        <div class="admin-stats">
          <div class="stat-item">
            <span class="label">Durée :</span>
            <span class="value">{{ config?.durationDays || 21 }} jours</span>
          </div>
          <div class="stat-item" *ngIf="config?.startDate">
            <span class="label">Départ :</span>
            <span class="value">{{ config?.startDate | date:'dd/MM/yyyy' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-stats fade-in" style="animation-delay: 100ms;">
      <div class="card glass stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">{{ config?.durationDays || 21 }}</div>
        <div class="stat-label">Jours de voyage</div>
      </div>
      
      <div class="card glass stat-card">
        <div class="stat-icon">⛩️</div>
        <div class="stat-value">{{ suggestionCount }}</div>
        <div class="stat-label">Suggestions</div>
      </div>
      
      <div class="card glass stat-card" routerLink="/groups">
        <div class="stat-icon">👥</div>
        <div class="stat-value">{{ participantCount }}</div>
        <div class="stat-label">Participants</div>
      </div>
    </div>

    <!-- NORMAL ACTIONS SECTION -->

    <div class="dashboard-actions fade-in" style="animation-delay: 200ms;">
      <div class="card glass action-card">
        <h3>📍 Explorer</h3>
        <p>Découvrez des lieux incroyables à visiter.</p>
        <button class="btn btn-secondary full-width" routerLink="/suggestions">Voir les suggestions</button>
      </div>
      
      <div class="card glass action-card">
        <h3>✨ Vos Préférences</h3>
        <p>Votez pour ce que vous voulez faire.</p>
        <button class="btn btn-outline full-width" routerLink="/suggestions">Mes votes</button>
      </div>

      <div class="card glass action-card highlight">
        <h3>🗺️ Nouveau Plan</h3>
        <p>Générez un plan de voyage optimisé.</p>
        <button 
          class="btn btn-primary full-width" 
          (click)="generateItinerary()"
          [disabled]="generatingItinerary">
          {{ generatingItinerary ? 'Génération...' : 'Planifier' }}
        </button>
      </div>
    </div>

    <!-- ITINERARY LIST SECTION -->
    <div class="itineraries-section fade-in" style="animation-delay: 300ms;" *ngIf="itineraries.length > 0">
      <h2>🎒 Vos Voyages ({{ itineraries.length }})</h2>
      <div class="grid-itineraries">
        <div class="card glass itinerary-card" *ngFor="let item of itineraries">
          <div class="itinerary-info">
            <h3>{{ item.name }}</h3>
            <div class="itinerary-meta">
              <span>🗓️ {{ item.totalDays }} jours</span>
              <span>💰 {{ item.totalCost | number:'1.0-0' }}€</span>
            </div>
            <div class="itinerary-date">Créé le {{ item.generatedAt | date:'dd/MM/yyyy' }}</div>
          </div>
          <div class="itinerary-actions">
            <a [routerLink]="['/itinerary', item.id]" class="btn btn-sm btn-outline">Voir</a>
            <button class="btn btn-sm btn-ghost" (click)="deleteItinerary(item.id, $event)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- CONFIG MODAL -->
    <div *ngIf="showConfigModal" class="modal-backdrop fade-in">
      <div class="card glass modal-card">
        <h3>Configurer le voyage</h3>
        <p class="modal-subtitle">Paramètres pour {{ currentGroup?.name }}</p>
        
        <div class="form-group">
          <label>Durée du voyage (jours)</label>
          <input type="number" [(ngModel)]="configDuration" min="1" max="90" class="input">
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" (click)="showConfigModal = false">Annuler</button>
          <button class="btn btn-primary" (click)="saveConfig()">Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- CHANGELOG MODAL -->
    <div *ngIf="showChangelog && latestChangelog" class="modal-backdrop fade-in">
      <div class="card glass changelog-card">
        <div class="changelog-header">
          <div class="changelog-icon">🎉</div>
          <h2>Quoi de neuf ?</h2>
          <div class="changelog-version">{{ latestChangelog.version }}</div>
        </div>
        
        <div class="changelog-body">
          <p>{{ latestChangelog.content }}</p>
        </div>
        
        <div class="changelog-footer">
           <button class="btn btn-primary full-width" (click)="dismissChangelog()">
             C'est parti !
           </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .subtitle-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .group-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.9rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .badge {
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: bold;
    }

    .badge-primary {
      background: var(--color-primary);
      color: white;
    }

    .admin-section {
      max-width: 800px;
      margin: 0 auto 2rem;
    }

    .admin-card {
      padding: 1.5rem;
      border: 1px solid rgba(var(--color-primary-rgb), 0.3);
      background: rgba(var(--color-primary-rgb), 0.05);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .admin-stats {
      display: flex;
      gap: 2rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-item .label {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }

    .stat-item .value {
      font-size: 1.1rem;
      font-weight: bold;
    }

    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    
    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      transition: transform 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
    
    .stat-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-primary);
    }
    
    .stat-label {
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }
    
    .dashboard-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }
    
    .action-card {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      height: 100%;
    }
    
    .action-card.highlight {
      border: 1px solid rgba(var(--color-primary-rgb), 0.3);
      background: rgba(var(--color-primary-rgb), 0.05);
    }
    
    .action-card h3 {
      margin-top: 0;
      font-size: 1.4rem;
      margin-bottom: 0.5rem;
    }
    
    .action-card p {
      color: var(--color-text-secondary);
      margin-bottom: 2rem;
      flex-grow: 1;
    }
    
    .full-width {
      width: 100%;
    }

    .itineraries-section {
      margin-top: 3rem;
    }

    .grid-itineraries {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .itinerary-card {
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .itinerary-meta {
      display: flex;
      gap: 1rem;
      margin: 0.5rem 0;
      font-size: 0.9rem;
      color: var(--color-text-secondary);
    }

    .itinerary-date {
      font-size: 0.8rem;
      opacity: 0.7;
    }

    .itinerary-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    }

    .modal-card {
      padding: 2rem;
      width: 90%;
      max-width: 500px;
      background: var(--color-background);
    }

    .modal-subtitle {
        color: var(--color-text-secondary);
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
    }

    .input {
        width: 100%;
        padding: 0.8rem;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
        color: var(--color-text);
        margin-top: 0.5rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    .changelog-card {
      width: 90%;
      max-width: 500px;
      padding: 2rem;
      text-align: center;
      border: 1px solid var(--color-glass-border);
    }

    .changelog-header {
      margin-bottom: 1.5rem;
    }

    .changelog-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .changelog-version {
      display: inline-block;
      padding: 0.2rem 0.8rem;
      background: rgba(var(--color-primary-rgb), 0.2);
      color: var(--color-primary);
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .changelog-body {
      margin-bottom: 2rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
      text-align: left;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser$;
  config: TripConfig | null = null;
  suggestionCount = 0;
  participantCount = 0;
  generatingItinerary = false;
  itineraries: Itinerary[] = [];
  currentGroup: Group | null = null;
  isGroupAdmin = false;
  showConfigModal = false;
  configDuration = 21;

  // Changelog
  showChangelog = false;
  latestChangelog: Changelog | null = null;

  constructor(
    private authService: AuthService,
    private tripConfigService: TripConfigService,
    private suggestionsService: SuggestionsService,
    private usersService: UsersService,
    private itineraryService: ItineraryService,
    private groupsService: GroupsService,
    private changelogService: ChangelogService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.loadData();
    this.checkChangelog();
  }

  loadData() {
    console.log('Loading dashboard data...');

    // 1. First, get user's groups
    this.groupsService.getMyGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          if (groups.length === 0) {
            console.warn('⚠️ User has no groups');
            return;
          }

          // Use first group (or could let user select)
          this.currentGroup = groups[0];
          this.isGroupAdmin = this.currentGroup.role === GroupRole.ADMIN || this.currentGroup.role === 'admin';
          const groupId = this.currentGroup.id;

          console.log(`✅ Loaded group #${groupId}: ${this.currentGroup.name}`, { isAdmin: this.isGroupAdmin });

          // 2. Load config for this group
          this.tripConfigService.getConfig(groupId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (config) => {
                this.config = config;
                this.configDuration = config.durationDays;
                const countryId = this.currentGroup?.country?.id;

                console.log(`✅ Loaded config for group #${groupId}:`, config);

                // 3. Load suggestions for this group
                this.suggestionsService.getAll({ groupId, countryId })
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                    next: (suggestions) => this.suggestionCount = suggestions.length,
                    error: (err) => console.error('Error loading suggestions:', err)
                  });

                // 4. Load itineraries for this group
                this.itineraryService.getAll(groupId)
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                    next: (itineraries) => {
                      console.log('Loaded itineraries:', itineraries);
                      this.itineraries = itineraries;
                    },
                    error: (err) => console.error('Error loading itineraries:', err)
                  });

                // 5. Update participant count
                this.participantCount = this.currentGroup?.members?.length || 1;
              },
              error: (err) => console.error('Error loading config:', err)
            });
        },
        error: (err) => console.error('Error loading groups:', err)
      });
  }

  saveConfig() {
    if (!this.currentGroup || !this.configDuration) return;

    const groupId = this.currentGroup.id;
    this.tripConfigService.updateConfig(groupId, { durationDays: this.configDuration })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedConfig) => {
          console.log('✅ Config updated:', updatedConfig);
          this.config = updatedConfig;
          this.showConfigModal = false;
        },
        error: (err) => {
          console.error('Error updating config:', err);
          alert('Erreur lors de la mise à jour');
        }
      });
  }

  checkChangelog() {
    forkJoin({
      user: this.authService.currentUser$.pipe(take(1)), // Get current value once
      changelogs: this.changelogService.getLatest()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ user, changelogs }) => {
        if (changelogs && changelogs.length > 0) {
          const latest = changelogs[0]; // Assuming sorted by Backend.
          this.latestChangelog = latest;

          const lastViewedTime = user?.lastViewedChangelogAt ? new Date(user.lastViewedChangelogAt).getTime() : 0;
          const publishedTime = new Date(latest.publishedAt).getTime();

          // Buffer of 2 seconds to avoid precision issues between server/db
          if (lastViewedTime < (publishedTime - 2000)) {
            this.showChangelog = true;
          }
        }
      }
    });
  }

  dismissChangelog() {
    this.showChangelog = false;
    this.usersService.markChangelogRead().subscribe({
      next: (updatedUser) => {
        this.authService.updateUser(updatedUser);
      }
    });
  }

  generateItinerary() {
    this.generatingItinerary = true;

    if (!this.currentGroup) {
      alert("Aucun groupe trouvé");
      this.generatingItinerary = false;
      return;
    }

    this.itineraryService.generate({
      name: `Voyage ${this.currentGroup?.country?.name || 'Japon'} - ${new Date().toLocaleDateString('fr-FR')}`,
      maxActivitiesPerDay: 4,
      groupId: this.currentGroup.id
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (itinerary) => {
          console.log('Itinerary generated:', itinerary);
          this.generatingItinerary = false;
          this.router.navigate(['/itinerary', itinerary.id]);
        },
        error: (err) => {
          console.error('Error generating itinerary:', err);
          this.generatingItinerary = false;
          alert("Erreur lors de la génération. Assurez-vous d'avoir voté pour des suggestions.");
        }
      });
  }

  deleteItinerary(id: number, event: Event) {
    event.stopPropagation(); // Prevent clicking card if we wrap it in link
    if (!confirm('Voulez-vous vraiment supprimer cet itinéraire ?')) return;

    this.itineraryService.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.itineraries = this.itineraries.filter(i => i.id !== id);
        },
        error: (err) => alert('Erreur lors de la suppression')
      });
  }
}
