import { Test, TestingModule } from '@nestjs/testing';
import { SuggestionsController } from './suggestions.controller';
import { SuggestionsService } from './suggestions.service';

describe('SuggestionsController', () => {
  let controller: SuggestionsController;
  let service: SuggestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuggestionsController],
      providers: [
        {
          provide: SuggestionsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            retryGeocode: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SuggestionsController>(SuggestionsController);
    service = module.get<SuggestionsService>(SuggestionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
