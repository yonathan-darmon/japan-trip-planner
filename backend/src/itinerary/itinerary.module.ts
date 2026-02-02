import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItineraryService } from './itinerary.service';
import { ItineraryController } from './itinerary.controller';
import { Itinerary } from './entities/itinerary.entity';
import { TripConfigModule } from '../trip-config/trip-config.module';
import { SuggestionsModule } from '../suggestions/suggestions.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { AuthModule } from '../auth/auth.module';
import { ClusteringService } from './clustering.service';
import { OptimizationService } from './optimization.service';
import { RoutingService } from './routing.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Itinerary]),
        TripConfigModule,
        forwardRef(() => SuggestionsModule),
        PreferencesModule,
        AuthModule,
    ],
    controllers: [ItineraryController],
    providers: [ItineraryService, ClusteringService, OptimizationService, RoutingService],
    exports: [ItineraryService],
})
export class ItineraryModule { }
