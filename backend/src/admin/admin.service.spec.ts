import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../groups/entities/group-member.entity';

describe('AdminService', () => {
    let service: AdminService;

    const mockUserRepository = {
        findOneBy: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
    };

    const mockGroupsRepository = {
        find: jest.fn(),
        findOneBy: jest.fn(),
    };

    const mockGroupMembersRepository = {
        findOneBy: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: getRepositoryToken(Group),
                    useValue: mockGroupsRepository,
                },
                {
                    provide: getRepositoryToken(GroupMember),
                    useValue: mockGroupMembersRepository,
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('forceLogout', () => {
        it('should increment token version correctly when null', async () => {
            const user = { id: 1, tokenVersion: null } as any;
            mockUserRepository.findOneBy.mockResolvedValue(user);
            mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

            await service.forceLogout(1);

            const savedUser = mockUserRepository.save.mock.calls[0][0];
            expect(savedUser.tokenVersion).toBeGreaterThan(1);
        });

        it('should increment token version correctly when 0', async () => {
            const user = { id: 1, tokenVersion: 0 } as any;
            mockUserRepository.findOneBy.mockResolvedValue(user);
            mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

            await service.forceLogout(1);

            const savedUser = mockUserRepository.save.mock.calls[0][0];
            expect(savedUser.tokenVersion).toBeGreaterThan(1);
        });

        it('should increment token version correctly when 1', async () => {
            const user = { id: 1, tokenVersion: 1 } as any;
            mockUserRepository.findOneBy.mockResolvedValue(user);
            mockUserRepository.save.mockImplementation((u) => Promise.resolve(u));

            await service.forceLogout(1);

            const savedUser = mockUserRepository.save.mock.calls[0][0];
            expect(savedUser.tokenVersion).toBeGreaterThan(1);
        });
    });
});
