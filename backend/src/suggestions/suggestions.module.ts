import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { Suggestion } from './entities/suggestion.entity';
import { Country } from '../countries/entities/country.entity';
import { StorageModule } from '../storage/storage.module';
import { GeocodingService } from './geocoding.service';
import { ItineraryModule } from '../itinerary/itinerary.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Suggestion, Country]),
    forwardRef(() => ItineraryModule),
    forwardRef(() => GroupsModule),
    StorageModule
  ],
  controllers: [SuggestionsController],
  providers: [SuggestionsService, GeocodingService],
  exports: [SuggestionsService],
})
export class SuggestionsModule { }
