import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupsService, Group } from '../../core/services/groups.service';
import { TripConfigService, TripConfig } from '../../core/services/trip-config';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
    selector: 'app-group-manage',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="dashboard-header fade-in">
      <h1>👥 Mon Groupe de Voyage</h1>
      <p>Gérez les membres et invitez vos compagnons.</p>
    </div>

    <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 fade-in" style="animation-delay: 100ms;">
        
        <!-- LOADING STATE -->
        <div *ngIf="loading && !group" class="flex flex-col items-center justify-center p-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p class="mt-4 text-text-secondary">Chargement de votre groupe...</p>
        </div>

        <!-- NO GROUP FOUND -->
        <div *ngIf="!loading && !group" class="card glass text-center p-12">
            <h3 class="text-xl font-bold mb-4">Aucun groupe sélectionné</h3>
            <p class="text-text-secondary mb-6">Vous devez sélectionner un groupe pour le gérer.</p>
            <button class="btn btn-primary" routerLink="/groups">Sélectionner un voyage</button>
        </div>

        <div *ngIf="group" class="space-y-8">
            
            <!-- GROUP INFO CARD -->
            <div class="card glass">
                <div class="px-6 py-5 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold text-white">{{ group.name }}</h3>
                        <p class="mt-1 text-sm text-text-secondary">Voyage au Japon</p>
                    </div>
                    <span class="badge badge-primary">
                        {{ group.members?.length || 0 }} membres
                    </span>
                </div>
            </div>

            <!-- MEMBERS LIST -->
            <div class="card glass no-padding">
                <div class="px-6 py-5 border-b border-white/5">
                    <h3 class="text-lg font-bold text-white">Membres du Groupe</h3>
                    <p class="mt-1 text-sm text-text-secondary">Liste des participants ayant accès au voyage.</p>
                </div>
                <ul class="divide-y divide-white/5">
                    <li *ngFor="let member of group.members" class="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div class="flex items-center space-x-4">
                            <!-- Avatar Placeholder -->
                            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold shadow-md">
                                {{ member.user.username.charAt(0).toUpperCase() }}
                            </div>
                            <div>
                                <p class="text-sm font-bold text-white">{{ member.user.username }}</p>
                                <p class="text-xs text-text-tertiary">{{ member.user.email }}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <span [ngClass]="{
                                'badge-secondary': member.role === 'admin',
                                'badge-success': member.role === 'member'
                            }" class="badge">
                                {{ member.role }}
                            </span>
                            <button *ngIf="canRemoveInfo(member)" 
                                    (click)="removeMember(member.user.id)" 
                                    class="p-2 text-text-tertiary hover:text-error transition-colors rounded-full hover:bg-white/5"
                                    title="Retirer du groupe">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </li>
                </ul>
            </div>

            <!-- TRIP SETTINGS SECTION -->
            <div class="card glass" *ngIf="config">
                <div class="px-6 py-5 border-b border-white/5">
                    <h3 class="text-lg font-bold text-white flex items-center">
                        <span class="mr-2">⚙️</span> Paramètres du Voyage
                    </h3>
                    <p class="mt-1 text-sm text-text-secondary">Définissez la durée et les dates de votre séjour.</p>
                </div>
                
                <div *ngIf="!isAdmin()" class="p-6 text-center text-text-tertiary italic text-sm">
                    Seuls les administrateurs du groupe peuvent modifier ces paramètres.
                </div>

                <form *ngIf="isAdmin()" (ngSubmit)="updateSettings()" class="px-6 py-5 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="form-group">
                            <label class="text-xs font-bold text-text-tertiary uppercase mb-1 block">Durée (jours)</label>
                            <input type="number" name="durationDays" [(ngModel)]="config.durationDays" class="form-input" min="1" max="60">
                        </div>
                        <div class="form-group">
                            <label class="text-xs font-bold text-text-tertiary uppercase mb-1 block">Date de début</label>
                            <input type="date" name="startDate" [ngModel]="formatDate(config.startDate)" (ngModelChange)="config.startDate = $event" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="text-xs font-bold text-text-tertiary uppercase mb-1 block">Date de fin</label>
                            <input type="date" name="endDate" [ngModel]="formatDate(config.endDate)" (ngModelChange)="config.endDate = $event" class="form-input">
                        </div>
                    </div>
                    
                    <div class="flex justify-end">
                        <button type="submit" [disabled]="loading" class="btn btn-secondary btn-sm">
                            Sauvegarder les paramètres
                        </button>
                    </div>
                </form>
            </div>

            <!-- INVITE SECTION -->
            <div class="card glass" *ngIf="isAdmin()">
                <div class="px-6 py-5">
                    <h3 class="text-lg font-bold text-white flex items-center">
                        <span class="mr-2">✉️</span> Inviter un ami
                    </h3>
                    <div class="mt-2 text-sm text-text-secondary">
                        <p>Entrez l'adresse email de la personne avec qui vous souhaitez voyager.</p>
                    </div>
                    
                    <form (ngSubmit)="inviteMember()" class="mt-5 sm:flex sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        <div class="w-full sm:max-w-md">
                            <label for="email" class="sr-only">Email</label>
                            <input type="email" name="email" id="email" 
                                   [(ngModel)]="inviteEmail" 
                                   class="form-input" 
                                   placeholder="ami@exemple.com">
                        </div>
                        <button type="submit" 
                                [disabled]="loading || !inviteEmail" 
                                class="btn btn-primary w-full sm:w-auto">
                            <span *ngIf="loading" class="mr-2 inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            {{ loading ? 'Envoi...' : 'Envoyer l\'invitation' }}
                        </button>
                    </form>

                    <!-- Feedback Messages -->
                    <div *ngIf="message" class="mt-4 p-3 rounded-md text-sm font-medium" 
                         [ngClass]="{
                            'bg-success/20 text-success': !isError, 
                            'bg-error/20 text-error': isError
                         }">
                        {{ message }}
                    </div>
                </div>
            </div>

        </div>
    </div>
    `,
    styles: [`
        .dashboard-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .dashboard-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        .dashboard-header p {
            font-size: 1.1rem;
            color: var(--color-text-tertiary);
        }
        .card.no-padding {
            padding: 0;
        }
        .text-text-secondary { color: var(--color-text-secondary); }
        .text-text-tertiary { color: var(--color-text-tertiary); }
        .border-primary { border-color: var(--color-primary); }
        .text-error { color: var(--color-error); }
        .hover\:text-error:hover { color: var(--color-error); }
        
        /* Fade In Animation */
        .fade-in {
            animation: fadeIn 0.8s ease-out forwards;
            opacity: 0;
            transform: translateY(20px);
        }
        @keyframes fadeIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `]
})
export class GroupManageComponent implements OnInit {
    group: Group | null = null;
    config: TripConfig | null = null;
    loading = false;
    inviteEmail = '';
    message = '';
    isError = false;
    currentGroupId: number | null = null;

    constructor(
        private groupsService: GroupsService,
        private tripConfigService: TripConfigService,
        private authService: AuthService,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        const storedId = localStorage.getItem('currentGroupId');
        if (storedId) {
            this.currentGroupId = +storedId;
            this.loadGroup();
        } else {
            this.fetchAndSelectFirstGroup();
        }
    }

    fetchAndSelectFirstGroup() {
        this.loading = true;
        this.groupsService.getMyGroups().subscribe({
            next: (groups) => {
                if (groups && groups.length > 0) {
                    this.currentGroupId = groups[0].id;
                    localStorage.setItem('currentGroupId', this.currentGroupId.toString());
                    this.loadGroup();
                } else {
                    this.loading = false;
                }
            },
            error: (err) => {
                console.error('Failed to fetch user groups', err);
                this.loading = false;
            }
        });
    }

    loadGroup() {
        if (!this.currentGroupId) return;
        this.loading = true;

        // Load group and its config
        this.groupsService.getGroup(this.currentGroupId).subscribe({
            next: (group) => {
                this.group = group;
                this.tripConfigService.getConfig(this.currentGroupId!).subscribe(config => {
                    this.config = config;
                    this.loading = false;
                });
            },
            error: (err) => {
                console.error('Failed to load group', err);
                this.loading = false;
            }
        });
    }

    inviteMember() {
        if (!this.currentGroupId || !this.inviteEmail) return;
        this.loading = true;
        this.message = '';
        this.isError = false;

        this.groupsService.inviteMember(this.currentGroupId, this.inviteEmail).subscribe({
            next: () => {
                this.message = 'Invitation envoyée avec succès ! 🎉';
                this.inviteEmail = '';
                this.loading = false;
                this.loadGroup();
            },
            error: (err) => {
                this.message = err.error?.message || 'Échec de l\'invitation. Vérifiez l\'adresse email.';
                this.isError = true;
                this.loading = false;
            }
        });
    }

    removeMember(userId: number) {
        if (!this.currentGroupId || !confirm('Êtes-vous sûr de vouloir retirer ce membre du groupe ?')) return;

        this.groupsService.removeMember(this.currentGroupId, userId).subscribe({
            next: () => {
                this.loadGroup();
            },
            error: (err) => alert('Impossible de retirer le membre.')
        });
    }

    updateSettings() {
        if (!this.config) return;
        this.loading = true;
        this.message = '';
        this.isError = false;

        this.tripConfigService.updateConfig(this.currentGroupId!, {
            durationDays: this.config.durationDays,
            startDate: this.config.startDate,
            endDate: this.config.endDate
        }).subscribe({
            next: (updated) => {
                this.config = updated;
                this.message = 'Paramètres mis à jour ! ✅';
                this.loading = false;
                setTimeout(() => this.message = '', 3000);
            },
            error: (err) => {
                this.message = 'Erreur lors de la mise à jour.';
                this.isError = true;
                this.loading = false;
            }
        });
    }

    formatDate(dateStr: string | null | undefined): string {
        if (!dateStr) return '';
        return dateStr.split('T')[0];
    }

    canRemoveInfo(member: any): boolean {
        if (!this.isAdmin()) return false;
        // Don't allow removing self from here (you are admin)
        return member.user.id !== this.authService.currentUserValue?.id;
    }

    isAdmin(): boolean {
        if (!this.group || !this.authService.currentUserValue) return false;
        const currentUserId = this.authService.currentUserValue.id;

        // Find member with loose equality to match string/number
        const member = this.group.members?.find(m => m.user.id == currentUserId);

        console.log('isAdmin Check:', {
            currentUserId,
            foundMemberRole: member?.role,
            isSuperAdmin: this.authService.currentUserValue.role === 'super_admin'
        });

        return member?.role === 'admin' || this.authService.currentUserValue.role === 'super_admin';
    }
}
