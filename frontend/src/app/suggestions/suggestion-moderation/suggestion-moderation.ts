import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuggestionsService, Suggestion, SuggestionCategory } from '../../core/services/suggestions';
import { CountriesService, Country } from '../../core/services/countries.service';
import { GroupsService, Group } from '../../core/services/groups.service';
import { UsersService } from '../../core/services/users';
import { AuthService } from '../../core/services/auth';
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
      <div class="p-4 flex flex-wrap gap-6 items-center justify-between">
        <div class="flex gap-2">
            <button 
                class="tab-btn-sm" 
                [class.active]="filterType === 'private'"
                (click)="filterType = 'private'; loadSuggestions()">
                🕒 À Modérer (Privés)
            </button>
            <button 
                class="tab-btn-sm" 
                [class.active]="filterType === 'global'"
                (click)="filterType = 'global'; loadSuggestions()">
                🌍 Catalogue Global
            </button>
            <button 
                class="tab-btn-sm" 
                [class.active]="filterType === 'all'"
                (click)="filterType = 'all'; loadSuggestions()">
                📋 Tous
            </button>
        </div>

        <div class="flex gap-4 items-center">
            <div class="filter-group">
                <label class="text-[10px] font-bold uppercase opacity-50 block mb-1">Pays</label>
                <select [(ngModel)]="filterCountryId" (change)="loadSuggestions()" class="form-input-sm">
                    <option [ngValue]="null">Tous les pays</option>
                    <option *ngFor="let c of countries" [ngValue]="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div class="search-box">
                 <label class="text-[10px] font-bold uppercase opacity-50 block mb-1">Recherche</label>
                 <input type="text" [(ngModel)]="searchQuery" placeholder="Nom, lieu, auteur..." class="form-input-sm w-64">
            </div>
        </div>
      </div>
    </div>

    <div class="card glass fade-in" style="animation-delay: 200ms;">
        <div class="overflow-x-auto">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Suggestion</th>
                        <th>Status</th>
                        <th>Pays</th>
                        <th>Groupe</th>
                        <th>Auteur</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let s of filteredSuggestions()" class="hover:bg-white/5 transition-colors">
                        <td>
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded bg-cover bg-center" [style.backgroundImage]="s.photoUrl ? 'url(' + s.photoUrl + ')' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'"></div>
                                <div>
                                    <div class="font-bold">{{ s.name }}</div>
                                    <div class="text-xs opacity-50">{{ s.location | slice:0:30 }}...</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span *ngIf="s.isGlobal" class="badge badge-success">🌍 Global</span>
                            <span *ngIf="!s.isGlobal" class="badge badge-secondary">🔒 Privé</span>
                        </td>
                        <td>
                            <select [(ngModel)]="s.countryId" (change)="updateCountry(s)" class="admin-select">
                                <option [ngValue]="null">Non défini</option>
                                <option *ngFor="let c of countries" [ngValue]="c.id">{{ c.name }}</option>
                            </select>
                        </td>
                        <td>
                            <select [(ngModel)]="s.groupId" (change)="updateGroup(s)" class="admin-select">
                                <option [ngValue]="null">Public / Aucun</option>
                                <option *ngFor="let g of groups" [ngValue]="g.id">#{{ g.id }} - {{ g.name }}</option>
                            </select>
                        </td>
                        <td>
                            <div class="flex items-center gap-2">
                                <div class="text-sm">{{ s.createdBy?.username || 'Anonyme' }}</div>
                                <div *ngIf="isSuperAdmin && !s.createdBy" class="flex items-center gap-1">
                                    <select #userSelect class="admin-select-xs">
                                        <option value="">-- Attribuer à --</option>
                                        <option *ngFor="let u of allUsers" [value]="u.id">{{ u.username }}</option>
                                    </select>
                                    <button (click)="attributeTo(s, userSelect.value)" class="btn btn-icon-xs" title="Attribuer">✅</button>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="flex gap-2">
                                <button (click)="toggleGlobal(s)" [class.btn-success]="!s.isGlobal" [class.btn-outline]="s.isGlobal" class="btn btn-xs">
                                    {{ s.isGlobal ? 'Privatiser' : 'Globaliser' }}
                                </button>
                                <a [routerLink]="['/suggestions/edit', s.id]" class="btn btn-xs btn-outline">✏️</a>
                                <button (click)="deleteSuggestion(s)" class="btn btn-xs btn-error">🗑️</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div *ngIf="!loading && suggestions().length === 0" class="p-12 text-center">
            <p class="opacity-50 italic">Aucune suggestion trouvée.</p>
        </div>
    </div>
  `,
    styles: [`
    .dashboard-header { 
        text-align: left; 
        margin-bottom: 2.5rem; 
        padding: 2rem;
        background: linear-gradient(135deg, rgba(255,107,157,0.1) 0%, rgba(78,205,196,0.1) 100%);
        border-radius: var(--radius-xl);
        border: 1px solid var(--color-glass-border);
    }
    .dashboard-header h1 { 
        font-size: 2.5rem; 
        font-weight: 800; 
        margin-bottom: 0.5rem;
        background: var(--gradient-primary); 
        -webkit-background-clip: text; 
        -webkit-text-fill-color: transparent; 
        letter-spacing: -1px;
    }
    .dashboard-header p {
        font-size: 1.1rem;
        opacity: 0.8;
        margin-bottom: 0;
    }
    .form-input-sm { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 0.6rem 1rem; color: white; font-size: 0.9rem; transition: all 0.2s; }
    .form-input-sm:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(255,107,157,0.2); outline: none; }
    
    .btn-xs { padding: 0.4rem 0.8rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge { padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.65rem; text-transform: uppercase; }
    .badge-success { background: rgba(107, 207, 127, 0.2); color: #6bcf7f; border: 1px solid rgba(107, 207, 127, 0.3); }
    .badge-secondary { background: rgba(255, 255, 255, 0.05); color: #8891b8; border: 1px solid rgba(255, 255, 255, 0.1); }
    
    .fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(20px); }
    
    /* Table styles */
    .admin-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
    .admin-table th { padding: 1.25rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--color-text-tertiary); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
    .admin-table td { padding: 1.25rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
    .admin-table tr:last-child td { border-bottom: none; }
    .admin-table tr:hover { background: rgba(255, 255, 255, 0.02); }
    
    .admin-select { background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); color: white; border-radius: 6px; padding: 0.4rem 0.6rem; font-size: 0.85rem; outline: none; cursor: pointer; transition: all 0.2s; }
    .admin-select:hover { border-color: rgba(255, 255, 255, 0.3); }
    .admin-select:focus { border-color: var(--color-primary); background: rgba(0, 0, 0, 0.4); }

    .tab-btn-sm {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--color-text-secondary);
        font-size: 0.85rem;
        font-weight: 600;
        border: 1px solid transparent;
        transition: all 0.2s;
    }
    .tab-btn-sm:hover { background: rgba(255, 255, 255, 0.1); color: white; }
    .tab-btn-sm.active { background: var(--color-primary); color: white; box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3); }

    .admin-select-xs { background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.2); color: white; border-radius: 4px; padding: 0.2rem 0.4rem; font-size: 0.75rem; outline: none; }
    .btn-icon-xs { background: rgba(255, 255, 255, 0.1); border: none; cursor: pointer; border-radius: 4px; padding: 0.2rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .btn-icon-xs:hover { background: rgba(107, 207, 127, 0.3); }

    @keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SuggestionModerationComponent implements OnInit {
    suggestions = signal<Suggestion[]>([]);
    countries: Country[] = [];
    groups: Group[] = [];
    loading = false;

    // Filters
    filterType = 'private';
    filterCountryId: number | null = null;
    searchQuery = '';

    allUsers: any[] = [];

    get isSuperAdmin(): boolean {
        const user = this.authService.currentUserValue;
        return user?.role === 'super_admin' || user?.role === 'admin';
    }

    private destroyRef = inject(DestroyRef);

    constructor(
        private suggestionsService: SuggestionsService,
        private countriesService: CountriesService,
        private groupsService: GroupsService,
        private usersService: UsersService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        console.log('DEBUG: isSuperAdmin=', this.isSuperAdmin, 'Role=', this.authService.currentUserValue?.role);
        this.loadCountries();
        this.loadGroups();
        this.loadSuggestions();
        if (this.isSuperAdmin) {
            this.loadUsers();
        }
    }

    loadUsers() {
        this.usersService.getAll().subscribe(data => this.allUsers = data);
    }

    loadCountries() {
        this.countriesService.findAll().subscribe(data => this.countries = data);
    }

    loadGroups() {
        this.groupsService.getAllGroups().subscribe(data => this.groups = data);
    }

    loadSuggestions() {
        this.loading = true;
        const options: any = { includePrivate: true };
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
        let list = this.suggestions();
        const query = this.searchQuery.toLowerCase();
        const type = this.filterType;

        // 1. Filter by Tab (Reactive!)
        if (type === 'all') {
            // No filter
        } else if (type === 'global') {
            list = list.filter(s => s.isGlobal);
        } else if (type === 'private') {
            list = list.filter(s => !s.isGlobal);
        }

        // 2. Filter by Search Query
        if (query) {
            list = list.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.location.toLowerCase().includes(query) ||
                (s.createdBy?.username || '').toLowerCase().includes(query)
            );
        }

        return list;
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
        formData.append('countryId', s.countryId ? String(s.countryId) : '');

        this.suggestionsService.update(s.id, formData).subscribe({
            next: () => { },
            error: (err: any) => alert("Erreur lors de l'affectation au pays")
        });
    }

    updateGroup(s: Suggestion) {
        const formData = new FormData();
        formData.append('groupId', s.groupId ? String(s.groupId) : '');

        this.suggestionsService.update(s.id, formData).subscribe({
            next: () => { },
            error: (err: any) => alert("Erreur lors de l'affectation au groupe")
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

    attributeTo(s: Suggestion, userIdString: string) {
        if (!userIdString) return;
        const userId = parseInt(userIdString);
        this.usersService.reattributeSuggestion(s.id, userId).subscribe({
            next: () => {
                alert('Suggestion ré-attribuée avec succès');
                this.loadSuggestions();
            },
            error: (err) => alert("Erreur lors de l'attribution")
        });
    }
}
