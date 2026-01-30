import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SuggestionsService, SuggestionCategory } from '../../core/services/suggestions';

@Component({
  selector: 'app-suggestion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIf, NgFor],
  template: `
    <div class="form-container fade-in">
      <div class="card glass form-card">
        <div class="form-header">
          <h1>{{ isEditing ? 'Modifier' : 'Ajouter' }} une Suggestion</h1>
          <p>Partagez un lieu incontournable pour le voyage</p>
        </div>

        <form [formGroup]="suggestionForm" (ngSubmit)="onSubmit()">
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

          <div class="form-group">
            <label class="form-label" for="price">Prix estimé (€)</label>
            <input id="price" type="number" class="form-input" formControlName="price" placeholder="0">
          </div>

          <div class="form-group">
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
  `]
})
export class SuggestionFormComponent implements OnInit {
  suggestionForm: FormGroup;
  isEditing = false;
  suggestionId: number | null = null;
  isLoading = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  categories = Object.values(SuggestionCategory);

  constructor(
    private fb: FormBuilder,
    private suggestionsService: SuggestionsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.suggestionForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      category: [SuggestionCategory.ACTIVITE, Validators.required],
      price: [null],
      description: [''],
      durationHours: [2, [Validators.min(0.5), Validators.max(8)]]
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
  }

  loadSuggestion(id: number) {
    this.suggestionsService.getOne(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.suggestionForm.patchValue({
          name: data.name,
          location: data.location,
          category: data.category,
          price: data.price,
          description: data.description
        });
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

      const currentGroupId = localStorage.getItem('currentGroupId');
      if (currentGroupId) {
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
    }
  }

  setDuration(hours: number) {
    this.suggestionForm.patchValue({ durationHours: hours });
  }
}
