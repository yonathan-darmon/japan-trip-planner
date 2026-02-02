import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface CachedRates {
    rates: Record<string, number>;
    timestamp: number;
    source: 'ecb' | 'fallback';
}

/**
 * Service for currency conversion with real-time ECB rates via backend proxy
 */
@Injectable({
    providedIn: 'root'
})
export class CurrencyService {
    private rates: Record<string, number> = {};
    private readonly BACKEND_API_URL = 'http://localhost:3000/api/currency/rates';
    private readonly CACHE_KEY = 'ecb_rates_cache';
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    // Fallback static rates (used if backend fails)
    private readonly FALLBACK_RATES: Record<string, number> = {
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

    private isLoadingRates = false;

    constructor(private http: HttpClient) {
        this.loadRates();
    }

    /**
     * Load rates from cache or fetch from backend
     */
    private async loadRates(): Promise<void> {
        if (this.isLoadingRates) return;
        this.isLoadingRates = true;

        try {
            // Try to load from cache first
            const cached = this.loadFromCache();
            if (cached) {
                this.rates = cached;
                console.log('💶 Currency rates loaded from cache');
                return;
            }

            // Fetch from backend proxy
            await this.fetchBackendRates();
        } catch (error) {
            console.warn('⚠️ Failed to load rates from backend, using static fallback', error);
            this.rates = { ...this.FALLBACK_RATES };
        } finally {
            this.isLoadingRates = false;
        }
    }

    /**
     * Load rates from localStorage cache
     */
    private loadFromCache(): Record<string, number> | null {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (!cached) return null;

            const data: CachedRates = JSON.parse(cached);
            const now = Date.now();

            // Check if cache is still valid
            if (now - data.timestamp < this.CACHE_TTL) {
                return data.rates;
            }

            // Cache expired, remove it
            localStorage.removeItem(this.CACHE_KEY);
            return null;
        } catch (error) {
            console.warn('Failed to load rates from cache', error);
            return null;
        }
    }

    /**
     * Fetch rates from backend proxy
     */
    private async fetchBackendRates(): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.http.get<CachedRates>(this.BACKEND_API_URL)
            );

            if (!response.rates || Object.keys(response.rates).length === 0) {
                throw new Error('No rates found in backend response');
            }

            // Save to cache
            this.saveToCache(response.rates);

            // Update current rates
            this.rates = response.rates;

            console.log(`✅ Currency rates updated from backend (source: ${response.source})`, {
                'EUR/JPY': response.rates['JPY'],
                'EUR/USD': response.rates['USD'],
                'EUR/GBP': response.rates['GBP']
            });
        } catch (error) {
            console.error('Failed to fetch rates from backend', error);
            throw error;
        }
    }

    /**
     * Save rates to localStorage cache
     */
    private saveToCache(rates: Record<string, number>): void {
        try {
            const data: CachedRates = {
                rates,
                timestamp: Date.now(),
                source: 'ecb'
            };
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save rates to cache', error);
        }
    }

    /**
     * Refresh rates (force fetch from backend)
     */
    async refreshRates(): Promise<void> {
        localStorage.removeItem(this.CACHE_KEY);
        this.isLoadingRates = false;
        await this.loadRates();
    }

    /**
     * Convert amount from one currency to another
     */
    convert(amount: number, from: string, to: string): number {
        const fromRate = this.rates[from];
        const toRate = this.rates[to];

        if (!fromRate || !toRate) {
            console.warn(`Currency conversion rate missing for ${from} or ${to}`);
            return amount;
        }

        // Convert to EUR first, then to target currency
        const inEUR = amount / fromRate;
        return inEUR * toRate;
    }

    /**
     * Get exchange rate between two currencies
     */
    getRate(from: string, to: string): number {
        return this.convert(1, from, to);
    }

    /**
     * Get currency symbol
     */
    getCurrencySymbol(currency: string): string {
        const symbols: Record<string, string> = {
            'EUR': '€',
            'JPY': '¥',
            'USD': '$',
            'GBP': '£',
            'AUD': 'A$',
            'CAD': 'C$',
            'CHF': 'CHF',
            'CNY': '¥',
            'SEK': 'kr',
            'NZD': 'NZ$',
        };
        return symbols[currency] || currency;
    }

    /**
     * Format amount with currency symbol
     */
    format(amount: number, currency: string): string {
        const symbol = this.getCurrencySymbol(currency);
        return `${symbol}${amount.toFixed(2)}`;
    }

    /**
     * Get all available currencies
     */
    getAvailableCurrencies(): string[] {
        return Object.keys(this.rates);
    }
}
