import { Controller, Get } from '@nestjs/common';
import { ChangelogService } from './changelog.service';
import { Changelog } from './entities/changelog.entity';

@Controller('changelog')
export class ChangelogController {
    constructor(private readonly changelogService: ChangelogService) { }

    @Get('latest')
    async getLatest(): Promise<Changelog[]> {
        return this.changelogService.findAll();
    }
}
