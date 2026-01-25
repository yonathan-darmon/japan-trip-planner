import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PreferencesService } from './preferences.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('preferences')
@UseGuards(AuthGuard('jwt'))
export class PreferencesController {
    constructor(private readonly preferencesService: PreferencesService) { }

    @Get('my-votes')
    getMyVotes(@CurrentUser() user: User) {
        return this.preferencesService.getUserPreferences(user.id);
    }

    @Patch(':suggestionId')
    updateVote(
        @Param('suggestionId', ParseIntPipe) suggestionId: number,
        @Body() dto: UpdatePreferenceDto,
        @CurrentUser() user: User,
    ) {
        return this.preferencesService.updatePreference(user.id, suggestionId, dto);
    }

    @Get('suggestion/:suggestionId')
    getSuggestionVotes(@Param('suggestionId', ParseIntPipe) suggestionId: number) {
        return this.preferencesService.getSuggestionVotes(suggestionId);
    }
}
