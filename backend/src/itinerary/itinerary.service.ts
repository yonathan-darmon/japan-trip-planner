import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Itinerary } from './entities/itinerary.entity';
import { TripConfigService } from '../trip-config/trip-config.service';
import { SuggestionsService } from '../suggestions/suggestions.service';
import { PreferencesService } from '../preferences/preferences.service';
import { UsersService } from '../users/users.service'; // Added based on typical usage, though not in original imports list shown? 
// Wait, original imports (Step 4105) didn't show UsersService. Let's check constructor signature in Step 4084 proposal.
// It had UsersService. But maybe original didn't?
// Step 4105 imports: TripConfigService, SuggestionsService, PreferencesService.
// Let's stick to what was there + new services.
// Actually, Step 4084 proposed adding UsersService and PreferencesModule. 
// I will just add ClusteringService and RoutingService.

import { GenerateItineraryDto } from './dto/generate-itinerary.dto';
import { ReorderActivitiesDto } from './dto/reorder-activities.dto';
import { Suggestion, SuggestionCategory } from '../suggestions/entities/suggestion.entity';
import { TripConfig } from '../trip-config/entities/trip-config.entity';
import { ClusteringService } from './clustering.service';
import { OptimizationService } from './optimization.service';
import { RoutingService } from './routing.service';
import { GeoUtils } from './utils/geo.utils';

interface DayPlan {
    dayNumber: number;
    date: Date | null;
    activities: {
        suggestionId: number;
        orderInDay: number;
        suggestion: Suggestion;
    }[];
    accommodation: Suggestion | null;
}

@Injectable()
export class ItineraryService {
    private readonly logger = new Logger(ItineraryService.name);

    constructor(
        @InjectRepository(Itinerary)
        private itineraryRepository: Repository<Itinerary>,
        private tripConfigService: TripConfigService,
        @Inject(forwardRef(() => SuggestionsService))
        private suggestionsService: SuggestionsService,
        private preferencesService: PreferencesService,
        private clusteringService: ClusteringService,
        private optimizationService: OptimizationService,
        private routingService: RoutingService,
    ) { }

    /**
     * PHASE 1: Collect trip configuration and voted suggestions
     */
    private async collectData(groupId?: number): Promise<{ config: TripConfig; votedSuggestions: Suggestion[] }> {
        if (!groupId) {
            throw new BadRequestException('groupId is required for itinerary generation');
        }

        const config = await this.tripConfigService.getConfig(groupId);
        const allSuggestions = await this.suggestionsService.findAll({ groupId });

        this.logger.log(`=== PHASE 1: COLLECT DATA (Group: ${groupId}) ===`);
        this.logger.debug(`Total suggestions visible: ${allSuggestions.length}`);

        // 1. Activities MUST be voted (and not deleted, but findAll handles that)
        // Also exclude accommodations from this list to avoid duplicates if we merge later
        const votedActivities = allSuggestions.filter(s =>
            s.category !== SuggestionCategory.HEBERGEMENT &&
            s.category !== SuggestionCategory.TRANSPORT &&
            s.category !== SuggestionCategory.AUTRE &&
            s.preferences &&
            s.preferences.some(p => p.selected)
        );

        // 2. Accommodations: Take ALL of them (voted or not)
        const allAccommodations = allSuggestions.filter(s =>
            s.category === SuggestionCategory.HEBERGEMENT
        );

        // 3. Merge
        // Un hôtel a le droit d'être "voted" aussi, mais on le veut dans tous les cas.
        // Puisque j'ai exclu HEBERGEMENT de votedActivities, pas de doublons possibles.
        const result = [...votedActivities, ...allAccommodations];

        this.logger.debug(`Pool: ${votedActivities.length} voted activities + ${allAccommodations.length} accommodations = ${result.length} total items.`);

        return { config, votedSuggestions: result };
    }

