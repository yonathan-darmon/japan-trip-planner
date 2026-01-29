import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    ParseIntPipe,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get('count')
    count() {
        return this.usersService.countAll();
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findOne(id);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.remove(id);
    }

    @Delete('me/delete') // Explicit path to avoid conflict with :id if not careful, though 'me' is not int.
    removeSelf(@Request() req: any) {
        // req.user is populated by JwtStrategy
        return this.usersService.remove(req.user.id);
    }

    @Post('me/changelog-read')
    updateChangelogRead(@Request() req: any) {
        return this.usersService.updateLastViewedChangelog(req.user.id);
    }
}
