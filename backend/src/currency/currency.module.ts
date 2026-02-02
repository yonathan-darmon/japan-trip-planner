import { Module } from '@nestjs/common';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';

@Module({
    controllers: [CurrencyController],
    providers: [CurrencyService],
    exports: [CurrencyService], // Export in case other modules need it
})
export class CurrencyModule { }
