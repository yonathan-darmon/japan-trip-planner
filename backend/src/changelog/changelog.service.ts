import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Changelog } from './entities/changelog.entity';

@Injectable()
export class ChangelogService {
    constructor(
        @InjectRepository(Changelog)
        private changelogRepository: Repository<Changelog>,
    ) { }

    async findAll(): Promise<Changelog[]> {
        return this.changelogRepository.find({
            order: { publishedAt: 'DESC' },
            take: 5,
        });
    }
}
