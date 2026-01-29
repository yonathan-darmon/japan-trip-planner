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

    <!-- ADMIN SECTION -->
    <div class="admin-section fade-in" style="animation-delay: 150ms;" *ngIf="(currentUser$ | async)?.role === 'super_admin'">
      <h2>⚙️ Administration</h2>
      <div class="dashboard-actions">
        <div class="card glass action-card">
          <h3>👥 Utilisateurs</h3>
          <p>Gérer les comptes et les accès.</p>
          <button class="btn btn-outline full-width" routerLink="/users">Gérer</button>
        </div>
        <div class="card glass action-card">
          <h3>⚙️ Configuration</h3>
          <p>Modifier la durée et les paramètres du voyage.</p>
          <button class="btn btn-outline full-width" routerLink="/trip-config">Configurer</button>
        </div>
        </div>
      </div>
      
      <!-- Group Admin Actions -->
      <div class="dashboard-actions mt-4">
        <div class="card glass action-card">
           <h3>👥 Mon Groupe</h3>
           <p>Gérer les membres du groupe.</p>
           <button class="btn btn-outline full-width" routerLink="/groups/manage">Gérer le Groupe</button>
        </div>
      </div>

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
    <div *ngIf="showChangelog && latestChangelog" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full fade-in z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
            <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-lg leading-6 font-medium text-gray-900 mt-2">Nouveautés ({{ latestChangelog.version }})</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 whitespace-pre-wrap text-left">{{ latestChangelog.content }}</p>
          </div>
          <div class="items-center px-4 py-3">
             <button id="ok-btn" (click)="dismissChangelog()" class="px-4 py-2 bg-indigo-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                J'ai compris
             </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header {
      text-align: center;
// ... (rest of styles kept implicitly, focusing on component logic below)
// I will only replace the Component class and key template parts to avoid massive replace
// But replace_file_content needs contiguous block. 
// I will try to replace the end of template and the class implementation.
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
          // Load suggestions filtered by country
          const countryId = config?.group?.country?.id;
          this.suggestionsService.getAll(countryId)
            .pipe(takeUntilDestroyed(this.destroyRef)) // Note: nesting pipe logic might be tricky with destroyRef if repeated? Actually separate subscription is fine.
            .subscribe({
              next: (suggestions) => this.suggestionCount = suggestions.length,
              error: (err) => console.error('Error loading suggestions:', err)
            });
        },
        error: (err) => console.error('Error loading config:', err)
      });

    this.itineraryService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (itineraries) => {
          console.log('Loaded itineraries:', itineraries);
          this.itineraries = itineraries;
        },
        error: (err) => console.error('Error loading itineraries:', err)
      });

    this.participantCount = 1;
  }

  checkChangelog() {
    forkJoin({
      user: this.authService.currentUser$.pipe(take(1)), // Get current value once
      changelogs: this.changelogService.getLatest()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ user, changelogs }) => {
        if (changelogs && changelogs.length > 0) {
          const latest = changelogs[0]; // Assuming sorted by Backend. If not, sort here.
          this.latestChangelog = latest;
          const lastViewed = user?.lastViewedChangelogAt ? new Date(user.lastViewedChangelogAt) : null;
          const published = new Date(latest.publishedAt);

          if (!lastViewed || lastViewed < published) {
            this.showChangelog = true;
          }
        }
      }
    });
  }

  dismissChangelog() {
    this.showChangelog = false;
    this.usersService.markChangelogRead().subscribe();
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

