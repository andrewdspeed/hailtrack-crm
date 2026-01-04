import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { manageLoanersProcedure } from "./rbac-middleware";
import { getDb } from "./db";
import { loanerVehicles, loanerAssignments } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

export const loanerRouter = router({
  // List all loaner vehicles
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const vehicles = await db.select().from(loanerVehicles);
    
    // Get active assignments for each vehicle
    const vehiclesWithAssignments = await Promise.all(
      vehicles.map(async (vehicle) => {
        const activeAssignment = await db
          .select()
          .from(loanerAssignments)
          .where(
            and(
              eq(loanerAssignments.loanerVehicleId, vehicle.id),
              isNull(loanerAssignments.returnedDate)
            )
          )
          .limit(1);
        
        return {
          ...vehicle,
          activeAssignment: activeAssignment[0] || null,
        };
      })
    );
    
    return vehiclesWithAssignments;
  }),

  // Get single loaner vehicle by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const vehicle = await db
        .select()
        .from(loanerVehicles)
        .where(eq(loanerVehicles.id, input.id))
        .limit(1);
      
      if (!vehicle[0]) throw new Error("Loaner vehicle not found");
      
      // Get all assignments for this vehicle
      const assignments = await db
        .select()
        .from(loanerAssignments)
        .where(eq(loanerAssignments.loanerVehicleId, input.id));
      
      return {
        ...vehicle[0],
        assignments,
      };
    }),

  // Create new loaner vehicle
  create: manageLoanersProcedure
    .input(z.object({
      make: z.string(),
      model: z.string(),
      year: z.string(),
      color: z.string().optional(),
      vin: z.string().optional(),
      licensePlate: z.string().optional(),
      currentMileage: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(loanerVehicles).values({
        ...input,
        status: "available",
      });
      
      return { id: Number(result.insertId), success: true };
    }),

  // Update loaner vehicle
  update: manageLoanersProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        make: z.string().optional(),
        model: z.string().optional(),
        year: z.string().optional(),
        color: z.string().optional(),
        vin: z.string().optional(),
        licensePlate: z.string().optional(),
        status: z.enum(["available", "assigned", "maintenance", "out_of_service"]).optional(),
        currentMileage: z.number().optional(),
        lastMaintenanceDate: z.date().optional(),
        nextMaintenanceDate: z.date().optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(loanerVehicles)
        .set(input.data)
        .where(eq(loanerVehicles.id, input.id));
      
      return { success: true };
    }),

  // Delete loaner vehicle
  delete: manageLoanersProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if vehicle has active assignments
      const activeAssignment = await db
        .select()
        .from(loanerAssignments)
        .where(
          and(
            eq(loanerAssignments.loanerVehicleId, input.id),
            isNull(loanerAssignments.returnedDate)
          )
        )
        .limit(1);
      
      if (activeAssignment.length > 0) {
        throw new Error("Cannot delete vehicle with active assignment");
      }
      
      await db.delete(loanerVehicles).where(eq(loanerVehicles.id, input.id));
      
      return { success: true };
    }),

  // Assign loaner vehicle to lead
  assign: manageLoanersProcedure
    .input(z.object({
      leadId: z.number(),
      loanerVehicleId: z.number(),
      mileageOut: z.number().optional(),
      fuelLevelOut: z.string().optional(),
      condition: z.string().optional(),
      notes: z.string().optional(),
      assignedBy: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if vehicle is available
      const vehicle = await db
        .select()
        .from(loanerVehicles)
        .where(eq(loanerVehicles.id, input.loanerVehicleId))
        .limit(1);
      
      if (!vehicle[0]) throw new Error("Loaner vehicle not found");
      if (vehicle[0].status !== "available") {
        throw new Error("Vehicle is not available for assignment");
      }
      
      // Create assignment
      const result = await db.insert(loanerAssignments).values({
        leadId: input.leadId,
        loanerVehicleId: input.loanerVehicleId,
        assignedDate: new Date(),
        mileageOut: input.mileageOut,
        fuelLevelOut: input.fuelLevelOut,
        condition: input.condition,
        notes: input.notes,
        assignedBy: input.assignedBy,
      });
      
      // Update vehicle status to assigned
      await db
        .update(loanerVehicles)
        .set({ status: "assigned" })
        .where(eq(loanerVehicles.id, input.loanerVehicleId));
      
      return { id: Number(result.insertId), success: true };
    }),

  // Return loaner vehicle
  returnVehicle: manageLoanersProcedure
    .input(z.object({
      assignmentId: z.number(),
      mileageIn: z.number().optional(),
      fuelLevelIn: z.string().optional(),
      condition: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get assignment
      const assignment = await db
        .select()
        .from(loanerAssignments)
        .where(eq(loanerAssignments.id, input.assignmentId))
        .limit(1);
      
      if (!assignment[0]) throw new Error("Assignment not found");
      if (assignment[0].returnedDate) {
        throw new Error("Vehicle already returned");
      }
      
      // Update assignment with return info
      await db
        .update(loanerAssignments)
        .set({
          returnedDate: new Date(),
          mileageIn: input.mileageIn,
          fuelLevelIn: input.fuelLevelIn,
          condition: input.condition || assignment[0].condition,
          notes: input.notes ? `${assignment[0].notes || ""}\n${input.notes}` : assignment[0].notes,
        })
        .where(eq(loanerAssignments.id, input.assignmentId));
      
      // Update vehicle status to available
      await db
        .update(loanerVehicles)
        .set({ 
          status: "available",
          currentMileage: input.mileageIn || assignment[0].mileageOut,
        })
        .where(eq(loanerVehicles.id, assignment[0].loanerVehicleId));
      
      return { success: true };
    }),

  // Get assignments for a lead
  getAssignmentsByLeadId: publicProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const assignments = await db
        .select()
        .from(loanerAssignments)
        .where(eq(loanerAssignments.leadId, input.leadId));
      
      // Get vehicle details for each assignment
      const assignmentsWithVehicles = await Promise.all(
        assignments.map(async (assignment) => {
          const vehicle = await db
            .select()
            .from(loanerVehicles)
            .where(eq(loanerVehicles.id, assignment.loanerVehicleId))
            .limit(1);
          
          return {
            ...assignment,
            vehicle: vehicle[0] || null,
          };
        })
      );
      
      return assignmentsWithVehicles;
    }),

  // Get available vehicles
  getAvailable: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    return await db
      .select()
      .from(loanerVehicles)
      .where(eq(loanerVehicles.status, "available"));
  }),

  // Get assignment history for a vehicle
  getAssignmentHistory: publicProcedure
    .input(z.object({ loanerVehicleId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(loanerAssignments)
        .where(eq(loanerAssignments.loanerVehicleId, input.loanerVehicleId));
    }),
});
