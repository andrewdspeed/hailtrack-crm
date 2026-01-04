import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  activeRoutes,
  routeStops,
  routeHistory,
  agentLocations,
  territories,
  type InsertActiveRoute,
  type InsertRouteStop,
  type InsertRouteHistory,
  type InsertAgentLocation,
  type InsertTerritory,
} from "../../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export const routesRouter = router({
  // ===== ACTIVE ROUTES =====
  
  /**
   * Create a new active route
   */
  createRoute: publicProcedure
    .input(
      z.object({
        agentId: z.number(),
        agentName: z.string(),
        routeName: z.string(),
        routeType: z.string().optional(),
        priority: z.number().default(5),
        totalStops: z.number(),
        totalDistance: z.number().optional(),
        estimatedTime: z.number().optional(),
        territoryId: z.number().optional(),
        stops: z.array(
          z.object({
            leadId: z.number(),
            stopOrder: z.number(),
            latitude: z.string(),
            longitude: z.string(),
            address: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Create active route
        const [route] = await db.insert(activeRoutes).values({
          agentId: input.agentId,
          agentName: input.agentName,
          routeName: input.routeName,
          routeType: input.routeType,
          priority: input.priority,
          totalStops: input.totalStops,
          totalDistance: input.totalDistance?.toString(),
          estimatedTime: input.estimatedTime,
          territoryId: input.territoryId,
          status: "active",
        });

        const routeId = route.insertId;

        // Create route stops
        if (input.stops.length > 0) {
          await db.insert(routeStops).values(
            input.stops.map((stop) => ({
              routeId: Number(routeId),
              leadId: stop.leadId,
              stopOrder: stop.stopOrder,
              latitude: stop.latitude,
              longitude: stop.longitude,
              address: stop.address,
              status: "pending" as const,
            }))
          );
        }

        return { routeId, success: true };
      } catch (error) {
        console.error("[Routes] Failed to create route:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create route" });
      }
    }),

  /**
   * Get all active routes
   */
  getActiveRoutes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const routes = await db
        .select()
        .from(activeRoutes)
        .where(eq(activeRoutes.status, "active"));

      return routes;
    } catch (error) {
      console.error("[Routes] Failed to get active routes:", error);
      return [];
    }
  }),

  /**
   * Get route details with stops
   */
  getRouteDetails: publicProcedure
    .input(z.object({ routeId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      try {
        const [route] = await db
          .select()
          .from(activeRoutes)
          .where(eq(activeRoutes.id, input.routeId));

        if (!route) return null;

        const stops = await db
          .select()
          .from(routeStops)
          .where(eq(routeStops.routeId, input.routeId))
          .orderBy(routeStops.stopOrder);

        return { route, stops };
      } catch (error) {
        console.error("[Routes] Failed to get route details:", error);
        return null;
      }
    }),

  /**
   * Update route status
   */
  updateRouteStatus: publicProcedure
    .input(
      z.object({
        routeId: z.number(),
        status: z.enum(["active", "paused", "completed", "cancelled"]),
        completedAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        await db
          .update(activeRoutes)
          .set({
            status: input.status,
            completedAt: input.completedAt,
          })
          .where(eq(activeRoutes.id, input.routeId));

        return { success: true };
      } catch (error) {
        console.error("[Routes] Failed to update route status:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update route status" });
      }
    }),

  /**
   * Update stop status
   */
  updateStopStatus: publicProcedure
    .input(
      z.object({
        stopId: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "skipped"]),
        outcome: z.enum(["converted", "follow_up", "not_interested", "no_answer"]).optional(),
        notes: z.string().optional(),
        actualArrival: z.date().optional(),
        departureTime: z.date().optional(),
        timeSpent: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        await db
          .update(routeStops)
          .set({
            status: input.status,
            outcome: input.outcome,
            notes: input.notes,
            actualArrival: input.actualArrival,
            departureTime: input.departureTime,
            timeSpent: input.timeSpent,
          })
          .where(eq(routeStops.id, input.stopId));

        return { success: true };
      } catch (error) {
        console.error("[Routes] Failed to update stop status:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update stop status" });
      }
    }),

  // ===== AGENT LOCATIONS =====

  /**
   * Update agent location
   */
  updateAgentLocation: publicProcedure
    .input(
      z.object({
        agentId: z.number(),
        agentName: z.string(),
        latitude: z.string(),
        longitude: z.string(),
        accuracy: z.number().optional(),
        activeRouteId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Set expiry to 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.insert(agentLocations).values({
          agentId: input.agentId,
          agentName: input.agentName,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy?.toString(),
          isActive: true,
          activeRouteId: input.activeRouteId,
          expiresAt,
        });

        // Update active route's current location if provided
        if (input.activeRouteId) {
          await db
            .update(activeRoutes)
            .set({
              currentLatitude: input.latitude,
              currentLongitude: input.longitude,
              lastLocationUpdate: new Date(),
            })
            .where(eq(activeRoutes.id, input.activeRouteId));
        }

        return { success: true };
      } catch (error) {
        console.error("[Routes] Failed to update agent location:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update agent location" });
      }
    }),

  /**
   * Get active agent locations (not expired)
   */
  getActiveAgentLocations: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const now = new Date();
      const locations = await db
        .select()
        .from(agentLocations)
        .where(
          and(
            eq(agentLocations.isActive, true),
            gte(agentLocations.expiresAt, now)
          )
        )
        .orderBy(sql`${agentLocations.timestamp} DESC`);

      // Group by agent ID and return only the latest location for each agent
      const latestLocations = new Map();
      locations.forEach((loc) => {
        if (!latestLocations.has(loc.agentId)) {
          latestLocations.set(loc.agentId, loc);
        }
      });

      return Array.from(latestLocations.values());
    } catch (error) {
      console.error("[Routes] Failed to get agent locations:", error);
      return [];
    }
  }),

  // ===== ROUTE HISTORY =====

  /**
   * Complete a route and save to history
   */
  completeRoute: publicProcedure
    .input(
      z.object({
        routeId: z.number(),
        actualDistance: z.number().optional(),
        actualTime: z.number().optional(),
        conversions: z.number().default(0),
        followUps: z.number().default(0),
        notInterested: z.number().default(0),
        noAnswers: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Get route details
        const [route] = await db
          .select()
          .from(activeRoutes)
          .where(eq(activeRoutes.id, input.routeId));

        if (!route) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Route not found" });
        }

        // Get stops to count completed/skipped
        const stops = await db
          .select()
          .from(routeStops)
          .where(eq(routeStops.routeId, input.routeId));

        const completedStops = stops.filter((s) => s.status === "completed").length;
        const skippedStops = stops.filter((s) => s.status === "skipped").length;

        // Calculate conversion rate
        const totalOutcomes = input.conversions + input.followUps + input.notInterested + input.noAnswers;
        const conversionRate = totalOutcomes > 0 ? (input.conversions / totalOutcomes) * 100 : 0;

        // Calculate duration
        const duration = input.actualTime || 0;

        // Save to history
        await db.insert(routeHistory).values({
          agentId: route.agentId,
          agentName: route.agentName,
          routeName: route.routeName,
          routeType: route.routeType,
          priority: route.priority,
          totalStops: route.totalStops,
          completedStops,
          skippedStops,
          plannedDistance: route.totalDistance,
          actualDistance: input.actualDistance?.toString(),
          estimatedTime: route.estimatedTime,
          actualTime: input.actualTime,
          conversions: input.conversions,
          followUps: input.followUps,
          notInterested: input.notInterested,
          noAnswers: input.noAnswers,
          conversionRate: conversionRate.toString(),
          territoryId: route.territoryId,
          startedAt: route.startedAt,
          completedAt: new Date(),
          duration,
        });

        // Update active route status
        await db
          .update(activeRoutes)
          .set({
            status: "completed",
            completedAt: new Date(),
            completedStops,
          })
          .where(eq(activeRoutes.id, input.routeId));

        return { success: true };
      } catch (error) {
        console.error("[Routes] Failed to complete route:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to complete route" });
      }
    }),

  /**
   * Get route history with analytics
   */
  getRouteHistory: publicProcedure
    .input(
      z.object({
        agentId: z.number().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        let query = db.select().from(routeHistory);

        if (input.agentId) {
          query = query.where(eq(routeHistory.agentId, input.agentId)) as any;
        }

        const history = await query
          .orderBy(sql`${routeHistory.completedAt} DESC`)
          .limit(input.limit);

        return history;
      } catch (error) {
        console.error("[Routes] Failed to get route history:", error);
        return [];
      }
    }),

  // ===== TERRITORIES =====

  /**
   * Create territory
   */
  createTerritory: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        color: z.string().optional(),
        boundaryCoordinates: z.string(), // JSON string
        assignedAgentId: z.number().optional(),
        assignedAgentName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        const [territory] = await db.insert(territories).values(input);
        return { territoryId: territory.insertId, success: true };
      } catch (error) {
        console.error("[Routes] Failed to create territory:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create territory" });
      }
    }),

  /**
   * Get all territories
   */
  getTerritories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    try {
      const territoryList = await db
        .select()
        .from(territories)
        .where(eq(territories.isActive, true));

      return territoryList;
    } catch (error) {
      console.error("[Routes] Failed to get territories:", error);
      return [];
    }
  }),
});
