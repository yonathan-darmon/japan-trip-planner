import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ItineraryService, Itinerary } from '../core/services/itinerary';

@Component({
  selector: 'app-itinerary-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="itinerary-list-container">
      <div class="header">
        <div class="header-content">
          <div>
            <h1>📋 Tous les Itinéraires</h1>
            <p class="subtitle">Découvrez les plannings créés par la communauté</p>
          </div>
          <button class="btn-create" (click)="createNewItinerary()">
            ✨ Créer un nouvel itinéraire
          </button>
        </div>
      </div>

      <div class="itinerary-grid" *ngIf="itineraries.length > 0">
        <div class="itinerary-card" 
             *ngFor="let itinerary of itineraries" 
             (click)="viewItinerary(itinerary.id)">
          <div class="card-header">
            <h3>{{ itinerary.name }}</h3>
            <span class="creator">Par {{ itinerary.createdBy?.username || 'Anonyme' }}</span>
          </div>
          
          <div class="card-stats">
            <div class="stat">
              <span class="icon">📅</span>
              <span>{{ itinerary.totalDays }} jours</span>
            </div>
            <div class="stat">
              <span class="icon">🎯</span>
              <span>{{ getTotalActivities(itinerary) }} activités</span>
            </div>
            <div class="stat" *ngIf="getTotalCost(itinerary) > 0">
              <span class="icon">💰</span>
              <span>{{ getTotalCost(itinerary) }}€</span>
            </div>
          </div>

          <div class="card-footer">
            <span class="date">{{ itinerary.generatedAt | date:'dd/MM/yyyy' }}</span>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="itineraries.length === 0 && !loading">
        <p>Aucun itinéraire disponible pour le moment.</p>
      </div>

      <div class="loading" *ngIf="loading">
        <p>Chargement...</p>
      </div>
    </div>
  `,
  styles: [`
    .itinerary-list-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      background: var(--gradient-hero);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
      text-align: left;
    }

    .subtitle {
      color: var(--color-text-secondary);
      font-size: 1.1rem;
      text-align: left;
    }

    .btn-create {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: 0.875rem 1.75rem;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-create:hover {
      background: var(--color-primary-dark);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .itinerary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
    }

    .itinerary-card {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid var(--color-border);
    }

    .itinerary-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      border-color: var(--color-primary);
    }

    .card-header {
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .card-header h3 {
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
      color: var(--color-text-primary);
    }

    .creator {
      font-size: 0.9rem;
      color: var(--color-text-secondary);
    }

    .card-stats {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: var(--color-text-secondary);
    }

    .stat .icon {
      font-size: 1.2rem;
    }

    .card-footer {
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }

    .date {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    .empty-state, .loading {
      text-align: center;
      padding: 3rem;
      color: var(--color-text-secondary);
    }

    @media (max-width: 768px) {
      .itinerary-list-container {
        padding: 1rem;
      }

      .header h1 {
        font-size: 2rem;
      }

      .itinerary-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ItineraryListComponent implements OnInit {
  itineraries: Itinerary[] = [];
  loading = true;

  constructor(
    private itineraryService: ItineraryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadItineraries();
  }

  loadItineraries(): void {
    this.itineraryService.getAll().subscribe({
      next: (itineraries) => {
        this.itineraries = itineraries;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading itineraries:', err);
        this.loading = false;
      }
    });
  }

  viewItinerary(id: number): void {
    this.router.navigate(['/itinerary', id]);
  }

  createNewItinerary(): void {
    this.router.navigate(['/dashboard']);
  }

  getTotalActivities(itinerary: Itinerary): number {
    return itinerary.days?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0;
  }

  getTotalCost(itinerary: Itinerary): number {
    return itinerary.days?.reduce((sum, day) => {
      const dayCost = day.activities?.reduce((daySum, act) => daySum + (act.suggestion?.price || 0), 0) || 0;
      return sum + dayCost;
    }, 0) || 0;
  }
}
