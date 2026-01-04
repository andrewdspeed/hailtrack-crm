/**
 * Route Suggestion Engine
 * Combines Hail Recon damage data with existing leads to suggest optimal routes
 */

export interface Location {
  lat: number;
  lng: number;
}

export interface Lead {
  id: string;
  name: string;
  address: string;
  location: Location;
  status: string;
  canvassed?: boolean;
}

export interface HailDamageZone {
  id: string;
  center: Location;
  severity: "low" | "medium" | "high";
  radius: number; // in meters
  timestamp: Date;
}

export interface SuggestedRoute {
  id: string;
  name: string;
  leads: Lead[];
  hailZones: HailDamageZone[];
  totalDistance: number;
  estimatedTime: number; // in minutes
  priority: number; // 1-10, higher = more important
  potentialLeads: number; // estimated new leads in the route
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((point1.lat * Math.PI) / 180) *
      Math.cos((point2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

/**
 * Check if a point is within a hail damage zone
 */
export function isInHailZone(point: Location, zone: HailDamageZone): boolean {
  const distance = calculateDistance(point, zone.center);
  return distance <= zone.radius / 1000; // convert radius to km
}

/**
 * Nearest neighbor algorithm for route optimization
 * Starts from current location and visits nearest unvisited lead
 */
export function optimizeRoute(
  currentLocation: Location,
  leads: Lead[],
  hailZones: HailDamageZone[]
): Lead[] {
  const unvisited = [...leads];
  const route: Lead[] = [];
  let current = currentLocation;

  while (unvisited.length > 0) {
    // Find nearest unvisited lead
    let nearestIdx = 0;
    let minDistance = calculateDistance(current, unvisited[0].location);

    for (let i = 1; i < unvisited.length; i++) {
      const distance = calculateDistance(current, unvisited[i].location);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIdx = i;
      }
    }

    // Add nearest lead to route
    const nearest = unvisited.splice(nearestIdx, 1)[0];
    route.push(nearest);
    current = nearest.location;
  }

  return route;
}

/**
 * Generate route suggestions based on hail damage zones and existing leads
 */
export function generateRouteSuggestions(
  currentLocation: Location,
  leads: Lead[],
  hailZones: HailDamageZone[]
): SuggestedRoute[] {
  const suggestions: SuggestedRoute[] = [];

  // Group hail zones by severity
  const highSeverityZones = hailZones.filter((z) => z.severity === "high");
  const mediumSeverityZones = hailZones.filter((z) => z.severity === "medium");

  // Strategy 1: Focus on high-severity hail zones
  if (highSeverityZones.length > 0) {
    const leadsInHighZones = leads.filter((lead) =>
      highSeverityZones.some((zone) => isInHailZone(lead.location, zone))
    );

    const uncanvasedLeads = leadsInHighZones.filter((l) => !l.canvassed);
    if (uncanvasedLeads.length > 0) {
      const optimized = optimizeRoute(currentLocation, uncanvasedLeads, highSeverityZones);
      const totalDistance = calculateRouteTotalDistance([currentLocation, ...optimized.map((l) => l.location)]);

      suggestions.push({
        id: `high-severity-${Date.now()}`,
        name: "High Priority - Severe Damage Zones",
        leads: optimized,
        hailZones: highSeverityZones,
        totalDistance,
        estimatedTime: Math.round(totalDistance * 3 + optimized.length * 15), // 3 min/km + 15 min per stop
        priority: 10,
        potentialLeads: uncanvasedLeads.length,
      });
    }
  }

  // Strategy 2: Focus on medium-severity zones
  if (mediumSeverityZones.length > 0) {
    const leadsInMediumZones = leads.filter((lead) =>
      mediumSeverityZones.some((zone) => isInHailZone(lead.location, zone))
    );

    const uncanvasedLeads = leadsInMediumZones.filter((l) => !l.canvassed);
    if (uncanvasedLeads.length > 0) {
      const optimized = optimizeRoute(currentLocation, uncanvasedLeads, mediumSeverityZones);
      const totalDistance = calculateRouteTotalDistance([currentLocation, ...optimized.map((l) => l.location)]);

      suggestions.push({
        id: `medium-severity-${Date.now()}`,
        name: "Medium Priority - Moderate Damage Zones",
        leads: optimized,
        hailZones: mediumSeverityZones,
        totalDistance,
        estimatedTime: Math.round(totalDistance * 3 + optimized.length * 15),
        priority: 7,
        potentialLeads: uncanvasedLeads.length,
      });
    }
  }

  // Strategy 3: Nearby uncanvassed leads (within 5km)
  const nearbyLeads = leads.filter((lead) => {
    const distance = calculateDistance(currentLocation, lead.location);
    return distance <= 5 && !lead.canvassed;
  });

  if (nearbyLeads.length > 0) {
    const optimized = optimizeRoute(currentLocation, nearbyLeads, hailZones);
    const totalDistance = calculateRouteTotalDistance([currentLocation, ...optimized.map((l) => l.location)]);

    suggestions.push({
      id: `nearby-${Date.now()}`,
      name: "Nearby Uncanvassed Leads",
      leads: optimized,
      hailZones: [],
      totalDistance,
      estimatedTime: Math.round(totalDistance * 3 + optimized.length * 15),
      priority: 5,
      potentialLeads: nearbyLeads.length,
    });
  }

  // Sort by priority (descending)
  return suggestions.sort((a, b) => b.priority - a.priority);
}

/**
 * Calculate total distance for a route
 */
function calculateRouteTotalDistance(locations: Location[]): number {
  let total = 0;
  for (let i = 0; i < locations.length - 1; i++) {
    total += calculateDistance(locations[i], locations[i + 1]);
  }
  return total;
}

/**
 * Get polygon coordinates for a circular hail zone
 */
export function getZonePolygonCoordinates(
  center: Location,
  radiusKm: number,
  points: number = 32
): Location[] {
  const coordinates: Location[] = [];
  const latChange = radiusKm / 111; // 1 degree latitude ≈ 111 km

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * (2 * Math.PI);
    const lngChange = (radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180))) * Math.cos(angle);

    coordinates.push({
      lat: center.lat + latChange * Math.sin(angle),
      lng: center.lng + lngChange,
    });
  }

  return coordinates;
}
