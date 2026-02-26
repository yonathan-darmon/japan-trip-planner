import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { SignupComponent } from './auth/signup/signup.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth-guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

import { GroupSelectionComponent } from './auth/group-selection/group-selection.component';

export const routes: Routes = [
    {
        path: 'auth',
        children: [
            { path: 'login', component: LoginComponent, data: { title: 'Connexion', description: 'Connectez-vous pour commencer à planifier votre voyage.' } },
            { path: 'signup', component: SignupComponent, data: { title: 'Inscription', description: 'Créez un compte gratuitement.' } }
        ]
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'groups',
                component: GroupSelectionComponent,
                data: { title: 'Vos Groupes', description: 'Sélectionnez un groupe de voyage existant ou créez-en un nouveau.' }
            },
            {
                path: 'groups/manage',
                loadComponent: () => import('./groups/group-manage/group-manage.component').then(m => m.GroupManageComponent),
                data: { title: 'Gérer les Groupes', description: 'Administration de votre groupe de voyage, invitations et configuration.' }
            },
            // Dashboard
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
                data: { title: 'Tableau de Bord', description: 'Aperçu de votre voyage, statistiques et avancement de l\'itinéraire.' }
            },
            // Suggestions
            {
                path: 'suggestions',
                loadComponent: () => import('./suggestions/suggestion-list/suggestion-list').then(m => m.SuggestionListComponent),
                data: { title: 'Suggestions de voyage', description: 'Proposez des lieux et des activités, ou votez pour ceux des autres membres.' }
            },
            {
                path: 'suggestions/new',
                loadComponent: () => import('./suggestions/suggestion-form/suggestion-form').then(m => m.SuggestionFormComponent),
                data: { title: 'Nouvelle Suggestion', description: 'Ajoutez une nouvelle idée de visite pour le groupe.' }
            },
            {
                path: 'suggestions/edit/:id',
                loadComponent: () => import('./suggestions/suggestion-form/suggestion-form').then(m => m.SuggestionFormComponent),
                data: { title: 'Modifier la Suggestion', description: 'Modifiez les détails de cette idée.' }
            },
            {
                path: 'suggestions/:id',
                loadComponent: () => import('./suggestions/suggestion-detail/suggestion-detail.component').then(m => m.SuggestionDetailComponent),
                data: { title: 'Détail de la Suggestion', description: 'Explorez en détail cette suggestion de voyage.' }
            },
            // Trip Config (Super Admin only)
            {
                path: 'trip-config',
                loadComponent: () => import('./trip-config/trip-config.component').then(m => m.TripConfigComponent),
                canActivate: [superAdminGuard],
                data: { title: 'Configuration Globale', description: 'Paramètres d\'administration avancée du système.' }
            },
            // Itinerary List
            {
                path: 'itineraries',
                loadComponent: () => import('./itinerary/itinerary-list.component').then(m => m.ItineraryListComponent),
                data: { title: 'Liste des Itinéraires', description: 'Consultez les itinéraires générés pour le voyage.' }
            },
            // Itinerary Viewer
            {
                path: 'itinerary/:id',
                loadComponent: () => import('./itinerary/itinerary-viewer').then(m => m.ItineraryViewerComponent),
                data: { title: 'Itinéraire', description: 'Visionnez et personnalisez votre planning complet au jour le jour.' }
            },
            // Help / Guide
            {
                path: 'help',
                loadComponent: () => import('./help/help.component').then(m => m.HelpComponent),
                data: { title: 'Guide Utilisateur', description: 'Découvrez comment bien utiliser l\'application.' }
            },
            // Administration - Users
            {
                path: 'settings',
                loadComponent: () => import('./users/user-settings/user-settings.component').then(m => m.UserSettingsComponent),
                data: { title: 'Paramètres du Profil', description: 'Modifiez vos informations personnelles.' }
            },
            {
                path: 'admin',
                loadComponent: () => import('./users/super-admin/super-admin').then(m => m.SuperAdminComponent),
                canActivate: [superAdminGuard],
                data: { title: 'Super Admin', description: 'Administration système.' }
            },
            {
                path: 'users',
                loadComponent: () => import('./users/user-list/user-list').then(m => m.UserListComponent),
                canActivate: [superAdminGuard],
                data: { title: 'Liste des Utilisateurs', description: 'Gestion des utilisateurs.' }
            },
            {
                path: 'users/new',
                loadComponent: () => import('./users/user-form/user-form').then(m => m.UserFormComponent),
                canActivate: [superAdminGuard],
                data: { title: 'Nouvel Utilisateur', description: 'Création d\'un compte manuel.' }
            },
            {
                path: 'admin/suggestions',
                loadComponent: () => import('./suggestions/suggestion-moderation/suggestion-moderation').then(m => m.SuggestionModerationComponent),
                canActivate: [superAdminGuard],
                data: { title: 'Modération', description: 'Gérez la base des données des suggestions globales.' }
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
