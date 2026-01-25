import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('suggestions')
@UseGuards(AuthGuard('jwt'))
export class SuggestionsController {
    constructor(private readonly suggestionsService: SuggestionsService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    create(
        @Body() createSuggestionDto: CreateSuggestionDto,
        @CurrentUser() user: User,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.suggestionsService.create(createSuggestionDto, user, file);
    }

    @Get()
    findAll() {
        return this.suggestionsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.suggestionsService.findOne(id);
    }

    @Patch(':id')
    @UseInterceptors(FileInterceptor('file'))
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateSuggestionDto: UpdateSuggestionDto,
        @CurrentUser() user: User,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.suggestionsService.update(id, updateSuggestionDto, user, file);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
        return this.suggestionsService.remove(id, user);
    }
}
