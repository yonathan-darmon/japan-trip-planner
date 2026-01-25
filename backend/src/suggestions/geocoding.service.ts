import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
    constructor() { }

    async getCoordinates(address: string): Promise<{ lat: number; lng: number } | null> {
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: address,
                    format: 'json',
                    limit: 1,
                },
                headers: {
                    'User-Agent': 'JapanTripPlanner/1.0',
                },
            });

            if (response.data && response.data.length > 0) {
                return {
                    lat: parseFloat(response.data[0].lat),
                    lng: parseFloat(response.data[0].lon),
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding Error:', error.message);
            return null; // Fail silently, just won't have coordinates
        }
    }
}
