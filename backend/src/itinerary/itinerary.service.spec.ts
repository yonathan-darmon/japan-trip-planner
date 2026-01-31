import { Test, TestingModule } from '@nestjs/testing';
import { ItineraryService } from './itinerary.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Itinerary } from './entities/itinerary.entity';
import { TripConfigService } from '../trip-config/trip-config.service';
import { SuggestionsService } from '../suggestions/suggestions.service';
import { PreferencesService } from '../preferences/preferences.service';
import { ClusteringService } from './clustering.service';
import { RoutingService } from './routing.service';
import { Repository } from 'typeorm';

describe('ItineraryService', () => {
    let service: ItineraryService;
    let repository: Repository<Itinerary>;

    const mockItineraryRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
    };

    const mockTripConfigService = {
        getConfig: jest.fn(),
    };

    const mockSuggestionsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
    };

    const mockPreferencesService = {};

    const mockClusteringService = {
        clusterByLocation: jest.fn(),
    };

    const mockRoutingService = {
        nearestNeighbor: jest.fn(),
        findBestAccommodationForCluster: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ItineraryService,
                {
                    provide: getRepositoryToken(Itinerary),
                    useValue: mockItineraryRepository,
                },
                {
                    provide: TripConfigService,
                    useValue: mockTripConfigService,
                },
                {
                    provide: SuggestionsService,
                    useValue: mockSuggestionsService,
                },
                {
                    provide: PreferencesService,
                    useValue: mockPreferencesService,
                },
                {
                    provide: ClusteringService,
                    useValue: mockClusteringService,
                },
                {
                    provide: RoutingService,
                    useValue: mockRoutingService,
                },
            ],
        }).compile();

        service = module.get<ItineraryService>(ItineraryService);
        repository = module.get<Repository<Itinerary>>(getRepositoryToken(Itinerary));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return itineraries filtered by userId when no groupId is provided', async () => {
            const userId = 1;
            const expectedResult = [{ id: 1, createdById: userId }] as Itinerary[];
            mockItineraryRepository.find.mockResolvedValue(expectedResult);

            const result = await service.findAll(userId);

            expect(mockItineraryRepository.find).toHaveBeenCalledWith({
                where: { createdById: userId },
                order: { generatedAt: 'DESC' },
                relations: ['createdBy']
            });
            expect(result).toEqual(expectedResult);
        });

        it('should return itineraries filtered by groupId when groupId is provided', async () => {
            const userId = 1;
            const groupId = 5;
            const expectedResult = [{ id: 2, groupId: 5 }] as Itinerary[];
            mockItineraryRepository.find.mockResolvedValue(expectedResult);

            const result = await service.findAll(userId, groupId);

            expect(mockItineraryRepository.find).toHaveBeenCalledWith({
                where: { groupId: groupId },
                order: { generatedAt: 'DESC' },
                relations: ['createdBy']
            });
            expect(result).toEqual(expectedResult);
        });
    });
});
