import { Controller, Get, Patch, Body, UseGuards, Query, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { TripConfigService } from './trip-config.service';
import { UpdateTripConfigDto } from './dto/update-trip-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroupAdminGuard } from '../auth/guards/group-admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('trip-config')
@UseGuards(JwtAuthGuard)
export class TripConfigController {
    constructor(private readonly tripConfigService: TripConfigService) { }

    @Get()
    async getConfig(@Query('groupId') groupId?: string) {
        if (!groupId) {
            throw new BadRequestException('groupId est requis');
        }
        return this.tripConfigService.getConfig(+groupId);
    }

    @Patch(':groupId')
    @UseGuards(GroupAdminGuard)
    async updateConfig(
        @Param('groupId', ParseIntPipe) groupId: number,
        @Body() dto: UpdateTripConfigDto,
        @CurrentUser() user: User,
    ) {
        return this.tripConfigService.updateConfig(groupId, dto, user.id);
    }
}

