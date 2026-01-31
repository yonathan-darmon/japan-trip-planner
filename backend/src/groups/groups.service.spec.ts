import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { User } from '../users/entities/user.entity';

describe('GroupsService', () => {
    let service: GroupsService;

    const mockGroupsRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };

    const mockGroupMembersRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
    };

    const mockUsersRepository = {
        findOneBy: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GroupsService,
                {
                    provide: getRepositoryToken(Group),
                    useValue: mockGroupsRepository,
                },
                {
                    provide: getRepositoryToken(GroupMember),
                    useValue: mockGroupMembersRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUsersRepository,
                },
            ],
        }).compile();

        service = module.get<GroupsService>(GroupsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('update', () => {
        it('should update group country', async () => {
            const groupId = 1;
            const countryId = 5;
            const group = { id: groupId, name: 'Test Group' } as Group;

            mockGroupsRepository.findOneBy.mockResolvedValue(group);
            mockGroupsRepository.save.mockImplementation(val => Promise.resolve(val));

            const result = await service.update(groupId, { countryId });

            expect(mockGroupsRepository.findOneBy).toHaveBeenCalledWith({ id: groupId });
            expect(result.country).toEqual({ id: countryId });
            expect(mockGroupsRepository.save).toHaveBeenCalled();
        });
    });
});
