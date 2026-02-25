import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';

describe('CurrencyController', () => {
    let controller: CurrencyController;
    let service: CurrencyService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CurrencyController],
            providers: [CurrencyService],
        }).compile();

        controller = module.get<CurrencyController>(CurrencyController);
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
        expect(controller).toBeDefined();
    });

    describe('getRates', () => {
        it('should return exchange rates', async () => {
            const result = await controller.getRates();

            expect(result).toBeDefined();
            expect(result.rates).toBeDefined();
            expect(result.timestamp).toBeDefined();
            expect(result.source).toMatch(/^(ecb|fallback)$/);
        });

        it('should return rates with EUR as base', async () => {
            const result = await controller.getRates();

            expect(result.rates.EUR).toBe(1);
        });
    });

    describe('clearCache', () => {
        it('should clear the cache', () => {
            const result = controller.clearCache();

            expect(result).toBeDefined();
            expect(result.message).toBe('Cache cleared successfully');
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
