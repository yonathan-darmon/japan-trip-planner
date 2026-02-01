import { Component, OnInit, DestroyRef, inject, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { CommonModule, NgIf, NgFor, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as L from 'leaflet';
import { SuggestionsService, SuggestionCategory } from '../../core/services/suggestions';
import { GroupsService } from '../../core/services/groups.service';
import { TripConfigService } from '../../core/services/trip-config';
import { CurrencyService } from '../../core/services/currency.service';

@Component({
  selector: 'app-suggestion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, NgIf, NgFor],
  template: `
    <div class="form-container fade-in">
      <div class="card glass form-card">
        <div class="form-header">
          <h1>{{ isEditing ? 'Modifier' : 'Ajouter' }} une Suggestion</h1>
          <p>Partagez un lieu incontournable pour le voyage</p>
        </div>

        <form [formGroup]="suggestionForm" (ngSubmit)="onSubmit()">
          <!-- Context Info -->
          <div class="context-banner glass" *ngIf="contextGroup">
            <span class="context-label">📍 Destination :</span>
            <span class="context-value">
              {{ contextGroup.country?.name || 'Japon' }} — <strong>{{ contextGroup.name }}</strong>
            </span>
            <small class="context-hint">(Lié automatiquement)</small>
          </div>

          <!-- Photo Upload -->
          <div class="form-group upload-section">
            <div 
              class="image-preview" 
              [style.backgroundImage]="imagePreview ? 'url(' + imagePreview + ')' : ''"
              (click)="fileInput.click()"
            >
              <div class="upload-placeholder" *ngIf="!imagePreview">
                <span>📸</span>
                <p>Ajouter une photo</p>
              </div>
            </div>
            <input 
              #fileInput 
              type="file" 
              (change)="onFileSelected($event)" 
              accept="image/*" 
              style="display: none"
            >
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label class="form-label" for="name">Nom du lieu</label>
              <input id="name" type="text" class="form-input" formControlName="name" placeholder="Ex: Temple d'Or">
            </div>

            <div class="form-group half">
              <label class="form-label" for="category">Catégorie</label>
              <select id="category" class="form-select" formControlName="category">
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="location">Adresse précise ou Nom du lieu</label>
            <input id="location" type="text" class="form-input" formControlName="location" placeholder="Ex: Shibuya Crossing, Tokyo (pour la carte)">
            <small class="hint">Plus c'est précis, mieux ce sera placé sur la carte ! 🗺️</small>
          </div>

          <div class="form-row">
            <div class="form-group half">
              <label class="form-label" for="latitude">Latitude (Optionnel)</label>
              <input id="latitude" type="number" class="form-input" formControlName="latitude" placeholder="Ex: 35.6591" step="any">
            </div>
            <div class="form-group half">
              <label class="form-label" for="longitude">Longitude (Optionnel)</label>
              <input id="longitude" type="number" class="form-input" formControlName="longitude" placeholder="Ex: 139.7006" step="any">
            </div>
            </div>
          
          <div class="form-group">
            <label class="form-label">Position sur la carte</label>
            <div class="map-container">
              <div id="map"></div>
            </div>
            <small class="hint">Vous pouvez déplacer le marqueur pour ajuster la position.</small>
          </div>

          <small class="hint" style="display:block; margin-top:-1rem; margin-bottom:1rem;">Remplissez ces champs uniquement si la localisation automatique est incorrecte.</small>

          <div class="form-group">
            <label class="form-label" for="price">Prix estimé</label>
            <div class="price-input-group">
              <input 
                id="price" 
                type="number" 
                class="form-input" 
                [ngModel]="displayedPrice" 
                (ngModelChange)="onPriceChange($event)"
                [ngModelOptions]="{standalone: true}"
                placeholder="0"
              >
              <select class="currency-select" [(ngModel)]="currencyMode" (ngModelChange)="onCurrencyModeChange()" [ngModelOptions]="{standalone: true}">
                <option value="LOCAL">{{ contextGroup?.country?.currencySymbol || 'Local' }}</option>
                <option value="EUR">€ (EUR)</option>
              </select>
            </div>
            <small class="hint" *ngIf="convertedHint">{{ convertedHint }}</small>
          </div>

          <div class="form-group" *ngIf="suggestionForm.get('category')?.value !== SuggestionCategory.HEBERGEMENT">
            <label class="form-label">Durée estimée</label>
            <div class="duration-selector">
              <button 
                type="button" 
                class="duration-btn" 
                [class.active]="suggestionForm.get('durationHours')?.value === 1"
                (click)="setDuration(1)">
                1h
              </button>
              <button 
                type="button" 
                class="duration-btn" 
                [class.active]="suggestionForm.get('durationHours')?.value === 2"
                (click)="setDuration(2)">
                2h
              </button>
              <button 
                type="button" 
                class="duration-btn" 
                [class.active]="suggestionForm.get('durationHours')?.value === 3"
                (click)="setDuration(3)">
                3h
              </button>
              <button 
                type="button" 
                class="duration-btn" 
                [class.active]="suggestionForm.get('durationHours')?.value === 4"
                (click)="setDuration(4)">
                🌅 Demi-journée
              </button>
              <button 
                type="button" 
                class="duration-btn" 
                [class.active]="suggestionForm.get('durationHours')?.value === 8"
                (click)="setDuration(8)">
                ☀️ Journée
              </button>
            </div>
            <div class="duration-custom">
              <label class="form-label-small">Ou personnalisé :</label>
              <input 
                type="number" 
                class="form-input-small" 
                formControlName="durationHours" 
                min="0.5" 
                max="8" 
                step="0.5"
                placeholder="Heures">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="description">Description (Optionnel)</label>
            <textarea id="description" class="form-textarea" formControlName="description" placeholder="Pourquoi faut-il y aller ?"></textarea>
          </div>

          <div class="form-actions">
            <a routerLink="/suggestions" class="btn btn-ghost">Annuler</a>
            <button type="submit" class="btn btn-primary" [disabled]="suggestionForm.invalid || isLoading">
              {{ isLoading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer la suggestion') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      display: flex;
      justify-content: center;
      padding: 2rem 0;
    }
    .form-card {
      width: 100%;
      max-width: 700px;
    }
    .form-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .upload-section {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }
    .image-preview {
      width: 100%;
      height: 250px;
      background-color: var(--color-bg-tertiary);
      border: 2px dashed var(--color-text-tertiary);
      border-radius: var(--radius-lg);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
    }
    .image-preview:hover {
      border-color: var(--color-primary);
      background-color: var(--color-bg-elevated);
    }
    .upload-placeholder {
      text-align: center;
      color: var(--color-text-secondary);
    }
    .upload-placeholder span {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }
    .form-row {
      display: flex;
      gap: 1.5rem;
    }
    .half {
      flex: 1;
    }
    .hint {
      font-size: 0.8rem;
      color: var(--color-text-tertiary);
      margin-top: 0.25rem;
      display: block;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      border-top: 1px solid var(--color-glass-border);
      padding-top: 1.5rem;
    }
    
    .duration-selector {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .duration-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--color-border);
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }
    .duration-btn:hover {
      background: var(--color-bg-elevated);
      border-color: var(--color-primary);
    }
    .duration-btn.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
    .duration-custom {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .form-label-small {
      font-size: 0.85rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .form-input-small {
      width: 100px;
      padding: 0.5rem;
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      font-size: 0.9rem;
    }
    
    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
    .map-container {
      height: 300px;
      width: 100%;
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 1rem;
      border: 1px solid var(--color-border);
      z-index: 0;
    }
    #map {
      height: 100%;
      width: 100%;
    }
    
    .context-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.25rem;
      margin-bottom: 1.5rem;
      border-radius: var(--radius-md);
      background: rgba(99, 179, 237, 0.1);
      border: 1px solid rgba(99, 179, 237, 0.3);
      color: var(--color-text-primary);
      animation: slideDown 0.4s ease-out;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .context-label {
      color: var(--color-primary-light);
      font-weight: 500;
      font-size: 0.9rem;
    }
    .context-value {
      font-size: 1rem;
    }
    .context-hint {
      margin-left: auto;
      color: var(--color-text-tertiary);
      font-style: italic;
      font-size: 0.8rem;
    }
    
    .price-input-group {
      display: flex;
      gap: 0.5rem;
    }
    .currency-select {
      width: 100px;
      padding: 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background-color: var(--color-bg-secondary);
      color: var(--color-text-primary);
    }
  `]
})
export class SuggestionFormComponent implements OnInit, AfterViewInit {
  suggestionForm: FormGroup;
  isEditing = false;
  suggestionId: number | null = null;
  isLoading = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  categories = Object.values(SuggestionCategory);
  SuggestionCategory = SuggestionCategory; // Expose enum for template
  contextGroup: any = null;

  currencyMode: 'LOCAL' | 'EUR' = 'LOCAL';
  displayedPrice: number | null = null;
  convertedHint: string | null = null;

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  private urlGroupId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private suggestionsService: SuggestionsService,
    private groupsService: GroupsService,
    private tripConfigService: TripConfigService,
    private currencyService: CurrencyService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.suggestionForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      category: [SuggestionCategory.ACTIVITE, Validators.required],
      price: [null],
      description: [''],
      durationHours: [2, [Validators.min(0), Validators.max(8)]],
      latitude: [null],
      longitude: [null]
    });
  }

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['id']) {
          this.isEditing = true;
          this.suggestionId = +params['id'];
          this.loadSuggestion(this.suggestionId);
        }
      });

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['groupId']) {
          this.urlGroupId = params['groupId'];
          console.log('🔗 Group Context:', this.urlGroupId);
        }

        // Load context details if not editing
        if (!this.isEditing) {
          if (this.urlGroupId) {
            this.loadGroupContext(+this.urlGroupId);
          } else {
            this.loadContext();
          }
        }
      });

    // Monitor category changes
    this.suggestionForm.get('category')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cat => {
        const durationControl = this.suggestionForm.get('durationHours');

        // Reset validators based on category
        if (cat === SuggestionCategory.AUTRE || cat === SuggestionCategory.HEBERGEMENT) {
          durationControl?.setValidators([Validators.min(0), Validators.max(24)]); // Allow 0, max 24h
        } else {
          durationControl?.setValidators([Validators.min(0.5), Validators.max(8)]); // Standard activities
        }
        durationControl?.updateValueAndValidity();

        if (cat === SuggestionCategory.HEBERGEMENT) {
          durationControl?.setValue(0);
          durationControl?.disable();
        } else if (cat === SuggestionCategory.AUTRE) {
          // For Autre (eSIM etc), default to 0 but allow edit
          if (durationControl?.value > 0 && durationControl?.value !== 2) {
            // Keep existing value if user typed it
          } else {
            durationControl?.setValue(0);
          }
          durationControl?.enable();
        } else {
          // For others, ensure valid duration
          durationControl?.enable();
          if (durationControl?.value === 0) {
            durationControl?.setValue(2);
          }
        }
      });

    // Monitor coordinates changes (Manual Input)
    this.suggestionForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => {
        if (val.latitude && val.longitude && this.map) {
          // Check if marker is already there to avoid jitter?
          // updateMarker handles marker creation/move
          this.updateMarker(val.latitude, val.longitude, false);
          // Optional: Pan to it
          // this.map.panTo([val.latitude, val.longitude]);
        }
      });
  }

  loadSuggestion(id: number) {
    this.suggestionsService.getOne(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.suggestionForm.patchValue({
          name: data.name,
          location: data.location,
          category: data.category,
          // price is managed separately via displayedPrice
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          durationHours: data.durationHours
        }, { emitEvent: false });

        // Handle category logic manually since we suppressed events
        const durationControl = this.suggestionForm.get('durationHours');

        // Apply correct validators based on category
        if (data.category === SuggestionCategory.AUTRE || data.category === SuggestionCategory.HEBERGEMENT) {
          durationControl?.setValidators([Validators.min(0), Validators.max(24)]);
        } else {
          durationControl?.setValidators([Validators.min(0.5), Validators.max(8)]);
        }
        durationControl?.updateValueAndValidity({ emitEvent: false });

        if (data.category === SuggestionCategory.HEBERGEMENT) {
          durationControl?.disable({ emitEvent: false });
        } else {
          durationControl?.enable({ emitEvent: false });
        }

        // Update Map Reference
        if (data.latitude && data.longitude) {
          // Even if map not ready, initMap will pick up from form values
          // But if map IS ready (e.g. reused component?), update it
          if (this.map) {
            this.updateMarker(data.latitude, data.longitude, false);
            this.map.setView([data.latitude, data.longitude], 15);
          }
        }

        // Populate context for currency display
        if (data.country) {
          this.contextGroup = {
            country: data.country,
            name: 'Lié à la suggestion'
          };
        } else if (!this.contextGroup) {
          // Fallback to loading general context if suggestion has no country (rare but possible)
          this.loadContext();
        }

        // Init displayed price (Always local initially)
        this.displayedPrice = data.price;
        this.updateConvertedHint();
        this.updateFormValue(); // Sync to form control

        this.imagePreview = data.photoUrl;
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.suggestionForm.valid) {
      this.isLoading = true;

      const formData = new FormData();
      Object.keys(this.suggestionForm.value).forEach(key => {
        const value = this.suggestionForm.value[key];
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      // Prioritize URL groupId (more reliable), then LocalStorage
      const currentGroupId = this.urlGroupId || localStorage.getItem('currentGroupId');
      if (currentGroupId && !this.isEditing) {
        formData.append('groupId', currentGroupId);
      }

      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
      }

      const request$ = this.isEditing && this.suggestionId
        ? this.suggestionsService.update(this.suggestionId, formData)
        : this.suggestionsService.create(formData);

      request$.subscribe({
        next: () => {
          this.router.navigate(['/suggestions']);
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          alert('Une erreur est survenue');
        }
      });
    } else {
      this.suggestionForm.markAllAsTouched();
      // Debug: Log validation errors
      const errors: any = {};
      Object.keys(this.suggestionForm.controls).forEach(key => {
        const control = this.suggestionForm.get(key);
        if (control?.errors) {
          errors[key] = control.errors;
        }
      });
      console.error('❌ Form is invalid. Errors:', errors);
      alert(`Formulaire invalide. Vérifiez: ${Object.keys(errors).join(', ')}`);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initMap(), 100);
    }
  }

  private initMap(): void {
    if (this.map) return;

    const latVal = this.suggestionForm.get('latitude')?.value;
    const lngVal = this.suggestionForm.get('longitude')?.value;
    const hasLocation = latVal && lngVal;

    const centerLat = hasLocation ? latVal : 35.6762; // Tokyo default
    const centerLng = hasLocation ? lngVal : 139.6503;

    this.map = L.map('map').setView([centerLat, centerLng], hasLocation ? 15 : 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.updateMarker(e.latlng.lat, e.latlng.lng, true);
    });

    if (hasLocation) {
      this.updateMarker(latVal, lngVal, false);
    }
  }

  private updateMarker(lat: number, lng: number, updateForm: boolean) {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.suggestionForm.patchValue({ latitude: pos.lat, longitude: pos.lng }, { emitEvent: false });
      });
    }

    if (updateForm) {
      this.suggestionForm.patchValue({ latitude: lat, longitude: lng }, { emitEvent: false });
    }
  }

  setDuration(hours: number) {
    this.suggestionForm.patchValue({ durationHours: hours });
  }

  private loadGroupContext(groupId: number) {
    this.groupsService.getGroup(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (group) => {
          this.contextGroup = group;
        },
        error: (err) => console.warn('Could not load group context', err)
      });
  }

  onPriceChange(val: number) {
    this.displayedPrice = val;
    this.updateConvertedHint();
    this.updateFormValue();
  }

  onCurrencyModeChange() {
    this.updateConvertedHint();
    this.updateFormValue();
  }

  private updateConvertedHint() {
    if (!this.displayedPrice) {
      this.convertedHint = null;
      return;
    }

    const localCode = this.contextGroup?.country?.currencyCode || 'JPY';
    const localSymbol = this.contextGroup?.country?.currencySymbol || '¥';

    if (this.currencyMode === 'EUR') {
      // EUR -> Local
      const converted = this.currencyService.convert(this.displayedPrice, 'EUR', localCode);
      this.convertedHint = converted ? `≈ ${Math.round(converted)} ${localSymbol}` : null;
    } else {
      // Local -> EUR
      const converted = this.currencyService.convert(this.displayedPrice, localCode, 'EUR');
      this.convertedHint = converted ? `≈ ${converted.toFixed(2)} €` : null;
    }
  }

  private updateFormValue() {
    if (!this.displayedPrice) {
      this.suggestionForm.patchValue({ price: null });
      return;
    }

    if (this.currencyMode === 'EUR') {
      const localCode = this.contextGroup?.country?.currencyCode || 'JPY';
      const converted = this.currencyService.convert(this.displayedPrice, 'EUR', localCode);
      // Save rounded value for clean integer prices in Yen/Won etc
      const roundedPrice = converted ? Math.round(converted) : null;
      console.log(`💱 Converting Price: ${this.displayedPrice} EUR -> ${roundedPrice} ${localCode}`);
      this.suggestionForm.patchValue({ price: roundedPrice });
    } else {
      this.suggestionForm.patchValue({ price: this.displayedPrice });
    }
  }

  private loadContext() {
    this.tripConfigService.getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (config) => {
          this.contextGroup = config.group;
        },
        error: (err) => console.warn('Could not load trip context', err)
      });
  }
}
