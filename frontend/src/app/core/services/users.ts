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

    getAll(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    deleteSelf(): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/me/delete`);
    }

    markChangelogRead(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/me/changelog-read`, {});
    }

    create(user: any): Observable<User> {
        return this.http.post<User>(this.apiUrl, user);
    }

    forceLogout(userId: number): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}/admin/users/${userId}/force-logout`, {});
    }
}
