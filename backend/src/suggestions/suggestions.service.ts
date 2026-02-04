import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Suggestion } from './entities/suggestion.entity';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { S3Service } from '../storage/s3.service';
import { GeocodingService } from './geocoding.service';
import { SyncGateway } from '../sync/sync.gateway';
import { ItineraryService } from '../itinerary/itinerary.service';
import { GroupsService } from '../groups/groups.service';
import { Country } from '../countries/entities/country.entity';

@Injectable()
export class SuggestionsService {
    constructor(
        @InjectRepository(Suggestion)
        private suggestionsRepository: Repository<Suggestion>,
        @InjectRepository(Country)
        private countriesRepository: Repository<Country>,
        private s3Service: S3Service,
        private geocodingService: GeocodingService,
        private syncGateway: SyncGateway,
        @Inject(forwardRef(() => ItineraryService))
        private itineraryService: ItineraryService,
        private groupsService: GroupsService,
    ) { }

    // ... (existing code for create, findAll, findOne) ...

    async update(
        id: number,
        updateSuggestionDto: UpdateSuggestionDto,
        user: User,
        file?: Express.Multer.File,
    ): Promise<Suggestion> {
        const suggestion = await this.findOne(id);

        // Check permissions: only creator or super admin can update
        if (
            user.role !== UserRole.SUPER_ADMIN &&
            suggestion.createdById !== user.id
        ) {
            throw new ForbiddenException(
                "Vous n'avez pas le droit de modifier cette suggestion",
            );
        }

        // Update fields explicitly to handle casting from FormData strings
        if (updateSuggestionDto.name !== undefined) suggestion.name = updateSuggestionDto.name;
        // Handle manual coordinates
        const manualCoords = updateSuggestionDto.latitude !== undefined || updateSuggestionDto.longitude !== undefined;
        if (updateSuggestionDto.latitude !== undefined) suggestion.latitude = updateSuggestionDto.latitude;
        if (updateSuggestionDto.longitude !== undefined) suggestion.longitude = updateSuggestionDto.longitude;

        if (updateSuggestionDto.location !== undefined) {
            if (updateSuggestionDto.location !== suggestion.location && !manualCoords) {
                console.log(`📍 Location changed, re-geocoding...`);
                // Resolve context
                const effectiveCountryId = updateSuggestionDto.countryId ?? suggestion.countryId;
                const effectiveGroupId = updateSuggestionDto.groupId ?? suggestion.groupId;
                const context = await this.getCountryContext(effectiveCountryId, effectiveGroupId);

                const coords = await this.geocodingService.getCoordinatesWithRetry(updateSuggestionDto.location, context);
                if (coords) {
                    suggestion.latitude = coords.lat;
                    suggestion.longitude = coords.lng;
                }
            }
            suggestion.location = updateSuggestionDto.location;
        }
        if (updateSuggestionDto.description !== undefined) suggestion.description = updateSuggestionDto.description;
        if (updateSuggestionDto.price !== undefined) suggestion.price = (updateSuggestionDto.price !== null && (updateSuggestionDto.price as any) !== '') ? +updateSuggestionDto.price : null;
        if (updateSuggestionDto.category !== undefined) suggestion.category = updateSuggestionDto.category;
        if (updateSuggestionDto.durationHours !== undefined) suggestion.durationHours = (updateSuggestionDto.durationHours !== null && (updateSuggestionDto.durationHours as any) !== '') ? +updateSuggestionDto.durationHours : 2;
        if (updateSuggestionDto.countryId !== undefined) suggestion.countryId = updateSuggestionDto.countryId ? +updateSuggestionDto.countryId : null;

        if (updateSuggestionDto.isGlobal !== undefined) {
            // Robust boolean casting
            suggestion.isGlobal = String(updateSuggestionDto.isGlobal) === 'true';
        }

        if (updateSuggestionDto.groupId !== undefined) suggestion.groupId = updateSuggestionDto.groupId ? +updateSuggestionDto.groupId : null;

        // Upload new image if present
        if (file) {
            suggestion.photoUrl = await this.s3Service.uploadFile(file);
        }

        const updatedSuggestion = await this.suggestionsRepository.save(suggestion);
        this.syncGateway.sendSuggestionUpdate('update', updatedSuggestion);

        // Synchronize itineraries
        try {
            await this.itineraryService.updateSuggestionInItineraries(updatedSuggestion);
        } catch (err) {
            console.error('Error synchronizing itineraries:', err);
        }

        return updatedSuggestion;
    }

