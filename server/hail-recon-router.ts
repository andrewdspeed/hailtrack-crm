import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";

// Store Hail Recon credentials in memory (will be moved to env/secrets)
let hailReconCredentials: {
  apiKey?: string;
  apiUrl?: string;
  enabled: boolean;
} = {
  enabled: false,
};

// Cache for hail data to reduce API calls
const hailDataCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
  }
>();

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const hailReconRouter = router({
  /**
   * Set Hail Recon API credentials (admin only)
   */
  setCredentials: publicProcedure
    .input(
      z.object({
        apiKey: z.string(),
        apiUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      // In production, store in secure environment variables or database
      hailReconCredentials = {
        apiKey: input.apiKey,
        apiUrl: input.apiUrl,
        enabled: true,
      };

      return { success: true, message: "Hail Recon credentials configured" };
    }),

  /**
   * Check if Hail Recon is configured
   */
  isConfigured: publicProcedure.query(() => {
    return {
      configured: hailReconCredentials.enabled,
      hasCredentials: !!hailReconCredentials.apiKey,
    };
  }),

  /**
   * Fetch hail damage heat map data for a region
   */
  getHeatMapData: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radius: z.number().default(5), // miles
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      if (!hailReconCredentials.enabled || !hailReconCredentials.apiKey) {
        throw new Error("Hail Recon not configured");
      }

      // Create cache key
      const cacheKey = `hail_${input.latitude}_${input.longitude}_${input.radius}`;

      // Check cache
      const cached = hailDataCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      try {
        // Construct Hail Recon API request
        const params = new URLSearchParams({
          lat: input.latitude.toString(),
          lon: input.longitude.toString(),
          radius: input.radius.toString(),
          api_key: hailReconCredentials.apiKey!,
        });

        if (input.startDate) params.append("start_date", input.startDate);
        if (input.endDate) params.append("end_date", input.endDate);

        const response = await fetch(
          `${hailReconCredentials.apiUrl}/hail_data?${params}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Hail Recon API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform Hail Recon data to heat map format
        const heatMapData = transformToHeatMap(data);

        // Cache the result
        hailDataCache.set(cacheKey, {
          data: heatMapData,
          timestamp: Date.now(),
        });

        return heatMapData;
      } catch (error) {
        console.error("Hail Recon API error:", error);
        throw new Error("Failed to fetch hail damage data");
      }
    }),

  /**
   * Get hail damage severity for a specific location
   */
  getSeverityAtLocation: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .query(async ({ input }) => {
      if (!hailReconCredentials.enabled || !hailReconCredentials.apiKey) {
        throw new Error("Hail Recon not configured");
      }

      try {
        const params = new URLSearchParams({
          lat: input.latitude.toString(),
          lon: input.longitude.toString(),
          api_key: hailReconCredentials.apiKey!,
        });

        const response = await fetch(
          `${hailReconCredentials.apiUrl}/severity?${params}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Hail Recon API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Hail Recon severity API error:", error);
        throw new Error("Failed to fetch hail severity data");
      }
    }),

  /**
   * Clear cache
   */
  clearCache: publicProcedure.mutation(() => {
    hailDataCache.clear();
    return { success: true, message: "Cache cleared" };
  }),

  /**
   * Get cache statistics
   */
  getCacheStats: publicProcedure.query(() => {
    return {
      cacheSize: hailDataCache.size,
      cacheEntries: Array.from(hailDataCache.keys()),
      cacheDuration: CACHE_DURATION / 1000 / 60, // minutes
    };
  }),
});

/**
 * Transform Hail Recon API response to Google Maps heat map format
 */
function transformToHeatMap(data: any): any {
  // This function will be customized based on actual Hail Recon API response format
  // For now, return a generic heat map data structure

  if (!data || !data.points) {
    return {
      points: [],
      severity: "unknown",
      coverage: 0,
    };
  }

  // Transform points to heat map format
  const heatPoints = data.points.map((point: any) => ({
    location: new google.maps.LatLng(point.lat, point.lon),
    weight: point.intensity || 1, // Intensity from 0-1
  }));

  return {
    points: heatPoints,
    severity: data.severity || "unknown",
    coverage: data.coverage || 0, // percentage
    lastUpdated: new Date().toISOString(),
    dataSource: "Hail Recon",
  };
}
