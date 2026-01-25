import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripConfig } from './entities/trip-config.entity';
import { TripConfigService } from './trip-config.service';
import { TripConfigController } from './trip-config.controller';

@Module({
    imports: [TypeOrmModule.forFeature([TripConfig])],
    controllers: [TripConfigController],
    providers: [TripConfigService],
    exports: [TripConfigService],
})
export class TripConfigModule { }
