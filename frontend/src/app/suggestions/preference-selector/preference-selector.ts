import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { PreferencesService, Priority, UserPreference } from '../../core/services/preferences';

@Component({
  selector: 'app-preference-selector',
  standalone: true,
  imports: [CommonModule, NgIf],
  template: `
    <div class="pref-container">
      <div class="vote-row">
        <!-- Vote Toggle (Heart) -->
        <button 
          class="btn-vote" 
          [class.active]="preference?.selected"
          (click)="onHeartClick()"
          [title]="preference?.selected ? 'Modifier mon vote' : 'Je veux faire ça !'"
        >
          ❤️
        </button>

        <!-- Vote Summary Labels (Visible when voted) -->
        <div class="vote-summary" *ngIf="preference?.selected" (click)="onHeartClick()">
          <span 
            class="summary-badge"
            [class.badge-success]="preference?.priority === 'INDISPENSABLE'"
            [class.badge-warning]="preference?.priority === 'SI_POSSIBLE'"
            [class.badge-secondary]="preference?.priority === 'BONUS'"
          >
            {{ getLabel(preference?.priority || Priority.SI_POSSIBLE) }}
          </span>
        </div>
      </div>

      <!-- Options Panel (Visible via isOpen state) -->
      <div class="pref-options fade-in" *ngIf="isOpen && preference?.selected">
        
        <div class="options-row">
          <span class="label">Priorité :</span>
          <div class="priority-group">
            <button 
              *ngFor="let p of priorities"
              class="badge"
              [class.selected]="preference?.priority === p"
              [class.badge-success]="p === 'INDISPENSABLE'"
              [class.badge-warning]="p === 'SI_POSSIBLE'"
              [class.badge-secondary]="p === 'BONUS'"
              (click)="setPriority(p)"
            >
              {{ getLabel(p) }}
            </button>
          </div>
        </div>

        <div class="options-footer">
          <button class="btn-text-danger" (click)="removeVote()">🗑️ Retirer mon vote</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .pref-container {
      position: relative;
      width: auto;
    }
    .vote-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .vote-summary {
      display: flex;
      gap: 0.25rem;
      cursor: pointer;
    }
    .summary-badge {
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid var(--color-glass-border);
      white-space: nowrap;
    }
    .summary-badge.badge-success { color: var(--color-success); border-color: var(--color-success); background: rgba(76, 175, 80, 0.1); }
    .summary-badge.badge-warning { color: var(--color-warning); border-color: var(--color-warning); background: rgba(255, 152, 0, 0.1); }
    .summary-badge.mode-badge { color: var(--color-accent); border-color: var(--color-accent); }

    .btn-vote {
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid transparent;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: flex-start; 
    }
    .btn-vote:hover {
      transform: scale(1.1);
      background: rgba(255, 107, 157, 0.2);
    }
    .btn-vote.active {
      background: var(--color-primary);
      border-color: var(--color-primary-light);
      box-shadow: 0 0 15px var(--color-primary);
    }
    
    .pref-options {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 100;
      min-width: 250px;
      background: var(--color-bg-elevated);
      padding: 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-glass-border);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
      backdrop-filter: blur(10px);
    }

    .options-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: space-between;
    }

    .label {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      font-weight: 500;
      min-width: 70px;
    }
    
    .priority-group {
      display: flex;
      gap: 0.5rem;
    }
    .badge {
      cursor: pointer;
      opacity: 0.4;
      border: 1px solid transparent;
      transition: all 0.2s;
      padding: 0.25rem 0.75rem;
      font-size: 0.8rem;
    }
    .badge:hover {
      opacity: 0.7;
    }
    .badge.selected {
      opacity: 1;
      border-color: currentColor;
      transform: scale(1.05);
      font-weight: bold;
    }
    
    .mode-toggle {
      display: flex;
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-sm);
      padding: 2px;
    }
    .mode-toggle button {
      background: transparent;
      border: none;
      color: var(--color-text-tertiary);
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
    }
    .mode-toggle button.active {
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .options-footer {
      border-top: 1px solid var(--color-glass-border);
      padding-top: 0.5rem;
      text-align: center;
    }
    .btn-text-danger {
      background: none;
      border: none;
      color: #ff4d4d;
      font-size: 0.8rem;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .btn-text-danger:hover {
      opacity: 1;
      text-decoration: underline;
    }
  `]
})
export class PreferenceSelectorComponent {
  @Input() suggestionId!: number;
  @Input() preference: UserPreference | undefined;
  @Output() preferenceChange = new EventEmitter<UserPreference>();

  Priority = Priority; // Expose enum to template
  priorities = Object.values(Priority);

  isOpen = false; // Local state for menu visibility

  constructor(private preferencesService: PreferencesService) { }

  onHeartClick() {
    if (this.preference?.selected) {
      // If already voted, just toggle the menu without API call
      this.isOpen = !this.isOpen;
    } else {
      // If not voted, vote YES and open menu
      this.update({ selected: true });
      this.isOpen = true;
    }
  }

  removeVote() {
    this.update({ selected: false });
    this.isOpen = false;
  }

  setPriority(priority: Priority) {
    this.update({ priority });
  }

  getLabel(priority: Priority): string {
    switch (priority) {
      case Priority.INDISPENSABLE: return 'Indispensable';
      case Priority.SI_POSSIBLE: return 'Si possible';
      case Priority.BONUS: return 'Bonus';
      default: return priority;
    }
  }

  private update(changes: { selected?: boolean; priority?: Priority }) {
    this.preferencesService.updateVote(this.suggestionId, changes).subscribe({
      next: (pref) => {
        this.preference = pref;
        this.preferenceChange.emit(pref);
      },
      error: (err) => console.error(err)
    });
  }
}