    async create(
        createSuggestionDto: CreateSuggestionDto,
        user: User,
        file?: Express.Multer.File,
    ): Promise<Suggestion> {
        const suggestion = this.suggestionsRepository.create({
            ...createSuggestionDto,
            createdBy: user,
            createdById: user.id,
            isGlobal: true // Force public visibility as per requirement "always public"
        });

        // Ensure groupId is a number
        let effectiveGroupId = createSuggestionDto.groupId ? +createSuggestionDto.groupId : null;

        // Auto-link: If no groupId provided, check if user has a unique group they belong to
        if (!effectiveGroupId) {
            try {
                const userGroups = await this.groupsService.findByUser(user.id);
                if (userGroups && userGroups.length === 1) {
                    effectiveGroupId = userGroups[0].id;
                    console.log(`🤖 Auto-linked suggestion to user's only group: ${effectiveGroupId}`);
                }
            } catch (err) {
                console.warn('Failed to auto-fetch groups for suggestion linkage:', err.message);
            }
        }

        // Apply group and fetch country context
        if (effectiveGroupId) {
            suggestion.groupId = effectiveGroupId;
            try {
                const group = await this.groupsService.findOne(effectiveGroupId);
                if (group && group.countryId) {
                    suggestion.countryId = group.countryId;
                    console.log(`🔗 Linked suggestion to country ${group.countryId} from group ${group.id}`);
                }
            } catch (err) {
                console.warn(`Failed to fetch group ${effectiveGroupId} for suggestion context:`, err.message);
            }
        }

        // Fallback: If no country linked via group, use the first available country (default to Japan context)
        if (!suggestion.countryId) {
            try {
                const defaultCountry = await this.countriesRepository.findOne({ where: {} });
                if (defaultCountry) {
                    suggestion.countryId = defaultCountry.id;
                    console.log(`🌍 Linked global suggestion to default country: ${defaultCountry.name}`);
                }
            } catch (err) {
                console.warn('Failed to find a default country for suggestion linkage');
            }
        }

        // Upload image if present
        if (file) {
            suggestion.photoUrl = await this.s3Service.uploadFile(file);
        }

        // Geocode location with retry ONLY if coordinates are not manually provided
        if (createSuggestionDto.location && (!createSuggestionDto.latitude || !createSuggestionDto.longitude)) {
            const countryContext = await this.getCountryContext(createSuggestionDto.countryId, createSuggestionDto.groupId);
            // Default to Japan if no context found (classic behavior) ??
            // User requested "what if I search outside Japan". 
            // So if context is undefined, we should NOT force Japan??
            // But if context is undefined, `geocoding.service` will just search globally (as per Step 427/432 logic: `query = context ? ... : address`).
            // However, the helper might return "Japan" if the group is assigned to Japan.
            // If the group has NO country, it returns undefined.
            // In that case, global search is correct.

            const coords = await this.geocodingService.getCoordinatesWithRetry(
                createSuggestionDto.location,
                countryContext
            );
            if (coords) {
                suggestion.latitude = coords.lat;
                suggestion.longitude = coords.lng;
            }
        }

        const savedSuggestion = await this.suggestionsRepository.save(suggestion);
        this.syncGateway.sendSuggestionUpdate('create', savedSuggestion);
        return savedSuggestion;
    }

