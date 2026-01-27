import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Itinerary } from '../../../core/services/itinerary';

@Component({
  selector: 'app-itinerary-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="viewer-header" *ngIf="itinerary">
      <div class="header-main">
        <div class="header-title">
          <h1>{{ itinerary.name }}</h1>
          <div class="trip-meta">
            <span class="badge days">{{ itinerary.totalDays }} Jours</span>
            <span class="badge cost">{{ itinerary.totalCost | currency:'EUR':'symbol':'1.0-0' }}</span>
            <span class="date-range" *ngIf="itinerary.days[0].date">
              {{ formatDate(itinerary.days[0].date) }} - 
              {{ formatDate(itinerary.days[itinerary.totalDays-1].date) }}
            </span>
          </div>
        </div>
        <div class="header-actions" *ngIf="!readOnly">
          <button class="btn-delete" (click)="delete.emit()">
            Supprimer
          </button>
        </div>
      </div>

      <div class="cost-breakdown" *ngIf="costBreakdown">
        <div class="cost-item" *ngFor="let item of costBreakdown | keyvalue">
          <span class="label">{{ item.key }}</span>
          <span class="value">{{ item.value | currency:'EUR':'symbol':'1.0-0' }}</span>
          <div class="bar" [style.width.%]="getPercent(item.value)"></div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .viewer-header {
      background: white;
      padding: 24px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      margin-bottom: 24px;
    }
    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .header-title h1 {
      margin: 0 0 12px 0;
      font-size: 2rem;
      color: #2c3e50;
    }
    .trip-meta {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .badge.days { background: #e3f2fd; color: #1976d2; }
    .badge.cost { background: #fce4ec; color: #c2185b; }
    .date-range { color: #666; font-size: 0.95rem; }
    
    .btn-delete {
      background: #ffebee;
      color: #c62828;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn-delete:hover { background: #ffcdd2; }

    .cost-breakdown {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid #eee;
    }
    .cost-item { position: relative; padding-bottom: 8px; }
    .cost-item .label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 4px; }
    .cost-item .value { display: block; font-weight: 600; color: #2c3e50; }
    .cost-item .bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: #3498db;
      border-radius: 2px;
      transition: width 0.3s ease;
    }
  `]
})
export class ItineraryHeaderComponent {
  @Input() itinerary: Itinerary | null = null;
  @Input() costBreakdown: { [key: string]: number } | null = null;
  @Input() readOnly = false;
  @Output() delete = new EventEmitter<void>();

  formatDate(date: string | Date | null): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }

  getPercent(amount: number): number {
    if (!this.itinerary || this.itinerary.totalCost === 0) return 0;
    return (amount / this.itinerary.totalCost) * 100;
  }
}
