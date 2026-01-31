import { Test, TestingModule } from '@nestjs/testing';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';

describe('PreferencesController', () => {
  let controller: PreferencesController;
  let service: PreferencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreferencesController],
      providers: [
        {
          provide: PreferencesService,
          useValue: {
            getUserPreferences: jest.fn(),
            updatePreference: jest.fn(),
            getSuggestionVotes: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PreferencesController>(PreferencesController);
    service = module.get<PreferencesService>(PreferencesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
