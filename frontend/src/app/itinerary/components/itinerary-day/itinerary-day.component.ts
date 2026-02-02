import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ItineraryDay } from '../../../core/services/itinerary';
import { Suggestion, SuggestionCategory } from '../../../core/services/suggestions';
import { GeoUtils } from '../../../core/utils/geo.utils';
import { CurrencyService } from '../../../core/services/currency.service';

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
        </div>
        <div class="day-load" [class.overload]="loadPercent > 100">
          <div class="load-bar" [style.width.%]="Math.min(loadPercent, 100)"></div>
          <span class="load-text">{{ loadPercent | number:'1.0-0' }}%</span>
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
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 4px solid var(--border-color); /* Thicker border to show color */
    }
    .day-info h3 { margin: 0; font-size: 1.25rem; color: var(--text-primary); font-weight: 700; }
    .day-info .date { font-size: 0.85rem; color: var(--text-secondary); }

    .day-load {
        width: 60px;
        height: 6px;
        background: #4a5568;
        border-radius: 3px;
        position: relative;
        margin-top: 6px;
    }
    .day-load .load-bar {
        height: 100%;
        background: var(--success-color);
        border-radius: 3px;
    }
    .day-load.overload .load-bar { background: #fc8181; }
    .load-text {
        position: absolute;
        right: -28px;
        top: -7px;
        font-size: 0.75rem;
        color: var(--text-secondary);
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

  isAdding = false;
  availableSuggestions: Suggestion[] = [];

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


  get loadPercent(): number {
    let hours = 0;

    // Sort activities by order (should be sorted by drag drop, but to be sure)
    const activities = [...this.day.activities].sort((a, b) => a.orderInDay - b.orderInDay);

    activities.forEach((act, index) => {
      // 1. Duration of activity itself
      const duration = act.suggestion.durationHours;
      hours += (duration !== undefined && duration !== null) ? Number(duration) : 2;

      // 2. Travel time to next activity
      if (index < activities.length - 1) {
        const nextAct = activities[index + 1];
        const dist = GeoUtils.distance(
          Number(act.suggestion.latitude),
          Number(act.suggestion.longitude),
          Number(nextAct.suggestion.latitude),
          Number(nextAct.suggestion.longitude)
        );
        // Walking speed 4km/h
        hours += dist / 4.0;
      }
    });

    return (hours / 8) * 100; // Assuming 8h is 100% capacity
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