    async findAll(options: {
        countryId?: number;
        isGlobal?: boolean;
        groupId?: number;
        includePrivate?: boolean; // For Super Admin
    } = {}): Promise<Suggestion[]> {
        let where: any;

        if (options.includePrivate) {
            // Admin Panel: No restriction on global/private, but respect other filters
            where = {};
            if (options.countryId) where.countryId = options.countryId;
            if (options.isGlobal !== undefined) where.isGlobal = options.isGlobal;
            if (options.groupId) where.groupId = options.groupId;
        } else {
            // Standard View: STRICT filtering by country
            // If groupId is provided, get the country from the group
            let effectiveCountryId = options.countryId;

            if (options.groupId && !effectiveCountryId) {
                try {
                    const group = await this.groupsService.findOne(options.groupId);
                    if (group && group.countryId) {
                        effectiveCountryId = group.countryId;
                        console.log(`🔍 Filtering suggestions for Group #${options.groupId}, Country #${effectiveCountryId}`);
                    }
                } catch (err) {
                    console.warn(`Failed to fetch group ${options.groupId}:`, err.message);
                }
            }

            // Build conditions: ONLY show suggestions from the same country
            const conditions: any[] = [];

            if (effectiveCountryId) {
                // 1. Global suggestions from this country
                conditions.push({ isGlobal: true, countryId: effectiveCountryId });

                // 2. Private suggestions from this group (same country)
                if (options.groupId) {
                    conditions.push({ groupId: options.groupId, countryId: effectiveCountryId });
                }
            } else {
                // Fallback: if no country context, show only group-specific suggestions
                if (options.groupId) {
                    conditions.push({ groupId: options.groupId });
                } else {
                    // No context at all, return empty
                    console.warn('⚠️ No country or group context provided, returning empty suggestions');
                    return [];
                }
            }

            where = conditions;
        }

        const results = await this.suggestionsRepository.find({
            where,
            order: { createdAt: 'DESC' },
            relations: ['createdBy', 'country', 'preferences', 'preferences.user'],
        });

        if (results.length > 0) {
            const s = results[0];
            console.log(`🔍 Debug Suggestion #${s.id}: createdById=${s.createdById}, createdBy=${s.createdById ? (s.createdBy ? s.createdBy.username : 'NULL_RELATION') : 'NULL_ID'}`);
        }
        return results;
    }

    async findOne(id: number): Promise<Suggestion> {
        const suggestion = await this.suggestionsRepository.findOne({
            where: { id },
            relations: ['createdBy', 'country'],
        });

        if (!suggestion) {
            throw new NotFoundException(`Suggestion #${id} non trouvée`);
        }

        return suggestion;
    }



    async remove(id: number, user: User): Promise<void> {
        const suggestion = await this.findOne(id);

        // Allow if SUPER ADMIN or if OWNER
        if (user.role !== UserRole.SUPER_ADMIN && suggestion.createdById !== user.id) {
            throw new ForbiddenException(
                'Vous ne pouvez supprimer que vos propres suggestions',
            );
        }

        await this.suggestionsRepository.softRemove(suggestion);
        this.syncGateway.sendSuggestionUpdate('delete', { id });
    }

    /**
     * Retry geocoding for a suggestion
     * Useful when initial geocoding failed
     */
    async retryGeocode(id: number): Promise<Suggestion> {
        const suggestion = await this.findOne(id);

        if (!suggestion.location) {
            throw new NotFoundException('Cette suggestion n\'a pas d\'adresse');
        }

        const coords = await this.geocodingService.getCoordinatesWithRetry(
            suggestion.location,
        );

        if (coords) {
            suggestion.latitude = coords.lat;
            suggestion.longitude = coords.lng;
            return this.suggestionsRepository.save(suggestion);
        }

        throw new NotFoundException(
            'Impossible de géocoder cette adresse. Vérifiez qu\'elle est correcte.',
        );
    }

    private async getCountryContext(countryId?: number | null, groupId?: number | null): Promise<string | undefined> {
        if (countryId) {
            const country = await this.countriesRepository.findOneBy({ id: countryId });
            return country?.name;
        }
        if (groupId) {
            const group = await this.groupsService.findOne(groupId);
            return group?.country?.name;
        }
        return undefined;
    }
}
