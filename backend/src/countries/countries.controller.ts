import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('countries')
export class CountriesController {
    constructor(private readonly countriesService: CountriesService) { }

    @Get()
    async findAll() {
        return this.countriesService.findAll();
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    async findOne(@Param('id') id: string) {
        return this.countriesService.findOne(+id);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    async create(@Body() createCountryDto: { name: string; code: string }) {
        return this.countriesService.create(createCountryDto);
    }

    @Post(':id/assign-suggestions')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    async assignSuggestions(
        @Param('id') id: string,
        @Body() body: { suggestionIds: number[] },
    ) {
        return this.countriesService.assignSuggestions(+id, body.suggestionIds);
    }
}
