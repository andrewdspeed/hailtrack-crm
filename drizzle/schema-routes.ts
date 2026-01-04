import { mysqlTable, int, varchar, text, timestamp, decimal, mysqlEnum, boolean } from "drizzle-orm/mysql-core";

/**
 * ACTIVE ROUTES - Real-time tracking of agents' active routes
 */
export const activeRoutes = mysqlTable("active_routes", {
  id: int("id").autoincrement().primaryKey(),
  
  // Agent information
  agentId: int("agent_id").notNull(),
  agentName: varchar("agent_name", { length: 255 }).notNull(),
  
  // Route details
  routeName: varchar("route_name", { length: 255 }).notNull(),
  routeType: varchar("route_type", { length: 100 }), // "high_priority", "medium_priority", "nearby"
  priority: int("priority").default(5),
  
  // Route metrics
  totalStops: int("total_stops").notNull(),
  completedStops: int("completed_stops").default(0),
  totalDistance: decimal("total_distance", { precision: 10, scale: 2 }), // in km
  estimatedTime: int("estimated_time"), // in minutes
  
  // Current location
  currentLatitude: varchar("current_latitude", { length: 50 }),
  currentLongitude: varchar("current_longitude", { length: 50 }),
  lastLocationUpdate: timestamp("last_location_update"),
  
  // Route status
  status: mysqlEnum("status", ["active", "paused", "completed", "cancelled"]).default("active").notNull(),
  
  // Territory
  territoryId: int("territory_id"),
  
  // Timestamps
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ActiveRoute = typeof activeRoutes.$inferSelect;
export type InsertActiveRoute = typeof activeRoutes.$inferInsert;

/**
 * ROUTE STOPS - Individual stops in an active route
 */
export const routeStops = mysqlTable("route_stops", {
  id: int("id").autoincrement().primaryKey(),
  
  // Route reference
  routeId: int("route_id").notNull(),
  
  // Stop details
  leadId: int("lead_id").notNull(),
  stopOrder: int("stop_order").notNull(), // 1, 2, 3, etc.
  
  // Location
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  address: text("address").notNull(),
  
  // Stop status
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "skipped"]).default("pending").notNull(),
  
  // Timing
  estimatedArrival: timestamp("estimated_arrival"),
  actualArrival: timestamp("actual_arrival"),
  departureTime: timestamp("departure_time"),
  timeSpent: int("time_spent"), // in minutes
  
  // Outcome
  outcome: mysqlEnum("outcome", ["converted", "follow_up", "not_interested", "no_answer"]),
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type RouteStop = typeof routeStops.$inferSelect;
export type InsertRouteStop = typeof routeStops.$inferInsert;

/**
 * ROUTE HISTORY - Completed routes for analytics
 */
export const routeHistory = mysqlTable("route_history", {
  id: int("id").autoincrement().primaryKey(),
  
  // Agent information
  agentId: int("agent_id").notNull(),
  agentName: varchar("agent_name", { length: 255 }).notNull(),
  
  // Route details
  routeName: varchar("route_name", { length: 255 }).notNull(),
  routeType: varchar("route_type", { length: 100 }),
  priority: int("priority"),
  
  // Metrics
  totalStops: int("total_stops").notNull(),
  completedStops: int("completed_stops").notNull(),
  skippedStops: int("skipped_stops").default(0),
  
  // Distance and time
  plannedDistance: decimal("planned_distance", { precision: 10, scale: 2 }), // in km
  actualDistance: decimal("actual_distance", { precision: 10, scale: 2 }),
  estimatedTime: int("estimated_time"), // in minutes
  actualTime: int("actual_time"), // in minutes
  
  // Performance metrics
  conversions: int("conversions").default(0),
  followUps: int("follow_ups").default(0),
  notInterested: int("not_interested").default(0),
  noAnswers: int("no_answers").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }), // percentage
  
  // Territory
  territoryId: int("territory_id"),
  
  // Timestamps
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at").notNull(),
  duration: int("duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RouteHistory = typeof routeHistory.$inferSelect;
export type InsertRouteHistory = typeof routeHistory.$inferInsert;

/**
 * AGENT LOCATIONS - Real-time location tracking
 */
export const agentLocations = mysqlTable("agent_locations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Agent information
  agentId: int("agent_id").notNull(),
  agentName: varchar("agent_name", { length: 255 }).notNull(),
  
  // Location
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }), // in meters
  
  // Status
  isActive: boolean("is_active").default(true),
  activeRouteId: int("active_route_id"),
  
  // Timestamps
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Location expires after 5 minutes of no updates
});

export type AgentLocation = typeof agentLocations.$inferSelect;
export type InsertAgentLocation = typeof agentLocations.$inferInsert;

/**
 * TERRITORIES - Geographic boundaries for route coordination
 */
export const territories = mysqlTable("territories", {
  id: int("id").autoincrement().primaryKey(),
  
  // Territory details
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // hex color code
  
  // Boundary (stored as JSON polygon coordinates)
  boundaryCoordinates: text("boundary_coordinates").notNull(), // JSON array of {lat, lng}
  
  // Assignment
  assignedAgentId: int("assigned_agent_id"),
  assignedAgentName: varchar("assigned_agent_name", { length: 255 }),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Territory = typeof territories.$inferSelect;
export type InsertTerritory = typeof territories.$inferInsert;
