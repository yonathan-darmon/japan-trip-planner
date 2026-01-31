import { Test, TestingModule } from '@nestjs/testing';
import { PreferencesService } from './preferences.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserPreference } from './entities/user-preference.entity';
import { SyncGateway } from '../sync/sync.gateway';

describe('PreferencesService', () => {
  let service: PreferencesService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSyncGateway = {
    sendVoteUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        {
          provide: getRepositoryToken(UserPreference),
          useValue: mockRepository,
        },
        {
          provide: SyncGateway,
          useValue: mockSyncGateway,
        },
      ],
    }).compile();

    service = module.get<PreferencesService>(PreferencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
