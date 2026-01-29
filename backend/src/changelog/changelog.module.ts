import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Changelog } from './entities/changelog.entity';
import { ChangelogController } from './changelog.controller';
import { ChangelogService } from './changelog.service';

@Module({
    imports: [TypeOrmModule.forFeature([Changelog])],
    controllers: [ChangelogController],
    providers: [ChangelogService],
    exports: [TypeOrmModule],
})
export class ChangelogModule { }
