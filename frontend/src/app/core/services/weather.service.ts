import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WeatherData {
    temperature: number;
    weatherCode: number;
    isHistorical: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class WeatherService {
    private apiUrl = `${environment.apiUrl}/weather`;

    constructor(private http: HttpClient) { }

    getWeatherForDate(lat: number, lon: number, dateStr: string): Observable<WeatherData> {
        let params = new HttpParams()
            .set('lat', lat.toString())
            .set('lon', lon.toString())
            .set('date', dateStr);

        return this.http.get<WeatherData>(this.apiUrl, { params });
    }

    // Helper method to convert Open-Meteo WMO weather codes to emojis
    getWeatherEmoji(code: number): string {
        // 0: Clear sky
        if (code === 0) return '☀️';

        // 1, 2, 3: Mainly clear, partly cloudy, and overcast
        if (code === 1) return '🌤️';
        if (code === 2) return '⛅';
        if (code === 3) return '☁️';

        // 45, 48: Fog and depositing rime fog
        if (code === 45 || code === 48) return '🌫️';

        // 51, 53, 55: Drizzle: Light, moderate, and dense intensity
        // 56, 57: Freezing Drizzle: Light and dense intensity
        if ([51, 53, 55, 56, 57].includes(code)) return '🌧️';

        // 61, 63, 65: Rain: Slight, moderate and heavy intensity
        // 66, 67: Freezing Rain: Light and heavy intensity
        if ([61, 63, 65, 66, 67].includes(code)) return '🌧️';

        // 80, 81, 82: Rain showers: Slight, moderate, and violent
        if ([80, 81, 82].includes(code)) return '🌦️';

        // 71, 73, 75: Snow fall: Slight, moderate, and heavy intensity
        // 77: Snow grains
        // 85, 86: Snow showers slight and heavy
        if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';

        // 95: Thunderstorm: Slight or moderate
        // 96, 99: Thunderstorm with slight and heavy hail
        if ([95, 96, 99].includes(code)) return '⛈️';

        return '🌡️'; // Default
    }
}
