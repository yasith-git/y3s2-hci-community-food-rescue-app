/**
 * Geospatial Calculation Utilities
 * Haversine distances, corridor projections, and bounding boxes.
 */

import { GeoPointData } from '../../types/route';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the great-circle distance between two coordinates using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) *
      Math.cos(degreesToRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the minimum perpendicular distance from a target point to a straight-line route segment (origin -> destination).
 * Also handles projection clamping if the point is beyond segment endpoints.
 */
export function distancePointToRouteSegment(
  point: { latitude: number; longitude: number },
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): { perpendicularDistanceKm: number; isWithinSegmentBounds: boolean; totalDetourDistanceKm: number } {
  // Convert lat/lon degrees to approximate flat local cartesian coordinates (km)
  const avgLatRad = degreesToRadians((origin.latitude + destination.latitude) / 2);
  const kmPerDegLat = 111.32;
  const kmPerDegLon = 111.32 * Math.cos(avgLatRad);

  const pX = (point.longitude - origin.longitude) * kmPerDegLon;
  const pY = (point.latitude - origin.latitude) * kmPerDegLat;

  const dX = (destination.longitude - origin.longitude) * kmPerDegLon;
  const dY = (destination.latitude - origin.latitude) * kmPerDegLat;

  const segmentLengthSq = dX * dX + dY * dY;
  const directRouteDistKm = Math.sqrt(segmentLengthSq);

  if (segmentLengthSq === 0) {
    const direct = calculateDistanceKm(point.latitude, point.longitude, origin.latitude, origin.longitude);
    return {
      perpendicularDistanceKm: direct,
      isWithinSegmentBounds: true,
      totalDetourDistanceKm: direct * 2,
    };
  }

  // Projection parameter t of point P onto line OD: t = (P . D) / |D|^2
  const t = Math.max(0, Math.min(1, (pX * dX + pY * dY) / segmentLengthSq));

  const projX = t * dX;
  const projY = t * dY;

  const perpDistKm = Math.sqrt((pX - projX) * (pX - projX) + (pY - projY) * (pY - projY));

  // Calculate actual detour distance: (dist(Origin, Point) + dist(Point, Destination)) - dist(Origin, Destination)
  const distOriginToPoint = calculateDistanceKm(origin.latitude, origin.longitude, point.latitude, point.longitude);
  const distPointToDest = calculateDistanceKm(point.latitude, point.longitude, destination.latitude, destination.longitude);
  const totalDetourDistKm = Math.max(0, distOriginToPoint + distPointToDest - directRouteDistKm);

  return {
    perpendicularDistanceKm: perpDistKm,
    isWithinSegmentBounds: t > 0.02 && t < 0.98,
    totalDetourDistanceKm: totalDetourDistKm,
  };
}

/**
 * Estimates additional travel time (in minutes) from extra detour distance based on transport mode.
 * Default urban driving average: ~30 km/h (0.5 km/min), accounting for traffic and stops (+3 min handling).
 */
export function estimateDetourMinutesFromDistance(
  detourDistanceKm: number,
  transportMode: 'DRIVING' | 'BICYCLE' | 'WALKING' = 'DRIVING'
): number {
  let avgSpeedKmh = 30; // Driving default in urban / suburban areas
  let baselineHandlingMinutes = 4; // Buffer for parking, deceleration, pickup

  if (transportMode === 'BICYCLE') {
    avgSpeedKmh = 15;
    baselineHandlingMinutes = 2;
  } else if (transportMode === 'WALKING') {
    avgSpeedKmh = 5;
    baselineHandlingMinutes = 1;
  }

  const travelTimeMinutes = (detourDistanceKm / avgSpeedKmh) * 60;
  return Math.round(travelTimeMinutes + baselineHandlingMinutes);
}

/**
 * Checks if a point is within a geographic bounding box formed by origin & destination plus a margin (in km).
 */
export function isPointInCorridorBoundingBox(
  point: { latitude: number; longitude: number },
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  marginKm: number = 5
): boolean {
  const marginDeg = marginKm / 111; // ~111 km per latitude degree

  const minLat = Math.min(origin.latitude, destination.latitude) - marginDeg;
  const maxLat = Math.max(origin.latitude, destination.latitude) + marginDeg;
  const minLon = Math.min(origin.longitude, destination.longitude) - marginDeg;
  const maxLon = Math.max(origin.longitude, destination.longitude) + marginDeg;

  return (
    point.latitude >= minLat &&
    point.latitude <= maxLat &&
    point.longitude >= minLon &&
    point.longitude <= maxLon
  );
}
