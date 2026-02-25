import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;

    const mockUsersService = {
        create: jest.fn(),
        countAll: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
        update: jest.fn(),
        updatePassword: jest.fn(),
        uploadAvatar: jest.fn(),
        updateLastViewedChangelog: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('updatePassword', () => {
        it('should call usersService.updatePassword with correct args', async () => {
            const req = { user: { id: 1 } };
            const dto = { oldPassword: 'old', newPassword: 'new' };

            await controller.updatePassword(req, dto);

            expect(mockUsersService.updatePassword).toHaveBeenCalledWith(1, dto);
        });
    });

    // Add basic tests for completeness dictated by unit-test-rule
    describe('count', () => {
        it('should return count', async () => {
            mockUsersService.countAll.mockResolvedValue(5);
            const res = await controller.count();
            expect(res).toBe(5);
        });
    });
});
