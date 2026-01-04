import { useState, useEffect } from "react";
import { MapView as Map } from "@/components/Map";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { MapPin, Plus, Navigation, HelpCircle, CheckCircle2, Layers } from "lucide-react";
import QuickStats from "@/components/QuickStats";
import { RouteSuggestionsPanel } from "@/components/RouteSuggestionsPanel";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  generateRouteSuggestions,
  type SuggestedRoute,
  type Lead as RouteLead,
} from "@/lib/routeSuggestions";

export default function MapView() {
  const [, setLocation] = useLocation();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLocationMarker, setCurrentLocationMarker] = useState<google.maps.Marker | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'off' | 'requesting' | 'active' | 'denied'>('off');
  const [showCanvassedZones, setShowCanvassedZones] = useState(true);
  const [canvassedZones, setCanvassedZones] = useState<google.maps.Circle[]>([]);
  const [routeSuggestions, setRouteSuggestions] = useState<SuggestedRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SuggestedRoute | null>(null);
  const [routePolyline, setRoutePolyline] = useState<google.maps.Polyline | null>(null);
  
  const { data: leads, isLoading } = trpc.leads.list.useQuery();
  const { data: hailZones } = trpc.hailRecon.getHeatMapData.useQuery();

  // Real-time GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    if (!isTrackingLocation) return;

    // Watch position for continuous updates
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(newPosition);
        setGpsStatus('active');

        // Update current location marker
        if (map) {
          if (currentLocationMarker) {
            currentLocationMarker.setPosition(newPosition);
          } else {
            // Create blue dot marker for current location
            const marker = new google.maps.Marker({
              position: newPosition,
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
              },
              zIndex: 1000, // Ensure it's on top
              title: "Your Location",
            });
            setCurrentLocationMarker(marker);
          }

          // Auto-center map on current location if tracking is enabled
          if (isTrackingLocation) {
            map.panTo(newPosition);
          }
        }
      },
      (error) => {
        console.warn("Geolocation error:", error.code, error.message);
        
        // Only stop tracking and show error for permission denied
        if (error.code === 1) { // PERMISSION_DENIED
          setIsTrackingLocation(false);
          setGpsStatus('denied');
          toast.error("Location access denied. Please enable location permissions in your browser.", { duration: 5000 });
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
          // Position unavailable - keep trying, don't stop tracking
          console.warn("Position temporarily unavailable, will retry...");
        } else if (error.code === 3) { // TIMEOUT
          // Timeout is normal, just retry on next interval
          console.warn("Location request timeout, will retry...");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    setWatchId(id);

    // Cleanup: stop watching position when component unmounts
    return () => {
      if (id !== null) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [map, isTrackingLocation]);

  // Initialize map and add markers
  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  // Add markers for all leads with enhanced geocaching
  useEffect(() => {
    if (!map || !leads) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Add new markers
    const newMarkers = leads
      .filter(lead => lead.latitude && lead.longitude)
      .map(lead => {
        // Determine if lead is contacted (has agent assigned)
        const isContacted = !!lead.agentId;
        const isCanvassed = lead.status === "complete" || lead.status === "awaiting_pickup";
        
        // Create custom marker icon based on contact status
        let markerIcon: google.maps.Symbol;
        let markerColor: string;
        
        if (isContacted) {
          // Contact pin - filled circle (assigned to agent)
          markerColor = getStatusColor(lead.status);
          markerIcon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: markerColor,
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          };
        } else {
          // Question mark pin - uncontacted lead
          markerColor = "#ef4444"; // Red for uncontacted
          markerIcon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: markerColor,
            fillOpacity: 0.7,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          };
        }
        
        const marker = new google.maps.Marker({
          position: {
            lat: parseFloat(lead.latitude!),
            lng: parseFloat(lead.longitude!),
          },
          map: map,
          title: lead.name || lead.address,
          icon: markerIcon,
          zIndex: isContacted ? 100 : 50, // Contact pins on top
        });

        // Enhanced info window with geocaching tags
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 240px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                ${isContacted 
                  ? '<div style="width: 20px; height: 20px; background: ' + markerColor + '; border-radius: 50%; border: 2px solid white;"></div>'
                  : '<div style="width: 20px; height: 20px; background: #ef4444; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">?</div>'
                }
                <h3 style="margin: 0; font-weight: 600; font-size: 14px;">${lead.name || "Unnamed Lead"}</h3>
              </div>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">${lead.address}</p>
              <p style="margin: 4px 0; font-size: 12px;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background: ${markerColor}20; color: ${markerColor}; font-weight: 500;">
                  ${formatStatus(lead.status)}
                </span>
              </p>
              ${isContacted 
                ? `<p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Agent:</strong> ${lead.agentName || 'Assigned'}</p>`
                : `<p style="margin: 4px 0; font-size: 12px; color: #ef4444;"><strong>Status:</strong> Uncontacted</p>`
              }
              ${lead.phone ? `<p style="margin: 4px 0; font-size: 12px; color: #666;"><strong>Phone:</strong> ${lead.phone}</p>` : ''}
              ${isCanvassed ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #10b981;"><strong>✓ Canvassed</strong></p>` : ''}
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">Geocached: ${new Date(lead.createdAt).toLocaleDateString()}</p>
              <button onclick="window.location.href='/leads/${lead.id}'" style="margin-top: 8px; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;">
                View Details
              </button>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        return marker;
      });

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      map.fitBounds(bounds);
    } else if (currentPosition) {
      map.setCenter(currentPosition);
      map.setZoom(13);
    }
  }, [map, leads, currentPosition]);

  // Add canvassed zones as polygons
  useEffect(() => {
    if (!map || !leads || !showCanvassedZones) {
      // Clear zones if hidden
      canvassedZones.forEach(zone => zone.setMap(null));
      setCanvassedZones([]);
      return;
    }

    // Clear existing zones
    canvassedZones.forEach(zone => zone.setMap(null));

    // Create zones around canvassed leads
    const canvassedLeads = leads.filter(l => 
      (l.status === "complete" || l.status === "awaiting_pickup") && 
      l.latitude && 
      l.longitude
    );

    const newZones = canvassedLeads.map(lead => {
      const circle = new google.maps.Circle({
        center: {
          lat: parseFloat(lead.latitude!),
          lng: parseFloat(lead.longitude!),
        },
        radius: 200, // 200 meters
        fillColor: "#10b981",
        fillOpacity: 0.15,
        strokeColor: "#059669",
        strokeWeight: 1,
        strokeOpacity: 0.5,
        map,
      });
      return circle;
    });

    setCanvassedZones(newZones);
  }, [map, leads, showCanvassedZones]);

  // Generate route suggestions
  useEffect(() => {
    if (!currentPosition || !leads || !hailZones) return;

    const leadsWithLocation = leads
      .filter(l => l.latitude && l.longitude)
      .map(l => ({
        id: l.id,
        name: l.name || "Unnamed Lead",
        address: l.address,
        location: { lat: parseFloat(l.latitude!), lng: parseFloat(l.longitude!) },
        status: l.status,
        canvassed: l.status === "complete" || l.status === "awaiting_pickup",
      })) as RouteLead[];

    const suggestions = generateRouteSuggestions(
      currentPosition,
      leadsWithLocation,
      hailZones as any[]
    );

    setRouteSuggestions(suggestions);
  }, [currentPosition, leads, hailZones]);

  // Draw selected route on map
  useEffect(() => {
    if (!map || !selectedRoute) {
      // Clear route polyline
      if (routePolyline) {
        routePolyline.setMap(null);
        setRoutePolyline(null);
      }
      return;
    }

    // Clear existing polyline
    if (routePolyline) {
      routePolyline.setMap(null);
    }

    if (selectedRoute.leads.length === 0) return;

    // Create polyline for the route
    const routePath = [
      currentPosition!,
      ...selectedRoute.leads.map(lead => lead.location),
    ];

    const polyline = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: "#3b82f6",
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map,
    });

    setRoutePolyline(polyline);

    // Fit map bounds to show entire route
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach(point => bounds.extend(point));
    map.fitBounds(bounds);
  }, [map, selectedRoute, currentPosition]);

  const handleNewLead = () => {
    if (currentPosition) {
      setLocation(`/leads/new?lat=${currentPosition.lat}&lng=${currentPosition.lng}`);
    } else {
      setLocation("/leads/new");
    }
  };

  const handleCenterOnMe = () => {
    if (map && currentPosition) {
      map.setCenter(currentPosition);
      map.setZoom(16);
      setIsTrackingLocation(true);
      toast.success("Tracking your location");
    } else {
      toast.error("Location not available");
    }
  };

  const handleToggleTracking = () => {
    if (!isTrackingLocation) {
      // Request permission first
      setGpsStatus('requesting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsStatus('active');
          setIsTrackingLocation(true);
          toast.success("Location tracking enabled");
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentPosition(pos);
          if (map) {
            map.panTo(pos);
            map.setZoom(16);
          }
        },
        (error) => {
          setGpsStatus('denied');
          if (error.code === 1) {
            toast.error("Location permission denied. Please enable location access in your browser settings.", { duration: 7000 });
          } else {
            toast.error("Unable to get your location. Please check your device settings.", { duration: 5000 });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsTrackingLocation(false);
      setGpsStatus('off');
      toast.info("Location tracking paused");
    }
  };

  const handleStartNavigation = (route: SuggestedRoute) => {
    if (route.leads.length === 0) return;
    
    // Open Google Maps with directions
    const origin = `${currentPosition!.lat},${currentPosition!.lng}`;
    const destination = `${route.leads[route.leads.length - 1].location.lat},${route.leads[route.leads.length - 1].location.lng}`;
    const waypoints = route.leads
      .slice(0, -1)
      .map(lead => `${lead.location.lat},${lead.location.lng}`)
      .join("|");
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, "_blank");
  };

  // Count contacted vs uncontacted leads
  const contactedCount = leads?.filter(l => !!l.agentId).length || 0;
  const uncontactedCount = (leads?.length || 0) - contactedCount;

  return (
    <AppLayout>
      <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
        {/* Left Panel - Map */}
        <div className="flex-1 flex flex-col min-h-[600px]">
          {/* Quick Stats Dashboard */}
          <div className="mb-4">
            <QuickStats />
          </div>

          {/* Action Bar */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Prospect Map</h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : `${leads?.length || 0} leads (${contactedCount} contacted, ${uncontactedCount} uncontacted)`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={showCanvassedZones ? "default" : "outline"}
                size="sm" 
                onClick={() => setShowCanvassedZones(!showCanvassedZones)}
              >
                <Layers className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Zones</span>
              </Button>
              <Button 
                variant={isTrackingLocation ? "default" : "outline"} 
                size="sm" 
                onClick={handleToggleTracking}
                disabled={gpsStatus === 'requesting'}
              >
                <Navigation className={`h-4 w-4 mr-2 ${gpsStatus === 'active' ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">
                  {gpsStatus === 'requesting' ? 'Requesting...' : isTrackingLocation ? 'Tracking' : 'Track Me'}
                </span>
                {gpsStatus === 'active' && <span className="ml-2 h-2 w-2 bg-green-500 rounded-full animate-pulse" />}
              </Button>
              <Button size="sm" onClick={handleNewLead}>
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative rounded-lg overflow-hidden border">
            <Map
              onMapReady={handleMapReady}
              initialCenter={currentPosition || { lat: 39.8283, lng: -98.5795 }} // Center of US
              initialZoom={currentPosition ? 13 : 4}
            />

            {/* Enhanced Legend with Geocaching Tags */}
            <Card className="absolute bottom-4 left-4 p-4 shadow-lg max-w-xs">
              <h3 className="text-sm font-semibold mb-3">Geocaching Tags</h3>
              
              {/* Pin Types */}
              <div className="mb-4 pb-4 border-b">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">PIN TYPES</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                    <span className="text-xs">Contact Pin (Assigned to Agent)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-white font-bold">?</span>
                    </div>
                    <span className="text-xs">Uncontacted Lead</span>
                  </div>
                  {showCanvassedZones && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 opacity-30" />
                      <span className="text-xs">Canvassed Zone</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Status */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">LEAD STATUS</h4>
                <div className="space-y-2">
                  {[
                    { status: "lead", label: "New Lead" },
                    { status: "scheduled", label: "Scheduled" },
                    { status: "in_shop", label: "In Shop" },
                    { status: "awaiting_pickup", label: "Awaiting Pickup" },
                    { status: "complete", label: "Complete" },
                  ].map(({ status, label }) => (
                    <div key={status} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getStatusColor(status) }}
                      />
                      <span className="text-xs">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Panel - Route Suggestions */}
        <div className="w-full lg:w-96 overflow-y-auto">
          <RouteSuggestionsPanel
            suggestions={routeSuggestions}
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
            onClearRoute={() => setSelectedRoute(null)}
            onStartNavigation={handleStartNavigation}
          />
        </div>
      </div>
    </AppLayout>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    lead: "#3b82f6", // blue
    scheduled: "#f59e0b", // amber
    in_shop: "#8b5cf6", // purple
    awaiting_pickup: "#10b981", // green
    complete: "#6b7280", // gray
  };
  return colors[status] || colors.lead;
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
