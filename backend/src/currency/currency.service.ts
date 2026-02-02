import { Injectable, Logger } from '@nestjs/common';
import { parseStringPromise } from 'xml2js';

export interface ExchangeRates {
    [currency: string]: number;
}

export interface CachedRates {
    rates: ExchangeRates;
    timestamp: number;
    source: 'ecb' | 'fallback';
}

@Injectable()
export class CurrencyService {
    private readonly logger = new Logger(CurrencyService.name);
    private readonly ECB_API_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    private cachedRates: CachedRates | null = null;

    // Fallback static rates (same as frontend)
    private readonly FALLBACK_RATES: ExchangeRates = {
        EUR: 1,
        JPY: 163.26,
        USD: 1.04,
        GBP: 0.83,
        AUD: 1.66,
        CAD: 1.50,
        CHF: 0.94,
        CNY: 7.58,
        SEK: 11.46,
        NZD: 1.81,
    };

    /**
     * Get current exchange rates (from cache or fetch new ones)
     */
    async getRates(): Promise<CachedRates> {
        // Check if cache is valid
        if (this.isCacheValid()) {
            this.logger.log('✅ Returning cached ECB rates');
            return this.cachedRates!;
        }

        // Try to fetch fresh rates from ECB
        try {
            this.logger.log('🔄 Fetching fresh rates from ECB API...');
            const rates = await this.fetchECBRates();

            this.cachedRates = {
                rates,
                timestamp: Date.now(),
                source: 'ecb',
            };

            this.logger.log(`✅ Successfully fetched ECB rates: ${Object.keys(rates).length} currencies`);
            return this.cachedRates;
        } catch (error) {
            this.logger.warn(`⚠️ Failed to fetch ECB rates: ${error.message}`);

            // Use fallback rates
            this.cachedRates = {
                rates: this.FALLBACK_RATES,
                timestamp: Date.now(),
                source: 'fallback',
            };

            this.logger.log('📊 Using fallback static rates');
            return this.cachedRates;
        }
    }

    /**
     * Check if cached rates are still valid
     */
    private isCacheValid(): boolean {
        if (!this.cachedRates) {
            return false;
        }

        const age = Date.now() - this.cachedRates.timestamp;
        return age < this.CACHE_TTL;
    }

    /**
     * Fetch rates from ECB API and parse XML
     */
    private async fetchECBRates(): Promise<ExchangeRates> {
        const response = await fetch(this.ECB_API_URL);

        if (!response.ok) {
            throw new Error(`ECB API returned ${response.status}`);
        }

        const xmlText = await response.text();
        const rates = await this.parseECBXML(xmlText);

        return rates;
    }

    /**
     * Parse ECB XML response
     */
    private async parseECBXML(xmlText: string): Promise<ExchangeRates> {
        try {
            const result = await parseStringPromise(xmlText);

            const cubes = result['gesmes:Envelope']?.Cube?.[0]?.Cube?.[0]?.Cube;

            if (!cubes || !Array.isArray(cubes)) {
                throw new Error('Invalid XML structure from ECB');
            }

            const rates: ExchangeRates = { EUR: 1 }; // EUR is always 1

            for (const cube of cubes) {
                const currency = cube.$?.currency;
                const rate = cube.$?.rate;

                if (currency && rate) {
                    rates[currency] = parseFloat(rate);
                }
            }

            return rates;
        } catch (error) {
            this.logger.error('Failed to parse ECB XML', error);
            throw new Error('Failed to parse ECB XML response');
        }
    }

    /**
     * Clear cache (useful for testing)
     */
    clearCache(): void {
        this.cachedRates = null;
        this.logger.log('🗑️ Cache cleared');
    }
}
