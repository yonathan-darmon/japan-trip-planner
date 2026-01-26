import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference, Priority } from './entities/user-preference.entity';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { User } from '../users/entities/user.entity';

import { SyncGateway } from '../sync/sync.gateway';

@Injectable()
export class PreferencesService {
    constructor(
        @InjectRepository(UserPreference)
        private preferencesRepository: Repository<UserPreference>,
        private syncGateway: SyncGateway,
    ) { }

    async updatePreference(
        userId: number,
        suggestionId: number,
        dto: UpdatePreferenceDto,
    ): Promise<UserPreference> {
        let preference = await this.preferencesRepository.findOne({
            where: { userId, suggestionId },
        });

        if (!preference) {
            preference = this.preferencesRepository.create({
                userId,
                suggestionId,
                selected: false,
                priority: Priority.SI_POSSIBLE, // Default priority
            });
        }

        Object.assign(preference, dto);

        const saved = await this.preferencesRepository.save(preference);

        // Notify everyone that this suggestion has a new vote stat
        // (Sending the raw preference allows the frontend to re-calculate totals locally if needed,
        // or trigger a refetch of votes for that card)
        this.syncGateway.sendVoteUpdate(suggestionId, {
            userId,
            preference: saved
        });

        return saved;
    }

    async setPriority(
        userId: number,
        suggestionId: number,
        priority: Priority,
    ): Promise<UserPreference> {
        return this.updatePreference(userId, suggestionId, { priority, selected: true });
    }

    async toggleSelection(
        userId: number,
        suggestionId: number,
    ): Promise<UserPreference> {
        const preference = await this.preferencesRepository.findOne({
            where: { userId, suggestionId },
        });

        const newState = preference ? !preference.selected : true;
        return this.updatePreference(userId, suggestionId, { selected: newState });
    }

    async getUserPreferences(userId: number): Promise<UserPreference[]> {
        return this.preferencesRepository.find({
            where: { userId }, // Return all history, not just active selections
            relations: ['suggestion'],
        });
    }

    // Get all votes for a specific suggestion (to count popularity)
    async getSuggestionVotes(suggestionId: number): Promise<UserPreference[]> {
        return this.preferencesRepository.find({
            where: { suggestionId, selected: true },
            relations: ['user'],
        });
    }
}