    /**
     * PHASE 2: Select and prioritize activities
     */
    private selectActivities(
        suggestions: Suggestion[],
        totalDays: number,
        maxPerDay: number
    ): Suggestion[] {
        // Calculate score for each suggestion
        const scored = suggestions.map(s => {
            const votes = s.preferences?.filter(p => p.selected).length || 0;
            const avgPriority = s.preferences
                ?.filter(p => p.selected)
                .reduce((sum, p) => {
                    if (p.priority === 'INDISPENSABLE') return sum + 3;
                    if (p.priority === 'SI_POSSIBLE') return sum + 2;
                    return sum + 1;
                }, 0) / votes || 0;

            return {
                suggestion: s,
                score: votes * avgPriority,
                votes,
            };
        });

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        // Select top N activities (totalDays * maxPerDay)
        const maxActivities = totalDays * maxPerDay;
        return scored.slice(0, maxActivities).map(s => s.suggestion);
    }

    /**
     * PHASE 3: Optimize geographic routing
     */
    private optimizeRouting(
        activities: Suggestion[],
        totalDays: number,
        maxPerDay: number
    ): DayPlan[] {
        // 1. Separate accommodations
        const accommodations = activities.filter(a => a.category === SuggestionCategory.HEBERGEMENT);
        const otherActivities = activities.filter(a => a.category !== SuggestionCategory.HEBERGEMENT);

        const days: DayPlan[] = Array.from({ length: totalDays }, (_, i) => ({
            dayNumber: i + 1,
            date: null,
            activities: [],
            accommodation: null,
        }));

        if (otherActivities.length === 0) {
            // Just spread accommodations if any
            accommodations.forEach((acc, i) => {
                if (i < totalDays) days[i].accommodation = acc;
            });
            return days;
        }

        // 2. Intelligent Clustering via Service
        const k = Math.min(totalDays, otherActivities.length);
        const clusters = this.clusteringService.clusterByLocation(otherActivities, k);

        this.logger.log(`Clustering: Created ${clusters.length} clusters for ${totalDays} days.`);

        // 3. Assign activities and match accommodation per cluster
        let currentDayIndex = 0;
        let currentDayHours = 0;
        const dailyTargetHours = 8.0;

        for (const cluster of clusters) {
            // Sort internal activities by Routing Service
            const sortedActivities = this.routingService.nearestNeighbor(cluster);

            // Find best accommodation for this cluster (within 30km radius)
            const bestHotel = this.routingService.findBestAccommodationForCluster(cluster, accommodations, 30);

            if (bestHotel) {
                this.logger.debug(`Cluster assigned to hotel: ${bestHotel.name} (Cluster size: ${cluster.length})`);
            }

            // Fill days with this cluster's activities
            const startDayIndex = currentDayIndex;

            // Force day change if we are starting a new cluster and the current day is not empty
            if (days[currentDayIndex].activities.length > 0 && currentDayIndex < totalDays - 1) {
                currentDayIndex++;
                currentDayHours = 0;
            }

            for (const activity of sortedActivities) {
                const duration = Number(activity.durationHours) || 2.0;
                let travelTime = 0;

                // Calculate travel time from previous activity in the same day
                if (days[currentDayIndex].activities.length > 0) {
                    const lastActivity = days[currentDayIndex].activities[days[currentDayIndex].activities.length - 1];
                    const dist = GeoUtils.distance(
                        Number(lastActivity.suggestion.latitude),
                        Number(lastActivity.suggestion.longitude),
                        Number(activity.latitude),
                        Number(activity.longitude)
                    );
                    // Assume walking speed 4 km/h
                    travelTime = dist / 4.0;
                } else if (bestHotel && days[currentDayIndex].activities.length === 0) {
                    // Optional: Calculate time from hotel to first activity?
                    // Let's keep it simple for now, usually starting fresh.
                    // But if we have a hotel, we *could* count it. 
                    // Let's count it to be more realistic functionality "travel time must be added".
                    const dist = GeoUtils.distance(
                        Number(bestHotel.latitude),
                        Number(bestHotel.longitude),
                        Number(activity.latitude),
                        Number(activity.longitude)
                    );
                    travelTime = dist / 4.0;
                }

                // If current day is full, move to next
                if (currentDayHours + duration + travelTime > dailyTargetHours && currentDayIndex < totalDays - 1) {
                    currentDayIndex++;
                    currentDayHours = 0;
                    travelTime = 0; // Reset travel time as we might start from hotel again (or not counted if moved)

                    // Recalculate from hotel for new day if applicable
                    if (bestHotel) {
                        const dist = GeoUtils.distance(
                            Number(bestHotel.latitude),
                            Number(bestHotel.longitude),
                            Number(activity.latitude),
                            Number(activity.longitude)
                        );
                        travelTime = dist / 4.0;
                    }
                }

                days[currentDayIndex].activities.push({
                    suggestionId: activity.id,
                    orderInDay: days[currentDayIndex].activities.length + 1,
                    suggestion: activity,
                });

                if (bestHotel && !days[currentDayIndex].accommodation) {
                    days[currentDayIndex].accommodation = bestHotel;
                }

                currentDayHours += duration + travelTime;
            }

            // Back-fill / Forward-fill accommodation
            for (let d = startDayIndex; d <= currentDayIndex; d++) {
                if (bestHotel && !days[d].accommodation) {
                    days[d].accommodation = bestHotel;
                }
            }
        }

        // Log days without accommodation
        const daysWithoutAccommodation = days.filter(d => !d.accommodation && d.activities.length > 0);
        if (daysWithoutAccommodation.length > 0) {
            this.logger.warn(
                `⚠️  ${daysWithoutAccommodation.length} jour(s) sans hébergement (jours: ${daysWithoutAccommodation.map(d => d.dayNumber).join(', ')}). ` +
                `L'utilisateur devra en ajouter manuellement.`
            );
        }

        // 4. Final optimization: regroup days by hotel and proximity
        this.logger.log('=== PHASE 4: FINAL OPTIMIZATION ===');
        const optimizedDays = this.optimizationService.optimizeDayOrder(days);

        return optimizedDays;
    }

