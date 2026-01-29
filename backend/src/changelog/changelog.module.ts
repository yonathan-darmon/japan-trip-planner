import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Changelog } from './entities/changelog.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Changelog])],
    controllers: [],
    providers: [],
    exports: [TypeOrmModule],
})
export class ChangelogModule { }
