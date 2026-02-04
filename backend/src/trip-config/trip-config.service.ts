import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripConfig } from './entities/trip-config.entity';
import { UpdateTripConfigDto } from './dto/update-trip-config.dto';
import { Group } from '../groups/entities/group.entity';

@Injectable()
export class TripConfigService {
    constructor(
        @InjectRepository(TripConfig)
        private tripConfigRepository: Repository<TripConfig>,
        @InjectRepository(Group)
        private groupsRepository: Repository<Group>,
    ) { }

    /**
     * Get config for a specific group
     * Creates one automatically if it doesn't exist
     */
    async getConfig(groupId: number): Promise<TripConfig> {
        const group = await this.groupsRepository.findOne({
            where: { id: groupId },
            relations: ['tripConfig', 'country'],
        });

        if (!group) {
            throw new NotFoundException(`Groupe #${groupId} non trouvé`);
        }

        // If group has a config, return it
        if (group.tripConfig) {
            // Return config with minimal group info to avoid circular references
            const config = group.tripConfig;
            // Attach minimal group info
            (config as any).group = {
                id: group.id,
                name: group.name,
                country: group.country
            };
            return config;
        }

        // Otherwise, create one
        return this.getOrCreateConfigForGroup(groupId);
    }

    /**
     * Get or create config for a group
     */
    async getOrCreateConfigForGroup(groupId: number): Promise<TripConfig> {
        const group = await this.groupsRepository.findOne({
            where: { id: groupId },
            relations: ['tripConfig', 'country'],
        });

        if (!group) {
            throw new NotFoundException(`Groupe #${groupId} non trouvé`);
        }

        if (group.tripConfig) {
            const config = group.tripConfig;
            (config as any).group = {
                id: group.id,
                name: group.name,
                country: group.country
            };
            return config;
        }

        // Create new config
        const config = this.tripConfigRepository.create({
            durationDays: 21,
            startDate: null,
            endDate: null,
        });
        const savedConfig = await this.tripConfigRepository.save(config);

        // Link to group
        group.tripConfigId = savedConfig.id;
        await this.groupsRepository.save(group);

        console.log(`✅ Created TripConfig #${savedConfig.id} for Group #${groupId}`);

        // Reload to get relations
        return this.getConfig(groupId);
    }

    /**
     * Update config for a specific group
     * Permissions are checked by GroupAdminGuard
     */
    async updateConfig(
        groupId: number,
        dto: UpdateTripConfigDto,
        userId: number,
    ): Promise<TripConfig> {
        const config = await this.getConfig(groupId);

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

        const updated = await this.tripConfigRepository.save(config);

        console.log(`✅ Updated TripConfig #${updated.id} for Group #${groupId} by User #${userId}`);

        return this.getConfig(groupId);
    }
}
