export class GeoUtils {
    /**
     * Calculate distance between two coordinates (Haversine formula) in km
     */
    static distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

    static toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    static getCentroid(points: { latitude: number | null; longitude: number | null }[]): { latitude: number; longitude: number } {
        const validPoints = points.filter(p => p.latitude !== null && p.longitude !== null);
        if (validPoints.length === 0) return { latitude: 0, longitude: 0 };

        let sumLat = 0, sumLng = 0;
        validPoints.forEach(p => {
            sumLat += Number(p.latitude);
            sumLng += Number(p.longitude);
        });

        return {
            latitude: sumLat / validPoints.length,
            longitude: sumLng / validPoints.length
        };
    }
}
