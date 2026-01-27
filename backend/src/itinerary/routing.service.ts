import { Injectable, Logger } from '@nestjs/common';
import { Suggestion } from '../suggestions/entities/suggestion.entity';
import { GeoUtils } from './utils/geo.utils';

@Injectable()
export class RoutingService {
    private readonly logger = new Logger(RoutingService.name);

    /**
     * Nearest neighbor algorithm for intra-day optimization.
     * Sorts a list of activities to minimize travel distance.
     */
    nearestNeighbor(activities: Suggestion[]): Suggestion[] {
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
                const dist = GeoUtils.distance(
                    Number(current.latitude),
                    Number(current.longitude),
                    Number(remaining[i].latitude),
                    Number(remaining[i].longitude)
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
     * Finds the accommodation closest to the centroid of a cluster of activities.
     */
    findBestAccommodationForCluster(cluster: Suggestion[], accommodations: Suggestion[]): Suggestion | null {
        if (accommodations.length === 0) return null;
        if (cluster.length === 0) return accommodations[0]; // Should not happen, but safe fallback

        // Calculate centroid of the cluster
        const centroid = GeoUtils.getCentroid(cluster);

        // Find nearest hotel to centroid
        let bestHotel: Suggestion | null = null;
        let minDist = Infinity;

        for (const hotel of accommodations) {
            const dist = GeoUtils.distance(
                centroid.latitude,
                centroid.longitude,
                Number(hotel.latitude),
                Number(hotel.longitude)
            );

            if (dist < minDist) {
                minDist = dist;
                bestHotel = hotel;
            }
        }

        return bestHotel;
    }
}
