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
    <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Manage Group</h1>

        <div *ngIf="group" class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Group Information</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">{{ group.name }}</p>
          </div>
        </div>

        <div *ngIf="group" class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
           <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
                <h3 class="text-lg leading-6 font-medium text-gray-900">Members</h3>
                <p class="mt-1 max-w-2xl text-sm text-gray-500">Manage who has access to this trip.</p>
            </div>
          </div>
          <div class="border-t border-gray-200">
            <ul class="divide-y divide-gray-200">
                <li *ngFor="let member of group.members" class="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-indigo-600 truncate">{{ member.user.username }}</p>
                        <p class="text-sm text-gray-500">{{ member.user.email }}</p>
                    </div>
                    <div class="flex items-center">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mr-4">
                            {{ member.role }}
                        </span>
                        <button *ngIf="canRemoveInfo(member)" (click)="removeMember(member.user.id)" class="text-red-600 hover:text-red-900 text-sm font-medium">Remove</button>
                    </div>
                </li>
            </ul>
          </div>
        </div>

        <div class="bg-white shadow sm:rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Invite New Member</h3>
            <div class="mt-2 text-sm text-gray-500">
              <p>Enter the email address of the user you want to invite.</p>
            </div>
            <form class="mt-5 sm:flex sm:items-center" (ngSubmit)="inviteMember()">
              <div class="w-full sm:max-w-xs">
                <label for="email" class="sr-only">Email</label>
                <input type="email" name="email" id="email" [(ngModel)]="inviteEmail" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="you@example.com">
              </div>
              <button type="submit" [disabled]="loading || !inviteEmail" class="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                Invite
              </button>
            </form>
            <div *ngIf="message" class="mt-3 text-sm" [ngClass]="{'text-green-600': !isError, 'text-red-600': isError}">
                {{ message }}
            </div>
          </div>
        </div>

      </div>
    </div>
  `
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
        // Get group ID from localStorage or Route?
        // Ideally from Route if we link to /groups/:id/manage
        // Or from localStorage 'currentGroupId'

        // Let's try to get from localStorage for now as 'Context', or assume we are managing "Current Group".
        const storedId = localStorage.getItem('currentGroupId');
        if (storedId) {
            this.currentGroupId = +storedId;
            this.loadGroup();
        }
    }

    loadGroup() {
        if (!this.currentGroupId) return;
        this.groupsService.getGroup(this.currentGroupId).subscribe({
            next: (group) => this.group = group,
            error: (err) => console.error('Failed to load group', err)
        });
    }

    inviteMember() {
        if (!this.currentGroupId || !this.inviteEmail) return;
        this.loading = true;
        this.message = '';
        this.isError = false;

        this.groupsService.inviteMember(this.currentGroupId, this.inviteEmail).subscribe({
            next: () => {
                this.message = 'Member invited successfully!';
                this.inviteEmail = '';
                this.loading = false;
                this.loadGroup(); // Refresh list
            },
            error: (err) => {
                this.message = err.error?.message || 'Failed to invite member';
                this.isError = true;
                this.loading = false;
            }
        });
    }

    removeMember(userId: number) {
        if (!this.currentGroupId || !confirm('Are you sure you want to remove this member?')) return;

        this.groupsService.removeMember(this.currentGroupId, userId).subscribe({
            next: () => {
                this.loadGroup();
            },
            error: (err) => alert('Failed to remove member')
        });
    }

    canRemoveInfo(member: any): boolean {
        // Logic to prevent removing self or if not admin
        // Ideally check current user ID vs member.user.id
        // For now simple TRUE, backend will block if not allowed
        return true;
    }
}
