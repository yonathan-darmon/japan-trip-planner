import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersService } from '../../core/services/users';
import { User, UserRole } from '../../core/services/auth';
import { GroupRole, GroupsService } from '../../core/services/groups.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error = '';

  constructor(
    private usersService: UsersService,
    private groupsService: GroupsService
  ) { }

  ngOnInit() {
    this.loadUsers();
    this.loadAllGroups();
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
  selectedUser: any | null = null;
  userGroups: any[] = [];
  allGroups: any[] = [];
  showGroupModal = false;
  loadingGroups = false;

  // Form for adding to group
  newMembership = {
    groupId: 0,
    role: GroupRole.MEMBER
  };

  loadAllGroups() {
    this.usersService.getAllGroups().subscribe(groups => {
      this.allGroups = groups;
    });
  }

  openGroupManagement(user: any) {
    this.selectedUser = user;
    this.showGroupModal = true;
    this.loadingGroups = true;
    this.newMembership = { groupId: 0, role: GroupRole.MEMBER };

    this.loadUserGroups(user.id);
  }

  loadUserGroups(userId: number) {
    this.loadingGroups = true;
    this.usersService.getUserGroups(userId).subscribe({
      next: (groups) => {
        this.userGroups = groups;
        this.loadingGroups = false;
      }
    });
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
        this.loadUserGroups(this.selectedUser!.id);
        this.loadUsers(); // Refresh main table
      },
      error: (err) => {
        alert('Erreur: ' + (err.error?.message || err.message));
      }
    });
  }

  addToGroup() {
    if (!this.selectedUser || !this.newMembership.groupId) return;

    this.usersService.addUserToGroup(
      this.selectedUser.id,
      this.newMembership.groupId,
      this.newMembership.role
    ).subscribe({
      next: () => {
        this.loadUserGroups(this.selectedUser!.id);
        this.loadUsers(); // Refresh main table
        this.newMembership.groupId = 0;
      },
      error: (err) => {
        alert('Erreur: ' + (err.error?.message || err.message));
      }
    });
  }

  changeRole(groupId: number, role: string) {
    if (!this.selectedUser) return;

    this.usersService.addUserToGroup(this.selectedUser.id, groupId, role).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        alert('Erreur: ' + (err.error?.message || err.message));
      }
    });
  }

  getAvailableGroups() {
    // Filter out groups user is already in
    const userGroupIds = this.userGroups.map(ug => ug.group.id);
    return this.allGroups.filter(g => !userGroupIds.includes(g.id));
  }

  getRoleBadgeClass(role: UserRole | string): string {
    return role === UserRole.SUPER_ADMIN || role === 'super_admin' ? 'badge-primary' : 'badge-secondary';
  }

  setGroupCountry(groupId: number) {
    const countryIdStr = prompt('Entrez l\'ID du pays pour ce groupe (ex: 1 pour Japon) :', '1');
    if (!countryIdStr) return;
    const countryId = parseInt(countryIdStr, 10);
    if (isNaN(countryId)) {
      alert('ID invalide');
      return;
    }

    this.groupsService.update(groupId, { countryId }).subscribe({
      next: () => {
        alert('Pays du groupe mis à jour !');
        if (this.selectedUser) {
          this.loadUserGroups(this.selectedUser.id);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de la mise à jour');
      }
    });
  }
}
