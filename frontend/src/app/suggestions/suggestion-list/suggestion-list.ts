import { Component, OnInit, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SuggestionsService, Suggestion, SuggestionCategory } from '../../core/services/suggestions';
import { AuthService } from '../../core/services/auth';
import { PreferencesService, UserPreference } from '../../core/services/preferences';
import { PreferenceSelectorComponent } from '../preference-selector/preference-selector';

@Component({
  selector: 'app-suggestion-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PreferenceSelectorComponent, FormsModule],
  template: `
    <div class="header-actions fade-in">
      <div>
        <h1>Suggestions de Visite</h1>
        <p>Découvrez les lieux proposés par le groupe</p>
      </div>
      <a routerLink="/suggestions/new" class="btn btn-primary">
        + Ajouter un lieu
      </a>
    </div>

    <!-- FILTER BAR -->
    <div class="filter-bar card glass fade-in" style="animation-delay: 50ms;">
      <div class="filter-group">
        <span class="icon">🔍</span>
        <input 
          type="text" 
          placeholder="Rechercher un lieu..." 
          [(ngModel)]="searchQuery"
          class="filter-input"
        >
      </div>

      <div class="filter-group">
        <select [(ngModel)]="selectedCategory" class="filter-select">
          <option value="">Toutes catégories</option>
          <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="filter-group">
        <select [(ngModel)]="sortOrder" class="filter-select">
          <option value="recent">Plus récents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="votes">Populaires (Votes)</option>
        </select>
      </div>
    </div>

    <div class="suggestions-grid fade-in" style="animation-delay: 100ms;">
      <div *ngFor="let suggestion of filteredSuggestions(); trackBy: trackById" class="card glass suggestion-card">
        <div class="card-image" [style.backgroundImage]="'url(' + (suggestion.photoUrl || 'assets/placeholder-japan.jpg') + ')'">
          <span class="badge badge-secondary category-badge">{{ suggestion.category }}</span>
        </div>
        
        <div class="card-content">
          <div class="card-header-row">
            <h3>{{ suggestion.name }}</h3>
            <!-- PREFERENCE SELECTOR -->
            <app-preference-selector
              [suggestionId]="suggestion.id"
              [preference]="getPreference(suggestion)"
              (preferenceChange)="onPreferenceChange(suggestion, $event)"
            ></app-preference-selector>
          </div>
          
          <p class="location">📍 {{ suggestion.location }}</p>
          
          <div class="price-tag" *ngIf="suggestion.price">
            {{ suggestion.price }} €
          </div>
          
          <p class="description">{{ suggestion.description | slice:0:100 }}{{ suggestion.description.length > 100 ? '...' : '' }}</p>
          
          <div class="card-footer">
            <span class="author">Par {{ suggestion.createdBy.username }}</span>
            <div class="actions" *ngIf="canEdit(suggestion)">
              <a [routerLink]="['/suggestions/edit', suggestion.id]" class="btn-icon">✏️</a>
              <button (click)="deleteSuggestion(suggestion.id)" class="btn-icon delete">🗑️</button>
            </div>
          </div>

          <!-- Social Proof Footer -->
          <div class="social-proof" *ngIf="getVoteCount(suggestion) > 0">
            <div class="voters">
              <div *ngFor="let voter of getVoters(suggestion)" class="avatar" [title]="voter.username">
               {{ voter.username.charAt(0).toUpperCase() }}
              </div>
            </div>
            <span class="vote-count">{{ getVoteCount(suggestion) }} intéressés</span>
          </div>
        </div>
      </div>

      <div *ngIf="filteredSuggestions().length === 0" class="empty-state">
        <p>Aucune suggestion pour le moment. Soyez le premier à en ajouter une ! 🎌</p>
      </div>
    </div>
  `,
  styles: [`
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .filter-bar {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 2rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(0,0,0,0.2);
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-glass-border);
      flex: 1;
      min-width: 200px;
    }
    .filter-input, .filter-select {
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      width: 100%;
      font-size: 0.95rem;
      outline: none;
    }
    .filter-select {
      cursor: pointer;
    }
    .filter-select option {
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
    }
    .icon {
      opacity: 0.7;
    }
    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
    }
    .suggestion-card {
      padding: 0;
      /* overflow: hidden;  <-- REMOVED to allow popup to show */
      display: flex;
      flex-direction: column;
      height: 100%;
      border-radius: var(--radius-lg); /* keep border radius on card */
    }
    .card-image {
      height: 200px;
      background-size: cover;
      background-position: center;
      position: relative;
      /* Manually fix top corners since overflow is visible */
      border-top-left-radius: var(--radius-lg);
      border-top-right-radius: var(--radius-lg);
    }
    .category-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
    }
    .card-content {
      padding: 1.5rem;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }
    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center; /* Center align for the heart button */
      margin-bottom: 0.5rem;
      position: relative; /* Context for z-index stacking if needed */
    }
    .card-header-row h3 {
      margin-bottom: 0;
      line-height: 1.2;
      flex: 1;
      padding-right: 1rem;
    }
    .location {
      font-size: 0.9rem;
      color: var(--color-primary-light);
      margin-bottom: 1rem;
    }
    .description {
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
      flex-grow: 1;
    }
    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid var(--color-glass-border);
      font-size: 0.85rem;
      color: var(--color-text-tertiary);
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
      transition: transform 0.2s;
    }
    .btn-icon:hover {
      transform: scale(1.2);
    }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem;
      background: var(--color-glass-bg);
      border-radius: var(--radius-lg);
      font-size: 1.2rem;
      color: var(--color-text-secondary);
    }
    
    .social-proof {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .voters {
      display: flex;
      padding-left: 0.5rem;
    }
    .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--color-primary-light);
      color: var(--color-text-primary);
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: -0.5rem;
      border: 2px solid var(--color-bg-elevated);
      font-weight: bold;
    }
    .vote-count {
      font-size: 0.8rem;
      color: var(--color-text-tertiary);
    }
  `]
})
export class SuggestionListComponent implements OnInit {
  // Use Signal for reactive state
  suggestions: WritableSignal<Suggestion[]> = signal([]);

