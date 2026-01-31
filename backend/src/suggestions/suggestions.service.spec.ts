import { Test, TestingModule } from '@nestjs/testing';
import { SuggestionsService } from './suggestions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Suggestion } from './entities/suggestion.entity';
import { S3Service } from './s3.service';
import { GeocodingService } from './geocoding.service';
import { SyncGateway } from '../sync/sync.gateway';
import { ItineraryService } from '../itinerary/itinerary.service';
import { GroupsService } from '../groups/groups.service';

describe('SuggestionsService', () => {
  let service: SuggestionsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
  };

  const mockGeocodingService = {
    getCoordinatesWithRetry: jest.fn(),
  };

  const mockSyncGateway = {
    sendSuggestionUpdate: jest.fn(),
  };

  const mockItineraryService = {
    updateSuggestionInItineraries: jest.fn(),
  };

  const mockGroupsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        {
          provide: getRepositoryToken(Suggestion),
          useValue: mockRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: GeocodingService,
          useValue: mockGeocodingService,
        },
        {
          provide: SyncGateway,
          useValue: mockSyncGateway,
        },
        {
          provide: ItineraryService,
          useValue: mockItineraryService,
        },
        {
          provide: GroupsService,
          useValue: mockGroupsService,
        },
      ],
    }).compile();

    service = module.get<SuggestionsService>(SuggestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
