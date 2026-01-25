import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItineraryService } from './itinerary.service';
import { ItineraryController } from './itinerary.controller';
import { Itinerary } from './entities/itinerary.entity';
import { TripConfigModule } from '../trip-config/trip-config.module';
import { SuggestionsModule } from '../suggestions/suggestions.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Itinerary]),
        TripConfigModule,
        SuggestionsModule,
        PreferencesModule,
        AuthModule,
    ],
    controllers: [ItineraryController],
    providers: [ItineraryService],
    exports: [ItineraryService],
})
export class ItineraryModule { }
