import {
    Controller,
    Get,
    Post,
    Delete,
    Patch,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ItineraryService } from './itinerary.service';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';
import { ReorderActivitiesDto } from './dto/reorder-activities.dto';

@Controller('itinerary')
@UseGuards(AuthGuard('jwt'))
export class ItineraryController {
    constructor(private readonly itineraryService: ItineraryService) { }

    @Post('generate')
    async generate(@Body() dto: GenerateItineraryDto, @Request() req) {
        return this.itineraryService.generate(dto, req.user.id);
    }

    @Get()
    async findAll(@Request() req) {
        return this.itineraryService.findAll(req.user.id);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.itineraryService.findOne(id, req.user.id);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        await this.itineraryService.remove(id, req.user.id);
        return { message: 'Itinerary deleted successfully' };
    }

    @Patch(':id/reorder')
    async reorder(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ReorderActivitiesDto,
        @Request() req
    ) {
        return this.itineraryService.reorder(id, dto, req.user.id);
    }
    @Patch(':id/days/:dayNumber/accommodation')
    async updateAccommodation(
        @Param('id', ParseIntPipe) id: number,
        @Param('dayNumber', ParseIntPipe) dayNumber: number,
        @Body() body: { suggestionId: number | null },
        @Request() req
    ) {
        return this.itineraryService.updateAccommodation(
            id,
            dayNumber,
            body.suggestionId,
            req.user.id
        );
    }
}
