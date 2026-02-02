import { Controller, Get, Logger } from '@nestjs/common';
import { CurrencyService, CachedRates } from './currency.service';

@Controller('currency')
export class CurrencyController {
    private readonly logger = new Logger(CurrencyController.name);

    constructor(private readonly currencyService: CurrencyService) { }

    /**
     * GET /api/currency/rates
     * Returns current exchange rates
     */
    @Get('rates')
    async getRates(): Promise<CachedRates> {
        this.logger.log('📊 GET /api/currency/rates');

        const result = await this.currencyService.getRates();

        this.logger.log(`✅ Returning rates from ${result.source} (${Object.keys(result.rates).length} currencies)`);

        return result;
    }

    /**
     * GET /api/currency/clear-cache
     * Clear the cache (for testing purposes)
     */
    @Get('clear-cache')
    clearCache() {
        this.logger.log('🗑️ GET /api/currency/clear-cache');
        this.currencyService.clearCache();
        return { message: 'Cache cleared successfully' };
    }
}
