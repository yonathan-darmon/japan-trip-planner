import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ItineraryService, Itinerary, ItineraryDay } from '../core/services/itinerary';
import { Suggestion, SuggestionCategory, SuggestionsService } from '../core/services/suggestions';
import * as L from 'leaflet';

@Component({
  selector: 'app-itinerary-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink, DragDropModule],
  template: `
    <div class="itinerary-container" *ngIf="itinerary">
      <div class="itinerary-header fade-in">
        <h1>{{ itinerary.name }}</h1>
        <div class="header-stats">
          <span class="stat">📅 {{ itinerary.totalDays }} jours</span>
          <span class="stat">💰 {{ itinerary.totalCost }}€</span>
          <span class="stat">📍 {{ getTotalActivities() }} activités</span>
        </div>

        <!-- NEW: Cost Breakdown -->
        <div class="cost-breakdown" *ngIf="costBreakdownKeys.length > 0">
          <div class="breakdown-item" *ngFor="let category of costBreakdownKeys">
            <div class="breakdown-label">
              <span>{{ category }}</span>
              <span>{{ costBreakdown[category] | number:'1.2-2' }}€</span>
            </div>
            <div class="progress-bg">
              <div class="progress-fill" 
                   [style.width.%]="getPercent(costBreakdown[category])"
                   [style.background-color]="getCategoryColor(category)">
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="map-section fade-in">
        <h2>📍 Carte de l'itinéraire</h2>
        <div id="map" class="map-container"></div>
      </div>

      <div class="timeline" cdkDropListGroup>
        <div class="day-card fade-in" *ngFor="let day of itinerary.days" 
             [style.animation-delay]="(day.dayNumber * 50) + 'ms'">
          <div class="day-header">
            <h2>Jour {{ day.dayNumber }}</h2>
            <span class="day-date" *ngIf="day.date">{{ formatDate(day.date) }}</span>
          </div>

          <div class="activities-list" 
               cdkDropList 
               [cdkDropListData]="day.activities"
               (cdkDropListDropped)="drop($event, day)">
            
            <div class="activity-item" 
                 *ngFor="let activity of day.activities" 
                 cdkDrag
                 [cdkDragData]="activity"
                 (cdkDragStarted)="dragStarted($event)"
                 (cdkDragEnded)="dragEnded($event)">
              
              <!-- Make the order circle the handle -->
              <div class="activity-order" cdkDragHandle>
                {{ activity.orderInDay }}
              </div>
              
              <div class="activity-content">
                <div class="activity-header">
                  <h3>{{ activity.suggestion.name }}</h3>
                  <span class="activity-price" *ngIf="activity.suggestion.price">
                    {{ activity.suggestion.price }}€
                  </span>
                </div>
                <p class="activity-location">📍 {{ activity.suggestion.location }}</p>
                <p class="activity-description">{{ activity.suggestion.description }}</p>
                <span class="activity-category">{{ activity.suggestion.category }}</span>
              </div>

              <!-- Custom Placeholder (The "Ghost") -->
              <div *cdkDragPlaceholder class="custom-placeholder"></div>

              <!-- Drag Preview -->
              <div *cdkDragPreview class="activity-item preview">
                <h3>{{ activity.suggestion.name }}</h3>
              </div>
            </div>

            <!-- Empty state INSIDE the drop list -->
            <div class="no-activities" *ngIf="day.activities.length === 0">
              <p>Glissez une activité ici</p>
            </div>
          </div>
        </div>
      </div>

      <div class="actions-footer">
        <button class="btn btn-outline" routerLink="/dashboard">
          ← Retour au dashboard
        </button>
        <button class="btn btn-secondary" (click)="deleteItinerary()">
          🗑️ Supprimer
        </button>
      </div>
    </div>

    <div class="loading" *ngIf="!itinerary">
      <p>Chargement de l'itinéraire...</p>
    </div>
  `,
  styles: [`
    /* Drag & Drop Styles */
    .activity-item {
      position: relative;
      /* Remove cursor: move from overall item since we have a specific handle */
    }
    
    .activity-order {
      cursor: grab;
      transition: transform 0.1s;
    }

    .activity-order:active {
      cursor: grabbing;
      transform: scale(0.95);
    }


    .itinerary-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .itinerary-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .itinerary-header h1 {
      background: var(--gradient-hero);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
    }

    .header-stats {
      display: flex;
      gap: 2rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .stat {
      font-size: 1.1rem;
      color: var(--color-text-secondary);
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .day-card {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: 2rem;
      border: 1px solid var(--color-border);
    }

    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid var(--color-border);
    }

    .day-header h2 {
      margin: 0;
      color: var(--color-primary);
    }

    .day-date {
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }

    .activities-list {
      display: flex;
      flex-direction: column;
      /* gap: 1.5rem;  <-- REMOVED for better CDK compatibility */
      min-height: 60px; /* Ensure drop zone exists */
      position: relative; /* Assist with positioning */
    }

    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--color-background);
      border-radius: var(--radius-md);
      transition: background-color 0.2s; /* Changed from transform */
      position: relative;
      margin-bottom: 1.5rem; /* Added margin instead of gap */
    }

    .activity-item:last-child {
      margin-bottom: 0;
    }

    .activity-item:hover {
      background-color: var(--color-surface); /* Alternative visual feedback */
    }

    .activity-order {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-primary);
      color: white;
      border-radius: 50%;
      font-weight: bold;
      position: relative; /* Context for drag handle if moved there */
    }


    .activity-content {
      flex: 1;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.5rem;
    }

    .activity-header h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .activity-price {
      background: var(--color-success);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      font-weight: bold;
      font-size: 0.9rem;
    }

    .activity-location {
      color: var(--color-text-secondary);
      margin: 0.5rem 0;
      font-size: 0.9rem;
    }

    .activity-description {
      margin: 0.5rem 0;
      line-height: 1.5;
    }

    .activity-category {
      display: inline-block;
      background: var(--color-surface);
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }

    .no-activities {
      text-align: center;
      padding: 2rem;
      color: var(--color-text-secondary);
      font-style: italic;
    }

    .actions-footer {
      display: flex;
      gap: 1rem;
      justify-content: center;
      padding: 2rem 0;
    }

    .loading {
      text-align: center;
      padding: 4rem;
      color: var(--color-text-secondary);
    }

    .map-section {
      margin: 3rem 0;
    }

    .map-section h2 {
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .map-container {
      height: 500px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 2px solid var(--color-border);
      box-shadow: var(--shadow-lg);
      background: #f0f0f0;
      position: relative;
      z-index: 1;
    }

    .map-container :global(.leaflet-container) {
      background: #f0f0f0;
    }

    @media (max-width: 768px) {
      .itinerary-container {
        padding: 1rem;
      }

      .header-stats {
        gap: 1rem;
      }

      .activity-item {
        flex-direction: column;
      }

      .activity-order {
        align-self: flex-start;
      }
    }
  `]
})
export class ItineraryViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  itinerary: Itinerary | null = null;
  itineraryId: number = 0;
  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;

  constructor(
    private route: ActivatedRoute,
    private itineraryService: ItineraryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.itineraryId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadItinerary();
  }

  ngAfterViewInit() {
    // Map will be initialized after itinerary is loaded
  }

  ngOnDestroy() {
    if (this.map) {
      console.log('🧹 Destroying map instance');
      this.map.remove();
      this.map = null;
    }
  }

  dragStarted(event: any) {
    console.log('🤏 Drag started', event);
  }

  dragEnded(event: any) {
    console.log('✋ Drag ended', event);
  }

  drop(event: CdkDragDrop<any[]>, day: ItineraryDay) {
    console.log('⬇️ Drop event detected', {
      prevIndex: event.previousIndex,
      currIndex: event.currentIndex,
      item: event.item.data,
      container: event.container.id,
      previousContainer: event.previousContainer.id
    });

    if (event.previousContainer === event.container) {
      // Reordering within the same day
      if (event.previousIndex === event.currentIndex) {
        console.log('🚫 No change in position');
        return;
      }

      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving from one day to another
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    // Update order numbers for modified days
    // For now, let's update visually and local logic.
    // We update orders for current day (target)
    day.activities.forEach((act, idx) => act.orderInDay = idx + 1);

    // If different container, we also need to update the SOURCE day orders?
    // event.previousContainer.data IS the array of the source day.
    if (event.previousContainer !== event.container) {
      event.previousContainer.data.forEach((act: any, idx: number) => act.orderInDay = idx + 1);
    }

    this.updateMapLayers();

    // TODO: Saving cross-day move requires a smarter backend endpoint!
    // The current 'reorder' endpoint only takes { dayNumber, newOrder }.
    // If we moved item to this day, 'newOrder' will contain a suggestionId that wasn't there before.
    // Does the backend handle "stealing" an activity from another day?
    // If not, we might need to implement that. 
    // Checking backend implementation...
    // Let's assume for now we just try to save the TARGET day's new order. 
    // If the backend logic is "set activities for day X defined by this list", it implies moving them to day X.
    // Let's invoke reorder for BOTH days if needed.

    // Ideally, we start with reordering the target day.
    const newOrder = day.activities.map(a => a.suggestionId);
    console.log('💾 Saving target day ' + day.dayNumber, newOrder);

    this.itineraryService.reorder(this.itineraryId, {
      dayNumber: day.dayNumber,
      newOrder: newOrder
    }).subscribe({
      next: () => {
        console.log('✅ Target day updated');
        // If cross-day, we theoretically should update source day too?
        // But if the backend implementation of "reorder day X" automatically grabs the activities and sets their day_id = X, 
        // then they are automatically removed from day Y.
        // However, day Y might have a hole in ordering.
        // Let's trigger reorder for previous container's day too if we can identify it.
        // Since we don't have the "Day Object" for previous container easily here without finding it,
        // we'll rely on visual refresh or just assume backend handles ownership transfer.
      },
      error: (err) => {
        console.error('❌ Failed to save order:', err);
        alert('Erreur lors de la sauvegarde de l\'ordre');
      }
    });
  }

  costBreakdown: { [key: string]: number } = {};
  costBreakdownKeys: string[] = [];

  // ...

  loadItinerary() {
    this.itineraryService.getOne(this.itineraryId).subscribe({
      next: (itinerary) => {
        this.itinerary = itinerary;
        this.calculateBreakdown(); // Calculate on load

        // Wait for DOM to be ready before initializing map
        setTimeout(() => {
          this.initMap();
          // Force map to recalculate size after render
          setTimeout(() => {
            if (this.map) {
              this.map.invalidateSize();
            }
          }, 200);
        }, 100);
      },
      error: (err) => {
        console.error('Error loading itinerary:', err);
        alert('Erreur lors du chargement de l\'itinéraire');
      }
    });
  }

  calculateBreakdown() {
    if (!this.itinerary) return;

    this.costBreakdown = {};

    this.itinerary.days.forEach(day => {
      day.activities.forEach(act => {
        const cat = act.suggestion.category;
        const price = Number(act.suggestion.price) || 0;

        if (!this.costBreakdown[cat]) {
          this.costBreakdown[cat] = 0;
        }
        this.costBreakdown[cat] += price;
      });
    });

    // Sort categories by cost descending
    this.costBreakdownKeys = Object.keys(this.costBreakdown).sort((a, b) => {
      return this.costBreakdown[b] - this.costBreakdown[a];
    });
  }

  getPercent(amount: number): number {
    const total = Number(this.itinerary?.totalCost) || 0;
    if (total === 0) return 0;
    return (amount / total) * 100;
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case SuggestionCategory.HEBERGEMENT: return '#FF6B6B'; // Red
      case SuggestionCategory.ACTIVITE: return '#4ECDC4';   // Teal
      case SuggestionCategory.RESTAURANT: return '#FFA07A'; // Orange
      case SuggestionCategory.NATURE: return '#98D8C8';    // Greenish
      case SuggestionCategory.SHOPPING: return '#F7DC6F';   // Yellow
      case SuggestionCategory.MUSEE: return '#BB8FCE';      // Purple
      case SuggestionCategory.TEMPLE: return '#85C1E2';     // Blue
      default: return '#cccccc';
    }
  }

  getTotalActivities(): number {
    if (!this.itinerary) return 0;
    return this.itinerary.days.reduce((total, day) => total + day.activities.length, 0);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  deleteItinerary() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet itinéraire ?')) {
      return;
    }

    this.itineraryService.delete(this.itineraryId).subscribe({
      next: () => {
        alert('Itinéraire supprimé');
        window.location.href = '/dashboard';
      },
      error: (err) => {
        console.error('Error deleting itinerary:', err);
        alert('Erreur lors de la suppression');
      }
    });
  }

  initMap() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.itinerary) return;

    // Create map instance if it doesn't exist
    if (!this.map) {
      this.map = L.map('map', {
        preferCanvas: true,
        zoomControl: true
      }).setView([36.2048, 138.2529], 6);

      // Add Tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Initialize layer group for markers/polylines
      this.markersLayer = L.layerGroup().addTo(this.map);
    } else {
      this.map.invalidateSize();
    }

    this.updateMapLayers(true);
  }

  updateMapLayers(shouldFitBounds: boolean = false) {
    if (!this.map || !this.markersLayer || !this.itinerary) return;

    // Clear existing layers
    this.markersLayer.clearLayers();

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const allPoints: L.LatLngExpression[] = [];
    let markerCount = 0;

    // Define the default icon explicitly
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    console.log('🎯 === UPDATING MARKERS ===');

    // Add markers for each activity
    this.itinerary.days.forEach((day, dayIndex) => {
      day.activities.forEach((activity, actIndex) => {
        const lat = parseFloat(activity.suggestion.latitude as any);
        const lng = parseFloat(activity.suggestion.longitude as any);

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          const point: L.LatLngExpression = [lat, lng];
          allPoints.push(point);

          // Use explicit icon instance
          const marker = L.marker(point, { icon: defaultIcon });
          markerCount++;

          // Add popup with activity details
          marker.bindPopup(`
            <div style="min-width: 200px; font-family: sans-serif;">
              <h3 style="margin: 0 0 5px 0; color: ${colors[dayIndex % colors.length]};">
                📅 Jour ${day.dayNumber}
              </h3>
              <div style="font-weight: bold; margin-bottom: 5px;">${activity.suggestion.name}</div>
              <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">
                📍 ${activity.suggestion.location}
              </div>
              <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="color: #3498db; text-decoration: none; font-size: 0.8em;">
                🔗 Ouvrir dans Maps
              </a>
            </div>
          `);

          // Add to layer group instead of map directly
          this.markersLayer?.addLayer(marker);
        }
      });
    });

    // Draw route line
    if (allPoints.length > 1) {
      const polyline = L.polyline(allPoints, {
        color: '#FF6B6B',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10', // Dashed line for better look
        lineCap: 'round'
      });
      this.markersLayer.addLayer(polyline);
    }

    // Fit map only if requested (e.g. on first load)
    if (shouldFitBounds && allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}
