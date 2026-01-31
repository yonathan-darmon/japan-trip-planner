import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface GeocodeResult {
    latitude: number;
    longitude: number;
    displayName?: string;
}

@Injectable()
export class GeocodingService {
    private readonly photonUrl = 'https://photon.komoot.io/api/';
    private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';
    private lastRequestTime = 0;
    private readonly logger = new Logger(GeocodingService.name);

    constructor() { }

    /**
     * Ensure we respect rate limits
     */
    private async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minDelay = 1100; // 1.1 seconds to be safe

        if (timeSinceLastRequest < minDelay) {
            const waitTime = minDelay - timeSinceLastRequest;
            this.logger.debug(`⏳ Waiting ${waitTime}ms to respect rate limit...`);
            await this.delay(waitTime);
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Try Photon API first (more reliable), fallback to Nominatim
     */
    async getCoordinates(address: string, countryContext?: string): Promise<{ lat: number; lng: number } | null> {
        if (!address || address.trim().length === 0) {
            return null;
        }

        await this.respectRateLimit();

        // Try Photon first
        const photonResult = await this.tryPhoton(address, countryContext);
        if (photonResult) return photonResult;

        // Fallback to Nominatim
        const nominatimResult = await this.tryNominatim(address, countryContext);
        return nominatimResult;
    }

    /**
     * Try Photon geocoding API (Komoot)
     */
    private async tryPhoton(address: string, countryContext?: string): Promise<{ lat: number; lng: number } | null> {
        const query = countryContext ? `${address}, ${countryContext}` : address;
        try {
            this.logger.debug(`🔍 [Photon] Geocoding: "${query}"`);

            const response = await axios.get(this.photonUrl, {
                params: {
                    q: query,
                    limit: 1,
                    lang: 'en',
                },
                timeout: 10000,
            });

            if (response.data?.features && response.data.features.length > 0) {
                const feature = response.data.features[0];
                const [lng, lat] = feature.geometry.coordinates;
                this.logger.log(`✅ [Photon] Found: ${lat}, ${lng} (${feature.properties.name || 'N/A'})`);
                return { lat, lng };
            }

            this.logger.warn(`⚠️ [Photon] No results for: "${query}"`);
            return null;
        } catch (error) {
            this.logger.error(`❌ [Photon] Error: ${error.message}`);
            return null;
        }
    }

    /**
     * Try Nominatim geocoding API (OpenStreetMap)
     */
    private async tryNominatim(address: string, countryContext?: string): Promise<{ lat: number; lng: number } | null> {
        const query = countryContext ? `${address}, ${countryContext}` : address;
        try {
            this.logger.debug(`🔍 [Nominatim] Geocoding: "${query}"`);

            const params: any = {
                q: query,
                format: 'json',
                limit: 1,
                addressdetails: 1,
            };

            // If context is strictly "Japan", we can add countrycodes for optimization, 
            // but for generic support, appending name to query is safer unless we map codes.
            if (countryContext?.toLowerCase() === 'japan' || countryContext?.toLowerCase() === 'japon') {
                params.countrycodes = 'jp';
            }

            const response = await axios.get(this.nominatimUrl, {
                params,
                headers: {
                    'User-Agent': 'JapanTripPlanner/1.0',
                    'Accept-Language': 'en',
                },
                timeout: 10000,
            });

            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                this.logger.log(`✅ [Nominatim] Found: ${lat}, ${lon} (${result.display_name})`);
                return {
                    lat: lat,
                    lng: lon,
                };
            }

            this.logger.warn(`⚠️ [Nominatim] No results for: "${query}"`);
            return null;
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                this.logger.error(`❌ [Nominatim] Timeout for: "${query}"`);
            } else if (error.response) {
                this.logger.error(`❌ [Nominatim] API error (${error.response.status}): ${error.response.statusText}`);
            } else {
                this.logger.error(`❌ [Nominatim] Error: ${error.message}`);
            }
            return null;
        }
    }

    /**
     * Geocode with retry logic
     */
    async getCoordinatesWithRetry(
        address: string,
        countryContext?: string,
        maxRetries: number = 2,
    ): Promise<{ lat: number; lng: number } | null> {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            const result = await this.getCoordinates(address, countryContext);

            if (result) {
                if (attempt > 0) {
                    this.logger.log(`✅ Geocoded "${address}" on attempt ${attempt + 1}`);
                }
                return result;
            }

            if (attempt < maxRetries) {
                const delay = 2000 * Math.pow(2, attempt);
                this.logger.debug(`⏳ Retrying geocoding in ${delay}ms... (attempt ${attempt + 2}/${maxRetries + 1})`);
                await this.delay(delay);
            }
        }

        this.logger.warn(`❌ Failed to geocode "${address}" after ${maxRetries + 1} attempts`);
        return null;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
