import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripConfig } from './entities/trip-config.entity';
import { UpdateTripConfigDto } from './dto/update-trip-config.dto';

@Injectable()
export class TripConfigService {
    constructor(
        @InjectRepository(TripConfig)
        private tripConfigRepository: Repository<TripConfig>,
    ) { }

    async getConfig(): Promise<TripConfig> {
        // Get the single config row, or create it if it doesn't exist
        let config = await this.tripConfigRepository.findOne({ where: {} });

        if (!config) {
            config = this.tripConfigRepository.create({
                durationDays: 21,
                startDate: null,
                endDate: null,
            });
            await this.tripConfigRepository.save(config);
        }

        return config;
    }

    async updateConfig(
        dto: UpdateTripConfigDto,
        userId: number,
    ): Promise<TripConfig> {
        const config = await this.getConfig();

        if (dto.durationDays !== undefined) {
            config.durationDays = dto.durationDays;
        }
        if (dto.startDate !== undefined) {
            config.startDate = dto.startDate ? new Date(dto.startDate) : null;
        }
        if (dto.endDate !== undefined) {
            config.endDate = dto.endDate ? new Date(dto.endDate) : null;
        }

        config.updatedById = userId;

        return this.tripConfigRepository.save(config);
    }
}
