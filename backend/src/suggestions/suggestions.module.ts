import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuggestionsService } from './suggestions.service';
import { SuggestionsController } from './suggestions.controller';
import { Suggestion } from './entities/suggestion.entity';
import { S3Service } from './s3.service';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [TypeOrmModule.forFeature([Suggestion])],
  controllers: [SuggestionsController],
  providers: [SuggestionsService, S3Service, GeocodingService],
  exports: [SuggestionsService],
})
export class SuggestionsModule { }
