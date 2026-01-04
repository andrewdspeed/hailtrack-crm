import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { customerMessages } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const messagingRouter = router({
  /**
   * Send a message from customer or staff
   */
  send: publicProcedure
    .input(z.object({
      customerId: z.number(),
      vehicleId: z.number().optional(),
      senderType: z.enum(["customer", "staff"]),
      senderName: z.string(),
      senderPhone: z.string().optional(),
      message: z.string(),
      attachmentUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const result = await db
        .insert(customerMessages)
        .values({
          customerId: input.customerId,
          vehicleId: input.vehicleId || null,
          senderType: input.senderType,
          senderName: input.senderName,
          senderPhone: input.senderPhone || null,
          message: input.message,
          attachmentUrl: input.attachmentUrl || null,
          isRead: false,
          createdAt: new Date(),
        })
        .returning();

      return result[0];
    }),

  /**
   * Get all messages for a customer
   */
  getByCustomerId: publicProcedure
    .input(z.object({
      customerId: z.number(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const messages = await db
        .select()
        .from(customerMessages)
        .where(eq(customerMessages.customerId, input.customerId))
        .orderBy(desc(customerMessages.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return messages.reverse(); // Return in chronological order
    }),

  /**
   * Get messages for a specific vehicle
   */
  getByVehicleId: publicProcedure
    .input(z.object({
      vehicleId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const messages = await db
        .select()
        .from(customerMessages)
        .where(eq(customerMessages.vehicleId, input.vehicleId))
        .orderBy(desc(customerMessages.createdAt))
        .limit(input.limit);

      return messages.reverse();
    }),

  /**
   * Mark messages as read
   */
  markAsRead: publicProcedure
    .input(z.object({
      messageIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Update messages to mark as read
      for (const messageId of input.messageIds) {
        await db
          .update(customerMessages)
          .set({ isRead: true })
          .where(eq(customerMessages.id, messageId));
      }

      return { success: true };
    }),

  /**
   * Get unread message count for a customer
   */
  getUnreadCount: publicProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const messages = await db
        .select()
        .from(customerMessages)
        .where(
          and(
            eq(customerMessages.customerId, input.customerId),
            eq(customerMessages.isRead, false)
          )
        );

      return messages.length;
    }),

  /**
   * Delete a message
   */
  delete: publicProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      await db
        .delete(customerMessages)
        .where(eq(customerMessages.id, input.messageId));

      return { success: true };
    }),

  /**
   * Search messages
   */
  search: publicProcedure
    .input(z.object({
      customerId: z.number(),
      query: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const messages = await db
        .select()
        .from(customerMessages)
        .where(eq(customerMessages.customerId, input.customerId));

      // Client-side search (would be better with full-text search in DB)
      return messages.filter(m =>
        m.message.toLowerCase().includes(input.query.toLowerCase()) ||
        m.senderName.toLowerCase().includes(input.query.toLowerCase())
      );
    }),

  /**
   * Get message statistics for a customer
   */
  getStats: publicProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const messages = await db
        .select()
        .from(customerMessages)
        .where(eq(customerMessages.customerId, input.customerId));

      const stats = {
        totalMessages: messages.length,
        unreadMessages: messages.filter(m => !m.isRead).length,
        customerMessages: messages.filter(m => m.senderType === "customer").length,
        staffMessages: messages.filter(m => m.senderType === "staff").length,
        lastMessageDate: messages.length > 0 ? messages[0].createdAt : null,
      };

      return stats;
    }),
});
