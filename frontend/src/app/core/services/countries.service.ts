import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Country {
    id: number;
    name: string;
    code: string;
    supportedFeatures?: Record<string, boolean>;
}

@Injectable({
    providedIn: 'root'
})
export class CountriesService {
    private apiUrl = `${environment.apiUrl}/countries`;

    constructor(private http: HttpClient) { }

    findAll(): Observable<Country[]> {
        return this.http.get<Country[]>(this.apiUrl);
    }

    create(country: { name: string; code: string }): Observable<Country> {
        return this.http.post<Country>(this.apiUrl, country);
    }

    assignSuggestions(countryId: number, suggestionIds: number[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/${countryId}/assign-suggestions`, { suggestionIds });
    }
}