    /**
     * PHASE 4: Calculate total cost
     */
    private calculateCost(days: DayPlan[]): number {
        let total = 0;
        for (const day of days) {
            for (const activity of day.activities) {
                const price = parseFloat(activity.suggestion.price as any) || 0;
                total += price;
            }
            // Add accommodation cost if any
            if (day.accommodation) {
                const price = parseFloat(day.accommodation.price as any) || 0;
                total += price;
            }
        }
        return total;
    }

    /**
     * Main generation method
     */
    async generate(dto: GenerateItineraryDto, userId: number): Promise<Itinerary> {
        this.logger.log(`=== STARTING ITINERARY GENERATION for User ${userId} (Group: ${dto.groupId}) ===`);

        // Phase 1: Collect data
        const { config, votedSuggestions } = await this.collectData(dto.groupId);

        if (votedSuggestions.length === 0) {
            throw new BadRequestException('No suggestions have been voted for. Please vote for some suggestions first.');
        }

        this.logger.log('=== PHASE 2: SELECT ACTIVITIES ===');
        // Phase 2: Select activities
        const selectedActivities = this.selectActivities(
            votedSuggestions,
            config.durationDays,
            dto.maxActivitiesPerDay || 4
        );
        this.logger.debug(`Selected ${selectedActivities.length} activities for ${config.durationDays} days`);

        this.logger.log('=== PHASE 3: OPTIMIZE ROUTING ===');
        // Phase 3: Optimize routing
        const days = this.optimizeRouting(
            selectedActivities,
            config.durationDays,
            dto.maxActivitiesPerDay || 4
        );

        this.logger.log('=== FINAL ITINERARY ===');
        days.slice(0, 3).forEach(day => {
            this.logger.debug(`Day ${day.dayNumber}: ${day.activities.length} activities`);
            day.activities.forEach(a => {
                this.logger.verbose(`  - ${a.suggestion.name} at (${a.suggestion.latitude}, ${a.suggestion.longitude})`);
            });
            if (day.accommodation) {
                this.logger.debug(`  - 🌙 Nuit à : ${day.accommodation.name}`);
            }
        });

        // Add dates if trip has start date
        if (config.startDate) {
            const startDate = new Date(config.startDate);
            days.forEach(day => {
                const date = new Date(startDate);
                date.setDate(date.getDate() + day.dayNumber - 1);
                day.date = date;
            });
        }

        // Phase 4: Calculate cost
        const totalCost = this.calculateCost(days);

        this.logger.log(`Total cost: ${totalCost}€`);
        this.logger.log('=== GENERATION COMPLETE ===');

        // Create itinerary
        const itinerary = this.itineraryRepository.create({
            name: dto.name || `Voyage au Japon - ${new Date().toLocaleDateString('fr-FR')}`,
            totalDays: config.durationDays,
            totalCost,
            createdById: userId,
            groupId: dto.groupId,
            days,
        });

        return this.itineraryRepository.save(itinerary);
    }

