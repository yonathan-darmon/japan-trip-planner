import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersService } from '../../core/services/users';
import { User, UserRole } from '../../core/services/auth';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error = '';

  constructor(private usersService: UsersService) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
      }
    });
  }

  deleteUser(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    this.usersService.delete(id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
      },
      error: (err) => {
        console.error('Error deleting user', err);
        alert('Erreur lors de la suppression');
      }
    });
  }

  forceLogout(userId: number) {
    if (!confirm('Voulez-vous forcer la déconnexion de cet utilisateur ?')) return;

    this.usersService.forceLogout(userId).subscribe({
      next: () => {
        alert('L\'utilisateur a été déconnecté (son jeton sera invalidé à sa prochaine action).');
      },
      error: (err) => {
        console.error('Error forcing logout', err);
        alert('Erreur lors de la déconnexion forcée');
      }
    });
  }

  // --- GROUP MANAGEMENT ---
  selectedUser: User | null = null;
  userGroups: any[] = [];
  allGroups: any[] = [];
  showGroupModal = false;
  loadingGroups = false;

  openGroupManagement(user: User) {
    this.selectedUser = user;
    this.showGroupModal = true;
    this.loadingGroups = true;

    // Load existing groups for this user
    this.usersService.getUserGroups(user.id).subscribe({
      next: (groups) => {
        this.userGroups = groups;
        this.loadingGroups = false;
      }
    });

    // Load available groups in system
    // We should probably have a GroupsService.getAll()
  }

  closeGroupModal() {
    this.showGroupModal = false;
    this.selectedUser = null;
    this.userGroups = [];
  }

  removeFromGroup(groupId: number) {
    if (!this.selectedUser) return;
    if (!confirm('Retirer cet utilisateur de ce groupe ?')) return;

    this.usersService.removeUserFromGroup(this.selectedUser.id, groupId).subscribe({
      next: () => {
        this.userGroups = this.userGroups.filter(g => g.group.id !== groupId);
      },
      error: (err) => {
        alert('Erreur: ' + (err.error?.message || err.message));
      }
    });
  }

  getRoleBadgeClass(role: UserRole | string): string {
    return role === UserRole.SUPER_ADMIN || role === 'super_admin' ? 'badge-primary' : 'badge-secondary';
  }
}
