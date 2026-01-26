import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="loading-overlay" *ngIf="loadingService.loading$ | async">
      <div class="spinner-container">
        <div class="spinner"></div>
        <p class="loading-text">Chargement...</p>
        <p class="loading-hint">La première connexion peut prendre jusqu'à 30 secondes</p>
      </div>
    </div>
  `,
    styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .spinner-container {
      text-align: center;
      background: var(--color-bg-secondary);
      padding: 2rem 3rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--color-border);
    }

    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 1rem;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-text {
      color: var(--color-text-primary);
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .loading-hint {
      color: var(--color-text-secondary);
      font-size: 0.85rem;
      max-width: 300px;
      margin: 0 auto;
      opacity: 0.8;
    }

    @media (max-width: 480px) {
      .spinner-container {
        padding: 1.5rem 2rem;
        margin: 1rem;
      }

      .loading-hint {
        font-size: 0.75rem;
      }
    }
  `]
})
export class LoadingSpinnerComponent {
    constructor(public loadingService: LoadingService) { }
}
