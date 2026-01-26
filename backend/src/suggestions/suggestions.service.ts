import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Suggestion } from './entities/suggestion.entity';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { S3Service } from './s3.service';
import { GeocodingService } from './geocoding.service';
import { SyncGateway } from '../sync/sync.gateway';

@Injectable()
export class SuggestionsService {
    constructor(
        @InjectRepository(Suggestion)
        private suggestionsRepository: Repository<Suggestion>,
        private s3Service: S3Service,
        private geocodingService: GeocodingService,
        private syncGateway: SyncGateway,
    ) { }

    async create(
        createSuggestionDto: CreateSuggestionDto,
        user: User,
        file?: Express.Multer.File,
    ): Promise<Suggestion> {
        const suggestion = this.suggestionsRepository.create({
            ...createSuggestionDto,
            createdBy: user,
            createdById: user.id,
        });

        // Upload image if present
        if (file) {
            suggestion.photoUrl = await this.s3Service.uploadFile(file);
        }

        // Geocode location with retry
        if (createSuggestionDto.location) {
            const coords = await this.geocodingService.getCoordinatesWithRetry(
                createSuggestionDto.location,
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

    async findAll(): Promise<Suggestion[]> {
        return this.suggestionsRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['createdBy', 'preferences', 'preferences.user'],
        });
    }

    async findOne(id: number): Promise<Suggestion> {
        const suggestion = await this.suggestionsRepository.findOne({
            where: { id },
            relations: ['createdBy'],
        });

        if (!suggestion) {
            throw new NotFoundException(`Suggestion #${id} non trouvée`);
        }

        return suggestion;
    }

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

        // Check if location changed BEFORE updating fields
        const locationChanged =
            updateSuggestionDto.location &&
            updateSuggestionDto.location !== suggestion.location;

        // Update basic fields
        Object.assign(suggestion, updateSuggestionDto);

        // Upload new image if present
        if (file) {
            suggestion.photoUrl = await this.s3Service.uploadFile(file);
        }

        // Re-geocode if location changed
        if (locationChanged) {
            console.log(`📍 Location changed, re-geocoding...`);
            const coords = await this.geocodingService.getCoordinatesWithRetry(
                updateSuggestionDto.location!,
            );
            if (coords) {
                suggestion.latitude = coords.lat;
                suggestion.longitude = coords.lng;
            }
        }

        const updatedSuggestion = await this.suggestionsRepository.save(suggestion);
        this.syncGateway.sendSuggestionUpdate('update', updatedSuggestion);
        return updatedSuggestion;
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
}
