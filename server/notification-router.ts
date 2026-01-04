import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import twilio from "twilio";

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export const notificationRouter = router({
  // Send SMS notification
  sendSMS: publicProcedure
    .input(z.object({
      to: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (!twilioClient || !TWILIO_PHONE_NUMBER) {
        throw new Error("Twilio is not configured");
      }

      try {
        const result = await twilioClient.messages.create({
          body: input.message,
          from: TWILIO_PHONE_NUMBER,
          to: input.to,
        });

        return {
          success: true,
          messageId: result.sid,
        };
      } catch (error: any) {
        throw new Error(`Failed to send SMS: ${error.message}`);
      }
    }),

  // Send technician assignment notification
  notifyTechnicianAssignment: publicProcedure
    .input(z.object({
      technicianId: z.number(),
      leadId: z.number(),
      customerName: z.string(),
      estimatedHours: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get technician details
      const technician = await db.query.technicians.findFirst({
        where: (technicians, { eq }) => eq(technicians.id, input.technicianId),
      });

      if (!technician || !technician.phone) {
        return { success: false, reason: "No phone number" };
      }

      const message = `New job assigned! Customer: ${input.customerName}, Lead #${input.leadId}${input.estimatedHours ? `, Est. ${input.estimatedHours}hrs` : ""}. Check CRM for details.`;

      if (twilioClient && TWILIO_PHONE_NUMBER) {
        try {
          await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: technician.phone,
          });
          return { success: true };
        } catch (error: any) {
          console.error("SMS send failed:", error);
          return { success: false, reason: error.message };
        }
      }

      return { success: false, reason: "Twilio not configured" };
    }),

  // Send loaner assignment notification
  notifyLoanerAssignment: publicProcedure
    .input(z.object({
      leadId: z.number(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      vehicleInfo: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (!input.customerPhone) {
        return { success: false, reason: "No customer phone" };
      }

      const message = `Hi ${input.customerName}, your loaner vehicle (${input.vehicleInfo}) is ready for pickup at Hail Solutions Group. Please bring your ID and insurance card.`;

      if (twilioClient && TWILIO_PHONE_NUMBER) {
        try {
          await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: input.customerPhone,
          });
          return { success: true };
        } catch (error: any) {
          console.error("SMS send failed:", error);
          return { success: false, reason: error.message };
        }
      }

      return { success: false, reason: "Twilio not configured" };
    }),

  // Send repair completion notification
  notifyRepairComplete: publicProcedure
    .input(z.object({
      leadId: z.number(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!input.customerPhone) {
        return { success: false, reason: "No customer phone" };
      }

      const message = `Good news ${input.customerName}! Your vehicle repair is complete and ready for pickup at Hail Solutions Group. Call us to schedule pickup.`;

      if (twilioClient && TWILIO_PHONE_NUMBER) {
        try {
          await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: input.customerPhone,
          });
          return { success: true };
        } catch (error: any) {
          console.error("SMS send failed:", error);
          return { success: false, reason: error.message };
        }
      }

      return { success: false, reason: "Twilio not configured" };
    }),

  // Send loaner return reminder
  notifyLoanerReturnReminder: publicProcedure
    .input(z.object({
      leadId: z.number(),
      customerName: z.string(),
      customerPhone: z.string().optional(),
      vehicleInfo: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (!input.customerPhone) {
        return { success: false, reason: "No customer phone" };
      }

      const message = `Reminder: Please return your loaner vehicle (${input.vehicleInfo}) to Hail Solutions Group. Your repaired vehicle is ready!`;

      if (twilioClient && TWILIO_PHONE_NUMBER) {
        try {
          await twilioClient.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: input.customerPhone,
          });
          return { success: true };
        } catch (error: any) {
          console.error("SMS send failed:", error);
          return { success: false, reason: error.message };
        }
      }

      return { success: false, reason: "Twilio not configured" };
    }),

  // Check Twilio configuration
  checkTwilioConfig: publicProcedure.query(() => {
    return {
      configured: !!(twilioClient && TWILIO_PHONE_NUMBER),
      phoneNumber: TWILIO_PHONE_NUMBER ? `***${TWILIO_PHONE_NUMBER.slice(-4)}` : null,
    };
  }),
});
