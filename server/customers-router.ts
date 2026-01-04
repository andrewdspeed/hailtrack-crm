import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { customers, vehicles } from "../drizzle/schema";
import { eq, like, desc } from "drizzle-orm";

export const customersRouter = router({
  /**
   * Get all customers with pagination and search
   */
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      let query = db.select().from(customers);

      if (input.search) {
        query = query.where(
          like(customers.name, `%${input.search}%`)
        );
      }

      const allCustomers = await query
        .orderBy(desc(customers.convertedAt))
        .limit(input.limit)
        .offset(input.offset);

      return allCustomers;
    }),

  /**
   * Get customer details with all vehicles
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const customerResult = await db
        .select()
        .from(customers)
        .where(eq(customers.id, input.id))
        .limit(1);

      if (customerResult.length === 0) {
        throw new Error("Customer not found");
      }

      const customer = customerResult[0];

      // Get all vehicles for this customer
      const customerVehicles = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.customerId, input.id))
        .orderBy(desc(vehicles.createdAt));

      return {
        ...customer,
        vehicles: customerVehicles,
      };
    }),

  /**
   * Get customer count
   */
  count: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const result = await db
      .select()
      .from(customers);

    return result.length;
  }),

  /**
   * Get customers by status
   */
  getByVehicleStatus: publicProcedure
    .input(z.object({
      status: z.enum(["lead", "scheduled", "in_shop", "awaiting_pickup", "complete"]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const customersWithStatus = await db
        .select()
        .from(customers)
        .orderBy(desc(customers.convertedAt));

      // Filter by vehicle status
      const filtered = [];
      for (const customer of customersWithStatus) {
        const customerVehicles = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.customerId, customer.id));

        const hasStatus = customerVehicles.some(v => v.status === input.status);
        if (hasStatus) {
          filtered.push({
            ...customer,
            vehicles: customerVehicles,
          });
        }
      }

      return filtered;
    }),

  /**
   * Get recent customers
   */
  getRecent: publicProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      return await db
        .select()
        .from(customers)
        .orderBy(desc(customers.convertedAt))
        .limit(input.limit);
    }),

  /**
   * Get customer statistics
   */
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const allCustomers = await db.select().from(customers);
    const allVehicles = await db.select().from(vehicles);

    const stats = {
      totalCustomers: allCustomers.length,
      totalVehicles: allVehicles.length,
      vehiclesByStatus: {
        lead: allVehicles.filter(v => v.status === "lead").length,
        scheduled: allVehicles.filter(v => v.status === "scheduled").length,
        in_shop: allVehicles.filter(v => v.status === "in_shop").length,
        awaiting_pickup: allVehicles.filter(v => v.status === "awaiting_pickup").length,
        complete: allVehicles.filter(v => v.status === "complete").length,
      },
      avgVehiclesPerCustomer: allCustomers.length > 0 
        ? (allVehicles.length / allCustomers.length).toFixed(2)
        : 0,
    };

    return stats;
  }),
});
