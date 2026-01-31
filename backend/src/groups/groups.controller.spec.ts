import { Test, TestingModule } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

describe('GroupsController', () => {
    let controller: GroupsController;
    let service: GroupsService;

    const mockGroupsService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByUser: jest.fn(),
        addMemberByEmail: jest.fn(),
        removeMember: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [GroupsController],
            providers: [
                {
                    provide: GroupsService,
                    useValue: mockGroupsService,
                },
            ],
        }).compile();

        controller = module.get<GroupsController>(GroupsController);
        service = module.get<GroupsService>(GroupsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('update', () => {
        it('should call service.update with correct params', async () => {
            const groupId = 1;
            const body = { countryId: 5 };
            const req = { user: { id: 1 } };

            await controller.update(groupId, body, req);

            expect(service.update).toHaveBeenCalledWith(groupId, body);
        });
    });
});
