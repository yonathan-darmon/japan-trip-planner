import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum GroupRole {
    ADMIN = 'admin',
    MEMBER = 'member',
}

export interface Group {
    id: number;
    name: string;
    role: GroupRole | string;
    country?: { name: string; code: string };
    members?: GroupMember[];
}

export interface GroupMember {
    id: number;
    role: GroupRole | string;
    user: { id: number; username: string; email: string };
    joinedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class GroupsService {
    private apiUrl = `${environment.apiUrl}/groups`;

    constructor(private http: HttpClient) { }

    getMyGroups(): Observable<Group[]> {
        return this.http.get<Group[]>(`${this.apiUrl}/my`);
    }

    getAllGroups(): Observable<Group[]> {
        return this.http.get<Group[]>(this.apiUrl);
    }

    getGroup(id: number): Observable<Group> {
        return this.http.get<Group>(`${this.apiUrl}/${id}`);
    }

    inviteMember(groupId: number, email: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${groupId}/members`, { email });
    }

    removeMember(groupId: number, userId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${groupId}/members/${userId}`);
    }
    update(id: number, data: { countryId?: number }): Observable<Group> {
        return this.http.patch<Group>(`${this.apiUrl}/${id}`, data);
    }
}
