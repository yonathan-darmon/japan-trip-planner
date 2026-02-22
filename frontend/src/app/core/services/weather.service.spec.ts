import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WeatherService, WeatherData } from './weather.service';
import { environment } from '../../../environments/environment';

describe('WeatherService', () => {
    let service: WeatherService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [WeatherService]
        });
        service = TestBed.inject(WeatherService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call backend weather endpoint', () => {
        const dummyWeather: WeatherData = { temperature: 20, weatherCode: 1, isHistorical: false };
        const lat = 35.6895;
        const lon = 139.6917;
        const dateStr = '2024-05-01';

        service.getWeatherForDate(lat, lon, dateStr).subscribe(data => {
            expect(data).toEqual(dummyWeather);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/weather?lat=35.6895&lon=139.6917&date=2024-05-01`);
        expect(req.request.method).toBe('GET');
        req.flush(dummyWeather);
    });

    it('should return correct emojis for weather codes', () => {
        expect(service.getWeatherEmoji(0)).toBe('☀️');
        expect(service.getWeatherEmoji(3)).toBe('☁️');
        expect(service.getWeatherEmoji(61)).toBe('🌧️');
        expect(service.getWeatherEmoji(71)).toBe('❄️');
        expect(service.getWeatherEmoji(95)).toBe('⛈️');
        expect(service.getWeatherEmoji(999)).toBe('🌡️'); // Default
    });
});
