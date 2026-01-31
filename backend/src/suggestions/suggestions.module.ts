import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { Suggestion } from './entities/suggestion.entity';
import { Country } from '../countries/entities/country.entity';
import { S3Service } from './s3.service';
import { GeocodingService } from './geocoding.service';
import { ItineraryModule } from '../itinerary/itinerary.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Suggestion, Country]),
    forwardRef(() => ItineraryModule),
    forwardRef(() => GroupsModule)
  ],
  controllers: [SuggestionsController],
  providers: [SuggestionsService, S3Service, GeocodingService],
  exports: [SuggestionsService],
})
export class SuggestionsModule { }
