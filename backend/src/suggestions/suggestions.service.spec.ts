import { Test, TestingModule } from '@nestjs/testing';
import { SuggestionsService } from './suggestions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Suggestion } from './entities/suggestion.entity';
import { Country } from '../countries/entities/country.entity';
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

  const mockCountriesRepository = {
    findOneBy: jest.fn(),
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
        {
          provide: getRepositoryToken(Country),
          useValue: mockCountriesRepository,
        },
      ],
    }).compile();

    service = module.get<SuggestionsService>(SuggestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should allow setting price to 0', async () => {
      const suggestion = { id: 1, createdById: 1, price: 100 } as any;
      const user = { id: 1, role: 'user' } as any;

      // Mock findOne for the initial fetch
      mockRepository.findOne.mockReturnValue(Promise.resolve(suggestion));

      mockRepository.save.mockImplementation(s => Promise.resolve(s));
      mockGroupsService.findOne.mockResolvedValue(null);

      // Reset mock calls
      mockRepository.save.mockClear();

      const result = await service.update(1, { price: 0 }, user);

      expect(result.price).toBe(0);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({ price: 0 }));
    });
  });
});
