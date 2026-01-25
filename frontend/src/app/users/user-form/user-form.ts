import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users';
import { UserRole } from '../../core/services/auth';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.css']
})
export class UserFormComponent {
  formData = {
    username: '',
    password: '',
    role: UserRole.STANDARD
  };

  loading = false;
  error = '';
  UserRole = UserRole; // Make enum available in template

  constructor(
    private usersService: UsersService,
    private router: Router
  ) { }

  onSubmit() {
    if (!this.formData.username || !this.formData.password) {
      this.error = 'Veuillez remplir les champs obligatoires';
      return;
    }

    this.loading = true;
    this.error = '';

    this.usersService.create(this.formData).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error('Error creating user', err);
        this.error = 'Erreur lors de la création (Vérifiez si l\'utilisateur existe déjà)';
        this.loading = false;
      }
    });
  }
}
