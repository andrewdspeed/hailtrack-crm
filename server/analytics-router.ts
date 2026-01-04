import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { analyticsProcedure } from "./rbac-middleware";
import { getDb } from "./db";
import { leads, estimates, invoices } from "../drizzle/schema";
import { sql, eq, and, gte, lte } from "drizzle-orm";

export const analyticsRouter = router({
  // Get agent performance metrics
  getAgentPerformance: analyticsProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = input?.startDate ? new Date(input.startDate) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = input?.endDate ? new Date(input.endDate) : new Date();
      
      // Get all leads with date filter
      const allLeads = await db
        .select()
        .from(leads)
        .where(
          and(
            gte(leads.createdAt, startDate),
            lte(leads.createdAt, endDate)
          )
        );
      
      // Group by agent
      const agentStats = new Map<string, {
        agentId: number | null;
        agentName: string;
        totalLeads: number;
        newLeads: number;
        scheduled: number;
        inShop: number;
        awaitingPickup: number;
        completed: number;
        conversionRate: number;
        avgResponseTime: number;
      }>();
      
      for (const lead of allLeads) {
        const agentKey = lead.agentId?.toString() || 'unassigned';
        const agentName = lead.agentName || 'Unassigned';
        
        if (!agentStats.has(agentKey)) {
          agentStats.set(agentKey, {
            agentId: lead.agentId,
            agentName,
            totalLeads: 0,
            newLeads: 0,
            scheduled: 0,
            inShop: 0,
            awaitingPickup: 0,
            completed: 0,
            conversionRate: 0,
            avgResponseTime: 0,
          });
        }
        
        const stats = agentStats.get(agentKey)!;
        stats.totalLeads++;
        
        switch (lead.status) {
          case 'lead':
            stats.newLeads++;
            break;
          case 'scheduled':
            stats.scheduled++;
            break;
          case 'in_shop':
            stats.inShop++;
            break;
          case 'awaiting_pickup':
            stats.awaitingPickup++;
            break;
          case 'complete':
            stats.completed++;
            break;
        }
      }
      
      // Calculate conversion rates
      const agentPerformance = Array.from(agentStats.values()).map(stats => ({
        ...stats,
        conversionRate: stats.totalLeads > 0 
          ? Math.round((stats.completed / stats.totalLeads) * 100) 
          : 0,
      }));
      
      // Sort by total leads descending
      agentPerformance.sort((a, b) => b.totalLeads - a.totalLeads);
      
      return agentPerformance;
    }),
  
  // Get monthly revenue data
  getMonthlyRevenue: analyticsProcedure
    .input(z.object({
      months: z.number().default(12),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const months = input?.months || 12;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      // Get completed leads
      const completedLeads = await db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.status, 'complete'),
            gte(leads.createdAt, startDate)
          )
        );
      
      // Group by month and agent
      const monthlyData = new Map<string, Map<string, number>>();
      
      for (const lead of completedLeads) {
        const monthKey = new Date(lead.createdAt).toISOString().slice(0, 7); // YYYY-MM
        const agentKey = lead.agentName || 'Unassigned';
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, new Map());
        }
        
        const monthAgents = monthlyData.get(monthKey)!;
        monthAgents.set(agentKey, (monthAgents.get(agentKey) || 0) + 1);
      }
      
      // Convert to array format
      const result = Array.from(monthlyData.entries())
        .map(([month, agents]) => ({
          month,
          ...Object.fromEntries(agents.entries()),
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
      
      return result;
    }),
  
  // Get overall statistics
  getOverallStats: analyticsProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const allLeads = await db.select().from(leads);
    
    const totalLeads = allLeads.length;
    const completedLeads = allLeads.filter(l => l.status === 'complete').length;
    const activeLeads = allLeads.filter(l => l.status !== 'complete').length;
    const conversionRate = totalLeads > 0 
      ? Math.round((completedLeads / totalLeads) * 100) 
      : 0;
    
    // Count unique agents
    const uniqueAgents = new Set(allLeads.map(l => l.agentId).filter(Boolean));
    
    return {
      totalLeads,
      completedLeads,
      activeLeads,
      conversionRate,
      totalAgents: uniqueAgents.size,
    };
  }),
  
  // Get conversion funnel data
  getConversionFunnel: analyticsProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = input?.startDate ? new Date(input.startDate) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = input?.endDate ? new Date(input.endDate) : new Date();
      
      const allLeads = await db
        .select()
        .from(leads)
        .where(
          and(
            gte(leads.createdAt, startDate),
            lte(leads.createdAt, endDate)
          )
        );
      
      const funnel = {
        lead: allLeads.filter(l => l.status === 'lead').length,
        scheduled: allLeads.filter(l => l.status === 'scheduled').length,
        inShop: allLeads.filter(l => l.status === 'in_shop').length,
        awaitingPickup: allLeads.filter(l => l.status === 'awaiting_pickup').length,
        complete: allLeads.filter(l => l.status === 'complete').length,
        total: allLeads.length,
      };
      
      return {
        ...funnel,
        conversionRate: funnel.total > 0 ? Math.round((funnel.complete / funnel.total) * 100) : 0,
      };
    }),
  
  // Get revenue trends
  getRevenueTrends: analyticsProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      groupBy: z.enum(['day', 'week', 'month']).default('month'),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = input?.startDate ? new Date(input.startDate) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = input?.endDate ? new Date(input.endDate) : new Date();
      const groupBy = input?.groupBy || 'month';
      
      // Get all invoices in date range
      const allInvoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            gte(invoices.createdAt, startDate),
            lte(invoices.createdAt, endDate)
          )
        );
      
      // Group by time period
      const revenueByPeriod = new Map<string, { revenue: number; count: number }>();
      
      for (const invoice of allInvoices) {
        let periodKey: string;
        const date = new Date(invoice.createdAt);
        
        if (groupBy === 'day') {
          periodKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
        } else if (groupBy === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().slice(0, 10);
        } else {
          periodKey = date.toISOString().slice(0, 7); // YYYY-MM
        }
        
        if (!revenueByPeriod.has(periodKey)) {
          revenueByPeriod.set(periodKey, { revenue: 0, count: 0 });
        }
        
        const period = revenueByPeriod.get(periodKey)!;
        period.revenue += invoice.totalAmount || 0;
        period.count++;
      }
      
      // Convert to array and sort
      const trends = Array.from(revenueByPeriod.entries())
        .map(([period, data]) => ({
          period,
          revenue: data.revenue / 100, // Convert from cents to dollars
          invoiceCount: data.count,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
      
      return trends;
    }),
  
  // Get average repair duration
  getRepairDuration: analyticsProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const startDate = input?.startDate ? new Date(input.startDate) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = input?.endDate ? new Date(input.endDate) : new Date();
      
      const completedLeads = await db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.status, 'complete'),
            gte(leads.createdAt, startDate),
            lte(leads.createdAt, endDate)
          )
        );
      
      // Calculate average days from creation to completion
      const durations = completedLeads
        .filter(l => l.updatedAt)
        .map(l => {
          const created = new Date(l.createdAt).getTime();
          const updated = new Date(l.updatedAt!).getTime();
          return Math.round((updated - created) / (1000 * 60 * 60 * 24)); // Days
        });
      
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
      
      return {
        averageDays: avgDuration,
        totalCompleted: completedLeads.length,
        durations: durations.slice(0, 100), // Return sample for distribution chart
      };
    }),
});
