import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Itinerary } from './entities/itinerary.entity';
import { TripConfigService } from '../trip-config/trip-config.service';
import { SuggestionsService } from '../suggestions/suggestions.service';
import { PreferencesService } from '../preferences/preferences.service';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';
import { ReorderActivitiesDto } from './dto/reorder-activities.dto';
import { Suggestion, SuggestionCategory } from '../suggestions/entities/suggestion.entity';

interface DayPlan {
    dayNumber: number;
    date: Date | null;
    activities: {
        suggestionId: number;
        orderInDay: number;
        suggestion: Suggestion;
    }[];
}

@Injectable()
export class ItineraryService {
    constructor(
        @InjectRepository(Itinerary)
        private itineraryRepository: Repository<Itinerary>,
        private tripConfigService: TripConfigService,
        private suggestionsService: SuggestionsService,
        private preferencesService: PreferencesService,
    ) { }

    /**
     * PHASE 1: Collect trip configuration and voted suggestions
     */
    private async collectData() {
        const config = await this.tripConfigService.getConfig();
        const allSuggestions = await this.suggestionsService.findAll();

        console.log('=== PHASE 1: COLLECT DATA ===');
        console.log('Total suggestions in DB:', allSuggestions.length);

        // Filter only voted suggestions (selected = true)
        const votedSuggestions = allSuggestions.filter(s =>
            s.preferences && s.preferences.some(p => p.selected)
        );

        console.log('Voted suggestions:', votedSuggestions.length);
        votedSuggestions.forEach(s => {
            console.log(`  - ${s.name} (${s.location}) - Lat: ${s.latitude}, Lng: ${s.longitude}`);
        });

        return { config, votedSuggestions };
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
        // Separate accommodations from other activities
        const accommodations = activities.filter(a => a.category === SuggestionCategory.HEBERGEMENT);
        const otherActivities = activities.filter(a => a.category !== SuggestionCategory.HEBERGEMENT);

        if (otherActivities.length === 0) {
            // Only accommodations, create empty days
            return Array.from({ length: totalDays }, (_, i) => ({
                dayNumber: i + 1,
                date: null,
                activities: accommodations[i] ? [{
                    suggestionId: accommodations[i].id,
                    orderInDay: 1,
                    suggestion: accommodations[i],
                }] : [],
            }));
        }

        // Cluster activities by geographic proximity
        const numClusters = Math.min(Math.ceil(otherActivities.length / maxPerDay), otherActivities.length);
        const clusters = this.clusterByLocation(otherActivities, numClusters);

        console.log(`Distributing ${otherActivities.length} activities across ${totalDays} days`);

        // Flatten clusters and distribute evenly across days
        const allActivitiesOrdered: Suggestion[] = [];
        for (const cluster of clusters) {
            // Sort cluster by nearest neighbor for optimal routing
            const sorted = this.nearestNeighbor(cluster);
            allActivitiesOrdered.push(...sorted);
        }

        // Calculate spacing between activities to distribute evenly
        const spacing = totalDays / allActivitiesOrdered.length;

        const days: DayPlan[] = [];
        let nextActivityIndex = 0;

        for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
            const dayActivities: Suggestion[] = [];

            // Determine if this day should have activities
            const expectedActivityIndex = Math.floor((dayNum - 1) / spacing);

            // Add activities for this day (up to maxPerDay)
            while (nextActivityIndex < allActivitiesOrdered.length &&
                nextActivityIndex <= expectedActivityIndex &&
                dayActivities.length < maxPerDay) {
                dayActivities.push(allActivitiesOrdered[nextActivityIndex]);
                nextActivityIndex++;
            }

            // Add accommodation if available
            const accommodation = accommodations[dayNum - 1];
            if (accommodation) {
                dayActivities.push(accommodation);
            }

            days.push({
                dayNumber: dayNum,
                date: null,
                activities: dayActivities.map((s, idx) => ({
                    suggestionId: s.id,
                    orderInDay: idx + 1,
                    suggestion: s,
                })),
            });

            if (dayActivities.length > 0) {
                console.log(`Day ${dayNum}: ${dayActivities.map(a => a.name).join(', ')}`);
            }
        }

