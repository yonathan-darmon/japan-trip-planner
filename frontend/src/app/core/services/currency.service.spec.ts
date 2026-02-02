import { TestBed } from '@angular/core/testing';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
    let service: CurrencyService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CurrencyService);

        // Clear localStorage before each test
        localStorage.clear();

        // Mock fetch to avoid real API calls in tests
        spyOn(window, 'fetch').and.returnValue(
            Promise.resolve({
                ok: true,
                text: () => Promise.resolve(mockECBXML)
            } as Response)
        );
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('convert', () => {
        it('should convert JPY to EUR', () => {
            const result = service.convert(1000, 'JPY', 'EUR');
            expect(result).not.toBeNull();
            expect(result).toBeGreaterThan(0);
        });

        it('should convert EUR to USD', () => {
            const result = service.convert(100, 'EUR', 'USD');
            expect(result).not.toBeNull();
            expect(result).toBeGreaterThan(0);
        });

        it('should return same amount for same currency', () => {
            const result = service.convert(100, 'EUR', 'EUR');
            expect(result).toBe(100);
        });

        it('should return null for zero amount', () => {
            const result = service.convert(0, 'JPY', 'EUR');
            expect(result).toBeNull();
        });

        it('should return null for unknown currency', () => {
            const result = service.convert(100, 'XXX', 'EUR');
            expect(result).toBeNull();
        });

        it('should handle case-insensitive currency codes', () => {
            const result = service.convert(100, 'jpy', 'eur');
            expect(result).not.toBeNull();
        });
    });

    describe('getSymbol', () => {
        it('should return € for EUR', () => {
            expect(service.getSymbol('EUR')).toBe('€');
        });

        it('should return ¥ for JPY', () => {
            expect(service.getSymbol('JPY')).toBe('¥');
        });

        it('should return $ for USD', () => {
            expect(service.getSymbol('USD')).toBe('$');
        });

        it('should return £ for GBP', () => {
            expect(service.getSymbol('GBP')).toBe('£');
        });

        it('should return currency code for unknown currency', () => {
            expect(service.getSymbol('XXX')).toBe('XXX');
        });

        it('should handle case-insensitive codes', () => {
            expect(service.getSymbol('eur')).toBe('€');
        });
    });

    describe('cache', () => {
        it('should save rates to localStorage', (done) => {
            // Wait for constructor to finish loading rates
            setTimeout(() => {
                const cached = localStorage.getItem('ecb_rates');
                expect(cached).toBeTruthy();

                const data = JSON.parse(cached!);
                expect(data.rates).toBeDefined();
                expect(data.timestamp).toBeDefined();
                done();
            }, 100);
        });

        it('should load rates from cache if valid', () => {
            // Manually set cache
            const mockRates = {
                rates: { EUR: 1, JPY: 150, USD: 1.1, GBP: 0.9 },
                timestamp: Date.now()
            };
            localStorage.setItem('ecb_rates', JSON.stringify(mockRates));

            // Create new service instance
            const newService = new CurrencyService();

            // Should use cached rates
            const result = newService.convert(150, 'JPY', 'EUR');
            expect(result).toBeCloseTo(1, 2);
        });

        it('should ignore expired cache', (done) => {
            // Set expired cache (25 hours ago)
            const expiredRates = {
                rates: { EUR: 1, JPY: 999 },
                timestamp: Date.now() - (25 * 60 * 60 * 1000)
            };
            localStorage.setItem('ecb_rates', JSON.stringify(expiredRates));

            // Create new service instance
            const newService = new CurrencyService();

            // Should fetch new rates, not use expired cache
            setTimeout(() => {
                const result = newService.convert(999, 'JPY', 'EUR');
                // Should not use the 999 rate from expired cache
                expect(result).not.toBeCloseTo(1, 0);
                done();
            }, 100);
        });
    });

    describe('fallback', () => {
        it('should use static rates if fetch fails', (done) => {
            // Mock fetch to fail
            (window.fetch as jasmine.Spy).and.returnValue(
                Promise.reject(new Error('Network error'))
            );

            // Create new service instance
            const newService = new CurrencyService();

            setTimeout(() => {
                // Should still be able to convert using static fallback
                const result = newService.convert(162.50, 'JPY', 'EUR');
                expect(result).toBeCloseTo(1, 2);
                done();
            }, 100);
        });
    });

    describe('refreshRates', () => {
        it('should clear cache and refetch rates', async () => {
            // Set cache
            localStorage.setItem('ecb_rates', JSON.stringify({
                rates: { EUR: 1, JPY: 100 },
                timestamp: Date.now()
            }));

            await service.refreshRates();

            // Cache should be cleared and new rates fetched
            const cached = localStorage.getItem('ecb_rates');
            expect(cached).toBeTruthy();

            const data = JSON.parse(cached!);
            expect(data.rates.JPY).not.toBe(100);
        });
    });
});

// Mock ECB XML response
const mockECBXML = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
    <gesmes:subject>Reference rates</gesmes:subject>
    <gesmes:Sender>
        <gesmes:name>European Central Bank</gesmes:name>
    </gesmes:Sender>
    <Cube>
        <Cube time='2026-02-02'>
            <Cube currency='USD' rate='1.1840'/>
            <Cube currency='JPY' rate='183.59'/>
            <Cube currency='GBP' rate='0.8658'/>
        </Cube>
    </Cube>
</gesmes:Envelope>`;
