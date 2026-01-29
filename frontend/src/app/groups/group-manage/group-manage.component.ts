import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupsService, Group } from '../../core/services/groups.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-group-manage',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="dashboard-header fade-in">
      <h1>👥 Mon Groupe de Voyage</h1>
      <p>Gérez les membres et invitez vos compagnons.</p>
    </div>

    <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 fade-in" style="animation-delay: 100ms;">
        
        <!-- LOADING STATE -->
        <div *ngIf="loading && !group" class="flex justify-center p-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>

        <div *ngIf="group" class="space-y-8">
            
            <!-- GROUP INFO CARD -->
            <div class="card glass">
                <div class="px-6 py-5 border-b border-gray-200/30 flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">{{ group.name }}</h3>
                        <p class="mt-1 text-sm text-gray-500">Voyage au Japon</p>
                    </div>
                    <span class="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-800">
                        {{ group?.members?.length }} membres
                    </span>
                </div>
            </div>

            <!-- MEMBERS LIST -->
            <div class="card glass">
                <div class="px-6 py-5 border-b border-gray-200/30">
                    <h3 class="text-lg font-bold text-gray-900">Membres du Groupe</h3>
                    <p class="mt-1 text-sm text-gray-500">Liste des participants ayant accès au voyage.</p>
                </div>
                <ul class="divide-y divide-gray-200/30">
                    <li *ngFor="let member of group.members" class="px-6 py-4 flex items-center justify-between hover:bg-white/30 transition-colors">
                        <div class="flex items-center space-x-4">
                            <!-- Avatar Placeholder -->
                            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                {{ member.user.username.charAt(0).toUpperCase() }}
                            </div>
                            <div>
                                <p class="text-sm font-bold text-gray-900">{{ member.user.username }}</p>
                                <p class="text-xs text-gray-500">{{ member.user.email }}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <span [ngClass]="{
                                'bg-purple-100 text-purple-800': member.role === 'admin',
                                'bg-green-100 text-green-800': member.role === 'member'
                            }" class="px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wide">
                                {{ member.role }}
                            </span>
                            <button *ngIf="canRemoveInfo(member)" 
                                    (click)="removeMember(member.user.id)" 
                                    class="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                                    title="Retirer du groupe">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </li>
                </ul>
            </div>

            <!-- INVITE SECTION -->
            <div class="card glass">
                <div class="px-6 py-5">
                    <h3 class="text-lg font-bold text-gray-900 flex items-center">
                        <span class="mr-2">✉️</span> Inviter un ami
                    </h3>
                    <div class="mt-2 text-sm text-gray-600">
                        <p>Entrez l'adresse email de la personne avec qui vous souhaitez voyager.</p>
                    </div>
                    
                    <form (ngSubmit)="inviteMember()" class="mt-5 sm:flex sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        <div class="w-full sm:max-w-md">
                            <label for="email" class="sr-only">Email</label>
                            <input type="email" name="email" id="email" 
                                   [(ngModel)]="inviteEmail" 
                                   class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white/50 backdrop-blur-sm" 
                                   placeholder="ami@exemple.com">
                        </div>
                        <button type="submit" 
                                [disabled]="loading || !inviteEmail" 
                                class="btn btn-primary w-full sm:w-auto flex justify-center items-center">
                            <span *ngIf="loading" class="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            {{ loading ? 'Envoi...' : 'Envoyer l\'invitation' }}
                        </button>
                    </form>

                    <!-- Feedback Messages -->
                    <div *ngIf="message" class="mt-4 p-3 rounded-md text-sm font-medium animate-pulse" 
                         [ngClass]="{'bg-green-50 text-green-700': !isError, 'bg-red-50 text-red-700': isError}">
                        {{ message }}
                    </div>
                </div>
            </div>

        </div>
    </div>
    `,
    styles: [`
        .glass {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
        }
        .dashboard-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        .dashboard-header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        .dashboard-header p {
            font-size: 1.1rem;
            color: #64748b;
        }
        .btn {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: all 0.2s;
            cursor: pointer;
        }
        .btn-primary {
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            color: white;
            border: none;
            box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
        }
        .btn-primary:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(99, 102, 241, 0.5);
        }
        .btn-primary:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
        /* Fade In Animation */
        .fade-in {
            animation: fadeIn 0.6s ease-out forwards;
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
    loading = false;
    inviteEmail = '';
    message = '';
    isError = false;
    currentGroupId: number | null = null;

    constructor(
        private groupsService: GroupsService,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        const storedId = localStorage.getItem('currentGroupId');
        if (storedId) {
            this.currentGroupId = +storedId;
            this.loadGroup();
        }
    }

    loadGroup() {
        if (!this.currentGroupId) return;
        this.loading = true;
        this.groupsService.getGroup(this.currentGroupId).subscribe({
            next: (group) => {
                this.group = group;
                this.loading = false;
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
                this.loadGroup(); // Refresh list to verify or just show success
            },
            error: (err) => {
                this.message = err.error?.message || 'Échec de l\'invitation. Vérifiez l\'email.';
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

    canRemoveInfo(member: any): boolean {
        // Logic: Can remove if I am admin, and target is NOT me.
        // For now, consistent with previous logic, backend handles security.
        return true;
    }
}
