import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { TripConfigService } from './trip-config.service';
import { UpdateTripConfigDto } from './dto/update-trip-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('trip-config')
@UseGuards(JwtAuthGuard)
export class TripConfigController {
    constructor(private readonly tripConfigService: TripConfigService) { }

    @Get()
    async getConfig() {
        return this.tripConfigService.getConfig();
    }

    @Patch()
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    async updateConfig(
        @Body() dto: UpdateTripConfigDto,
        @CurrentUser() user: any,
    ) {
        return this.tripConfigService.updateConfig(dto, user.id);
    }
}
