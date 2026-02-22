import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('weather')
@UseGuards(JwtAuthGuard)
export class WeatherController {
    constructor(private readonly weatherService: WeatherService) { }

    @Get()
    async getWeather(
        @Query('lat') lat: string,
        @Query('lon') lon: string,
        @Query('date') date: string,
    ) {
        if (!lat || !lon || !date) {
            throw new BadRequestException('Les paramètres lat, lon et date sont requis');
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            throw new BadRequestException('La latitude et la longitude doivent être des nombres valides');
        }

        return this.weatherService.getWeatherForDate(latitude, longitude, date);
    }
}
