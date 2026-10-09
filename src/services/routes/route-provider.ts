/**
 * Routing Provider Abstraction
 * Supports polyline coordinates and detour calculation without exposing server keys.
 */

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteNavigationResult {
  coordinates: Coordinate[];
  distanceKm: number;
  durationMinutes: number;
  provider: 'GEOMETRIC' | 'GOOGLE_ROUTES';
}

export interface RouteProvider {
  calculateRoute(
    origin: Coordinate,
    destination: Coordinate,
    waypoints?: Coordinate[]
  ): Promise<RouteNavigationResult>;

  estimateDetourTime(
    origin: Coordinate,
    destination: Coordinate,
    pickupPoint: Coordinate,
    communityDestination?: Coordinate
  ): Promise<{ detourMinutes: number; detourDistanceKm: number; isExact: boolean }>;
}

/**
 * Geometric / Client-side fallback provider
 * Used when no backend Google Routes API proxy is configured.
 * Generates direct or waypoint-interpolated polyline points and geometric detour metrics.
 */
export class GeometricRouteProvider implements RouteProvider {
  async calculateRoute(
    origin: Coordinate,
    destination: Coordinate,
    waypoints: Coordinate[] = []
  ): Promise<RouteNavigationResult> {
    const coords: Coordinate[] = [origin, ...waypoints, destination];
    
    // Estimate total distance
    let totalDistKm = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const dLat = (p2.latitude - p1.latitude) * 111.32;
      const dLon = (p2.longitude - p1.longitude) * 111.32 * Math.cos(((p1.latitude + p2.latitude) / 2) * (Math.PI / 180));
      totalDistKm += Math.sqrt(dLat * dLat + dLon * dLon);
    }

    const durationMinutes = Math.round((totalDistKm / 30) * 60);

    return {
      coordinates: coords,
      distanceKm: Number(totalDistKm.toFixed(1)),
      durationMinutes,
      provider: 'GEOMETRIC',
    };
  }

  async estimateDetourTime(
    origin: Coordinate,
    destination: Coordinate,
    pickupPoint: Coordinate,
    communityDestination?: Coordinate
  ): Promise<{ detourMinutes: number; detourDistanceKm: number; isExact: boolean }> {
    // Base direct distance
    const baseDirectKm = this.getEuclideanKm(origin, destination);

    let detourKm = 0;
    if (communityDestination) {
      // Origin -> Pickup -> Community Point -> Destination
      const leg1 = this.getEuclideanKm(origin, pickupPoint);
      const leg2 = this.getEuclideanKm(pickupPoint, communityDestination);
      const leg3 = this.getEuclideanKm(communityDestination, destination);
      detourKm = Math.max(0, leg1 + leg2 + leg3 - baseDirectKm);
    } else {
      // Origin -> Pickup -> Destination
      const leg1 = this.getEuclideanKm(origin, pickupPoint);
      const leg2 = this.getEuclideanKm(pickupPoint, destination);
      detourKm = Math.max(0, leg1 + leg2 - baseDirectKm);
    }

    // Urban estimate: 30 km/h avg speed + 4 min pickup buffer
    const detourMinutes = Math.round((detourKm / 30) * 60 + 4);

    return {
      detourMinutes,
      detourDistanceKm: Number(detourKm.toFixed(1)),
      isExact: false,
    };
  }

  private getEuclideanKm(p1: Coordinate, p2: Coordinate): number {
    const dLat = (p2.latitude - p1.latitude) * 111.32;
    const dLon = (p2.longitude - p1.longitude) * 111.32 * Math.cos(((p1.latitude + p2.latitude) / 2) * (Math.PI / 180));
    return Math.sqrt(dLat * dLat + dLon * dLon);
  }
}

// Global active route provider instance
export const activeRouteProvider: RouteProvider = new GeometricRouteProvider();
