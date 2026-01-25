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

  getRoleBadgeClass(role: UserRole | string): string {
    return role === UserRole.SUPER_ADMIN || role === 'super_admin' ? 'badge-primary' : 'badge-secondary';
  }
}
