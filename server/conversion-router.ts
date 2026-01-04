import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { leads, customers, vehicles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const conversionRouter = router({
  /**
   * Convert a lead to a customer
   * Called when a vehicle enters "in_shop" status
   */
  convertLeadToCustomer: publicProcedure
    .input(z.object({
      leadId: z.number(),
      vehicleId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        // Get the lead
        const leadResult = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
        if (leadResult.length === 0) {
          throw new Error("Lead not found");
        }
        const lead = leadResult[0];

        // Check if customer already exists for this lead
        const existingCustomer = await db.select().from(customers).where(eq(customers.leadId, input.leadId)).limit(1);
        
        let customerId: number;

        if (existingCustomer.length > 0) {
          // Customer already exists, just update the vehicle
          customerId = existingCustomer[0].id;
        } else {
          // Create new customer from lead
          const customerResult = await db.insert(customers).values({
            leadId: input.leadId,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            latitude: lead.latitude,
            longitude: lead.longitude,
            agentId: lead.agentId,
            agentName: lead.agentName,
            source: lead.source,
            notes: lead.notes,
            convertedAt: new Date(),
            convertedFromLeadId: input.leadId,
          });

          customerId = (customerResult as any).insertId || (customerResult as any)[0]?.id || 0;
        }

        // Update vehicle to link to customer
        await db.update(vehicles)
          .set({ customerId })
          .where(eq(vehicles.id, input.vehicleId));

        // Update lead status to "converted"
        await db.update(leads)
          .set({ status: "converted" })
          .where(eq(leads.id, input.leadId));

        return {
          success: true,
          customerId,
          message: `Lead #${input.leadId} successfully converted to Customer #${customerId}`,
        };
      } catch (error) {
        console.error("Conversion error:", error);
        throw error;
      }
    }),

  /**
   * Check if a lead can be converted
   * Returns validation errors if conversion is not possible
   */
  validateConversion: publicProcedure
    .input(z.object({
      leadId: z.number(),
      vehicleId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const errors: string[] = [];

      // Check if lead exists
      const leadResult = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
      if (leadResult.length === 0) {
        errors.push("Lead not found");
        return { valid: false, errors };
      }
      const lead = leadResult[0];

      // Check if vehicle exists
      const vehicleResult = await db.select().from(vehicles).where(eq(vehicles.id, input.vehicleId)).limit(1);
      if (vehicleResult.length === 0) {
        errors.push("Vehicle not found");
        return { valid: false, errors };
      }

      // Check if lead has required fields
      if (!lead.name) errors.push("Lead name is required");
      if (!lead.phone && !lead.email) errors.push("Lead must have phone or email");
      if (!lead.address) errors.push("Lead address is required");

      return {
        valid: errors.length === 0,
        errors,
        lead,
      };
    }),

  /**
   * Get conversion preview data
   * Shows what data will be used for the customer record
   */
  getConversionPreview: publicProcedure
    .input(z.object({
      leadId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const leadResult = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
      if (leadResult.length === 0) {
        throw new Error("Lead not found");
      }

      const lead = leadResult[0];

      // Check if customer already exists
      const existingCustomer = await db.select().from(customers).where(eq(customers.leadId, input.leadId)).limit(1);

      return {
        leadId: lead.id,
        customerName: lead.name,
        customerPhone: lead.phone,
        customerEmail: lead.email,
        customerAddress: lead.address,
        customerCity: lead.city,
        customerState: lead.state,
        agentName: lead.agentName,
        alreadyConverted: existingCustomer.length > 0,
        existingCustomerId: existingCustomer.length > 0 ? existingCustomer[0].id : null,
      };
    }),
});
