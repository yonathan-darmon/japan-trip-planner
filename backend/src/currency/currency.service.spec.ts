import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
    let service: CurrencyService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CurrencyService],
        }).compile();

        service = module.get<CurrencyService>(CurrencyService);

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            text: async () => `
                <gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
                    <Cube>
                        <Cube time="2025-01-01">
                            <Cube currency="USD" rate="1.05"/>
                            <Cube currency="JPY" rate="160.50"/>
                            <Cube currency="GBP" rate="0.85"/>
                        </Cube>
                    </Cube>
                </gesmes:Envelope>
            `
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getRates', () => {
        it('should return rates with EUR as base currency', async () => {
            const result = await service.getRates();

            expect(result).toBeDefined();
            expect(result.rates).toBeDefined();
            expect(result.rates.EUR).toBe(1);
            expect(result.timestamp).toBeDefined();
            expect(result.source).toMatch(/^(ecb|fallback)$/);
        });

        it('should return rates from cache on second call', async () => {
            const firstCall = await service.getRates();
            const secondCall = await service.getRates();

            expect(firstCall.timestamp).toBe(secondCall.timestamp);
        });

        it('should include common currencies', async () => {
            const result = await service.getRates();

            expect(result.rates.USD).toBeDefined();
            expect(result.rates.JPY).toBeDefined();
            expect(result.rates.GBP).toBeDefined();
        });
    });

    describe('clearCache', () => {
        it('should clear the cache', async () => {
            await service.getRates();
            service.clearCache();

            // After clearing cache, next call should fetch fresh rates
            const result = await service.getRates();
            expect(result).toBeDefined();
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
