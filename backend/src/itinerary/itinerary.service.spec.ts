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

import { OptimizationService } from './optimization.service';

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

    const mockOptimizationService = {
        optimizeDayOrder: jest.fn().mockImplementation((days) => days),
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
                    provide: OptimizationService,
                    useValue: mockOptimizationService,
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
                where: [{ createdById: userId }],
                order: { generatedAt: 'DESC' },
                relations: ['createdBy']
            });
            expect(result).toEqual(expectedResult);
        });

        it('should return itineraries filtered by userId OR groupId when groupId is provided', async () => {
            const userId = 1;
            const groupId = 5;
            const expectedResult = [{ id: 2, groupId: 5 }, { id: 1, createdById: 1 }] as unknown as Itinerary[];
            mockItineraryRepository.find.mockResolvedValue(expectedResult);

            const result = await service.findAll(userId, groupId);

            expect(mockItineraryRepository.find).toHaveBeenCalledWith({
                where: [{ createdById: userId }, { groupId: groupId }],
                order: { generatedAt: 'DESC' },
                relations: ['createdBy']
            });
            expect(result).toEqual(expectedResult);
        });
    });
    describe('generate', () => {
        it('should exclude TRANSPORT and AUTRE from clustering', async () => {
            const userId = 1;
            const dto = { groupId: 1 };

            // Mock Config
            mockTripConfigService.getConfig.mockResolvedValue({ durationDays: 3, startDate: new Date() });

            // Mock Suggestions
            const suggestions = [
                { id: 1, category: 'Restaurant', name: 'Sushi', preferences: [{ selected: true }] },
                { id: 2, category: 'Transport', name: 'Train', preferences: [{ selected: true }] }, // Should be excluded
                { id: 3, category: 'Autre', name: 'eSIM', preferences: [{ selected: true }] },      // Should be excluded
                { id: 4, category: 'Temple', name: 'Kinkaku-ji', preferences: [{ selected: true }] },
                { id: 5, category: 'Hébergement', name: 'Hotel', preferences: [{ selected: true }] } // Handled separately
            ];
            mockSuggestionsService.findAll.mockResolvedValue(suggestions);

            // Mock Clustering to capture what it receives
            mockClusteringService.clusterByLocation.mockReturnValue([]);
            mockRoutingService.nearestNeighbor.mockReturnValue([]);

            // Mock Repository Save
            mockItineraryRepository.create.mockReturnValue({ id: 1 });
            mockItineraryRepository.save.mockImplementation(i => Promise.resolve(i));

            await service.generate(dto as any, userId);

            // Verify Clustering was called, and capture the arguments
            expect(mockClusteringService.clusterByLocation).toHaveBeenCalled();

            // Get the first argument of the first call
            const clusteredItems = mockClusteringService.clusterByLocation.mock.calls[0][0];

            // Should contain id 1 (Restaurant) and id 4 (Temple)
            // Should NOT contain id 2 (Transport), 3 (Autre), or 5 (Hebergement - filtered earlier)
            expect(clusteredItems).toHaveLength(2);
            expect(clusteredItems).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: 1 }),
                expect.objectContaining({ id: 4 })
            ]));
            expect(clusteredItems).not.toEqual(expect.arrayContaining([
                expect.objectContaining({ id: 2 })
            ]));
            expect(clusteredItems).not.toEqual(expect.arrayContaining([
                expect.objectContaining({ id: 3 })
            ]));
        });
    });

    describe('getBudgetSummary', () => {
        it('should calculate daily totals and grand total correctly', async () => {
            const itineraryId = 1;
            const userId = 1;

            const mockItinerary = {
                id: itineraryId,
                createdById: userId,
                days: [
                    {
                        dayNumber: 1,
                        date: new Date('2026-04-01'),
                        activities: [
                            { suggestion: { price: 1000 } }, // 1000 whatever currency
                            { suggestion: { price: 500 } }
                        ],
                        accommodation: { price: 10000 }
                    },
                    {
                        dayNumber: 2,
                        date: new Date('2026-04-02'),
                        activities: [],
                        accommodation: null // No accommodation cost
                    }
                ]
            };

            mockItineraryRepository.findOne.mockResolvedValue(mockItinerary);

            const result = await service.getBudgetSummary(itineraryId, userId);

            expect(mockItineraryRepository.findOne).toHaveBeenCalledWith({
                where: { id: itineraryId },
                relations: ['createdBy']
            });

            // Day 1: 1000 + 500 + 10000 = 11500
            // Day 2: 0
            // Grand Total: 11500
            expect(result.totalEur).toBe(11500);
            expect(result.dailyTotals).toHaveLength(2);
            expect(result.dailyTotals[0].totalEur).toBe(11500);
            expect(result.dailyTotals[1].totalEur).toBe(0);
            expect(result.currencySymbol).toBe('€');
        });

        it('should return 0 if no prices are set', async () => {
            const itineraryId = 1;
            const userId = 1;

            const mockItinerary = {
                id: itineraryId,
                createdById: userId,
                days: [
                    {
                        dayNumber: 1,
                        activities: [
                            { suggestion: {} }, // No price
                        ],
                        accommodation: null
                    }
                ]
            };

            mockItineraryRepository.findOne.mockResolvedValue(mockItinerary);

            const result = await service.getBudgetSummary(itineraryId, userId);

            expect(result.totalEur).toBe(0);
        });

        it('should throw NotFoundException if itinerary not found', async () => {
            mockItineraryRepository.findOne.mockResolvedValue(null);

            await expect(service.getBudgetSummary(999, 1))
                .rejects
                .toThrow('Itinerary not found');
        });
    });
});
