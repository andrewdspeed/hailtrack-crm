import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface HeatMapLayerProps {
  map: google.maps.Map | null;
  latitude: number;
  longitude: number;
  radius?: number;
  enabled: boolean;
  onDataLoaded?: (data: any) => void;
}

export function HeatMapLayer({
  map,
  latitude,
  longitude,
  radius = 5,
  enabled,
  onDataLoaded,
}: HeatMapLayerProps) {
  const [heatMapLayer, setHeatMapLayer] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch hail damage data
  const { data: heatMapData, isLoading: isDataLoading } = useQuery({
    queryKey: ["hailRecon.getHeatMapData", latitude, longitude, radius],
    queryFn: () =>
      trpc.hailRecon.getHeatMapData.query({
        latitude,
        longitude,
        radius,
      }),
    enabled: enabled,
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
    retry: 1,
  });

  // Create and update heat map layer
  useEffect(() => {
    if (!map || !enabled || !heatMapData) return;

    setIsLoading(true);

    try {
      // Load visualization library if not already loaded
      if (!window.google?.maps?.visualization) {
        const script = document.createElement("script");
        script.src =
          "https://maps.googleapis.com/maps/api/js?libraries=visualization";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
          createHeatMap();
        };
      } else {
        createHeatMap();
      }

      function createHeatMap() {
        // Remove existing heat map layer
        if (heatMapLayer) {
          heatMapLayer.setMap(null);
        }

        // Create new heat map layer
        const newHeatMapLayer = new google.maps.visualization.HeatmapLayer({
          data: heatMapData.points || [],
          map: map,
          radius: 30, // pixels
          opacity: 0.6,
          maxIntensity: 100,
          dissipating: true,
        });

        setHeatMapLayer(newHeatMapLayer);

        // Call callback
        if (onDataLoaded) {
          onDataLoaded(heatMapData);
        }

        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error creating heat map layer:", error);
      toast.error("Failed to load hail damage heat map");
      setIsLoading(false);
    }

    return () => {
      // Cleanup
      if (heatMapLayer) {
        heatMapLayer.setMap(null);
      }
    };
  }, [map, enabled, heatMapData]);

  // Toggle heat map visibility
  useEffect(() => {
    if (heatMapLayer) {
      heatMapLayer.setMap(enabled ? map : null);
    }
  }, [enabled, heatMapLayer, map]);

  return null; // This component doesn't render anything, just manages the heat map layer
}

/**
 * Hook to manage heat map layer state
 */
export function useHeatMapLayer(map: google.maps.Map | null) {
  const [heatMapEnabled, setHeatMapEnabled] = useState(false);
  const [heatMapData, setHeatMapData] = useState<any>(null);

  // Check if Hail Recon is configured
  const { data: configStatus } = useQuery({
    queryKey: ["hailRecon.isConfigured"],
    queryFn: () => trpc.hailRecon.isConfigured.query(),
  });

  const handleToggleHeatMap = () => {
    if (!configStatus?.configured) {
      toast.error("Hail Recon not configured. Please add API credentials.");
      return;
    }
    setHeatMapEnabled(!heatMapEnabled);
  };

  return {
    heatMapEnabled,
    heatMapData,
    setHeatMapData,
    handleToggleHeatMap,
    isConfigured: configStatus?.configured || false,
  };
}
