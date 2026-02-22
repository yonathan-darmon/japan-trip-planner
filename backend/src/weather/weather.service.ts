import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface WeatherData {
    temperature: number;
    weatherCode: number;
    isHistorical: boolean;
}

@Injectable()
export class WeatherService {
    private readonly logger = new Logger(WeatherService.name);

    constructor(private readonly httpService: HttpService) { }

    /**
     * Get weather for a specific date and location
     * Logic:
     * - If date is within 14 days from now => Use Open-Meteo Forecast API
     * - If date is > 14 days in the future => Use Open-Meteo Historical API (same date, previous year)
     */
    async getWeatherForDate(lat: number, lon: number, targetDateStr: string): Promise<WeatherData> {
        try {
            const targetDate = new Date(targetDateStr);
            const today = new Date();

            // Normalize times to compare just dates
            targetDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            const diffTime = targetDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 14 && diffDays >= 0) {
                // Forecast (0 to 14 days ahead)
                return await this.fetchForecast(lat, lon, targetDateStr);
            } else {
                // Historical (either past or > 14 days future)
                // If it's in the future, we look at exactly one year ago to get the seasonal average
                let historicalDate = new Date(targetDate);
                if (diffDays > 14) {
                    historicalDate.setFullYear(historicalDate.getFullYear() - 1);
                }

                // Format directly keeping local date string
                const year = historicalDate.getFullYear();
                const month = String(historicalDate.getMonth() + 1).padStart(2, '0');
                const day = String(historicalDate.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                const data = await this.fetchHistorical(lat, lon, formattedDate);
                // Si la date est dans le futur > 14 jours, on veut que le frontend sache que 
                // c'est "historique" (pour la saison) mais on ne pas forcer l'iconographie 
                // d'une date passée (optionnel, mais utile).
                return { ...data, isHistorical: diffDays > 14 };
            }
        } catch (error) {
            this.logger.error(`Erreur lors de la récupération de la météo pour lat:${lat}, lon:${lon}, date:${targetDateStr}`, error);
            throw new HttpException('Impossible de récupérer les données météorologiques', HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private async fetchForecast(lat: number, lon: number, dateStr: string): Promise<WeatherData> {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;

        const response = await firstValueFrom(this.httpService.get(url));
        const data = response.data;

        if (!data.daily || !data.daily.temperature_2m_max || data.daily.temperature_2m_max.length === 0) {
            throw new Error('No daily forecast data found');
        }

        // Calculate average temperature between max and min for the day
        const maxTemp = data.daily.temperature_2m_max[0];
        const minTemp = data.daily.temperature_2m_min[0];
        const avgTemp = (maxTemp + minTemp) / 2;
        const weatherCode = data.daily.weathercode[0];

        return {
            temperature: Math.round(avgTemp * 10) / 10,
            weatherCode: weatherCode,
            isHistorical: false
        };
    }

    private async fetchHistorical(lat: number, lon: number, dateStr: string): Promise<WeatherData> {
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

        const response = await firstValueFrom(this.httpService.get(url));
        const data = response.data;

        if (!data.daily || !data.daily.temperature_2m_max || data.daily.temperature_2m_max.length === 0) {
            throw new Error('No historical data found');
        }

        // Calculate average temperature
        const maxTemp = data.daily.temperature_2m_max[0];
        const minTemp = data.daily.temperature_2m_min[0];
        const avgTemp = (maxTemp + minTemp) / 2;
        const weatherCode = data.daily.weathercode[0];

        return {
            temperature: Math.round(avgTemp * 10) / 10, // Keep 1 decimal
            weatherCode: weatherCode,
            isHistorical: true
        };
    }
}
