import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { BadRequestException } from '@nestjs/common';

describe('WeatherController', () => {
    let controller: WeatherController;
    let service: jest.Mocked<WeatherService>;

    beforeEach(async () => {
        const mockWeatherService = {
            getWeatherForDate: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [WeatherController],
            providers: [
                {
                    provide: WeatherService,
                    useValue: mockWeatherService,
                },
            ],
        }).compile();

        controller = module.get<WeatherController>(WeatherController);
        service = module.get(WeatherService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getWeather', () => {
        it('should return weather data for valid inputs', async () => {
            const mockData = { temperature: 20, weatherCode: 1, isHistorical: false };
            service.getWeatherForDate.mockResolvedValue(mockData);

            const result = await controller.getWeather('35.6895', '139.6917', '2024-05-01');
            expect(result).toEqual(mockData);
            expect(service.getWeatherForDate).toHaveBeenCalledWith(35.6895, 139.6917, '2024-05-01');
        });

        it('should throw BadRequestException if lat is missing', async () => {
            await expect(controller.getWeather('', '139.6917', '2024-05-01')).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if invalid lat/lon provided', async () => {
            await expect(controller.getWeather('abc', 'def', '2024-05-01')).rejects.toThrow(BadRequestException);
        });
    });
});
