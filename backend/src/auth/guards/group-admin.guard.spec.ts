import { Test, TestingModule } from '@nestjs/testing';
import { GroupAdminGuard } from './group-admin.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupMember, GroupRole } from '../../groups/entities/group-member.entity';
import { UserRole } from '../../users/entities/user.entity';

describe('GroupAdminGuard', () => {
    let guard: GroupAdminGuard;
    let mockGroupMembersRepository: any;

    beforeEach(async () => {
        mockGroupMembersRepository = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GroupAdminGuard,
                {
                    provide: getRepositoryToken(GroupMember),
                    useValue: mockGroupMembersRepository,
                },
            ],
        }).compile();

        guard = module.get<GroupAdminGuard>(GroupAdminGuard);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should allow SUPER_ADMIN without checking group membership', async () => {
        const mockContext = createMockContext({
            user: { id: 1, role: UserRole.SUPER_ADMIN },
            params: { groupId: '1' },
        });

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(mockGroupMembersRepository.findOne).not.toHaveBeenCalled();
    });

    it('should allow GROUP ADMIN', async () => {
        const mockContext = createMockContext({
            user: { id: 2, role: UserRole.STANDARD },
            params: { groupId: '1' },
        });

        mockGroupMembersRepository.findOne.mockResolvedValue({
            userId: 2,
            groupId: 1,
            role: GroupRole.ADMIN,
        });

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(mockGroupMembersRepository.findOne).toHaveBeenCalledWith({
            where: { userId: 2, groupId: 1 },
        });
    });

    it('should deny GROUP MEMBER (not admin)', async () => {
        const mockContext = createMockContext({
            user: { id: 3, role: UserRole.STANDARD },
            params: { groupId: '1' },
        });

        mockGroupMembersRepository.findOne.mockResolvedValue({
            userId: 3,
            groupId: 1,
            role: GroupRole.MEMBER,
        });

        await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should deny non-member', async () => {
        const mockContext = createMockContext({
            user: { id: 4, role: UserRole.STANDARD },
            params: { groupId: '1' },
        });

        mockGroupMembersRepository.findOne.mockResolvedValue(null);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should throw if groupId is missing', async () => {
        const mockContext = createMockContext({
            user: { id: 5, role: UserRole.STANDARD },
            params: {},
        });

        await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should throw if user is not authenticated', async () => {
        const mockContext = createMockContext({
            user: null,
            params: { groupId: '1' },
        });

        await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    function createMockContext(options: { user: any; params: any; query?: any }): ExecutionContext {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    user: options.user,
                    params: options.params,
                    query: options.query || {},
                }),
            }),
        } as ExecutionContext;
    }
});
