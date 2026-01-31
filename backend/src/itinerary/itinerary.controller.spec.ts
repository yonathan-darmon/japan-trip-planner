import { Test, TestingModule } from '@nestjs/testing';
import { ItineraryController } from './itinerary.controller';
import { ItineraryService } from './itinerary.service';

describe('ItineraryController', () => {
    let controller: ItineraryController;
    let service: ItineraryService;

    const mockItineraryService = {
        findAll: jest.fn(),
        generate: jest.fn(),
        findAllPublic: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
        reorder: jest.fn(),
        reorderAllDays: jest.fn(),
        updateAccommodation: jest.fn(),
        addActivity: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ItineraryController],
            providers: [
                {
                    provide: ItineraryService,
                    useValue: mockItineraryService,
                },
            ],
        }).compile();

        controller = module.get<ItineraryController>(ItineraryController);
        service = module.get<ItineraryService>(ItineraryService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should call service.findAll with userId and no groupId if not provided', async () => {
            const req = { user: { id: 1 } };
            await controller.findAll(req, undefined);
            expect(service.findAll).toHaveBeenCalledWith(1, undefined);
        });

        it('should call service.findAll with userId and groupId if provided', async () => {
            const req = { user: { id: 1 } };
            const groupId = '5';
            await controller.findAll(req, groupId);
            expect(service.findAll).toHaveBeenCalledWith(1, 5);
        });
    });
});
