import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, DestroyRef, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ItineraryStateService } from '../core/services/itinerary-state.service';
import { ItineraryService, ItineraryDay } from '../core/services/itinerary';
import { SuggestionsService, Suggestion, SuggestionCategory } from '../core/services/suggestions';

// Import sub-components
import { ItineraryMapComponent } from './components/itinerary-map/itinerary-map.component';
import { ItineraryHeaderComponent } from './components/itinerary-header/itinerary-header.component';
import { ItineraryDayComponent } from './components/itinerary-day/itinerary-day.component';

@Component({
  selector: 'app-itinerary-viewer',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    ItineraryMapComponent,
    ItineraryHeaderComponent,
    ItineraryDayComponent
  ],
  template: `
    <div class="viewer-layout" *ngIf="itinerary$ | async as itinerary">
      
      <!-- LEFT PANEL: CONTENT -->
      <div class="viewer-content">
        <app-itinerary-header 
          [itinerary]="itinerary"
          [costBreakdown]="(costBreakdown$ | async) || {}"
          (delete)="deleteItinerary()">
        </app-itinerary-header>

        <div class="days-container" cdkDropListGroup>
          <app-itinerary-day
            *ngFor="let day of itinerary.days"
            [day]="day"
            [connectedTo]="allDayIds"
            [selectedActivities]="selectedActivities"
            (dayClick)="onDaySelected(day)"
            (editAccommodation)="startEditAccommodation($event)"
            (viewDetails)="viewActivityDetails($event)"
            (toggleSelection)="toggleSelection($event.suggestionId)"
            (drop)="onDrop($event, day)">
          </app-itinerary-day>
        </div>
      </div>

      <!-- RIGHT PANEL: MAP -->
      <div class="viewer-map">
        <div class="map-sticky">
          <app-itinerary-map
            [itinerary]="itinerary"
            [selectedDay]="selectedDay$ | async">
          </app-itinerary-map>
        </div>
      </div>

    </div>

    <!-- ACCOMMODATION MODAL -->
    <div class="modal-overlay" *ngIf="showAccommodationModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Choisir un hébergement (Jour {{ editingDay?.dayNumber }})</h3>
                <button class="btn-close" (click)="closeAccommodationModal()">×</button>
            </div>
            
            <div class="modal-search">
                <input type="text" placeholder="Rechercher un hôtel..." 
                       (input)="filterAccommodations($any($event.target).value)" 
                       [value]="searchQuery">
            </div>

            <div class="modal-list">
                <div class="modal-item placeholder-item" (click)="selectAccommodationFromModal(null)">
                    <span>🚫 Aucun hébergement / Supprimer</span>
                </div>
                <div class="modal-item" *ngFor="let acc of filteredAccommodations" (click)="selectAccommodationFromModal(acc)">
                    <div class="item-info">
                        <strong>{{ acc.name }}</strong>
                        <span class="item-loc">{{ acc.location }}</span>
                    </div>
                    <span class="item-price" *ngIf="acc.price">{{ acc.price }}€</span>
                </div>
            </div>
        </div>
    </div>

    <div class="loading-overlay" *ngIf="loading$ | async">
      <div class="spinner"></div>
    </div>

    <!-- SELECTION BAR -->
    <div class="selection-footer" *ngIf="selectedActivities.size > 0">
        <div class="selection-container">
            <div class="selection-status">
                <span class="count">{{ selectedActivities.size }}</span>
                <span>activités sélectionnées</span>
            </div>
            
            <div class="selection-actions">
                <span class="label">Déplacer vers :</span>
                <div class="day-selector">
                    <button *ngFor="let day of (itinerary$ | async)?.days" 
                            (click)="moveSelectedToDay(day.dayNumber)"
                            class="btn-day-move">
                        J{{ day.dayNumber }}
                    </button>
                </div>
                <div class="divider"></div>
                <button class="btn-cancel" (click)="deselectAll()">Annuler</button>
            </div>
        </div>
    </div>
  `,
  styles: [`
    .viewer-layout {
      display: grid;
      grid-template-columns: 1fr 450px;
      gap: 24px;
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      height: calc(100vh - 64px);
    }
    .viewer-content { overflow-y: auto; padding-right: 12px; padding-bottom: 100px; }
    .days-container { display: flex; flex-direction: column; gap: 24px; }
    .viewer-map { height: 100%; }
    .map-sticky { position: sticky; top: 0; height: 100%; border-radius: 16px; overflow: hidden; }

    .loading-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 2000;
      display: flex; justify-content: center; align-items: center;
    }
    .spinner {
      width: 50px; height: 50px;
      border: 5px solid #2d3748;
      border-top: 5px solid #63b3ed;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    /* Selection Footer */
    .selection-footer {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 4000;
        background: #2d3748;
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        border: 1px solid #4a5568;
        animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp { from { transform: translate(-50%, 100px); } to { transform: translate(-50%, 0); } }

    .selection-container {
        display: flex;
        align-items: center;
        gap: 24px;
        white-space: nowrap;
    }
    .selection-status { display: flex; align-items: center; gap: 8px; font-weight: 500; }
    .selection-status .count {
        background: #63b3ed;
        color: #1a202c;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-weight: 700;
        font-size: 0.9rem;
    }

    .selection-actions { display: flex; align-items: center; gap: 16px; }
    .selection-actions .label { color: #a0aec0; font-size: 0.9rem; }
    
    .day-selector { display: flex; gap: 6px; }
    .btn-day-move {
        background: #1a202c;
        color: white;
        border: 1px solid #4a5568;
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;
    }
    .btn-day-move:hover { background: #4a5568; border-color: #63b3ed; }

    .divider { width: 1px; height: 24px; background: #4a5568; margin: 0 4px; }
    
    .btn-cancel {
        background: none;
        border: none;
        color: #fc8181;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
    }
    .btn-cancel:hover { text-decoration: underline; }

    /* Modal Styles */
    .modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 3000;
        display: flex; justify-content: center; align-items: center;
    }
    .modal-content {
        background: #2d3748;
        color: white;
        width: 500px;
        max-width: 90%;
        max-height: 80vh;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        display: flex; flex-direction: column;
        overflow: hidden;
        border: 1px solid #4a5568;
    }
    .modal-header {
        padding: 16px;
        border-bottom: 1px solid #4a5568;
        display: flex; justify-content: space-between; align-items: center;
        background: #1a202c;
    }
    .modal-header h3 { margin: 0; font-size: 1.1rem; }
    .btn-close {
        background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #a0aec0;
    }
    .modal-search { padding: 12px; border-bottom: 1px solid #4a5568; background: #2d3748; }
    .modal-search input {
        width: 100%; padding: 10px; border: 1px solid #4a5568; border-radius: 8px; font-size: 1rem;
        background: #1a202c; color: white;
    }
    .modal-list {
        overflow-y: auto;
        padding: 8px;
        display: flex; flex-direction: column; gap: 4px;
        background: #2d3748;
    }
    .modal-item {
        padding: 10px;
        border-radius: 6px;
        cursor: pointer;
        display: flex; justify-content: space-between; align-items: center;
        transition: background 0.2s;
    }
    .modal-item:hover { background: #4a5568; }
    .placeholder-item { color: #fc8181; font-weight: 500; font-style: italic; }
    .item-info { display: flex; flex-direction: column; }
    .item-loc { font-size: 0.8rem; color: #a0aec0; }
    .item-price { font-weight: bold; color: #68d391; font-size: 0.9rem; }

    @media (max-width: 1024px) {
      .viewer-layout { grid-template-columns: 1fr; height: auto; }
      .viewer-map { height: 400px; order: -1; }
      .map-sticky { position: relative; }
    }
  `]
})
export class ItineraryViewerComponent implements OnInit, OnDestroy {
  // Services
  private stateService = inject(ItineraryStateService);
  private itineraryService = inject(ItineraryService);
  private suggestionsService = inject(SuggestionsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // State
  itinerary$ = this.stateService.itinerary$;
  loading$ = this.stateService.loading$;
  selectedDay$ = this.stateService.selectedDay$;
  costBreakdown$ = this.stateService.costBreakdown$;

  // Local UI state
  selectedActivities = new Set<number>();
  allDayIds: string[] = [];

  // Modal State
  showAccommodationModal = false;
  editingDay: ItineraryDay | null = null;
  accommodations: Suggestion[] = [];
  filteredAccommodations: Suggestion[] = [];
  searchQuery = '';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['id']) {
          this.loadItinerary(Number(params['id']));
        }
      });

    // Subscribe to itinerary to update IDs
    this.itinerary$.subscribe(itinerary => {
      if (itinerary) {
        this.allDayIds = itinerary.days.map(d => `day-list-${d.dayNumber}`);
      }
    });

    // Load available accommodations once
    if (isPlatformBrowser(this.platformId)) {
      this.loadAccommodations();
    }
  }

  loadAccommodations() {
    this.suggestionsService.getAll().subscribe(suggestions => {
      this.accommodations = suggestions.filter(s => s.category === SuggestionCategory.HEBERGEMENT);
      this.filteredAccommodations = this.accommodations;
    });
  }

  filterAccommodations(query: string) {
    this.searchQuery = query;
    if (!query) {
      this.filteredAccommodations = this.accommodations;
    } else {
      const lower = query.toLowerCase();
      this.filteredAccommodations = this.accommodations.filter(s =>
        s.name.toLowerCase().includes(lower) ||
        (s.location && s.location.toLowerCase().includes(lower))
      );
    }
  }

  ngOnDestroy() {
    this.stateService.selectDay(null);
  }

  loadItinerary(id: number) {
    this.itineraryService.getOne(id).subscribe({
      next: (data) => this.stateService.setItinerary(data),
      error: (err) => {
        console.error('Error loading itinerary', err);
        alert('Itinéraire introuvable');
        this.router.navigate(['/']);
      }
    });
  }

  onDaySelected(day: ItineraryDay) {
    this.stateService.selectDay(day);
  }

  toggleSelection(suggestionId: number) {
    if (this.selectedActivities.has(suggestionId)) {
      this.selectedActivities.delete(suggestionId);
    } else {
      this.selectedActivities.add(suggestionId);
    }
  }

  deselectAll() {
    this.selectedActivities.clear();
  }

  moveSelectedToDay(targetDayNumber: number) {
    const itinerary = this.stateService.getItinerary();
    if (!itinerary) return;

    // 1. Identify items to move
    const movingIds = Array.from(this.selectedActivities);

    // 2. Build the new structure
    const daysPayload = itinerary.days.map((d: ItineraryDay) => {
      // Remove items from wherever they are
      let activities = d.activities.filter((a: any) => !this.selectedActivities.has(a.suggestionId));

      // If this is the target day, add them at the end
      if (d.dayNumber === targetDayNumber) {
        movingIds.forEach((id: number) => {
          // Find original activity to preserve suggestion
          const originalAct = itinerary.days.flatMap((day: ItineraryDay) => day.activities).find((a: any) => a.suggestionId === id);
          if (originalAct) {
            activities.push({ ...originalAct });
          }
        });
      }

      return {
        dayNumber: d.dayNumber,
        activities: activities.map((act: any, idx: number) => ({
          suggestionId: act.suggestionId,
          orderInDay: idx + 1
        }))
      };
    });

    this.stateService.reorderAll(itinerary.id, daysPayload);
    this.deselectAll();
  }

  viewActivityDetails(suggestion: Suggestion) {
    const itinerary = this.stateService.getItinerary();
    this.router.navigate(['/suggestions', suggestion.id], {
      queryParams: { itineraryId: itinerary?.id }
    });
  }

  deleteItinerary() {
    const itinerary = this.stateService.getItinerary();
    if (!itinerary) return;

    if (confirm('Voulez-vous vraiment supprimer cet itinéraire ?')) {
      this.itineraryService.delete(itinerary.id).subscribe(() => {
        this.router.navigate(['/dashboard']);
      });
    }
  }

  startEditAccommodation(day: ItineraryDay) {
    this.editingDay = day;
    this.searchQuery = '';
    this.filteredAccommodations = this.accommodations;
    this.showAccommodationModal = true;
  }

  closeAccommodationModal() {
    this.showAccommodationModal = false;
    this.editingDay = null;
  }

  selectAccommodationFromModal(suggestion: Suggestion | null) {
    if (!this.editingDay) return;

    const itinerary = this.stateService.getItinerary();
    if (itinerary) {
      this.stateService.updateAccommodation(itinerary.id, this.editingDay.dayNumber, suggestion ? suggestion.id : null);
    }
    this.closeAccommodationModal();
  }

  onDrop(event: CdkDragDrop<any[]>, targetDay: ItineraryDay) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateOrder(targetDay);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      this.saveFullReorder();
    }

    // Force immediate local update for subscribers (like the map) 
    // by pushing a new reference of the itinerary
    const itinerary = this.stateService.getItinerary();
    if (itinerary) {
      this.stateService.setItinerary({ ...itinerary, days: [...itinerary.days] });
    }
  }

  private updateOrder(day: ItineraryDay) {
    day.activities.forEach((act, index) => {
      act.orderInDay = index + 1;
    });

    const itinerary = this.stateService.getItinerary();
    if (itinerary) {
      this.stateService.reorderActivities(
        itinerary.id,
        day.dayNumber,
        day.activities.map(a => a.suggestionId)
      );
    }
  }

  private saveFullReorder() {
    const itinerary = this.stateService.getItinerary();
    if (!itinerary) return;

    const daysPayload = itinerary.days.map(d => ({
      dayNumber: d.dayNumber,
      activities: d.activities.map((act, idx) => {
        act.orderInDay = idx + 1;
        return {
          suggestionId: act.suggestionId,
          orderInDay: idx + 1
        };
      })
    }));

    this.stateService.reorderAll(itinerary.id, daysPayload);
  }
}

