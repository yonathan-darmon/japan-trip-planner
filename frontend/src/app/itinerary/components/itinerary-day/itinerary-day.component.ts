import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ItineraryDay } from '../../../core/services/itinerary';
import { Suggestion, SuggestionCategory } from '../../../core/services/suggestions';
import { GeoUtils } from '../../../core/utils/geo.utils';
import { CurrencyService } from '../../../core/services/currency.service';
import { WeatherService, WeatherData } from '../../../core/services/weather.service';

@Component({
  selector: 'app-itinerary-day',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="day-card" 
         [class.selected]="isSelected"
         (click)="selectDay()">
      
      <div class="day-header" [style.borderCheck]="'none'" [style.borderBottomColor]="dayColor">
        <div class="day-info">
          <h3 [style.color]="dayColor">Jour {{ day.dayNumber }}</h3>
          <span class="date" *ngIf="day.date">{{ formatDate(day.date) }}</span>
          
          <!-- Weather Widget -->
          <div class="weather-widget fade-in" *ngIf="weatherData" [title]="weatherData.isHistorical ? 'Moyenne saisonnière (prévision indisponible pour cette date lointaine)' : 'Prévision météo'">
             <span class="weather-icon">{{ weatherService.getWeatherEmoji(weatherData.weatherCode) }}</span>
             <span class="weather-temp">{{ weatherData.temperature }}°C</span>
             <span class="weather-hist-badge" *ngIf="weatherData.isHistorical" title="Moyenne historique">⏳</span>
          </div>
        </div>
        <div class="day-gauges">
          <div class="gauge" [class.overload]="dayLoadPercent > 100" title="Occupation journée (7h - 17h)">
            <span class="gauge-icon">☀️</span>
            <div class="gauge-track">
              <div class="gauge-fill" [style.width.%]="Math.min(dayLoadPercent, 100)"></div>
            </div>
            <span class="gauge-text">{{ dayLoadPercent | number:'1.0-0' }}%</span>
          </div>
          <div class="gauge evening" *ngIf="eveningLoadPercent > 0"
               [class.overload]="eveningLoadPercent > 100" title="Occupation soirée (18h - 23h)">
            <span class="gauge-icon">🌙</span>
            <div class="gauge-track">
              <div class="gauge-fill" [style.width.%]="Math.min(eveningLoadPercent, 100)"></div>
            </div>
            <span class="gauge-text">{{ eveningLoadPercent | number:'1.0-0' }}%</span>
          </div>
        </div>
        <div class="day-cost" *ngIf="dayTotal > 0">
           {{ dayTotal | number:'1.0-0' }} €
        </div>
      </div>

      <div class="day-accommodation" 
           [class.has-hotel]="day.accommodation"
           [class.missing-hotel]="!day.accommodation && day.activities.length > 0">
        <div class="hotel-icon">{{ day.accommodation ? '🌙' : '⚠️' }}</div>
        <div class="hotel-info">
          <span class="label">Hébergement</span>
          <strong *ngIf="day.accommodation">{{ day.accommodation.name }}</strong>
          <span class="placeholder warning" *ngIf="!day.accommodation && day.activities.length > 0">
            Non défini (zone inconnue)
          </span>
          <span class="placeholder" *ngIf="!day.accommodation && day.activities.length === 0">
            Aucun hébergement
          </span>
        </div>
        <button class="btn-edit-hotel" 
                [class.btn-add]="!day.accommodation"
                *ngIf="!readOnly" 
                (click)="editAccommodation.emit(day); $event.stopPropagation()">
          {{ day.accommodation ? '✏️' : '➕' }}
        </button>
      </div>

      <div class="activities-list"
           cdkDropList
           [cdkDropListData]="day.activities"
           [cdkDropListDisabled]="readOnly"
           (cdkDropListDropped)="onDrop($event)">
        
        <div class="activity-item" 
             *ngFor="let activity of day.activities" 
             cdkDrag
             [cdkDragData]="activity">
          
          <div class="activity-time">{{ activity.orderInDay }}</div>
          <div class="activity-content">
            <div class="activity-main">
                <strong class="activity-name">{{ activity.suggestion.name }}</strong>
                <span class="activity-category">
                    {{ getCategoryIcon(activity.suggestion.category) }} {{ activity.suggestion.category }}
                </span>
            </div>
            <div class="activity-meta" *ngIf="activity.suggestion.price">
              <span class="price">{{ formatPrice(activity.suggestion) }}</span>
            </div>
            <div class="selection-checkbox" *ngIf="!readOnly">
               <input type="checkbox" 
                      [checked]="isActivitySelected(activity.suggestionId)"
                      (change)="toggleSelection.emit(activity); $event.stopPropagation()">
            </div>
          </div>
          
          <div class="activity-actions">
             <button class="btn-detail" (click)="viewDetails.emit(activity.suggestion); $event.stopPropagation()">ℹ️</button>
             <button class="btn-remove" *ngIf="!readOnly"
                     title="Retirer de l'itinéraire"
                     (click)="removeActivity.emit({ day: day, suggestionId: activity.suggestionId }); $event.stopPropagation()">🗑️</button>
          </div>
        </div>
        
        <div class="add-activity-container" *ngIf="!readOnly">
            <button class="btn-add-activity" *ngIf="!isAdding" (click)="startAdding(); $event.stopPropagation()">
                + Ajouter une activité
            </button>
            
            <div class="add-activity-form" *ngIf="isAdding" (click)="$event.stopPropagation()">
                <select (change)="onActivitySelected($event)" class="activity-select">
                    <option value="">Sélectionner une activité...</option>
                    <option *ngFor="let s of availableSuggestions" [value]="s.id">
                        {{ s.name }} ({{ s.category }})
                    </option>
                </select>
                <button class="btn-cancel-add" (click)="cancelAdd()">✕</button>
            </div>
        </div>

        <div class="empty-state" *ngIf="day.activities.length === 0 && !isAdding && !readOnly">
          Glissez des activités ici ou ajoutez-en une
        </div>
        <div class="empty-state" *ngIf="day.activities.length === 0 && readOnly">
          Aucune activité prévue
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Dark Mode Theme Variables */
    :host {
        --bg-card: #2d3748;
        --bg-card-hover: #4a5568;
        --bg-activity: #1a202c;
        --text-primary: #f7fafc;
        --text-secondary: #a0aec0;
        --border-color: #4a5568;
        --accent-color: #63b3ed;
        --success-color: #68d391;
        --hotel-bg: #2c5282;
    }

    .day-card {
        background: var(--bg-card);
        border-radius: 12px;
        padding: 16px;
        height: 100%;
        border: 2px solid transparent; /* default border */
        transition: all 0.2s;
        cursor: default;
        color: var(--text-primary);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    .day-card:hover { border-color: var(--border-color); }
    .day-card.selected {
        border-color: var(--accent-color);
        box-shadow: 0 0 0 2px rgba(99, 179, 237, 0.2);
    }

    .day-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 4px solid var(--border-color); /* Thicker border to show color */
    }
    .day-info { display: flex; flex-direction: column; gap: 4px; }
    .day-info h3 { margin: 0; font-size: 1.25rem; color: var(--text-primary); font-weight: 700; }
    .day-info .date { font-size: 0.85rem; color: var(--text-secondary); }

    .weather-widget {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.05);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.85rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-top: 4px;
        align-self: flex-start;
    }
    .weather-icon { font-size: 1rem; }
    .weather-temp { font-weight: 600; color: #90cdf4; }
    .weather-hist-badge { font-size: 0.7rem; opacity: 0.7; cursor: help; }

    .day-gauges {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 6px;
    }
    .gauge {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: help;
    }
    .gauge-icon { font-size: 0.8rem; line-height: 1; }
    .gauge-track {
        width: 60px;
        height: 6px;
        background: #4a5568;
        border-radius: 3px;
        overflow: hidden;
    }
    .gauge-fill {
        height: 100%;
        background: var(--success-color);
        border-radius: 3px;
        transition: width 0.3s ease;
    }
    .gauge.evening .gauge-fill { background: #8b5cf6; }
    .gauge.overload .gauge-fill { background: #fc8181; }
    .gauge-text {
        font-size: 0.75rem;
        color: var(--text-secondary);
        min-width: 32px;
        text-align: right;
    }

    .day-cost {
        font-size: 0.85rem;
        color: #68d391; /* Success color */
        font-weight: 600;
        background: rgba(104, 211, 145, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 12px;
    }

    /* Accommodation Styling - Dark Mode */
    .day-accommodation {
        background: rgba(255, 255, 255, 0.05); /* slightly lighter than card */
        padding: 12px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        border: 1px dashed var(--border-color);
    }
    .day-accommodation.has-hotel {
        border: 1px solid #4299e1;
        background: rgba(66, 153, 225, 0.15);
    }
    .day-accommodation.missing-hotel {
        border: 1px dashed #ed8936; /* Orange border */
        background: rgba(237, 137, 54, 0.1);
    }
    .hotel-icon { font-size: 1.2rem; }
    .hotel-info { flex: 1; display: flex; flex-direction: column; }
    .hotel-info .label { 
        font-size: 0.7rem; color: #90cdf4; 
        text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin-bottom: 2px; 
    }
    .hotel-info strong { font-size: 0.95rem; color: white; }
    .hotel-info .placeholder { font-size: 0.85rem; color: var(--text-secondary); font-style: italic; }
    .hotel-info .placeholder.warning { color: #fbd38d; font-weight: 500; }
    
    .btn-edit-hotel {
        background: none; border: none; cursor: pointer; opacity: 0.7; transition: all 0.2s; font-size: 1.1rem;
        filter: grayscale(100%) brightness(200%);
    }
    .btn-edit-hotel.btn-add {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        filter: none;
        color: white;
    }
    .btn-edit-hotel:hover { opacity: 1; transform: scale(1.1); }
    .btn-edit-hotel.btn-add:hover { background: rgba(255, 255, 255, 0.2); }

    .activities-list {
        min-height: 100px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    /* Activity Styling - Dark Mode */
    .activity-item {
        position: relative;
        background: var(--bg-activity);
        border-radius: 8px;
        padding: 12px;
        /* LEFT padding increased to ensure checkbox fits without overlap */
        padding-left: 40px; 
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid var(--border-color);
        cursor: move;
        transition: background 0.2s;
    }
    .activity-item:hover { background: #2d3748; border-color: #718096; }
    
    .activity-time {
        width: 24px;
        height: 24px;
        background: #2d3748;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--accent-color);
        flex-shrink: 0;
        border: 1px solid #4a5568;
    }
    .activity-content { flex: 1; min-width: 0; }
    .activity-main { display: flex; flex-direction: column; }
    .activity-name { 
        font-size: 0.95rem; 
        color: white; 
        font-weight: 600; 
        white-space: nowrap; 
        overflow: hidden; 
        text-overflow: ellipsis; 
    }
    .activity-category { 
        font-size: 0.7rem; 
        color: #cbd5e0; 
        background: #4a5568; 
        padding: 2px 8px; 
        border-radius: 4px; 
        align-self: flex-start; 
        margin-top: 4px;
    }
    .activity-meta { margin-top: 4px; font-size: 0.8rem; color: var(--text-secondary); }
    
    /* Checkbox Positioned Left - Fixes overlapping */
    .selection-checkbox { 
        position: absolute; 
        left: 12px; 
        top: 50%; 
        transform: translateY(-50%);
        z-index: 5;
    }
    .selection-checkbox input {
        width: 18px; height: 18px; cursor: pointer;
        opacity: 0.7;
    }
    .selection-checkbox input:checked { opacity: 1; accent-color: var(--accent-color); }
    
    .btn-detail {
        background: none; border: none; cursor: pointer; font-size: 1.2rem; opacity: 0.6; color: white;
    }
    .btn-detail:hover { opacity: 1; color: var(--accent-color); }

    .activity-actions { display: flex; flex-direction: column; gap: 4px; }
    .btn-remove {
        background: none; border: none; cursor: pointer; font-size: 1.1rem; opacity: 0.5;
    }
    .btn-remove:hover { opacity: 1; transform: scale(1.1); }

    .empty-state {
        text-align: center;
        padding: 20px;
        color: var(--text-secondary);
        font-size: 0.9rem;
        border: 2px dashed var(--border-color);
        border-radius: 8px;
    }
    
    /* Drag Preview - Dark Mode */
    .cdk-drag-preview {
        box-shadow: 0 10px 20px rgba(0,0,0,0.4);
        border-radius: 8px;
        background: var(--bg-card);
        color: white;
        padding: 12px;
        opacity: 0.95;
        position: relative;
        z-index: 1000;
        max-width: 300px;
    }
    .cdk-drag-placeholder { opacity: 0; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
    .activities-list.cdk-drop-list-dragging .activity-item:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .add-activity-container {
        margin-top: 8px;
    }
    .btn-add-activity {
        width: 100%;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px dashed var(--border-color);
        border-radius: 8px;
        color: var(--accent-color);
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
    }
    .btn-add-activity:hover {
        background: rgba(99, 179, 237, 0.1);
        border-color: var(--accent-color);
    }
    
    .add-activity-form {
        display: flex; gap: 8px;
    }
    .activity-select {
        flex: 1;
        padding: 8px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background: #1a202c;
        color: white;
        font-size: 0.9rem;
    }
    .btn-cancel-add {
        background: none; border: none; color: #fc8181; cursor: pointer; font-size: 1.2rem;
    }
  `]
})
export class ItineraryDayComponent {
  @Input() day!: ItineraryDay;
  @Input() index: number = 0; // Added index input
  private currencyService = inject(CurrencyService);
  weatherService = inject(WeatherService);

  weatherData: WeatherData | null = null;
  private weatherLoadedForLatLon = '';

  // Colors matching Map Component
  readonly DAY_COLORS = [
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#84cc16', // Lime
  ];

  get dayColor(): string {
    return this.DAY_COLORS[this.index % this.DAY_COLORS.length];
  }
  @Input() selectedActivities: Set<number> = new Set();
  @Input() connectedTo: string[] = [];
  @Input() readOnly = false;
  @Input() allSuggestions: Suggestion[] = [];
  @Input() usedSuggestionIds: Set<number> = new Set();

  @Output() dayClick = new EventEmitter<void>();
  @Output() drop = new EventEmitter<CdkDragDrop<any[]>>();
  @Output() toggleSelection = new EventEmitter<any>(); // emit activity
  @Output() viewDetails = new EventEmitter<Suggestion>();
  @Output() editAccommodation = new EventEmitter<ItineraryDay>();
  @Output() addActivity = new EventEmitter<{ day: ItineraryDay, suggestionId: number }>();
  @Output() removeActivity = new EventEmitter<{ day: ItineraryDay, suggestionId: number }>();

  isAdding = false;
  availableSuggestions: Suggestion[] = [];

  ngOnInit() {
    this.loadWeather();
  }

  ngOnChanges(changes: any) {
    if (changes['day']) {
      this.loadWeather();
    }
  }

  loadWeather() {
    if (!this.day || !this.day.date) return;

    // Find location (Accommodation first, then first activity)
    let lat: number | undefined;
    let lon: number | undefined;

    if (this.day.accommodation && this.day.accommodation.latitude && this.day.accommodation.longitude) {
      lat = Number(this.day.accommodation.latitude);
      lon = Number(this.day.accommodation.longitude);
    } else if (this.day.activities.length > 0) {
      const firstAct = this.day.activities[0].suggestion;
      if (firstAct.latitude && firstAct.longitude) {
        lat = Number(firstAct.latitude);
        lon = Number(firstAct.longitude);
      }
    }

    if (lat !== undefined && lon !== undefined) {
      const dateStr = new Date(this.day.date).toISOString().split('T')[0];
      const locationKey = `${lat.toFixed(2)},${lon.toFixed(2)},${dateStr}`;

      // Avoid re-fetching for the exact same inputs
      if (this.weatherLoadedForLatLon !== locationKey) {
        this.weatherService.getWeatherForDate(lat, lon, dateStr).subscribe({
          next: (data) => {
            this.weatherData = data;
            this.weatherLoadedForLatLon = locationKey;
          },
          error: (err) => {
            this.weatherData = null;
            console.error('Weather load error:', err);
          }
        });
      }
    } else {
      this.weatherData = null; // Reset if location removed
    }
  }

  formatPrice(suggestion: Suggestion): string {
    if (!suggestion.price && suggestion.price !== 0) return '';
    const currency = suggestion.country?.currencyCode || 'JPY';
    return this.currencyService.format(suggestion.price, currency);
  }

  isActivitySelected(suggestionId: number): boolean {
    return this.selectedActivities.has(suggestionId);
  }

  get isSelected(): boolean {
    // Logic can be external or passed via input
    // For now simplistic
    return false;
  }


  // Schedule windows (hours of day)
  private static readonly DAY_START = 7;
  private static readonly DAY_END = 17;
  private static readonly EVENING_START = 18;
  private static readonly EVENING_END = 23;

  /**
   * Simulates the day chronologically from 7:00 following activity order
   * (duration + walking travel time) and measures how much of the
   * day window (7h-17h) and evening window (18h-23h) is occupied.
   * The 17h-18h slot is a neutral transition (dinner/commute).
   */
  private computeSchedule(): { dayHours: number; eveningHours: number } {
    const DAY_START = ItineraryDayComponent.DAY_START;
    const DAY_END = ItineraryDayComponent.DAY_END;
    const EVENING_START = ItineraryDayComponent.EVENING_START;

    // Sort activities by order (should be sorted by drag drop, but to be sure)
    const activities = [...this.day.activities].sort((a, b) => a.orderInDay - b.orderInDay);

    let t = DAY_START;
    let dayHours = 0;
    let eveningHours = 0;

    const occupy = (duration: number) => {
      const start = t;
      const end = t + duration;
      // Overlap with the day window
      dayHours += Math.max(0, Math.min(end, DAY_END) - Math.max(start, DAY_START));
      // Overlap with the evening window (open-ended so overload past 23h shows up)
      eveningHours += Math.max(0, end - Math.max(start, EVENING_START));
      t = end;
    };

    activities.forEach((act, index) => {
      // If the previous activity ended in the 17h-18h transition, start this one at 18h
      if (t >= DAY_END && t < EVENING_START) t = EVENING_START;

      // 1. Duration of activity itself
      const duration = act.suggestion.durationHours;
      occupy((duration !== undefined && duration !== null) ? Number(duration) : 2);

      // 2. Travel time to next activity (walking speed 4km/h)
      if (index < activities.length - 1) {
        const nextAct = activities[index + 1];
        const dist = GeoUtils.distance(
          Number(act.suggestion.latitude),
          Number(act.suggestion.longitude),
          Number(nextAct.suggestion.latitude),
          Number(nextAct.suggestion.longitude)
        );
        occupy(isFinite(dist) ? dist / 4.0 : 0);
      }
    });

    return { dayHours, eveningHours };
  }

  get dayLoadPercent(): number {
    const capacity = ItineraryDayComponent.DAY_END - ItineraryDayComponent.DAY_START; // 10h
    return (this.computeSchedule().dayHours / capacity) * 100;
  }

  get eveningLoadPercent(): number {
    const capacity = ItineraryDayComponent.EVENING_END - ItineraryDayComponent.EVENING_START; // 5h
    return (this.computeSchedule().eveningHours / capacity) * 100;
  }

  get dayTotal(): number {
    let total = 0;
    if (this.day.activities) {
      this.day.activities.forEach(act => {
        // Price is usually in local currency, but let's just sum it raw for now or assume converted?
        // The backend sends 'price' on suggestion. 
        // In activity list we show `formatPrice` which uses currency service.
        // If we want EUR total, we need conversion.
        // Let's use the CurrencyService to convert everything to EUR for consistency with the Global Chart.

        if (act.suggestion.price && act.suggestion.country?.currencyCode) {
          const priceEur = this.currencyService.convert(act.suggestion.price, act.suggestion.country.currencyCode, 'EUR');
          total += priceEur || 0;
        }
      });
    }
    if (this.day.accommodation && this.day.accommodation.price && this.day.accommodation.country?.currencyCode) {
      const priceEur = this.currencyService.convert(this.day.accommodation.price, this.day.accommodation.country.currencyCode, 'EUR');
      total += priceEur || 0;
    }
    return total;
  }

  selectDay() {
    this.dayClick.emit();
  }

  onDrop(event: CdkDragDrop<any[]>) {
    this.drop.emit(event);
  }

  formatDate(date: string | Date | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }

  Math = Math; // Make Math accessible in template

  startAdding() {
    this.isAdding = true;
    this.availableSuggestions = this.allSuggestions.filter(s =>
      !this.usedSuggestionIds.has(s.id) &&
      s.category !== SuggestionCategory.HEBERGEMENT
    );
  }

  onActivitySelected(event: any) {
    const id = Number(event.target.value);
    if (id) {
      this.addActivity.emit({ day: this.day, suggestionId: id });
      this.isAdding = false;
    }
  }

  getCategoryIcon(category: string | SuggestionCategory): string {
    switch (category) {
      case SuggestionCategory.HEBERGEMENT: return '🏨';
      case SuggestionCategory.RESTAURANT: return '🍽️';
      case SuggestionCategory.TRANSPORT: return '🚆';
      case SuggestionCategory.AUTRE: return '🧾';
      case SuggestionCategory.TEMPLE: return '⛩️';
      case SuggestionCategory.NATURE: return '🌳';
      case SuggestionCategory.SHOPPING: return '🛍️';
      case SuggestionCategory.MUSEE: return '🎨';
      default: return '📍';
    }
  }

  cancelAdd() {
    this.isAdding = false;
  }
}
