import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth-guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

export const routes: Routes = [
    {
        path: 'auth',
        children: [
            { path: 'login', component: LoginComponent }
        ]
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            // Dashboard
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent)
            },
            // Suggestions
            {
                path: 'suggestions',
                loadComponent: () => import('./suggestions/suggestion-list/suggestion-list').then(m => m.SuggestionListComponent)
            },
            {
                path: 'suggestions/new',
                loadComponent: () => import('./suggestions/suggestion-form/suggestion-form').then(m => m.SuggestionFormComponent)
            },
            {
                path: 'suggestions/edit/:id',
                loadComponent: () => import('./suggestions/suggestion-form/suggestion-form').then(m => m.SuggestionFormComponent)
            },
            {
                path: 'suggestions/:id',
                loadComponent: () => import('./suggestions/suggestion-detail/suggestion-detail.component').then(m => m.SuggestionDetailComponent)
            },
            // Trip Config (Super Admin only)
            {
                path: 'trip-config',
                loadComponent: () => import('./trip-config/trip-config.component').then(m => m.TripConfigComponent),
                canActivate: [superAdminGuard]
            },
            // Itinerary List
            {
                path: 'itineraries',
                loadComponent: () => import('./itinerary/itinerary-list.component').then(m => m.ItineraryListComponent)
            },
            // Itinerary Viewer
            {
                path: 'itinerary/:id',
                loadComponent: () => import('./itinerary/itinerary-viewer').then(m => m.ItineraryViewerComponent)
            },
            // Help / Guide
            {
                path: 'help',
                loadComponent: () => import('./help/help.component').then(m => m.HelpComponent)
            },
            // Administration - Users
            {
                path: 'users',
                loadComponent: () => import('./users/user-list/user-list').then(m => m.UserListComponent),
                canActivate: [superAdminGuard]
            },
            {
                path: 'users/new',
                loadComponent: () => import('./users/user-form/user-form').then(m => m.UserFormComponent),
                canActivate: [superAdminGuard]
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
