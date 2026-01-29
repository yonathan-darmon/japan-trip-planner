import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Changelog {
    id: number;
    version: string;
    content: string;
    publishedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class ChangelogService {
    private apiUrl = `${environment.apiUrl}/changelog`;

    constructor(private http: HttpClient) { }

    getLatest(): Observable<Changelog[]> {
        return this.http.get<Changelog[]>(this.apiUrl);
    }
}
