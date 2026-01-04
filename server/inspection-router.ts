import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { inspections } from "../drizzle/schema";
import { eq, isNull } from "drizzle-orm";

export const inspectionRouter = router({
  // Get pending inspections for dashboard widget
  getPending: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const pendingInspections = await db
      .select()
      .from(inspections)
      .where(isNull(inspections.completedAt));

    return pendingInspections;
  }),

  // Get inspections by lead ID
  getByLeadId: publicProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db
        .select()
        .from(inspections)
        .where(eq(inspections.leadId, input.leadId));
    }),
});
