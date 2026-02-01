import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CurrencyService {
    // Base currency: EUR
    private rates: Record<string, number> = {
        'EUR': 1,
        'JPY': 162.50, // 1 EUR = ~162.50 JPY (Static rate for MVP)
        'USD': 1.08,
        'GBP': 0.85
    };

    constructor() { }

    /**
     * Convert an amount from one currency to another.
     * Default target is EUR.
     */
    convert(amount: number, fromCurrency: string, toCurrency: string = 'EUR'): number | null {
        if (!amount) return null;

        // Normalize codes
        const from = fromCurrency.toUpperCase();
        const to = toCurrency.toUpperCase();

        // If same currency, no conversion needed
        if (from === to) return amount;

        // Get rates
        const fromRate = this.rates[from];
        const toRate = this.rates[to];

        if (!fromRate || !toRate) {
            console.warn(`Currency conversion rate missing for ${from} or ${to}`);
            return null;
        }

        // Convert to Base (EUR) then to Target
        // Amount (JPY) / Rate (JPY) = Amount (EUR)
        // Amount (EUR) * Rate (USD) = Amount (USD)
        return (amount / fromRate) * toRate;
    }

    getSymbol(code: string): string {
        switch (code.toUpperCase()) {
            case 'EUR': return '€';
            case 'JPY': return '¥';
            case 'USD': return '$';
            case 'GBP': return '£';
            default: return code;
        }
    }
}
