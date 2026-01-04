import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { assignTechniciansProcedure } from "./rbac-middleware";
import { getDb } from "./db";
import { technicians, jobAssignments } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

export const technicianRouter = router({
  // List all technicians
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allTechnicians = await db.select().from(technicians);
    
    // Get active job count for each technician
    const techniciansWithJobs = await Promise.all(
      allTechnicians.map(async (tech) => {
        const activeJobs = await db
          .select()
          .from(jobAssignments)
          .where(
            and(
              eq(jobAssignments.technicianId, tech.id),
              eq(jobAssignments.status, "in_progress")
            )
          );
        
        return {
          ...tech,
          activeJobCount: activeJobs.length,
        };
      })
    );
    
    return techniciansWithJobs;
  }),

  // Get single technician by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const technician = await db
        .select()
        .from(technicians)
        .where(eq(technicians.id, input.id))
        .limit(1);
      
      if (!technician[0]) throw new Error("Technician not found");
      
      // Get all job assignments for this technician
      const assignments = await db
        .select()
        .from(jobAssignments)
        .where(eq(jobAssignments.technicianId, input.id));
      
      return {
        ...technician[0],
        assignments,
      };
    }),

  // Create new technician
  create: assignTechniciansProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      specialty: z.string().optional(),
      hourlyRate: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(technicians).values({
        ...input,
        status: "active",
      });
      
      return { id: Number(result.insertId), success: true };
    }),

  // Update technician
  update: assignTechniciansProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        specialty: z.string().optional(),
        status: z.enum(["active", "inactive", "on_leave"]).optional(),
        hourlyRate: z.number().optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(technicians)
        .set(input.data)
        .where(eq(technicians.id, input.id));
      
      return { success: true };
    }),

  // Delete technician
  delete: assignTechniciansProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if technician has active assignments
      const activeAssignments = await db
        .select()
        .from(jobAssignments)
        .where(
          and(
            eq(jobAssignments.technicianId, input.id),
            eq(jobAssignments.status, "in_progress")
          )
        )
        .limit(1);
      
      if (activeAssignments.length > 0) {
        throw new Error("Cannot delete technician with active job assignments");
      }
      
      await db.delete(technicians).where(eq(technicians.id, input.id));
      
      return { success: true };
    }),

  // Assign technician to job
  assignJob: assignTechniciansProcedure
    .input(z.object({
      leadId: z.number(),
      technicianId: z.number(),
      estimatedHours: z.number().optional(),
      notes: z.string().optional(),
      assignedBy: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if technician exists and is active
      const technician = await db
        .select()
        .from(technicians)
        .where(eq(technicians.id, input.technicianId))
        .limit(1);
      
      if (!technician[0]) throw new Error("Technician not found");
      if (technician[0].status !== "active") {
        throw new Error("Technician is not active");
      }
      
      // Create job assignment
      const result = await db.insert(jobAssignments).values({
        leadId: input.leadId,
        technicianId: input.technicianId,
        assignedDate: new Date(),
        status: "assigned",
        estimatedHours: input.estimatedHours,
        notes: input.notes,
        assignedBy: input.assignedBy,
      });
      
      return { id: Number(result.insertId), success: true };
    }),

  // Update job assignment status
  updateJobStatus: assignTechniciansProcedure
    .input(z.object({
      assignmentId: z.number(),
      status: z.enum(["assigned", "in_progress", "completed", "cancelled"]),
      startDate: z.date().optional(),
      completedDate: z.date().optional(),
      actualHours: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const updateData: any = {
        status: input.status,
      };
      
      if (input.startDate) updateData.startDate = input.startDate;
      if (input.completedDate) updateData.completedDate = input.completedDate;
      if (input.actualHours) updateData.actualHours = input.actualHours;
      if (input.notes) updateData.notes = input.notes;
      
      await db
        .update(jobAssignments)
        .set(updateData)
        .where(eq(jobAssignments.id, input.assignmentId));
      
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
        .from(jobAssignments)
        .where(eq(jobAssignments.leadId, input.leadId));
      
      // Get technician details for each assignment
      const assignmentsWithTechnicians = await Promise.all(
        assignments.map(async (assignment) => {
          const technician = await db
            .select()
            .from(technicians)
            .where(eq(technicians.id, assignment.technicianId))
            .limit(1);
          
          return {
            ...assignment,
            technician: technician[0] || null,
          };
        })
      );
      
      return assignmentsWithTechnicians;
    }),

  // Get active technicians (available for assignment)
  getActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const activeTechnicians = await db
      .select()
      .from(technicians)
      .where(eq(technicians.status, "active"));
    
    // Get workload for each technician
    const techniciansWithWorkload = await Promise.all(
      activeTechnicians.map(async (tech) => {
        const activeJobs = await db
          .select()
          .from(jobAssignments)
          .where(
            and(
              eq(jobAssignments.technicianId, tech.id),
              eq(jobAssignments.status, "in_progress")
            )
          );
        
        const assignedJobs = await db
          .select()
          .from(jobAssignments)
          .where(
            and(
              eq(jobAssignments.technicianId, tech.id),
              eq(jobAssignments.status, "assigned")
            )
          );
        
        return {
          ...tech,
          activeJobCount: activeJobs.length,
          assignedJobCount: assignedJobs.length,
          totalWorkload: activeJobs.length + assignedJobs.length,
        };
      })
    );
    
    // Sort by workload (least busy first)
    return techniciansWithWorkload.sort((a, b) => a.totalWorkload - b.totalWorkload);
  }),

  // Get assignment history for a technician
  getAssignmentHistory: publicProcedure
    .input(z.object({ technicianId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(jobAssignments)
        .where(eq(jobAssignments.technicianId, input.technicianId));
    }),

  // Get today's assignments for dashboard widget
  getTodayAssignments: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignments = await db
      .select()
      .from(jobAssignments)
      .where(
        and(
          eq(jobAssignments.status, "in_progress"),
          eq(jobAssignments.status, "assigned")
        )
      );

    // Get technician details
    const assignmentsWithTechnicians = await Promise.all(
      assignments.map(async (assignment) => {
        const technician = await db
          .select()
          .from(technicians)
          .where(eq(technicians.id, assignment.technicianId))
          .limit(1);
        
        return {
          ...assignment,
          technician: technician[0] || null,
        };
      })
    );

    return assignmentsWithTechnicians;
  }),

  // Get technician performance stats
  getStats: publicProcedure
    .input(z.object({ technicianId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allAssignments = await db
        .select()
        .from(jobAssignments)
        .where(eq(jobAssignments.technicianId, input.technicianId));
      
      const completedJobs = allAssignments.filter(a => a.status === "completed");
      const activeJobs = allAssignments.filter(a => a.status === "in_progress");
      const assignedJobs = allAssignments.filter(a => a.status === "assigned");
      
      // Calculate average completion time
      const completedWithDates = completedJobs.filter(
        j => j.assignedDate && j.completedDate
      );
      
      let avgCompletionDays = 0;
      if (completedWithDates.length > 0) {
        const totalDays = completedWithDates.reduce((sum, job) => {
          const assigned = new Date(job.assignedDate!).getTime();
          const completed = new Date(job.completedDate!).getTime();
          return sum + (completed - assigned) / (1000 * 60 * 60 * 24);
        }, 0);
        avgCompletionDays = totalDays / completedWithDates.length;
      }
      
      return {
        totalJobs: allAssignments.length,
        completedJobs: completedJobs.length,
        activeJobs: activeJobs.length,
        assignedJobs: assignedJobs.length,
        cancelledJobs: allAssignments.filter(a => a.status === "cancelled").length,
        avgCompletionDays: Math.round(avgCompletionDays * 10) / 10,
      };
    }),
});
