import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as calendar from "./calendar";
import { getDb } from "./db";
import { userCalendarTokens, leadCalendarEvents, leads } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const calendarRouter = router({
  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl: publicProcedure
    .input(z.object({
      redirectUri: z.string(),
    }))
    .query(({ input }) => {
      const authUrl = calendar.getAuthUrl(input.redirectUri);
      return { authUrl };
    }),

  /**
   * Exchange authorization code for tokens and store them
   */
  exchangeCode: publicProcedure
    .input(z.object({
      code: z.string(),
      redirectUri: z.string(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const tokens = await calendar.getTokensFromCode(input.code, input.redirectUri);
      
      // Store tokens in database
      await db.insert(userCalendarTokens).values({
        userId: input.userId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      });

      return { success: true };
    }),

  /**
   * Check if user has connected Google Calendar
   */
  isConnected: publicProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { connected: false };
      
      const tokens = await db
        .select()
        .from(userCalendarTokens)
        .where(eq(userCalendarTokens.userId, input.userId))
        .limit(1);

      return { connected: tokens.length > 0 };
    }),

  /**
   * Create calendar event for a lead
   */
  createEvent: publicProcedure
    .input(z.object({
      userId: z.number(),
      leadId: z.number(),
      scheduledDate: z.string(), // ISO date string
      duration: z.number().optional(),
      appointmentType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get user's calendar tokens
      const tokens = await db
        .select()
        .from(userCalendarTokens)
        .where(eq(userCalendarTokens.userId, input.userId))
        .limit(1);

      if (tokens.length === 0) {
        throw new Error("Google Calendar not connected");
      }

      const token = tokens[0];

      // Get lead details
      const leadData = await db
        .select()
        .from(leads)
        .where(eq(leads.id, input.leadId))
        .limit(1);

      if (leadData.length === 0) {
        throw new Error("Lead not found");
      }

      const lead = leadData[0];

      // Create calendar event
      const { eventId, eventLink } = await calendar.createCalendarEvent(
        token.accessToken,
        token.refreshToken,
        {
          customerName: lead.name || "Unnamed Customer",
          address: lead.address,
          phone: lead.phone || undefined,
          appointmentType: input.appointmentType,
          scheduledDate: new Date(input.scheduledDate),
          duration: input.duration,
          notes: lead.notes || undefined,
        }
      );

      // Store event reference
      await db.insert(leadCalendarEvents).values({
        leadId: input.leadId,
        eventId,
        eventLink,
        scheduledDate: new Date(input.scheduledDate),
      });

      return { success: true, eventId, eventLink };
    }),

  /**
   * List upcoming calendar events
   */
  listEvents: publicProcedure
    .input(z.object({
      userId: z.number(),
      maxResults: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { events: [] };
      
      const tokens = await db
        .select()
        .from(userCalendarTokens)
        .where(eq(userCalendarTokens.userId, input.userId))
        .limit(1);

      if (tokens.length === 0) {
        return { events: [] };
      }

      const token = tokens[0];
      const events = await calendar.listUpcomingEvents(
        token.accessToken,
        token.refreshToken,
        input.maxResults
      );

      return { events };
    }),

  /**
   * Delete calendar event
   */
  deleteEvent: publicProcedure
    .input(z.object({
      userId: z.number(),
      eventId: z.string(),
      leadId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const tokens = await db
        .select()
        .from(userCalendarTokens)
        .where(eq(userCalendarTokens.userId, input.userId))
        .limit(1);

      if (tokens.length === 0) {
        throw new Error("Google Calendar not connected");
      }

      const token = tokens[0];

      // Delete from Google Calendar
      await calendar.deleteCalendarEvent(
        token.accessToken,
        token.refreshToken,
        input.eventId
      );

      // Delete from database
      await db
        .delete(leadCalendarEvents)
        .where(eq(leadCalendarEvents.eventId, input.eventId));

      return { success: true };
    }),
});