    async findAll(userId: number, groupId?: number): Promise<Itinerary[]> {
        const where: any[] = [
            { createdById: userId } // Always include own itineraries
        ];

        if (groupId) {
            where.push({ groupId: groupId }); // Include group itineraries
        }

        return this.itineraryRepository.find({
            where,
            order: { generatedAt: 'DESC' },
            relations: ['createdBy']
        });
    }

    async findAllPublic(): Promise<Itinerary[]> {
        return this.itineraryRepository.find({
            relations: ['createdBy'],
            order: { generatedAt: 'DESC' },
        });
    }

    async findOne(id: number, userId: number): Promise<Itinerary> {
        const itinerary = await this.itineraryRepository.findOne({
            where: { id },
            relations: ['createdBy'],
        });

        if (!itinerary) {
            throw new NotFoundException('Itinerary not found');
        }

        return itinerary;
    }

    async remove(id: number, userId: number): Promise<void> {
        const itinerary = await this.findOne(id, userId);

        // Only the creator can delete the itinerary
        if (itinerary.createdById !== userId) {
            throw new BadRequestException('You can only delete your own itineraries');
        }

        await this.itineraryRepository.remove(itinerary);
    }

    async reorder(
        id: number,
        dto: ReorderActivitiesDto,
        userId: number
    ): Promise<Itinerary> {
        const itinerary = await this.findOne(id, userId);

        if (!itinerary) {
            throw new NotFoundException('Itinerary not found');
        }

        // Check permissions
        if (itinerary.createdById !== userId) {
            throw new BadRequestException('You can only modify your own itineraries');
        }

        // Target day index
        const targetDayIndex = dto.dayNumber - 1;
        const targetDay = itinerary.days[targetDayIndex];

        if (!targetDay) {
            throw new NotFoundException('Target day not found');
        }

        // We need to collect all activities effectively moved/kept in the target day
        const NewTargetActivities: any[] = [];

        // 1. Collect and remove from source
        for (const suggestionId of dto.newOrder) {
            let foundActivity: any = null;

            // Search in all days
            for (let d = 0; d < itinerary.days.length; d++) {
                const day = itinerary.days[d];
                const activityIndex = day.activities.findIndex(a => a.suggestionId === suggestionId);

                if (activityIndex !== -1) {
                    foundActivity = day.activities[activityIndex];
                    // Remove from source day
                    day.activities.splice(activityIndex, 1);
                    break;
                }
            }

            if (!foundActivity) {
                this.logger.warn(`Activity with suggestion ID ${suggestionId} not found in current itinerary.`);
                continue;
            }

            NewTargetActivities.push(foundActivity);
        }

        // 2. Assign to target day
        itinerary.days[targetDayIndex].activities = NewTargetActivities.map((act, index) => ({
            ...act,
            orderInDay: index + 1
        }));

        // 3. Re-index all days (cleanup orders)
        itinerary.days.forEach(day => {
            day.activities.forEach((act, index) => {
                act.orderInDay = index + 1;
            });
        });

        return this.itineraryRepository.save(itinerary);
    }

    /**
     * Reorder activities across ALL days at once
     */
    async reorderAllDays(
        id: number,
        dto: { days: { dayNumber: number; activities: { suggestionId: number; orderInDay: number }[] }[] },
        userId: number
    ): Promise<Itinerary> {
        const itinerary = await this.findOne(id, userId);

        if (!itinerary) {
            throw new NotFoundException('Itinerary not found');
        }

        // Check permissions
        if (itinerary.createdById !== userId) {
            throw new BadRequestException('You can only modify your own itineraries');
        }

        // Update each day's activities based on the DTO
        for (const dayDto of dto.days) {
            const dayIndex = dayDto.dayNumber - 1;
            if (dayIndex < 0 || dayIndex >= itinerary.days.length) {
                this.logger.warn(`Day ${dayDto.dayNumber} out of range, skipping`);
                continue;
            }

            // Clear current activities
            itinerary.days[dayIndex].activities = [];

            // Rebuild activities from DTO
            for (const actDto of dayDto.activities) {
                let foundActivity: any = null;

                // Search in all original days to find the activity object
                for (const day of itinerary.days) {
                    const found = day.activities.find(a => a.suggestionId === actDto.suggestionId);
                    if (found) {
                        foundActivity = found;
                        break;
                    }
                }

                // If not found in current structure, fetch from suggestions
                if (!foundActivity) {
                    const suggestion = await this.suggestionsService.findOne(actDto.suggestionId);
                    if (suggestion) {
                        foundActivity = {
                            suggestionId: suggestion.id,
                            orderInDay: actDto.orderInDay,
                            suggestion: suggestion
                        };
                    }
                }

                if (foundActivity) {
                    itinerary.days[dayIndex].activities.push({
                        ...foundActivity,
                        orderInDay: actDto.orderInDay
                    });
                }
            }
        }

        // Recalculate cost
        itinerary.totalCost = this.calculateCost(itinerary.days);

        return this.itineraryRepository.save(itinerary);
    }

