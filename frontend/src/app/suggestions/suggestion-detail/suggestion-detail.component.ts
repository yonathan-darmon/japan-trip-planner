import { Component, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SuggestionsService, Suggestion } from '../../core/services/suggestions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';

@Component({
  selector: 'app-suggestion-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detail-container" *ngIf="suggestion">
      <a routerLink="/itinerary/{{ itineraryId }}" class="back-button" *ngIf="itineraryId">
        ← Retour à l'itinéraire
      </a>
      <a routerLink="/suggestions" class="back-button" *ngIf="!itineraryId">
        ← Retour aux suggestions
      </a>

      <div class="detail-header">
        <span class="category-badge">{{ suggestion.category }}</span>
        <h1>{{ suggestion.name }}</h1>
        
        <div class="detail-meta">
          <div class="meta-item">
            <span class="meta-icon">📍</span>
            <a [href]="getGoogleMapsLink()" target="_blank" class="location-link">
              {{ suggestion.location }}
            </a>
          </div>
          <div class="meta-item" *ngIf="suggestion.durationHours">
            <span class="meta-icon">⏱️</span>
            <span>{{ suggestion.durationHours }}h</span>
          </div>
        </div>
      </div>

      <div class="detail-photo" *ngIf="suggestion.photoUrl">
        <img [src]="suggestion.photoUrl" [alt]="suggestion.name" />
      </div>

      <div class="price-box" *ngIf="suggestion.price">
        💰 {{ suggestion.price }}€
      </div>

      <div class="detail-content">
        <div class="detail-section" *ngIf="suggestion.description">
          <h2>📝 Description</h2>
          <p class="description-text">{{ suggestion.description }}</p>
        </div>
        <div class="detail-section" *ngIf="!suggestion.description">
          <h2>📝 Description</h2>
          <p class="no-description">Aucune description disponible.</p>
        </div>

        <div class="detail-section" *ngIf="suggestion.latitude && suggestion.longitude">
          <h2>🗺️ Localisation</h2>
          <div id="detail-map" class="detail-map"></div>
          <a [href]="getGoogleMapsLink()" target="_blank" class="location-link" style="margin-top: 1rem; display: inline-flex;">
            🔗 Ouvrir dans Google Maps
          </a>
        </div>
      </div>
    </div>

    <div class="detail-container" *ngIf="!suggestion && !loading">
      <p>Activité non trouvée.</p>
      <a routerLink="/suggestions" class="back-button">← Retour aux suggestions</a>
    </div>
  `,
  styleUrls: ['./suggestion-detail.component.css']
})
export class SuggestionDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  suggestion: Suggestion | null = null;
  loading = true;
  itineraryId: number | null = null;
  private map: L.Map | null = null;

  constructor(
    private route: ActivatedRoute,
    private suggestionsService: SuggestionsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.itineraryId = Number(this.route.snapshot.queryParamMap.get('itineraryId')) || null;

    this.suggestionsService.getOne(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (suggestion: Suggestion) => {
          this.suggestion = suggestion;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading suggestion:', err);
          this.loading = false;
        }
      });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initMap(), 100);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  initMap(): void {
    if (!this.suggestion?.latitude || !this.suggestion?.longitude) return;

    const mapElement = document.getElementById('detail-map');
    if (!mapElement) return;

    this.map = L.map('detail-map').setView(
      [this.suggestion.latitude, this.suggestion.longitude],
      15
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const icon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.marker([this.suggestion.latitude, this.suggestion.longitude], { icon })
      .addTo(this.map)
      .bindPopup(`<b>${this.suggestion.name}</b><br>${this.suggestion.location}`)
      .openPopup();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);
  }

  getGoogleMapsLink(): string {
    if (!this.suggestion) return '#';

    if (this.suggestion.latitude && this.suggestion.longitude) {
      return `https://www.google.com/maps?q=${this.suggestion.latitude},${this.suggestion.longitude}`;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.suggestion.location)}`;
  }
}
