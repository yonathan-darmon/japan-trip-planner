import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService, User } from '../../core/services/auth';

interface Group {
    id: number;
    name: string;
    role: string;
    country?: { name: string; code: string };
}

@Component({
    selector: 'app-group-selection',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Select a Trip Group
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
            or <a routerLink="/signup" class="font-medium text-indigo-600 hover:text-indigo-500">create a new one</a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div *ngIf="loading" class="text-center py-4">Loading groups...</div>
            
            <div *ngIf="!loading && groups.length === 0" class="text-center py-4 text-gray-500">
                You are not part of any group yet.
                <div class="mt-4">
                     <button routerLink="/signup" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                        Create New Group
                     </button>
                </div>
            </div>

            <ul *ngIf="!loading && groups.length > 0" class="divide-y divide-gray-200">
                <li *ngFor="let group of groups" (click)="selectGroup(group)" class="py-4 flex hover:bg-gray-50 cursor-pointer rounded-md px-2 transition-colors">
                    <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">{{ group.name }}</p>
                        <p class="text-sm text-gray-500" *ngIf="group.country">Destination: {{ group.country.name }}</p>
                        <p class="text-xs text-gray-400">Role: {{ group.role }}</p>
                    </div>
                    <div class="ml-auto flex items-center">
                        <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                    </div>
                </li>
            </ul>
        </div>
      </div>
    </div>
  `
})
export class GroupSelectionComponent implements OnInit {
    groups: Group[] = [];
    loading = true;

    constructor(
        private http: HttpClient,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.fetchGroups();
    }

    fetchGroups() {
        // We need an endpoint to get user's groups. 
        // Ideally GET /groups/my or similar.
        // If not exists, I might need to add it to backend GroupsController.
        this.http.get<any[]>(`${environment.apiUrl}/groups/my`).subscribe({
            next: (data) => {
                this.groups = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to fetch groups', err);
                this.loading = false;
            }
        });
    }

    selectGroup(group: Group) {
        // Store selected group context
        localStorage.setItem('currentGroupId', group.id.toString());
        // Also fetch context? Or just ID is enough?
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
    }
}
