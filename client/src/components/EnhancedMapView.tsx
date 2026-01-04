import { useState, useEffect, useRef } from "react";
import { MapView as Map } from "@/components/Map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Route,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  generateRouteSuggestions,
  getZonePolygonCoordinates,
  calculateDistance,
  type SuggestedRoute,
  type Lead,
} from "@/lib/routeSuggestions";

export function EnhancedMapView() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Lead | null>(null);
  const [routeSuggestions, setRouteSuggestions] = useState<SuggestedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SuggestedRoute | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [canvasedZones, setCanvasedZones] = useState<google.maps.Polygon[]>([]);
  const [routePolylines, setRoutePolylines] = useState<google.maps.Polyline[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const { data: leads } = trpc.leads.list.useQuery();
  const { data: hailZones } = trpc.hailRecon.getHeatMapData.useQuery();

  // Initialize map
  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  // Add lead markers to map
  useEffect(() => {
    if (!map || !leads) return;

    leads.forEach((lead) => {
      if (!lead.location) return;

      const markerColor = lead.status === "completed" ? "#10b981" : "#3b82f6";
      const marker = new google.maps.Marker({
        position: lead.location,
        map,
        title: lead.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: markerColor,
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Click handler for marker
      marker.addListener("click", () => {
        setSelectedMarker(lead);

        // Create or update info window
        if (!infoWindowRef.current) {
          infoWindowRef.current = new google.maps.InfoWindow();
        }

        infoWindowRef.current.setContent(`
          <div style="padding: 12px; min-width: 250px;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${lead.name}</h3>
            <p style="margin: 4px 0; font-size: 12px;"><strong>Address:</strong> ${lead.address}</p>
            <p style="margin: 4px 0; font-size: 12px;"><strong>Status:</strong> ${lead.status}</p>
            ${lead.phone ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Phone:</strong> ${lead.phone}</p>` : ""}
            ${lead.email ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Email:</strong> ${lead.email}</p>` : ""}
            <div style="margin-top: 12px; display: flex; gap: 8px;">
              <button onclick="window.location.href='/leads/${lead.id}'" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                View Details
              </button>
            </div>
          </div>
        `);

        infoWindowRef.current.open(map, marker);
      });
    });
  }, [map, leads]);

  // Add canvassed zones as polygons
  useEffect(() => {
    if (!map || !leads) return;

    // Clear existing zones
    canvasedZones.forEach((zone) => zone.setMap(null));
    setCanvasedZones([]);

    // Group leads by canvassed status and create zones
    const canvasedLeads = leads.filter((l) => l.status === "completed" || l.canvassed);

    if (canvasedLeads.length > 0) {
      // Create a convex hull or simple buffer zones around canvassed leads
      canvasedLeads.forEach((lead) => {
        if (!lead.location) return;

        // Create a small circle around each canvassed lead
        const circle = new google.maps.Circle({
          center: lead.location,
          radius: 200, // 200 meters
          fillColor: "#10b981",
          fillOpacity: 0.15,
          strokeColor: "#059669",
          strokeWeight: 1,
          strokeOpacity: 0.5,
          map,
        });

        setCanvasedZones((prev) => [...prev, circle as any]);
      });
    }
  }, [map, leads]);

  // Generate route suggestions when position or leads change
  useEffect(() => {
    if (!currentPosition || !leads || !hailZones) return;

    const suggestions = generateRouteSuggestions(
      currentPosition,
      leads as any[],
      hailZones as any[]
    );

    setRouteSuggestions(suggestions);
  }, [currentPosition, leads, hailZones]);

  // Draw selected route on map
  useEffect(() => {
    if (!map || !selectedRoute) return;

    // Clear existing polylines
    routePolylines.forEach((line) => line.setMap(null));
    setRoutePolylines([]);

    if (selectedRoute.leads.length === 0) return;

    // Create polyline for the route
    const routePath = selectedRoute.leads.map((lead) => lead.location);

    const polyline = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: "#3b82f4",
      strokeOpacity: 0.7,
      strokeWeight: 3,
      map,
    });

    setRoutePolylines([polyline]);

    // Fit map bounds to show entire route
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach((point) => {
      bounds.extend(point);
    });
    map.fitBounds(bounds);
  }, [map, selectedRoute]);

  // Track current location
  useEffect(() => {
    if (!isTrackingLocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === 1) {
          setIsTrackingLocation(false);
          toast.error("Location access denied");
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTrackingLocation]);

  return (
    <div className="space-y-4">
      {/* Map */}
      <Card className="h-[500px]">
        <Map
          initialCenter={{ lat: 39.7392, lng: -104.9903 }} // Denver, CO
          initialZoom={13}
          onMapReady={handleMapReady}
        />
      </Card>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          onClick={() => setIsTrackingLocation(!isTrackingLocation)}
          variant={isTrackingLocation ? "default" : "outline"}
          className="gap-2"
        >
          <Navigation className="w-4 h-4" />
          {isTrackingLocation ? "Stop Tracking" : "Track Location"}
        </Button>
      </div>

      {/* Route Suggestions */}
      {routeSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Suggested Routes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routeSuggestions.map((route) => (
              <div
                key={route.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedRoute?.id === route.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary"
                }`}
                onClick={() => setSelectedRoute(route)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{route.name}</h4>
                    <p className="text-sm text-muted-foreground">{route.leads.length} stops</p>
                  </div>
                  <Badge variant={route.priority >= 8 ? "default" : "secondary"}>
                    Priority {route.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{route.totalDistance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{route.estimatedTime} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    <span>{route.potentialLeads} new leads</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Route Details */}
      {selectedRoute && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{selectedRoute.name}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRoute(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {selectedRoute.leads.map((lead, index) => (
                <div key={lead.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.address}</p>
                    <Badge variant="outline" className="mt-1">
                      {lead.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Distance:</span>
                <span className="font-semibold">{selectedRoute.totalDistance.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Time:</span>
                <span className="font-semibold">{selectedRoute.estimatedTime} minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Marker Info */}
      {selectedMarker && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{selectedMarker.name}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMarker(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p>{selectedMarker.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge>{selectedMarker.status}</Badge>
            </div>
            {selectedMarker.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{selectedMarker.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
