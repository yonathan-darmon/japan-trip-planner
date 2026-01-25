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

@Injectable()
export class SuggestionsService {
    constructor(
        @InjectRepository(Suggestion)
        private suggestionsRepository: Repository<Suggestion>,
        private s3Service: S3Service,
        private geocodingService: GeocodingService,
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

        // Geocode location
        if (createSuggestionDto.location) {
            const coords = await this.geocodingService.getCoordinates(
                createSuggestionDto.location,
            );
            if (coords) {
                suggestion.latitude = coords.lat;
                suggestion.longitude = coords.lng;
            }
        }

        return this.suggestionsRepository.save(suggestion);
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

        // Update basic fields
        Object.assign(suggestion, updateSuggestionDto);

        // Upload new image if present
        if (file) {
            suggestion.photoUrl = await this.s3Service.uploadFile(file);
        }

        // Re-geocode if location changed
        if (
            updateSuggestionDto.location &&
            updateSuggestionDto.location !== suggestion.location
        ) {
            const coords = await this.geocodingService.getCoordinates(
                updateSuggestionDto.location,
            );
            if (coords) {
                suggestion.latitude = coords.lat;
                suggestion.longitude = coords.lng;
            }
        }

        return this.suggestionsRepository.save(suggestion);
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
    }
}
