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
import { TripConfig } from '../trip-config/entities/trip-config.entity';

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
    private async collectData(): Promise<{ config: TripConfig; votedSuggestions: Suggestion[] }> {
        const config = await this.tripConfigService.getConfig();
        const allSuggestions = await this.suggestionsService.findAll();

        console.log('=== PHASE 1: COLLECT DATA ===');
        console.log('Total suggestions in DB:', allSuggestions.length);

        // 1. Activities MUST be voted (and not deleted, but findAll handles that)
        // Also exclude accommodations from this list to avoid duplicates if we merge later
        const votedActivities = allSuggestions.filter(s =>
            s.category !== SuggestionCategory.HEBERGEMENT &&
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

        console.log(`Pool: ${votedActivities.length} voted activities + ${allAccommodations.length} accommodations = ${result.length} total items.`);

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

        // 2. Intelligent Clustering
        // We cluster activities to group them by region/neighborhood.
        // Heuristic: We try to create as many clusters as there are days, but bounded by activity count.
        // This encourages "Day 1 = Zone A, Day 2 = Zone B".
        const k = Math.min(totalDays, otherActivities.length);
        const clusters = this.clusterByLocation(otherActivities, k);

        console.log(`Clustering: Created ${clusters.length} clusters for ${totalDays} days.`);

        // 3. Assign activities and match accommodation per cluster
        let currentDayIndex = 0;
        let currentDayHours = 0;
        const dailyTargetHours = 8.0;

        // TODO: Ideally, we should sort clusters by TSP (Traveling Salesman) to minimize inter-cluster travel.
        // For now, we rely on the order returned from K-means (random-ish but stable-ish).

        for (const cluster of clusters) {
            // Sort internal activities by Nearest Neighbor
            const sortedActivities = this.nearestNeighbor(cluster);

            // Find best accommodation for this cluster (Centroid-based)
            const bestHotel = this.findBestAccommodationForCluster(cluster, accommodations);

            if (bestHotel) {
                console.log(`Cluster assigned to hotel: ${bestHotel.name} (Cluster size: ${cluster.length})`);
            }

            // Fill days with this cluster's activities
            // We track the start day to back-fill accommodation if needed
            const startDayIndex = currentDayIndex;

            // Force day change if we are starting a new cluster and the current day is not empty
            // This prevents mixing Osaka and Tokyo in the same day unless it's a travel day logic (which we simplify here)
            if (days[currentDayIndex].activities.length > 0 && currentDayIndex < totalDays - 1) {
                currentDayIndex++;
                currentDayHours = 0;
            }

            for (const activity of sortedActivities) {
                const duration = Number(activity.durationHours) || 2.0; // Default 2h if missing

                // If current day is full, move to next
                // But avoid overflowing totalDays
                if (currentDayHours + duration > dailyTargetHours && currentDayIndex < totalDays - 1) {
                    currentDayIndex++;
                    currentDayHours = 0;
                }

                days[currentDayIndex].activities.push({
                    suggestionId: activity.id,
                    orderInDay: days[currentDayIndex].activities.length + 1,
                    suggestion: activity,
                });

                // Assign hotel to this day immediately
                if (bestHotel && !days[currentDayIndex].accommodation) {
                    days[currentDayIndex].accommodation = bestHotel;
                }

                currentDayHours += duration;
            }

            // Back-fill / Forward-fill accommodation for the range of days touched by this cluster
            // This ensures that if a cluster spans 2 days, both get the hotel.
            // Also if a day was partially started by previous cluster, we might check if we should override?
            // Strategy: "First come first served" or "Majority wins"? 
            // Current strategy: If day has no accommodation, take this one.
            for (let d = startDayIndex; d <= currentDayIndex; d++) {
                if (bestHotel && !days[d].accommodation) {
                    days[d].accommodation = bestHotel;
                }
            }
        }

        // 4. Fallback: Fill holes in accommodation (Safety Net)
        // If some days have no accommodation (e.g. empty days at end, or start), propagate neighbors.

        // Forward fill
        for (let i = 1; i < totalDays; i++) {
            if (!days[i].accommodation && days[i - 1].accommodation) {
                days[i].accommodation = days[i - 1].accommodation;
            }
        }

        // Backward fill (for Day 1 if empty)
        for (let i = totalDays - 2; i >= 0; i--) {
            if (!days[i].accommodation && days[i + 1].accommodation) {
                days[i].accommodation = days[i + 1].accommodation;
            }
        }

        return days;
    }

    /**
     * Finds the accommodation closest to the centroid of a cluster of activities.
     */
    private findBestAccommodationForCluster(cluster: Suggestion[], accommodations: Suggestion[]): Suggestion | null {
        if (accommodations.length === 0) return null;
        if (cluster.length === 0) return accommodations[0]; // Should not happen, but safe fallback

        // Calculate centroid of the cluster
        let sumLat = 0, sumLng = 0;
        cluster.forEach(a => {
            sumLat += Number(a.latitude);
            sumLng += Number(a.longitude);
        });
        const centerLat = sumLat / cluster.length;
        const centerLng = sumLng / cluster.length;

        // Find nearest hotel to centroid
        let bestHotel: Suggestion | null = null;
        let minDist = Infinity;

        for (const hotel of accommodations) {
            const dist = this.distance(centerLat, centerLng, Number(hotel.latitude), Number(hotel.longitude));
            if (dist < minDist) {
                minDist = dist;
                bestHotel = hotel;
            }
        }

        return bestHotel;
    }

    /**
     * Distance-based clustering (Simple Threshold)
     * Better than K-means for travel because it naturally separates cities (Tokyo vs Osaka)
     * regardless of the number of activities.
     */
    private clusterByLocation(activities: Suggestion[], k: number): Suggestion[][] {
        if (activities.length === 0) return [];

        const clusters: Suggestion[][] = [];
        const thresholdKm = 100; // Max distance to be considered "same area"

        for (const activity of activities) {
            let added = false;

            // Try to fit into an existing cluster
            for (const cluster of clusters) {
                // Check distance to the first item (or centroid) of the cluster
                // Using first item is simpler and efficient enough for this scale
                const reference = cluster[0];
                const dist = this.distance(
                    Number(activity.latitude),
                    Number(activity.longitude),
                    Number(reference.latitude),
                    Number(reference.longitude)
                );

                if (dist < thresholdKm) {
                    cluster.push(activity);
                    added = true;
                    break;
                }
            }

            // If not added to any cluster, create a new one
            if (!added) {
                clusters.push([activity]);
            }
        }

        console.log(`=== DISTANCE CLUSTERING: Created ${clusters.length} clusters (Threshold: ${thresholdKm}km) ===`);
        clusters.forEach((cluster, idx) => {
            console.log(`  Cluster ${idx + 1}: ${cluster.length} items - ${cluster.map(a => a.name).join(', ')}`);
        });

        // Optional: If we have way too many clusters compared to days, maybe merge nearest?
        // But for now, let's respect geography. 
        // If user visits 5 cities in 3 days, they will just move a lot.

        return clusters;
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
            if (day.accommodation) {
                console.log(`  - 🌙 Nuit à : ${day.accommodation.name}`);
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

        if (!itinerary) {
            throw new Error('Itinerary not found');
        }

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
                // If not found in current itinerary activities, fetch from DB?
                // For now, ignore if not found (robustness)
                console.warn(`Activity with suggestion ID ${suggestionId} not found in current itinerary.`);
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
        // Since we spliced arrays, orderInDay might be wrong in source days
        itinerary.days.forEach(day => {
            day.activities.forEach((act, index) => {
                act.orderInDay = index + 1;
            });
        });

        return this.itineraryRepository.save(itinerary);
    }
    async updateAccommodation(
        id: number,
        dayNumber: number,
        suggestionId: number | null,
        userId: number
    ): Promise<Itinerary> {
        const itinerary = await this.findOne(id, userId);

        if (dayNumber < 1 || dayNumber > itinerary.days.length) {
            throw new Error('Day number out of range');
        }

        const dayIndex = dayNumber - 1;

        if (!suggestionId) {
            // Remove accommodation
            itinerary.days[dayIndex].accommodation = null;
        } else {
            // Find suggestion and set it
            const suggestion = await this.suggestionsService.findOne(suggestionId);
            if (!suggestion) {
                throw new Error('Accommodation suggestion not found');
            }
            // For flexibility, we allow changing category if user really wants to sleep in a museum... 
            // but let's warn or check. Let's strictly enforce if current logic expects it.
            // Actually, keep it flexible for now, but logical.
            itinerary.days[dayIndex].accommodation = suggestion;
        }

        // Recalculate cost
        itinerary.totalCost = this.calculateCost(itinerary.days);

        return this.itineraryRepository.save(itinerary);
    }
}
