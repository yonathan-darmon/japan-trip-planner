import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { AuthService } from '../core/services/auth';
import { TripConfigService, TripConfig } from '../core/services/trip-config';
import { SuggestionsService } from '../core/services/suggestions';
import { UsersService } from '../core/services/users';
import { ItineraryService, Itinerary } from '../core/services/itinerary';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

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
  `,
  styles: [`
    .dashboard-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    .dashboard-header h1 {
      background: var(--gradient-hero);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    .stat-card {
      text-align: center;
      padding: 2rem;
    }
    .stat-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      color: var(--color-text-secondary);
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .dashboard-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    .action-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .action-card h3 {
      margin-bottom: 0.5rem;
      font-size: 1.5rem;
    }
    .action-card p {
      flex-grow: 1;
      margin-bottom: 1.5rem;
    }
    .highlight {
      border: 1px solid var(--color-primary);
      box-shadow: var(--shadow-glow);
    }
    .full-width {
      width: 100%;
    }

    .itineraries-section, .admin-section {
      margin-top: 4rem;
    }
    .itineraries-section h2, .admin-section h2 {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 1rem;
    }

    .grid-itineraries {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .itinerary-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    }
    .itinerary-card:hover {
      border-color: var(--color-primary);
    }
    
    .itinerary-info h3 {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }
    .itinerary-meta {
      display: flex;
      gap: 1rem;
      color: var(--color-light);
      font-weight: bold;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .itinerary-date {
      font-size: 0.8rem;
      color: var(--color-text-tertiary);
    }

    .itinerary-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
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

  constructor(
    private authService: AuthService,
    private tripConfigService: TripConfigService,
    private suggestionsService: SuggestionsService,
    private usersService: UsersService,
    private itineraryService: ItineraryService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    console.log('Loading dashboard data...');

    this.tripConfigService.getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (config) => this.config = config,
        error: (err) => console.error('Error loading config:', err)
      });

    this.suggestionsService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (suggestions) => this.suggestionCount = suggestions.length,
        error: (err) => console.error('Error loading suggestions:', err)
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

