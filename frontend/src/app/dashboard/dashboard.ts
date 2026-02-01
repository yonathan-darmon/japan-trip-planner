import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { AuthService } from '../core/services/auth';
import { TripConfigService, TripConfig } from '../core/services/trip-config';
import { SuggestionsService } from '../core/services/suggestions';
import { UsersService } from '../core/services/users';
import { ItineraryService, Itinerary } from '../core/services/itinerary';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, take } from 'rxjs';
import { ChangelogService, Changelog } from '../core/services/changelog.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, RouterLink, CommonModule],
  template: `
    <div class="dashboard-header fade-in">
      <h1>👋 Konnichiwa, {{ (currentUser$ | async)?.username }} !</h1>
      <p>Prêt à planifier votre voyage au Japon ?</p>
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
      
      <div class="card glass stat-card">
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

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 1rem;
    }

    .changelog-card {
      max-width: 450px;
      width: 100%;
      padding: 2.5rem;
      text-align: center;
      border: 1px solid var(--color-glass-border);
    }

    .changelog-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .changelog-header h2 {
      margin-bottom: 0.5rem;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
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

  // Changelog
  showChangelog = false;
  latestChangelog: Changelog | null = null;

  constructor(
    private authService: AuthService,
    private tripConfigService: TripConfigService,
    private suggestionsService: SuggestionsService,
    private usersService: UsersService,
    private itineraryService: ItineraryService,
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

    this.tripConfigService.getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (config) => {
          this.config = config;
          const countryId = config?.group?.country?.id;

          // Restore group context in localStorage if it was lost
          let groupId = localStorage.getItem('currentGroupId');
          if (!groupId && config?.group?.id) {
            groupId = String(config.group.id);
            localStorage.setItem('currentGroupId', groupId);
            console.log('🔄 Restored group context from config:', groupId);
          }

          const activeGroupId = groupId ? Number(groupId) : undefined;

          // Fix: Pass object with named properties
          this.suggestionsService.getAll({
            countryId: countryId,
            groupId: activeGroupId
          })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (suggestions) => this.suggestionCount = suggestions.length,
              error: (err) => console.error('Error loading suggestions:', err)
            });

          // Load itineraries with group context
          this.itineraryService.getAll(activeGroupId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (itineraries) => {
                console.log('Loaded itineraries:', itineraries);
                this.itineraries = itineraries;
              },
              error: (err) => console.error('Error loading itineraries:', err)
            });

          // Update participant count based on group members
          if (config?.group && Array.isArray(config.group.members)) {
            this.participantCount = config.group.members.length;
          } else {
            this.participantCount = 1;
          }
        },
        error: (err) => console.error('Error loading config:', err)
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

    this.itineraryService.generate({
      name: `Voyage au Japon - ${new Date().toLocaleDateString('fr-FR')}`,
      maxActivitiesPerDay: 4
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
          alert('Erreur lors de la génération. Assurez-vous d\'avoir voté pour des suggestions.');
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