        return days;
    }

    /**
     * K-means clustering by geographic location
     */
    private clusterByLocation(activities: Suggestion[], k: number): Suggestion[][] {
        if (activities.length === 0) return [];
        if (k === 1 || activities.length <= k) return [activities];

        // Adjust k if we have fewer activities than requested clusters
        const actualK = Math.min(k, activities.length);

        console.log(`=== CLUSTERING: ${activities.length} activities into ${actualK} clusters ===`);

        // Simple k-means implementation
        const clusters: Suggestion[][] = Array(actualK).fill(null).map(() => []);

        // Initialize centroids randomly
        const centroids = activities
            .sort(() => Math.random() - 0.5)
            .slice(0, actualK)
            .map(a => ({ lat: a.latitude, lng: a.longitude }));

        // Assign each activity to nearest centroid
        for (const activity of activities) {
            let minDist = Infinity;
            let bestCluster = 0;

            for (let i = 0; i < actualK; i++) {
                const dist = this.distance(
                    activity.latitude,
                    activity.longitude,
                    centroids[i].lat,
                    centroids[i].lng
                );
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = i;
                }
            }

            clusters[bestCluster].push(activity);
        }

        const result = clusters.filter(c => c.length > 0);
        console.log(`Clusters created: ${result.length}`);
        result.forEach((cluster, idx) => {
            console.log(`  Cluster ${idx + 1}: ${cluster.map(a => a.name).join(', ')}`);
        });

        return result;
    }

    /**
     * Nearest neighbor algorithm for intra-day optimization
     */
    private nearestNeighbor(activities: Suggestion[]): Suggestion[] {
        if (activities.length <= 1) return activities;

        const result: Suggestion[] = [];
        const remaining = [...activities];

        // Start with first activity
        result.push(remaining.shift()!);

        while (remaining.length > 0) {
            const current = result[result.length - 1];
            let minDist = Infinity;
            let nearestIndex = 0;

            // Find nearest remaining activity
            for (let i = 0; i < remaining.length; i++) {
                const dist = this.distance(
                    current.latitude,
                    current.longitude,
                    remaining[i].latitude,
                    remaining[i].longitude
                );
                if (dist < minDist) {
                    minDist = dist;
                    nearestIndex = i;
                }
            }

            result.push(remaining.splice(nearestIndex, 1)[0]);
        }

        return result;
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
            Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
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
        }
        return total;
    }

    /**
     * Main generation method
     */
    async generate(dto: GenerateItineraryDto, userId: number): Promise<Itinerary> {
        console.log('=== STARTING ITINERARY GENERATION ===');

        // Phase 1: Collect data
        const { config, votedSuggestions } = await this.collectData();

        if (votedSuggestions.length === 0) {
            throw new Error('No suggestions have been voted for. Please vote for some suggestions first.');
        }

        console.log('=== PHASE 2: SELECT ACTIVITIES ===');
        // Phase 2: Select activities
        const selectedActivities = this.selectActivities(
            votedSuggestions,
            config.durationDays,
            dto.maxActivitiesPerDay || 4
        );
        console.log(`Selected ${selectedActivities.length} activities for ${config.durationDays} days`);

        console.log('=== PHASE 3: OPTIMIZE ROUTING ===');
        // Phase 3: Optimize routing
        const days = this.optimizeRouting(
            selectedActivities,
            config.durationDays,
            dto.maxActivitiesPerDay || 4
        );

        console.log('=== FINAL ITINERARY ===');
        days.slice(0, 3).forEach(day => {
            console.log(`Day ${day.dayNumber}: ${day.activities.length} activities`);
            day.activities.forEach(a => {
                console.log(`  - ${a.suggestion.name} at (${a.suggestion.latitude}, ${a.suggestion.longitude})`);
            });
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

        console.log(`Total cost: ${totalCost}€`);
        console.log('=== GENERATION COMPLETE ===');

        // Create itinerary
        const itinerary = this.itineraryRepository.create({
            name: dto.name || `Voyage au Japon - ${new Date().toLocaleDateString('fr-FR')}`,
            totalDays: config.durationDays,
            totalCost,
            createdById: userId,
            days,
        });

        return this.itineraryRepository.save(itinerary);
    }

    async findAll(userId: number): Promise<Itinerary[]> {
        return this.itineraryRepository.find({
            where: { createdById: userId },
            order: { generatedAt: 'DESC' },
        });
    }

    async findOne(id: number, userId: number): Promise<Itinerary> {
        const itinerary = await this.itineraryRepository.findOne({
            where: { id, createdById: userId },
        });

        if (!itinerary) {
            throw new Error('Itinerary not found');
        }

        return itinerary;
    }

    async remove(id: number, userId: number): Promise<void> {
        const itinerary = await this.findOne(id, userId);
        await this.itineraryRepository.remove(itinerary);
    }

    async reorder(
        id: number,
        dto: ReorderActivitiesDto,
        userId: number
    ): Promise<Itinerary> {
        const itinerary = await this.findOne(id, userId);

        // Target day index
        const targetDayIndex = dto.dayNumber - 1;
        const targetDay = itinerary.days[targetDayIndex];

        if (!targetDay) {
            throw new Error('Target day not found');
        }

        // We need to collect all activities effectively moved/kept in the target day
        const NewTargetActivities: any[] = [];

        // 1. Collect and remove from source
        for (const suggestionId of dto.newOrder) {
            let foundActivity: any = null;
            let foundDayIndex = -1;

            // Search in all days
            for (let d = 0; d < itinerary.days.length; d++) {
                const day = itinerary.days[d];
                const activityIndex = day.activities.findIndex(a => a.suggestionId === suggestionId);

                if (activityIndex !== -1) {
                    foundActivity = day.activities[activityIndex];
                    foundDayIndex = d;

                    // Remove from source day
                    day.activities.splice(activityIndex, 1);
                    break;
                }
            }

            if (!foundActivity) {
                // Should strictly not happen if frontend is synced, but let's handle graceful failure or error
                console.warn(`Activity with suggestion ID ${suggestionId} not found in itinerary usually implies sync error.`);
                // Option: Skip or Throw. Throwing is safer for data integrity.
                throw new Error(`Activity with suggestion ID ${suggestionId} not found`);
            }

            NewTargetActivities.push(foundActivity);
        }

        // 2. Assign to target day
        itinerary.days[targetDayIndex].activities = NewTargetActivities.map((act, index) => ({
            ...act,
            orderInDay: index + 1
        }));

        // 3. Re-index all days (cleanup orders)
        // Since we spliced arrays, orderInDay might be wrong in source days
        itinerary.days.forEach(day => {
            day.activities.forEach((act, index) => {
                act.orderInDay = index + 1;
            });
        });


        return this.itineraryRepository.save(itinerary);
    }
}
