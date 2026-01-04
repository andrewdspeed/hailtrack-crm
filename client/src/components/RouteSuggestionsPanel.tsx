import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Route, MapPin, Clock, AlertTriangle, Navigation, X } from "lucide-react";
import type { SuggestedRoute } from "@/lib/routeSuggestions";

interface RouteSuggestionsPanelProps {
  suggestions: SuggestedRoute[];
  selectedRoute: SuggestedRoute | null;
  onSelectRoute: (route: SuggestedRoute) => void;
  onClearRoute: () => void;
  onStartNavigation?: (route: SuggestedRoute) => void;
}

export function RouteSuggestionsPanel({
  suggestions,
  selectedRoute,
  onSelectRoute,
  onClearRoute,
  onStartNavigation,
}: RouteSuggestionsPanelProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Route Suggestions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Suggested Routes
            <Badge variant="secondary" className="ml-auto">
              {suggestions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((route) => (
            <div
              key={route.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedRoute?.id === route.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary hover:shadow-sm"
              }`}
              onClick={() => onSelectRoute(route)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{route.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {route.leads.length} stops • {route.potentialLeads} potential leads
                  </p>
                </div>
                <Badge
                  variant={route.priority >= 8 ? "default" : "secondary"}
                  className="ml-2"
                >
                  P{route.priority}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{route.totalDistance.toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{route.estimatedTime} min</span>
                </div>
              </div>

              {route.hailZones.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-orange-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{route.hailZones.length} hail damage zones</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Selected Route Details */}
      {selectedRoute && (
        <Card className="border-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{selectedRoute.name}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClearRoute}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Route Summary */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted rounded-lg text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold">{selectedRoute.leads.length}</p>
                <p className="text-xs text-muted-foreground">Stops</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {selectedRoute.totalDistance.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">km</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{selectedRoute.estimatedTime}</p>
                <p className="text-xs text-muted-foreground">min</p>
              </div>
            </div>

            {/* Stop List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <p className="text-sm font-medium mb-2">Route Stops</p>
              {selectedRoute.leads.map((lead, index) => (
                <div
                  key={lead.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.address}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {lead.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {onStartNavigation && (
              <Button
                className="w-full gap-2"
                onClick={() => onStartNavigation(selectedRoute)}
              >
                <Navigation className="w-4 h-4" />
                Start Navigation
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
