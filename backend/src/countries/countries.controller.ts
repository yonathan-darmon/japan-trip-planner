import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CountriesService } from './countries.service';

@Controller('countries')
export class CountriesController {
    constructor(private readonly countriesService: CountriesService) { }

    @Get()
    async findAll() {
        return this.countriesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.countriesService.findOne(+id);
    }

    @Post()
    async create(@Body() createCountryDto: { name: string; code: string }) {
        return this.countriesService.create(createCountryDto);
    }

    @Post(':id/assign-suggestions')
    async assignSuggestions(
        @Param('id') id: string,
        @Body() body: { suggestionIds: number[] },
    ) {
        return this.countriesService.assignSuggestions(+id, body.suggestionIds);
    }
}
