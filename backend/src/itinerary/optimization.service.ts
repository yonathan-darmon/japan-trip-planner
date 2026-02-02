import { Injectable, Logger } from '@nestjs/common';
import { Suggestion } from '../suggestions/entities/suggestion.entity';
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
export class OptimizationService {
    private readonly logger = new Logger(OptimizationService.name);

    /**
     * Main optimization method that combines hotel grouping and proximity grouping
     */
    optimizeDayOrder(days: DayPlan[]): DayPlan[] {
        if (days.length <= 1) return days;

        this.logger.log('=== STARTING DAY OPTIMIZATION ===');

        // Step 1: Group consecutive days with same hotel
        const hotelGrouped = this.regroupDaysByHotel(days);

        // Step 2: Reorder remaining days by geographic proximity
        const proximityOptimized = this.regroupDaysByProximity(hotelGrouped);

        // Step 3: Reassign day numbers
        proximityOptimized.forEach((day, index) => {
            day.dayNumber = index + 1;
        });

        this.logger.log(`=== OPTIMIZATION COMPLETE: ${days.length} days reordered ===`);
        return proximityOptimized;
    }

    /**
     * Groups consecutive days with the same accommodation together
     */
    private regroupDaysByHotel(days: DayPlan[]): DayPlan[] {
        if (days.length <= 1) return days;

        const result: DayPlan[] = [];
        const processed = new Set<number>();

        for (let i = 0; i < days.length; i++) {
            if (processed.has(i)) continue;

            const currentDay = days[i];
            result.push(currentDay);
            processed.add(i);

            // If this day has an accommodation, look for other days with the same hotel
            if (currentDay.accommodation) {
                const hotelId = currentDay.accommodation.id;

                // Find all other unprocessed days with the same hotel
                for (let j = i + 1; j < days.length; j++) {
                    if (processed.has(j)) continue;

                    const otherDay = days[j];
                    if (otherDay.accommodation && otherDay.accommodation.id === hotelId) {
                        result.push(otherDay);
                        processed.add(j);
                        this.logger.debug(
                            `Grouped day ${otherDay.dayNumber} with day ${currentDay.dayNumber} (same hotel: ${currentDay.accommodation.name})`
                        );
                    }
                }
            }
        }

        return result;
    }

    /**
     * Reorders days to minimize travel distance between consecutive days
     * Uses a nearest neighbor approach based on day centroids
     */
    private regroupDaysByProximity(days: DayPlan[]): DayPlan[] {
        if (days.length <= 1) return days;

        // Calculate centroid for each day
        const dayCentroids = days.map(day => ({
            day,
            centroid: this.calculateDayCentroid(day)
        }));

        // Use nearest neighbor algorithm to order days
        const result: DayPlan[] = [];
        const remaining = [...dayCentroids];

        // Start with the first day
        result.push(remaining.shift()!.day);

        while (remaining.length > 0) {
            const lastDay = result[result.length - 1];
            const lastCentroid = this.calculateDayCentroid(lastDay);

            // Find nearest remaining day
            let minDist = Infinity;
            let nearestIndex = 0;

            for (let i = 0; i < remaining.length; i++) {
                const dist = GeoUtils.distance(
                    lastCentroid.latitude,
                    lastCentroid.longitude,
                    remaining[i].centroid.latitude,
                    remaining[i].centroid.longitude
                );

                if (dist < minDist) {
                    minDist = dist;
                    nearestIndex = i;
                }
            }

            const nextDay = remaining.splice(nearestIndex, 1)[0];
            result.push(nextDay.day);

            this.logger.debug(
                `Day ${nextDay.day.dayNumber} follows day ${lastDay.dayNumber} (distance: ${minDist.toFixed(1)}km)`
            );
        }

        return result;
    }

    /**
     * Calculate the geographic centroid of all activities in a day
     */
    private calculateDayCentroid(day: DayPlan): { latitude: number; longitude: number } {
        if (day.activities.length === 0) {
            // If no activities, use accommodation location if available
            if (day.accommodation) {
                return {
                    latitude: Number(day.accommodation.latitude),
                    longitude: Number(day.accommodation.longitude)
                };
            }
            // Fallback to 0,0 (should not happen in practice)
            return { latitude: 0, longitude: 0 };
        }

        const activities = day.activities.map(a => a.suggestion);
        return GeoUtils.getCentroid(activities);
    }
}
