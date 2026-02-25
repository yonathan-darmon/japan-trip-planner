import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { AuthService } from '../core/services/auth';
import { TripConfigService, TripConfig } from '../core/services/trip-config';
import { SuggestionsService } from '../core/services/suggestions';
import { UsersService } from '../core/services/users';
import { ItineraryService, Itinerary } from '../core/services/itinerary';
import { GroupsService, Group, GroupRole } from '../core/services/groups.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, take } from 'rxjs';
import { ChangelogService, Changelog } from '../core/services/changelog.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, RouterLink, CommonModule, FormsModule],
  template: `
    <!-- ONBOARDING BANNER – shown when user has no group -->
    <div class="onboarding-banner fade-in" *ngIf="dataLoaded && groupCount === 0">
      <div class="onboarding-inner">
        <div class="onboarding-icon">🎌</div>
        <div class="onboarding-text">
          <h2>Bienvenue ! Par où commencer ?</h2>
          <p>Pour utiliser le planificateur, vous devez d'abord rejoindre ou créer un <strong>groupe de voyage</strong>.</p>
        </div>
        <div class="onboarding-actions">
          <a routerLink="/groups" class="btn btn-primary">Rejoindre / Créer un groupe →</a>
          <a routerLink="/help" class="btn btn-ghost">Voir le guide</a>
        </div>
      </div>
    </div>

    <!-- HEADER -->
    <div class="dashboard-header fade-in">
      <h1>👋 {{ getGreeting(currentGroup?.country?.code) }}, {{ (currentUser$ | async)?.username }} !</h1>
      <div class="subtitle-container">
        <p>Prêt à planifier votre voyage <span *ngIf="currentGroup?.country">en {{ currentGroup?.country?.name }}</span> ?</p>
        <div *ngIf="currentGroup" class="group-badge">
          {{ currentGroup.name }}
          <span *ngIf="isGroupAdmin" class="badge badge-primary">Admin</span>
        </div>
      </div>

      <!-- Guide shortcut pill -->
      <a routerLink="/help" class="guide-pill" *ngIf="groupCount > 0">
        ❓ Nouveau ici ? Consultez le guide
      </a>
    </div>

    <!-- ADMIN SECTION -->
    <div class="admin-section fade-in" *ngIf="isGroupAdmin" style="animation-delay: 50ms;">
      <div class="card glass admin-card">
        <div class="card-header">
          <h3>⚙️ Administration du Groupe</h3>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-secondary" routerLink="/groups/manage">👥 Membres / Inviter</button>
            <button class="btn btn-sm btn-outline" routerLink="/groups/manage">Modifier configuration</button>
          </div>
        </div>
        <div class="admin-stats">
          <div class="stat-item">
            <span class="label">Durée :</span>
            <span class="value">{{ config?.durationDays || 21 }} jours</span>
          </div>
          <div class="stat-item" *ngIf="config?.startDate">
            <span class="label">Départ :</span>
            <span class="value">{{ config?.startDate | date:'dd/MM/yyyy' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- STATS ROW -->
    <div class="grid-stats fade-in" style="animation-delay: 100ms;" *ngIf="groupCount > 0">
      <div class="card glass stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">{{ config?.durationDays || 21 }}</div>
        <div class="stat-label">Jours de voyage</div>
      </div>
      
      <div class="card glass stat-card">
        <div class="stat-icon">⛩️</div>
        <div class="stat-value">{{ suggestionCount }}</div>
        <div class="stat-label">Suggestions</div>
      </div>
      
      <div class="card glass stat-card" routerLink="/groups">
        <div class="stat-icon">✈️</div>
        <div class="stat-value">{{ groupCount }}</div>
        <div class="stat-label">Vos voyages</div>
      </div>
    </div>

    <!-- PRIMARY ACTION (GENERATE) -->
    <div class="primary-action-container fade-in" style="animation-delay: 150ms;" *ngIf="groupCount > 0">
      <button
        class="btn btn-lg btn-primary generate-btn"
        (click)="generateItinerary()"
        [disabled]="generatingItinerary || suggestionCount === 0"
        title="{{ suggestionCount === 0 ? 'Ajoutez d\'abord des suggestions pour pouvoir générer' : 'Lancer l\'algorithme d\'optimisation' }}">
        <span class="btn-icon">✨</span>
        <span class="btn-text">{{ generatingItinerary ? 'Génération en cours...' : 'Générer un itinéraire optimisé' }}</span>
      </button>
      <p class="generate-hint" *ngIf="suggestionCount === 0">
        💡 Veuillez ajouter des suggestions avant de générer.
      </p>
    </div>

    <!-- ITINERARY LIST SECTION -->
    <div class="itineraries-section fade-in" style="animation-delay: 200ms;" *ngIf="itineraries.length > 0">
      <div class="section-header">
        <h2>🎒 Vos Itinéraires ({{ itineraries.length }})</h2>
      </div>
      <div class="grid-itineraries">
        <div class="card glass itinerary-card" *ngFor="let item of itineraries">
          <div class="itinerary-info">
            <h3>{{ item.name }}</h3>
            <div class="itinerary-meta">
              <span>🗓️ {{ item.totalDays }} jours</span>
              <span>💰 {{ item.totalCost | number:'1.0-0' }}€</span>
            </div>
            <div class="itinerary-date">Créé le {{ item.generatedAt | date:'dd/MM/yyyy' }}</div>
          </div>
          <div class="itinerary-actions">
            <a [routerLink]="['/itinerary', item.id]" class="btn btn-sm btn-outline">Voir</a>
            <button class="btn btn-sm btn-ghost" (click)="deleteItinerary(item.id, $event)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- WORKFLOW PROGRESS SECTION -->
    <div class="workflow-section fade-in" style="animation-delay: 250ms;" *ngIf="dataLoaded && groupCount > 0">
      <h2 class="workflow-title">🗺️ Votre avancement</h2>
      <p class="workflow-subtitle">Suivez ces étapes pour générer votre itinéraire parfait.</p>

      <div class="workflow-steps">

        <!-- Step 1: Groupe -->
        <div class="workflow-step" [class.completed]="groupCount > 0" [class.active]="groupCount === 0">
          <div class="step-status-icon">
            <span *ngIf="groupCount > 0">✅</span>
            <span *ngIf="groupCount === 0">1</span>
          </div>
          <div class="step-content">
            <div class="step-header">
              <h4>Rejoindre un groupe</h4>
              <span class="step-badge done" *ngIf="groupCount > 0">Fait</span>
              <span class="step-badge todo" *ngIf="groupCount === 0">À faire</span>
            </div>
            <p>Créez ou rejoignez un groupe pour commencer à planifier ensemble.</p>
            <a routerLink="/groups" class="btn btn-sm btn-outline step-btn" *ngIf="groupCount === 0">→ Rejoindre un groupe</a>
          </div>
        </div>

        <!-- Step 2: Suggestions -->
        <div class="workflow-step" [class.completed]="suggestionCount > 0" [class.active]="groupCount > 0 && suggestionCount === 0">
          <div class="step-status-icon">
            <span *ngIf="suggestionCount > 0">✅</span>
            <span *ngIf="suggestionCount === 0">2</span>
          </div>
          <div class="step-content">
            <div class="step-header">
              <h4>Ajouter des suggestions</h4>
              <span class="step-badge done" *ngIf="suggestionCount > 0">{{ suggestionCount }} ajoutée(s)</span>
              <span class="step-badge active" *ngIf="groupCount > 0 && suggestionCount === 0">À faire maintenant</span>
              <span class="step-badge todo" *ngIf="groupCount === 0">En attente</span>
            </div>
            <p>Proposez des temples, restaurants, parcs… tout ce que vous voulez voir.</p>
            <a routerLink="/suggestions/new" class="btn btn-sm btn-primary step-btn" *ngIf="groupCount > 0 && suggestionCount === 0">+ Ajouter une suggestion</a>
            <a routerLink="/suggestions" class="btn btn-sm btn-outline step-btn" *ngIf="suggestionCount > 0">Voir les suggestions</a>
          </div>
        </div>

        <!-- Step 3: Voter -->
        <div class="workflow-step" [class.completed]="itineraries.length > 0 || (suggestionCount > 0 && groupCount > 0)" [class.active]="suggestionCount > 0 && itineraries.length === 0">
          <div class="step-status-icon">
            <span *ngIf="suggestionCount > 0">{{ itineraries.length > 0 ? '✅' : '⭐' }}</span>
            <span *ngIf="suggestionCount === 0">3</span>
          </div>
          <div class="step-content">
            <div class="step-header">
              <h4>Voter pour vos favoris</h4>
              <span class="step-badge active" *ngIf="suggestionCount > 0 && itineraries.length === 0">En cours</span>
              <span class="step-badge done" *ngIf="itineraries.length > 0">Fait</span>
              <span class="step-badge todo" *ngIf="suggestionCount === 0">En attente</span>
            </div>
            <p>Mettez un ❤️ sur les activités que vous voulez absolument faire. L'algorithme les priorisera.</p>
            <a routerLink="/suggestions" class="btn btn-sm btn-secondary step-btn" *ngIf="suggestionCount > 0">Voter maintenant</a>
          </div>
        </div>

        <!-- Step 4: Generate -->
        <div class="workflow-step highlight-step" [class.completed]="itineraries.length > 0" [class.active]="suggestionCount > 0">
          <div class="step-status-icon">
            <span *ngIf="itineraries.length > 0">✅</span>
            <span *ngIf="itineraries.length === 0">4</span>
          </div>
          <div class="step-content">
            <div class="step-header">
              <h4>Générer l'itinéraire</h4>
              <span class="step-badge done" *ngIf="itineraries.length > 0">{{ itineraries.length }} généré(s)</span>
              <span class="step-badge active" *ngIf="suggestionCount > 0 && itineraries.length === 0">Prêt !</span>
              <span class="step-badge todo" *ngIf="suggestionCount === 0">En attente</span>
            </div>
            <p>L'algorithme crée un planning optimisé jour par jour. Vous pouvez ensuite tout personnaliser.</p>
            <a [routerLink]="['/itinerary', itineraries[0]?.id]" class="btn btn-sm btn-primary step-btn" *ngIf="itineraries.length > 0">Voir mon itinéraire</a>
          </div>
        </div>

      </div>
    </div>



    <!-- CHANGELOG MODAL -->
    <div *ngIf="showChangelog && latestChangelog" class="modal-backdrop fade-in">
      <div class="card glass changelog-card">
        <div class="changelog-header">
          <div class="changelog-icon">🎉</div>
          <h2>Quoi de neuf ?</h2>
          <div class="changelog-version">{{ latestChangelog.version }}</div>
        </div>
        
        <div class="changelog-body">
          <p>{{ latestChangelog.content }}</p>
        </div>
        
        <div class="changelog-footer">
           <button class="btn btn-primary full-width" (click)="dismissChangelog()">
             C'est parti !
           </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* --------- ONBOARDING BANNER --------- */
    .onboarding-banner {
      background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.15), rgba(var(--color-accent-rgb), 0.1));
      border: 1px solid rgba(var(--color-primary-rgb), 0.3);
      border-radius: 1.25rem;
      padding: 2rem;
      margin-bottom: 2.5rem;
    }

    .onboarding-inner {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .onboarding-icon {
      font-size: 3rem;
      flex-shrink: 0;
    }

    .onboarding-text {
      flex: 1;
      min-width: 200px;
    }

    .onboarding-text h2 {
      margin: 0 0 0.5rem;
      font-size: 1.3rem;
    }

    .onboarding-text p {
      margin: 0;
      color: var(--color-text-secondary);
    }

    .onboarding-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap; /* Ensure buttons wrap if there is no space */
    }

    /* --------- GUIDE PILL --------- */
    .guide-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.75rem;
      padding: 0.3rem 1rem;
      background: rgba(var(--color-accent-rgb), 0.1);
      border: 1px solid rgba(var(--color-accent-rgb), 0.25);
      border-radius: 999px;
      font-size: 0.85rem;
      color: var(--color-accent);
      text-decoration: none;
      transition: background 0.2s, transform 0.2s;
    }

    .guide-pill:hover {
      background: rgba(var(--color-accent-rgb), 0.2);
      transform: translateY(-1px);
    }

    /* --------- DASHBOARD HEADER --------- */
    .dashboard-header {
      text-align: center;
      margin-bottom: 1.25rem;
    }
    
    .dashboard-header h1 {
      margin: 0 0 0.25rem 0;
      font-size: 1.8rem;
    }
    
    .subtitle-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .subtitle-container p {
      margin: 0;
      font-size: 0.95rem;
    }

    .group-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.9rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .badge {
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: bold;
    }

    .badge-primary {
      background: var(--color-primary);
      color: white;
    }

    /* --------- ADMIN --------- */
    .admin-section {
      max-width: 800px;
      margin: 0 auto 1.5rem;
    }

    .admin-card {
      padding: 1rem 1.5rem;
      border: 1px solid rgba(var(--color-primary-rgb), 0.3);
      background: rgba(var(--color-primary-rgb), 0.05);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .admin-stats {
      display: flex;
      gap: 2rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-item .label {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }

    .stat-item .value {
      font-size: 1.1rem;
      font-weight: bold;
    }

    /* --------- STATS GRID --------- */
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      transition: transform 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
    }
    
    .stat-icon {
      font-size: 2rem;
      margin-bottom: 0.25rem;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-primary);
    }
    
    .stat-label {
      color: var(--color-text-secondary);
      font-size: 0.85rem;
    }

    /* --------- PRIMARY ACTION --------- */
    .primary-action-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 2.5rem;
      text-align: center;
    }

    .generate-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.8rem 1.8rem;
      font-size: 1.15rem;
      border-radius: 999px;
      box-shadow: 0 4px 15px rgba(var(--color-primary-rgb), 0.3);
      transition: all 0.3s;
    }

    .generate-btn:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(var(--color-primary-rgb), 0.4);
      transform: translateY(-2px);
    }

    .generate-btn .btn-icon {
      font-size: 1.4rem;
    }

    .generate-hint {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    /* --------- WORKFLOW STEPS --------- */
    .workflow-section {
      margin-bottom: 3rem;
    }

    .workflow-title {
      font-size: 1.5rem;
      margin-bottom: 0.35rem;
    }

    .workflow-subtitle {
      color: var(--color-text-secondary);
      margin-bottom: 1.75rem;
      font-size: 0.95rem;
    }

    .workflow-steps {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .workflow-step {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      border-radius: 1rem;
      border: 1px solid rgba(255,255,255,0.07);
      background: rgba(255,255,255,0.03);
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .workflow-step.completed {
      background: rgba(var(--color-primary-rgb), 0.04);
      border-color: rgba(var(--color-primary-rgb), 0.15);
    }

    .workflow-step.active {
      background: rgba(var(--color-primary-rgb), 0.08);
      border-color: rgba(var(--color-primary-rgb), 0.35);
      box-shadow: 0 0 20px -8px rgba(var(--color-primary-rgb), 0.4);
    }

    .workflow-step.highlight-step.active {
      background: rgba(var(--color-accent-rgb), 0.08);
      border-color: rgba(var(--color-accent-rgb), 0.35);
      box-shadow: 0 0 20px -8px rgba(var(--color-accent-rgb), 0.4);
    }

    .step-status-icon {
      width: 2.5rem;
      height: 2.5rem;
      flex-shrink: 0;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text-secondary);
    }

    .workflow-step.completed .step-status-icon {
      background: rgba(var(--color-primary-rgb), 0.15);
      border-color: rgba(var(--color-primary-rgb), 0.3);
    }

    .workflow-step.active .step-status-icon {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
      box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.5);
    }

    .step-content {
      flex: 1;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.35rem;
      flex-wrap: wrap;
    }

    .step-header h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .step-badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      white-space: nowrap; /* Prevent badge text from breaking */
    }

    .step-badge.done {
      background: rgba(var(--color-primary-rgb), 0.15);
      color: var(--color-primary);
    }

    .step-badge.active {
      background: rgba(var(--color-accent-rgb), 0.2);
      color: var(--color-accent);
    }

    .step-badge.todo {
      background: rgba(255,255,255,0.05);
      color: var(--color-text-secondary);
    }

    .step-content p {
      margin: 0 0 0.75rem;
      color: var(--color-text-secondary);
      font-size: 0.88rem;
      line-height: 1.5;
    }

    .step-btn {
      margin-top: 0.25rem;
    }

    /* --------- ITINERARIES --------- */
    .itineraries-section {
      margin-top: 1rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .section-header h2 {
      margin: 0;
    }

    .grid-itineraries {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .itinerary-card {
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .itinerary-meta {
      display: flex;
      gap: 1rem;
      margin: 0.5rem 0;
      font-size: 0.9rem;
      color: var(--color-text-secondary);
    }

    .itinerary-date {
      font-size: 0.8rem;
      opacity: 0.7;
    }

    .itinerary-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* --------- MODALS --------- */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(5px);
    }

    .modal-card {
      padding: 2rem;
      width: 90%;
      max-width: 500px;
      background: var(--color-background);
    }

    .modal-subtitle {
        color: var(--color-text-secondary);
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
    }

    .input {
        width: 100%;
        padding: 0.8rem;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
        color: var(--color-text);
        margin-top: 0.5rem;
        box-sizing: border-box;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }

    .changelog-card {
      width: 90%;
      max-width: 500px;
      padding: 2rem;
      text-align: center;
      border: 1px solid var(--color-glass-border);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .changelog-header {
      margin-bottom: 1.5rem;
      flex-shrink: 0;
    }

    .changelog-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .changelog-version {
      display: inline-block;
      padding: 0.2rem 0.8rem;
      background: rgba(var(--color-primary-rgb), 0.2);
      color: var(--color-primary);
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .changelog-body {
      margin-bottom: 2rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
      text-align: left;
      overflow-y: auto;
    }

    .changelog-footer {
      flex-shrink: 0;
    }

    .full-width {
      width: 100%;
    }

    /* --------- RESPONSIVE --------- */
    @media (max-width: 640px) {
      .onboarding-inner {
        flex-direction: column;
        text-align: center;
      }
      .onboarding-actions {
        justify-content: center;
      }
      .workflow-step {
        padding: 1rem;
        flex-direction: column; /* Stack icon and content vertically on very small screens if necessary, though wrap is usually enough. Let's keep row but allow content to take full width */
        gap: 0.75rem;
      }
      .step-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .step-btn {
        width: 100%; /* Full width buttons on mobile inside workflow steps */
        justify-content: center;
      }
      .grid-stats {
        grid-template-columns: repeat(2, 1fr); /* 2 columns on mobile instead of auto-fit squishing */
      }
      .admin-stats {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser$;
  config: TripConfig | null = null;
  suggestionCount = 0;
  participantCount = 0;
  groupCount = 0;
  generatingItinerary = false;
  itineraries: Itinerary[] = [];
  currentGroup: Group | null = null;
  isGroupAdmin = false;
  dataLoaded = false;

  // Changelog
  showChangelog = false;
  latestChangelog: Changelog | null = null;

  constructor(
    private authService: AuthService,
    private tripConfigService: TripConfigService,
    private suggestionsService: SuggestionsService,
    private usersService: UsersService,
    private itineraryService: ItineraryService,
    private groupsService: GroupsService,
    private changelogService: ChangelogService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.loadData();
    this.checkChangelog();
  }

  loadData() {
    console.log('Loading dashboard data...');

    this.groupsService.getMyGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.groupCount = groups.length;
          this.dataLoaded = true;

          if (groups.length === 0) {
            console.warn('⚠️ User has no groups');
            return;
          }

          this.currentGroup = groups[0];
          this.isGroupAdmin = this.currentGroup.role === GroupRole.ADMIN || this.currentGroup.role === 'admin';
          const groupId = this.currentGroup.id;

          console.log(`✅ Loaded group #${groupId}: ${this.currentGroup.name}`, { isAdmin: this.isGroupAdmin });

          this.tripConfigService.getConfig(groupId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (config) => {
                this.config = config;
                const countryId = this.currentGroup?.country?.id;

                this.suggestionsService.getAll({ groupId, countryId })
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                    next: (suggestions) => this.suggestionCount = suggestions.length,
                    error: (err) => console.error('Error loading suggestions:', err)
                  });

                this.itineraryService.getAll(groupId)
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                    next: (itineraries) => {
                      this.itineraries = itineraries;
                    },
                    error: (err) => console.error('Error loading itineraries:', err)
                  });

                this.participantCount = this.currentGroup?.members?.length || 1;
              },
              error: (err) => console.error('Error loading config:', err)
            });
        },
        error: (err) => {
          console.error('Error loading groups:', err);
          this.dataLoaded = true;
        }
      });
  }

  checkChangelog() {
    forkJoin({
      user: this.authService.currentUser$.pipe(take(1)),
      changelogs: this.changelogService.getLatest()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ user, changelogs }) => {
        if (changelogs && changelogs.length > 0) {
          const latest = changelogs[0];
          this.latestChangelog = latest;

          const lastViewedTime = user?.lastViewedChangelogAt ? new Date(user.lastViewedChangelogAt).getTime() : 0;
          const publishedTime = new Date(latest.publishedAt).getTime();

          if (lastViewedTime < (publishedTime - 2000)) {
            this.showChangelog = true;
          }
        }
      }
    });
  }

  dismissChangelog() {
    this.showChangelog = false;
    this.usersService.markChangelogRead().subscribe({
      next: (updatedUser) => {
        this.authService.updateUser(updatedUser);
      }
    });
  }

  generateItinerary() {
    this.generatingItinerary = true;

    if (!this.currentGroup) {
      alert("Aucun groupe trouvé");
      this.generatingItinerary = false;
      return;
    }

    this.itineraryService.generate({
      name: `Voyage ${this.currentGroup?.country?.name || 'Japon'} - ${new Date().toLocaleDateString('fr-FR')}`,
      maxActivitiesPerDay: 4,
      groupId: this.currentGroup.id
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (itinerary) => {
          this.generatingItinerary = false;
          this.router.navigate(['/itinerary', itinerary.id]);
        },
        error: (err) => {
          console.error('Error generating itinerary:', err);
          this.generatingItinerary = false;
          alert("Erreur lors de la génération. Assurez-vous d'avoir voté pour des suggestions.");
        }
      });
  }

  deleteItinerary(id: number, event: Event) {
    event.stopPropagation();
    if (!confirm('Voulez-vous vraiment supprimer cet itinéraire ?')) return;

    this.itineraryService.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.itineraries = this.itineraries.filter(i => i.id !== id);
        },
        error: (err) => alert('Erreur lors de la suppression')
      });
  }

  getGreeting(code?: string): string {
    if (!code) return 'Bonjour';
    const greetings: Record<string, string> = {
      'JP': 'Konnichiwa',
      'FR': 'Bonjour',
      'US': 'Hello',
      'GB': 'Hello',
      'CA': 'Hello',
      'ES': 'Hola',
      'IT': 'Ciao',
      'DE': 'Guten Tag',
      'CN': 'Ni hao',
      'KR': 'Annyeonghaseyo'
    };
    return greetings[code.toUpperCase()] || 'Bonjour';
  }
}
