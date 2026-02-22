import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('WeatherService', () => {
    let service: WeatherService;
    let httpService: jest.Mocked<HttpService>;

    beforeEach(async () => {
        const mockHttpService = {
            get: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WeatherService,
                { provide: HttpService, useValue: mockHttpService },
            ],
        }).compile();

        service = module.get<WeatherService>(WeatherService);
        httpService = module.get(HttpService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getWeatherForDate', () => {
        it('should call fetchForecast for dates within 14 days', async () => {
            const today = new Date();
            today.setDate(today.getDate() + 5);
            const targetDateStr = today.toISOString().split('T')[0];

            httpService.get.mockReturnValue(of({
                data: {
                    daily: {
                        temperature_2m_max: [25],
                        temperature_2m_min: [15],
                        weathercode: [2]
                    }
                }
            } as any));

            const result = await service.getWeatherForDate(35.6895, 139.6917, targetDateStr);

            expect(result).toEqual({ temperature: 20, weatherCode: 2, isHistorical: false });
            expect(httpService.get).toHaveBeenCalledTimes(1);
            expect(httpService.get.mock.calls[0][0]).toContain('api.open-meteo.com/v1/forecast');
        });

        it('should call fetchHistorical for dates > 14 days in future with 1 year offset', async () => {
            const today = new Date();
            today.setDate(today.getDate() + 30); // 30 days in future
            const targetDateStr = today.toISOString().split('T')[0];

            httpService.get.mockReturnValue(of({
                data: {
                    daily: {
                        temperature_2m_max: [30],
                        temperature_2m_min: [20],
                        weathercode: [3]
                    }
                }
            } as any));

            const result = await service.getWeatherForDate(35.6895, 139.6917, targetDateStr);

            expect(result).toEqual({ temperature: 25, weatherCode: 3, isHistorical: true });
            expect(httpService.get).toHaveBeenCalledTimes(1);
            expect(httpService.get.mock.calls[0][0]).toContain('archive-api.open-meteo.com/v1/archive');

            // Check if year was subtracted
            const calledUrl = httpService.get.mock.calls[0][0];
            const currentYear = today.getFullYear();
            expect(calledUrl).toContain(`start_date=${currentYear - 1}`);
        });

        it('should throw HttpException on error', async () => {
            const today = new Date();
            const targetDateStr = today.toISOString().split('T')[0];

            httpService.get.mockReturnValue({
                subscribe: () => { throw new Error('API Error'); }
            } as any);

            await expect(service.getWeatherForDate(35.6895, 139.6917, targetDateStr)).rejects.toThrow(HttpException);
        });
    });
});
