import { Injectable, Logger } from '@nestjs/common';
import { Suggestion } from '../suggestions/entities/suggestion.entity';
import { GeoUtils } from './utils/geo.utils';

@Injectable()
export class ClusteringService {
    private readonly logger = new Logger(ClusteringService.name);

    /**
     * Distance-based clustering (Simple Threshold)
     * Groups activities that are within a certain distance of each other.
     * Better than K-means for travel because it naturally separates cities (Tokyo vs Osaka)
     * regardless of the number of activities.
     */
    clusterByLocation(activities: Suggestion[], k: number): Suggestion[][] {
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
                const dist = GeoUtils.distance(
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

        this.logger.log(`=== DISTANCE CLUSTERING: Created ${clusters.length} clusters (Threshold: ${thresholdKm}km) ===`);
        if (clusters.length > 0) {
            clusters.forEach((cluster, idx) => {
                this.logger.debug(`  Cluster ${idx + 1}: ${cluster.length} items - ${cluster.map(a => a.name).join(', ')}`);
            });
        }

        return clusters;
    }
}
