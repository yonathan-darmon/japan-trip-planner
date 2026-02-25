import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService, User } from '../../core/services/auth';
import { UsersService } from '../../core/services/users';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="settings-container fade-in">
      <div class="settings-header">
        <h1>👤 Paramètres du Profil</h1>
        <p>Gérez vos informations personnelles et la sécurité de votre compte.</p>
      </div>

      <div class="max-w-2xl mx-auto px-4">
        <!-- PROFILE CARD -->
        <div class="card glass mb-8">
          <div class="p-6">
            <div class="flex flex-col items-center mb-8">
              <div class="relative group cursor-pointer" (click)="fileInput.click()">
                <div class="avatar-container glass rounded-full w-32 h-32 flex-shrink-0 flex items-center justify-center overflow-hidden border-4 border-primary/20 transition-all group-hover:border-primary relative bg-bg-tertiary">
                   <img *ngIf="currentUser?.avatarUrl" [src]="currentUser?.avatarUrl" alt="Avatar" class="w-full h-full object-cover block">
                   <span *ngIf="!currentUser?.avatarUrl" class="text-4xl select-none">👤</span>
                   
                   <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span class="text-white font-bold text-sm">Modifier</span>
                   </div>
                </div>
                <input #fileInput type="file" class="hidden" (change)="onAvatarSelected($event)" accept="image/*">
              </div>
              <p class="mt-2 text-sm text-text-secondary">Cliquez pour changer votre photo</p>
            </div>

            <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
              <span class="text-primary">📝</span> Informations Générales
            </h3>
            
            <form [formGroup]="profileForm" (ngSubmit)="onUpdateProfile()" class="space-y-6">
               <div class="form-group">
                 <label for="username" class="form-label">Nom d'utilisateur</label>
                 <input type="text" formControlName="username" id="username" class="form-input" placeholder="ex: Nom de voyageur">
               </div>

               <div class="form-group">
                 <label for="email" class="form-label">Adresse Email</label>
                 <input type="email" formControlName="email" id="email" class="form-input" placeholder="ex: jean@example.com">
               </div>

               <div class="flex items-center gap-4 pt-2">
                 <button type="submit" [disabled]="profileForm.invalid || loading" class="btn btn-primary">
                   {{ loading ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                 </button>
                 <span *ngIf="successMessage" class="text-success text-sm fade-in">✅ {{ successMessage }}</span>
                 <span *ngIf="errorMessage" class="text-error text-sm fade-in">❌ {{ errorMessage }}</span>
               </div>
            </form>
          </div>
        </div>

        <!-- PASSWORD CARD -->
        <div class="card glass mb-8">
          <div class="p-6">
            <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
              <span class="text-primary">🔒</span> Sécurité & Mot de passe
            </h3>
            
            <form [formGroup]="passwordForm" (ngSubmit)="onUpdatePassword()" class="space-y-6">
               <div class="form-group">
                 <label for="oldPassword" class="form-label">Mot de passe actuel</label>
                 <input type="password" formControlName="oldPassword" id="oldPassword" class="form-input" placeholder="Votre mot de passe actuel">
               </div>

               <div class="form-group">
                 <label for="newPassword" class="form-label">Nouveau mot de passe</label>
                 <input type="password" formControlName="newPassword" id="newPassword" class="form-input" placeholder="8 caractères, majuscule, chiffre, spécial">
                 <small class="text-text-tertiary block mt-1">Min. 8 car., 1 Maj., 1 Min., 1 chiffre, 1 car. spécial (@$!%*?&)</small>
               </div>

               <div class="form-group">
                 <label for="confirmPassword" class="form-label">Confirmer le nouveau mot de passe</label>
                 <input type="password" formControlName="confirmPassword" id="confirmPassword" class="form-input" placeholder="Répéter le nouveau mot de passe">
                 <small *ngIf="passwordForm.errors?.['passwordMismatch'] && passwordForm.get('confirmPassword')?.touched" class="text-error block mt-1">Les mots de passe ne correspondent pas.</small>
               </div>

               <div class="flex items-center gap-4 pt-2">
                 <button type="submit" [disabled]="passwordForm.invalid || loadingPassword" class="btn btn-primary">
                   {{ loadingPassword ? 'Modification...' : 'Changer le mot de passe' }}
                 </button>
                 <span *ngIf="passwordSuccessMessage" class="text-success text-sm fade-in">✅ {{ passwordSuccessMessage }}</span>
                 <span *ngIf="passwordErrorMessage" class="text-error text-sm fade-in">❌ {{ passwordErrorMessage }}</span>
               </div>
            </form>
          </div>
        </div>

        <!-- DANGER ZONE -->
        <div class="card glass border-t-2 border-red-500/30">
          <div class="p-6">
            <h3 class="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
              <span class="text-2xl">⚠️</span> Zone de Danger
            </h3>
            <p class="text-text-secondary text-sm mb-6">Actions irréversibles concernant votre compte.</p>
            
            <div class="bg-red-500/5 rounded-lg p-6 border border-red-500/10">
              <h4 class="font-bold text-white mb-2">Suppression définitive du compte</h4>
              <p class="text-text-tertiary text-sm mb-5">
                Une fois votre compte supprimé, il n'y a pas de retour en arrière possible. 
                Toutes vos données seront effacées.
              </p>
              <button type="button" (click)="deleteAccount()" class="btn btn-outline border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    `,
  styles: [`
        .settings-container {
            padding: 4rem 1rem;
            min-height: calc(100vh - 100px);
        }
        .settings-header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .settings-header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        .settings-header p {
            color: var(--color-text-tertiary);
        }
        .fade-in {
            animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .text-success { color: var(--color-success); }
        .text-error { color: var(--color-error); }
    `]
})
export class UserSettingsComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = false;
  loadingPassword = false;
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';
  currentUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usersService: UsersService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser) {
      this.profileForm.patchValue({
        username: this.currentUser.username,
        email: (this.currentUser as any).email || ''
      });
    }
  }

  onUpdateProfile() {
    if (this.profileForm.invalid) return;
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.usersService.updateProfile(this.profileForm.value).subscribe({
      next: (updatedUser) => {
        this.loading = false;
        this.successMessage = 'Profil mis à jour avec succès !';
        this.authService.updateUser(updatedUser);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Erreur lors de la mise à jour : ' + (err.error?.message || err.message);
      }
    });
  }

  onUpdatePassword() {
    if (this.passwordForm.invalid) return;
    this.loadingPassword = true;
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    const payload = {
      oldPassword: this.passwordForm.value.oldPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.usersService.updatePassword(payload).subscribe({
      next: () => {
        this.loadingPassword = false;
        this.passwordSuccessMessage = 'Mot de passe modifié avec succès !';
        this.passwordForm.reset();
      },
      error: (err: any) => {
        this.loadingPassword = false;
        this.passwordErrorMessage = 'Erreur : ' + (err.error?.message || err.message);
      }
    });
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.loading = true;
      this.usersService.uploadAvatar(file).subscribe({
        next: (updatedUser) => {
          this.loading = false;
          this.authService.updateUser(updatedUser); // Update local state
          this.currentUser = updatedUser;
        },
        error: (err) => {
          this.loading = false;
          alert('Erreur upload avatar: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteAccount() {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      this.usersService.deleteSelf().subscribe({
        next: () => {
          this.authService.logout();
          this.router.navigate(['/']);
        },
        error: (err) => {
          alert('Erreur lors de la suppression du compte : ' + (err.error?.message || err.message));
        }
      });
    }
  }
}
