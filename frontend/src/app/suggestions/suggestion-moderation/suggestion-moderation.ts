import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuggestionsService, Suggestion, SuggestionCategory } from '../../core/services/suggestions';
import { CountriesService, Country } from '../../core/services/countries.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-suggestion-moderation',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="dashboard-header fade-in">
      <h1>🛡️ Modération des Suggestions</h1>
      <p>Gérez et globalisez les suggestions de la plateforme.</p>
    </div>

    <div class="card glass mb-6 fade-in" style="animation-delay: 100ms;">
      <div class="p-6 flex flex-wrap gap-4 items-center justify-between">
        <div class="flex gap-4 items-center">
            <div class="filter-group">
                <label class="text-xs font-bold uppercase opacity-50 block mb-1">Type</label>
                <select [(ngModel)]="filterType" (change)="loadSuggestions()" class="form-input-sm">
                    <option value="all">Toutes</option>
                    <option value="global">Globales uniquement</option>
                    <option value="private">Privées uniquement</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="text-xs font-bold uppercase opacity-50 block mb-1">Pays</label>
                <select [(ngModel)]="filterCountryId" (change)="loadSuggestions()" class="form-input-sm">
                    <option [ngValue]="null">Tous les pays</option>
                    <option *ngFor="let c of countries" [ngValue]="c.id">{{ c.name }}</option>
                </select>
            </div>
        </div>
        <div class="search-box">
             <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher..." class="form-input-sm w-64">
        </div>
      </div>
    </div>

    <div class="space-y-4 fade-in" style="animation-delay: 200ms;">
        <div *ngIf="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p class="mt-4 opacity-50">Chargement des suggestions...</p>
        </div>

        <div *ngIf="!loading && suggestions().length === 0" class="card glass p-12 text-center">
            <p class="opacity-50 italic">Aucune suggestion trouvée avec ces filtres.</p>
        </div>

        <div *ngFor="let s of filteredSuggestions()" class="card glass hover:bg-white/5 transition-colors overflow-hidden">
            <div class="flex flex-col md:flex-row">
                <div class="md:w-48 h-32 md:h-auto bg-cover bg-center" 
                     [style.backgroundImage]="s.photoUrl ? 'url(' + s.photoUrl + ')' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'">
                </div>
                <div class="flex-1 p-5">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h3 class="text-lg font-bold flex items-center gap-2">
                                {{ s.name }}
                                <span *ngIf="s.isGlobal" class="badge badge-success text-[10px] uppercase">Global</span>
                                <span *ngIf="!s.isGlobal" class="badge badge-secondary text-[10px] uppercase">Privé (Groupe #{{ s.groupId }})</span>
                            </h3>
                            <p class="text-sm opacity-70">📍 {{ s.location }}</p>
                        </div>
                        <div class="flex gap-2">
                            <button (click)="toggleGlobal(s)" [class.btn-success]="!s.isGlobal" [class.btn-outline]="s.isGlobal" class="btn btn-xs">
                                {{ s.isGlobal ? 'Rendre Privé' : 'Globaliser 🌍' }}
                            </button>
                            <button (click)="deleteSuggestion(s)" class="btn btn-xs btn-error">Supprimer</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-black/20 p-3 rounded-lg">
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-bold uppercase opacity-50">Attribuer au Pays :</span>
                            <select [(ngModel)]="s.countryId" (change)="updateCountry(s)" class="form-input-xs bg-white/10 border-none rounded text-xs py-1">
                                <option [ngValue]="null">Non attribué</option>
                                <option *ngFor="let c of countries" [ngValue]="c.id">{{ c.name }}</option>
                            </select>
                        </div>
                        <div class="flex items-center gap-3 text-xs opacity-70">
                            <span>Créé par : <strong>{{ s.createdBy.username }}</strong></span>
                            <span>Catégorie : <strong>{{ s.category }}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `,
    styles: [`
    .dashboard-header { text-align: center; margin-bottom: 2rem; }
    .dashboard-header h1 { font-size: 2.2rem; font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .form-input-sm { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 0.4rem 0.8rem; color: white; font-size: 0.875rem; }
    .form-input-xs { color: white; outline: none; }
    .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
    .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; }
    .badge-success { background: rgba(76, 175, 80, 0.2); color: #4caf50; border: 1px solid rgba(76, 175, 80, 0.3); }
    .badge-secondary { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); }
    .fade-in { animation: fadeIn 0.5s ease-out forwards; opacity: 0; transform: translateY(10px); }
    @keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SuggestionModerationComponent implements OnInit {
    suggestions = signal<Suggestion[]>([]);
    countries: Country[] = [];
    loading = false;

    // Filters
    filterType = 'all';
    filterCountryId: number | null = null;
    searchQuery = '';

    private destroyRef = inject(DestroyRef);

    constructor(
        private suggestionsService: SuggestionsService,
        private countriesService: CountriesService
    ) { }

    ngOnInit() {
        this.loadCountries();
        this.loadSuggestions();
    }

    loadCountries() {
        this.countriesService.findAll().subscribe(data => this.countries = data);
    }

    loadSuggestions() {
        this.loading = true;
        const options: any = {};
        if (this.filterType === 'global') options.isGlobal = true;
        if (this.filterType === 'private') options.isGlobal = false;
        if (this.filterCountryId) options.countryId = this.filterCountryId;

        this.suggestionsService.getAll(options)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    this.suggestions.set(data);
                    this.loading = false;
                },
                error: (err: any) => {
                    console.error(err);
                    this.loading = false;
                }
            });
    }

    filteredSuggestions = computed(() => {
        const query = this.searchQuery.toLowerCase();
        if (!query) return this.suggestions();
        return this.suggestions().filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.location.toLowerCase().includes(query) ||
            s.createdBy.username.toLowerCase().includes(query)
        );
    });

    toggleGlobal(s: Suggestion) {
        const formData = new FormData();
        formData.append('isGlobal', String(!s.isGlobal));

        this.suggestionsService.update(s.id, formData).subscribe({
            next: (updated) => {
                this.suggestions.update(list => list.map(item => item.id === s.id ? { ...item, isGlobal: updated.isGlobal } : item));
            },
            error: (err: any) => alert('Erreur lors de la modification')
        });
    }

    updateCountry(s: Suggestion) {
        const formData = new FormData();
        if (s.countryId) formData.append('countryId', String(s.countryId));

        this.suggestionsService.update(s.id, formData).subscribe({
            next: () => {
                // Updated automatically via ngModel but we confirm with server
            },
            error: (err: any) => alert("Erreur lors de l'affectation au pays")
        });
    }

    deleteSuggestion(s: Suggestion) {
        if (confirm(`Supprimer définitivement "${s.name}" ?`)) {
            this.suggestionsService.delete(s.id).subscribe({
                next: () => {
                    this.suggestions.update(list => list.filter(item => item.id !== s.id));
                }
            });
        }
    }
}
