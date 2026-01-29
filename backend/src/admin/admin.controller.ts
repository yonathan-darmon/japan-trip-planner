import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { GroupRole } from '../groups/entities/group-member.entity';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    async findAllUsers() {
        return this.adminService.findAllUsers();
    }

    @Get('groups')
    async findAllGroups() {
        return this.adminService.findAllGroups();
    }

    @Post('users/:userId/groups')
    async addUserToGroup(
        @Param('userId', ParseIntPipe) userId: number,
        @Body() body: { groupId: number; role?: GroupRole },
    ) {
        return this.adminService.addUserToGroup(userId, body.groupId, body.role);
    }

    @Post('users/:userId/force-logout')
    async forceLogout(@Param('userId', ParseIntPipe) userId: number) {
        return this.adminService.forceLogout(userId);
    }
}
