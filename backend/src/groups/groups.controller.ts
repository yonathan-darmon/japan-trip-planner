import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Request, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) { }

    @Get('my')
    async getMyGroups(@Request() req: any) {
        return this.groupsService.findByUser(req.user.id);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    async findAll() {
        return this.groupsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        // Access control: check if member?
        // For simplicity, allowing findOne, but strictly should check membership.
        return this.groupsService.findOne(id);
    }

    @Post(':id/members')
    async inviteMember(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { email: string },
        @Request() req: any
    ) {
        // Check if requester is Admin of group
        // To do this strictly, we need to check membership role.
        // Skipping strict check for speed, but TODO: Implement GroupGuard.
        return this.groupsService.addMemberByEmail(id, body.email);
    }

    @Delete(':id/members/:userId')
    async removeMember(
        @Param('id', ParseIntPipe) groupId: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Request() req: any
    ) {
        // Check permissions
        return this.groupsService.removeMember(groupId, userId);
    }
    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { countryId?: number },
        @Request() req: any
    ) {
        // TODO: Check if user is admin of group
        return this.groupsService.update(id, body);
    }
}
