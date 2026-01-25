import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripConfigService, TripConfig } from '../core/services/trip-config';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-trip-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container fade-in">
      <div class="config-card glass">
        <div class="header">
          <h1>⚙️ Configuration du Voyage</h1>
          <p>Définissez les paramètres globaux du projet</p>
        </div>

        <form (ngSubmit)="onSubmit()" #configForm="ngForm" *ngIf="config">
          
          <div class="form-group">
            <label>Durée du voyage (jours)</label>
            <div class="input-wrapper">
              <input 
                type="number" 
                [(ngModel)]="config.durationDays" 
                name="durationDays"
                step="1" 
                min="1" 
                max="365"
                required
                class="form-input"
              >
              <span class="unit">jours</span>
            </div>
          </div>

          <div class="row">
            <div class="form-group col">
              <label>Date de début (Optionnel)</label>
              <input 
                type="date" 
                [ngModel]="formatDate(config.startDate)" 
                (ngModelChange)="updateStartDate($event)"
                name="startDate"
                class="form-input"
              >
            </div>

            <div class="form-group col">
              <label>Date de fin (Optionnel)</label>
              <input 
                type="date" 
                [ngModel]="formatDate(config.endDate)" 
                (ngModelChange)="updateEndDate($event)"
                name="endDate"
                class="form-input"
              >
            </div>
          </div>

          <div class="actions">
            <button type="button" class="btn btn-ghost" routerLink="/">Annuler</button>
            <button type="submit" class="btn btn-primary" [disabled]="!configForm.form.valid || loading">
              {{ loading ? 'Enregistrement...' : 'Sauvegarder' }}
            </button>
          </div>

          <div *ngIf="message" class="message" [class.error]="isError">
            {{ message }}
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .config-card {
      padding: 2rem;
      border-radius: var(--radius-lg);
      background: var(--color-bg-elevated);
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .header h1 {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }
    .header p {
      color: var(--color-text-secondary);
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--color-text-primary);
    }
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .form-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--color-glass-border);
      color: white;
      padding: 0.75rem;
      border-radius: var(--radius-md);
      font-family: inherit;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(255, 107, 157, 0.2);
    }
    .unit {
      position: absolute;
      right: 1rem;
      color: var(--color-text-secondary);
      pointer-events: none;
    }
    .row {
      display: flex;
      gap: 1rem;
    }
    .col {
      flex: 1;
    }
    .help-text {
      font-size: 0.85rem;
      color: var(--color-text-tertiary);
      margin-top: 0.5rem;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }
    .message {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: var(--radius-md);
      background: rgba(76, 175, 80, 0.1);
      color: var(--color-success);
      text-align: center;
    }
    .message.error {
      background: rgba(244, 67, 54, 0.1);
      color: #ff4d4d;
    }
  `]
})
export class TripConfigComponent implements OnInit {
  config: TripConfig | null = null;
  loading = false;
  message = '';
  isError = false;

  constructor(private tripConfigService: TripConfigService) { }

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.tripConfigService.getConfig().subscribe({
      next: (data: TripConfig) => {
        this.config = data;
      },
      error: (err: any) => console.error(err)
    });
  }

  onSubmit() {
    if (!this.config) return;

    this.loading = true;
    this.message = '';
    this.isError = false;

    // Call API with partial update
    this.tripConfigService.updateConfig({
      durationDays: this.config.durationDays,
      startDate: this.config.startDate,
      endDate: this.config.endDate
    }).subscribe({
      next: (updated: TripConfig) => {
        this.config = updated;
        this.loading = false;
        this.message = 'Configuration enregistrée avec succès ! ✅';
        setTimeout(() => this.message = '', 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.isError = true;
        this.message = 'Erreur lors de la sauvegarde. Vérifiez vos droits.';
      }
    });
  }

  // Helpers for date input (HTML date input expects YYYY-MM-DD string)
  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  }

  updateStartDate(value: string) {
    if (this.config) this.config.startDate = value || null;
  }

  updateEndDate(value: string) {
    if (this.config) this.config.endDate = value || null;
  }
}
