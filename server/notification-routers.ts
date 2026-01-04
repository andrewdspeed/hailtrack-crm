import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as notifications from "./notifications";

export const notificationRouter = router({
  /**
   * Send test notification to verify setup
   */
  sendTest: publicProcedure
    .input(z.object({
      userId: z.number(),
      userName: z.string(),
      userPhone: z.string().optional(),
      userEmail: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await notifications.sendNotification({
        userId: input.userId,
        userName: input.userName,
        userPhone: input.userPhone,
        userEmail: input.userEmail,
        title: '🔔 Test Notification',
        message: 'Your notification system is working correctly!',
        type: 'lead_assigned',
      });
      return { success: true };
    }),

  /**
   * Notify about new lead assignment
   */
  notifyNewLead: publicProcedure
    .input(z.object({
      agentId: z.number(),
      agentName: z.string(),
      agentPhone: z.string().optional(),
      agentEmail: z.string().optional(),
      leadId: z.number(),
      leadAddress: z.string(),
    }))
    .mutation(async ({ input }) => {
      await notifications.notifyNewLead(
        input.agentId,
        input.agentName,
        input.agentPhone,
        input.agentEmail,
        input.leadId,
        input.leadAddress
      );
      return { success: true };
    }),

  /**
   * Notify when follow-up cooldown expires
   */
  notifyFollowUpReady: publicProcedure
    .input(z.object({
      agentId: z.number(),
      agentName: z.string(),
      agentPhone: z.string().optional(),
      agentEmail: z.string().optional(),
      leadId: z.number(),
      leadAddress: z.string(),
      customerName: z.string(),
    }))
    .mutation(async ({ input }) => {
      await notifications.notifyFollowUpReady(
        input.agentId,
        input.agentName,
        input.agentPhone,
        input.agentEmail,
        input.leadId,
        input.leadAddress,
        input.customerName
      );
      return { success: true };
    }),

  /**
   * Notify when lead status changes
   */
  notifyStatusChange: publicProcedure
    .input(z.object({
      agentId: z.number(),
      agentName: z.string(),
      agentPhone: z.string().optional(),
      agentEmail: z.string().optional(),
      leadId: z.number(),
      leadAddress: z.string(),
      customerName: z.string(),
      newStatus: z.string(),
    }))
    .mutation(async ({ input }) => {
      await notifications.notifyStatusChange(
        input.agentId,
        input.agentName,
        input.agentPhone,
        input.agentEmail,
        input.leadId,
        input.leadAddress,
        input.customerName,
        input.newStatus
      );
      return { success: true };
    }),

  /**
   * Send daily digest
   */
  sendDailyDigest: publicProcedure
    .input(z.object({
      agentId: z.number(),
      agentName: z.string(),
      agentPhone: z.string().optional(),
      agentEmail: z.string().optional(),
      leads: z.array(z.object({
        id: z.number(),
        name: z.string(),
        address: z.string(),
        hoursSinceLastContact: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      await notifications.sendDailyDigest(
        input.agentId,
        input.agentName,
        input.agentPhone,
        input.agentEmail,
        input.leads
      );
      return { success: true };
    }),
});
