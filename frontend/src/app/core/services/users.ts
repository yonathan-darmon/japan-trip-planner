import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from './auth';

@Injectable({
    providedIn: 'root'
})
export class UsersService {
    private apiUrl = `${environment.apiUrl}/users`;

    constructor(private http: HttpClient) { }

    getUserCount(): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/count`);
    }

    getAll(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/admin/users`);
    }

    getAllGroups(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/admin/groups`);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    deleteSelf(): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/me/delete`);
    }

    markChangelogRead(): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/me/changelog-read`, {});
    }

    create(user: any): Observable<User> {
        return this.http.post<User>(this.apiUrl, user);
    }

    updateProfile(data: { username?: string; email?: string }): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/me`, data);
    }

    updatePassword(data: { oldPassword?: string; newPassword?: string }): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/me/password`, data);
    }

    uploadAvatar(file: File): Observable<User> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<User>(`${this.apiUrl}/me/avatar`, formData);
    }

    getUserGroups(userId: number): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/admin/users/${userId}/groups`);
    }

    removeUserFromGroup(userId: number, groupId: number): Observable<void> {
        return this.http.delete<void>(`${environment.apiUrl}/admin/users/${userId}/groups/${groupId}`);
    }

    forceLogout(userId: number): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}/admin/users/${userId}/force-logout`, {});
    }

    addUserToGroup(userId: number, groupId: number, role: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/admin/users/${userId}/groups`, { groupId, role });
    }

    reattributeSuggestion(suggestionId: number, userId: number | null): Observable<any> {
        return this.http.patch<any>(`${environment.apiUrl}/admin/suggestions/${suggestionId}/attribute`, { userId });
    }
}