  // Filter Signals
  searchQuery = signal('');
  selectedCategory = signal('');
  sortOrder = signal('recent');

  categories = Object.values(SuggestionCategory);

  // Computed Filtered Suggestions
  filteredSuggestions = computed(() => {
    let list = this.suggestions();
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const sort = this.sortOrder();

    // 1. Filter by Search Query
    if (query) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.location.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
      );
    }

    // 2. Filter by Category
    if (category) {
      list = list.filter(s => s.category === category);
    }

    // 3. Sort
    switch (sort) {
      case 'recent':
        return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'price_asc':
        return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'price_desc':
        return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case 'votes':
        return list.sort((a, b) => this.getVoteCount(b) - this.getVoteCount(a));
      default:
        return list;
    }
  });

  currentUser: any;

  constructor(
    private suggestionsService: SuggestionsService,
    private preferencesService: PreferencesService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
  }

  ngOnInit() {
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.suggestionsService.getAll().subscribe({
      next: (data) => this.suggestions.set(data),
      error: (err) => console.error(err)
    });
  }

  // Get my preference for a specific suggestion from its own loaded preferences
  getPreference(suggestion: Suggestion): UserPreference | undefined {
    return suggestion.preferences?.find(p => p.userId === this.currentUser?.id);
  }

  onPreferenceChange(suggestion: Suggestion, updatedPref: UserPreference) {
    console.log('Updating preference:', updatedPref, 'for suggestion:', suggestion.id);
    this.suggestions.update(currentSuggestions => {
      return currentSuggestions.map(s => {
        if (s.id !== suggestion.id) return s;

        // Clone preferences array efficiently
        const newPreferences = s.preferences ? [...s.preferences] : [];
        const existingIndex = newPreferences.findIndex(p => p.userId === this.currentUser.id);

        if (existingIndex > -1) {
          // MERGE with existing preference instead of replacing completely
          const existingPref = newPreferences[existingIndex];
          newPreferences[existingIndex] = {
            ...existingPref,           // Keep all existing fields
            ...updatedPref,            // Override with new values from backend
            user: updatedPref.user || existingPref.user || this.currentUser  // Ensure user is always present
          };
          console.log('Merged preference:', newPreferences[existingIndex]);
        } else {
          // New preference - ensure user is attached
          newPreferences.push({
            ...updatedPref,
            user: updatedPref.user || this.currentUser
          });
        }

        return { ...s, preferences: newPreferences };
      });
    });
  }

  canEdit(suggestion: Suggestion): boolean {
    return this.currentUser &&
      (this.currentUser.role === 'super_admin' || this.currentUser.id === suggestion.createdById);
  }

  deleteSuggestion(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette suggestion ?')) {
      this.suggestionsService.delete(id).subscribe({
        next: () => {
          this.suggestions.update(list => list.filter(s => s.id !== id));
        },
        error: (err) => alert('Erreur lors de la suppression')
      });
    }
  }

  getVoteCount(suggestion: Suggestion): number {
    return suggestion.preferences?.filter(p => p.selected).length || 0;
  }

  getVoters(suggestion: Suggestion): any[] {
    return suggestion.preferences?.filter(p => p.selected && p.user).map(p => p.user) || [];
  }

  // Use arrow function to capture 'this' context safely and properties
  trackById = (index: number, suggestion: Suggestion): number => {
    return suggestion.id;
  }
}