    async updateAccommodation(
        id: number,
        dayNumber: number,
        suggestionId: number | null,
        userId: number
    ): Promise<Itinerary> {
        const itinerary = await this.findOne(id, userId);

        // Check permissions
        if (itinerary.createdById !== userId) {
            throw new BadRequestException('You can only modify your own itineraries');
        }

        if (dayNumber < 1 || dayNumber > itinerary.days.length) {
            throw new BadRequestException('Day number out of range');
        }

        const dayIndex = dayNumber - 1;

        if (!suggestionId) {
            itinerary.days[dayIndex].accommodation = null;
        } else {
            const suggestion = await this.suggestionsService.findOne(suggestionId);
            if (!suggestion) {
                throw new NotFoundException('Accommodation suggestion not found');
            }
            itinerary.days[dayIndex].accommodation = suggestion;
        }

        // Recalculate cost
        itinerary.totalCost = this.calculateCost(itinerary.days);

        return this.itineraryRepository.save(itinerary);
    }
    async addActivity(
        id: number,
        dayNumber: number,
        suggestionId: number,
        userId: number
    ): Promise<Itinerary> {
        const itinerary = await this.findOne(id, userId);

        // Check permissions
        if (itinerary.createdById !== userId) {
            throw new BadRequestException('You can only modify your own itineraries');
        }

        if (dayNumber < 1 || dayNumber > itinerary.days.length) {
            throw new BadRequestException('Day number out of range');
        }

        const dayIndex = dayNumber - 1;

        // Check availability
        const suggestion = await this.suggestionsService.findOne(suggestionId);
        if (!suggestion) {
            throw new NotFoundException('Suggestion not found');
        }

        // Check if already in itinerary (optional, but requested implicitly by user logic)
        // User asked for UI to filter, but backend should ideally prevent duplicates too if strict unique.
        // Let's check across ALL days for strict uniqueness or just append?
        // Usually trip itineraries don't repeat the exact same activity.
        const alreadyExists = itinerary.days.some(d =>
            d.activities.some(a => a.suggestionId === suggestionId)
        );

        if (alreadyExists) {
            throw new BadRequestException('This activity is already in the itinerary');
        }

        // Add to day
        itinerary.days[dayIndex].activities.push({
            suggestionId: suggestion.id,
            orderInDay: itinerary.days[dayIndex].activities.length + 1,
            suggestion: suggestion
        });

        // Recalculate cost
        itinerary.totalCost = this.calculateCost(itinerary.days);

        return this.itineraryRepository.save(itinerary);
    }

    async updateSuggestionInItineraries(suggestion: Suggestion): Promise<void> {
        // Fetch all itineraries because they store snapshots in JSON
        const itineraries = await this.itineraryRepository.find();


        for (const itinerary of itineraries) {
            let changed = false;
            for (const day of itinerary.days) {
                // Update Accommodation
                if (day.accommodation && day.accommodation.id === suggestion.id) {
                    day.accommodation = suggestion;
                    changed = true;
                }

                // Update Activities
                for (const activity of day.activities) {
                    if (activity.suggestionId === suggestion.id) {
                        activity.suggestion = suggestion;
                        changed = true;
                    }
                }
            }

            if (changed) {
                // Recalculate cost if price changed
                itinerary.totalCost = this.calculateCost(itinerary.days);
                await this.itineraryRepository.save(itinerary);
                this.logger.log(`Updated itinerary ${itinerary.id} with new details for suggestion ${suggestion.id}`);
            }
        }
    }
}
