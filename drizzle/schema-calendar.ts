import { mysqlTable, int, varchar, text, datetime, boolean } from "drizzle-orm/mysql-core";

export const userCalendarTokens = mysqlTable("user_calendar_tokens", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: datetime("expires_at"),
  createdAt: datetime("created_at").notNull().default(new Date()),
  updatedAt: datetime("updated_at").notNull().default(new Date()),
});

export const leadCalendarEvents = mysqlTable("lead_calendar_events", {
  id: int("id").primaryKey().autoincrement(),
  leadId: int("lead_id").notNull(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  eventLink: text("event_link"),
  scheduledDate: datetime("scheduled_date").notNull(),
  createdAt: datetime("created_at").notNull().default(new Date()),
});
