import { getDb } from "./db";
import { leads, users } from "../drizzle/schema";
import { and, ne } from "drizzle-orm";
import { sendEmail } from "./notifications";

interface LeadDigest {
  id: number;
  customerName: string;
  address: string;
  phone: string | null;
  status: string;
  lastFollowUpAt: Date | null;
  daysSinceFollowUp: number;
  agentId: string | null;
}

interface AgentDigest {
  agentId: string;
  agentName: string;
  agentEmail: string;
  leads: LeadDigest[];
  totalLeads: number;
}

/**
 * Calculate days since last follow-up
 */
function getDaysSinceFollowUp(lastFollowUpAt: Date | null): number {
  if (!lastFollowUpAt) return 999; // No follow-up yet
  const now = new Date();
  const diffMs = now.getTime() - lastFollowUpAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get all leads needing follow-up (72+ hours since last follow-up)
 */
export async function getLeadsNeedingFollowUp(): Promise<LeadDigest[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const allLeads = await db
    .select({
      id: leads.id,
      customerName: leads.name,
      address: leads.address,
      phone: leads.phone,
      status: leads.status,
      lastFollowUpAt: leads.lastFollowUpAt,
      agentId: leads.agentId,
    })
    .from(leads);

  // Filter leads that need follow-up (72+ hours) and not complete/awaiting pickup
  const needsFollowUp: LeadDigest[] = allLeads
    .filter((lead: any) => lead.status !== "Complete" && lead.status !== "Awaiting Pickup")
    .map((lead: any) => ({
      ...lead,
      daysSinceFollowUp: getDaysSinceFollowUp(lead.lastFollowUpAt),
    }))
    .filter((lead: any) => lead.daysSinceFollowUp >= 3); // 3 days = 72 hours

  return needsFollowUp;
}

/**
 * Group leads by agent for personalized digests
 */
export async function generateAgentDigests(): Promise<AgentDigest[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const leadsNeedingFollowUp = await getLeadsNeedingFollowUp();

  // Get all agents
  const allUsers = await db.select().from(users);

  // Group leads by agent
  const agentMap = new Map<string, LeadDigest[]>();

  for (const lead of leadsNeedingFollowUp) {
    const agentId = lead.agentId || "unassigned";
    if (!agentMap.has(agentId)) {
      agentMap.set(agentId, []);
    }
    const agentLeads = agentMap.get(agentId);
    if (agentLeads) {
      agentLeads.push(lead);
    }
  }

  // Create agent digests
  const digests: AgentDigest[] = [];

  const entries = Array.from(agentMap.entries());
  for (const [agentId, agentLeads] of entries) {
    if (agentId === "unassigned") continue; // Skip unassigned leads

    const user = allUsers.find((u: any) => u.id === agentId);
    if (!user || !user.email) continue; // Skip if no email

    digests.push({
      agentId,
      agentName: user.name || "Agent",
      agentEmail: user.email,
      leads: agentLeads.sort((a: LeadDigest, b: LeadDigest) => b.daysSinceFollowUp - a.daysSinceFollowUp),
      totalLeads: agentLeads.length,
    });
  }

  return digests;
}

/**
 * Generate HTML email content for daily digest
 */
function generateDigestEmailHTML(digest: AgentDigest, appUrl: string): string {
  const leadsHTML = digest.leads
    .map(
      (lead) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px;">
        <strong>${lead.customerName || "Unknown"}</strong><br/>
        <span style="color: #6b7280; font-size: 14px;">${lead.address}</span>
      </td>
      <td style="padding: 12px 8px; color: #6b7280;">
        ${lead.phone || "No phone"}
      </td>
      <td style="padding: 12px 8px;">
        <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          ${lead.status}
        </span>
      </td>
      <td style="padding: 12px 8px; color: #dc2626; font-weight: 600;">
        ${lead.daysSinceFollowUp} days ago
      </td>
      <td style="padding: 12px 8px;">
        <a href="${appUrl}/leads/${lead.id}" style="background: #3b82f6; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 14px;">
          View Lead
        </a>
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Lead Follow-up Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 24px;">
    <h1 style="margin: 0 0 8px 0; font-size: 28px;">Good Morning, ${digest.agentName}! ☀️</h1>
    <p style="margin: 0; font-size: 16px; opacity: 0.9;">Your daily follow-up digest for ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
  </div>

  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #1f2937;">📊 Summary</h2>
    <p style="margin: 0; font-size: 16px;">
      You have <strong style="color: #dc2626; font-size: 24px;">${digest.totalLeads}</strong> lead${digest.totalLeads !== 1 ? "s" : ""} ready for follow-up today.
    </p>
    <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
      These leads haven't been contacted in 72+ hours and are ready for your attention.
    </p>
  </div>

  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
    <div style="background: #f9fafb; padding: 16px; border-bottom: 1px solid #e5e7eb;">
      <h2 style="margin: 0; font-size: 18px; color: #1f2937;">🎯 Leads Needing Follow-up</h2>
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 14px;">Customer</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 14px;">Phone</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 14px;">Status</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 14px;">Last Contact</th>
          <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #6b7280; font-size: 14px;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${leadsHTML}
      </tbody>
    </table>
  </div>

  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #1e40af;">
      💡 <strong>Tip:</strong> Leads contacted within 24-48 hours have a 3x higher conversion rate. Start with the oldest leads first!
    </p>
  </div>

  <div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb;">
    <a href="${appUrl}/leads" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 12px;">
      View All Leads
    </a>
    <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">
      Hail Solutions Group CRM • <a href="${appUrl}/notifications" style="color: #3b82f6; text-decoration: none;">Manage Email Preferences</a>
    </p>
  </div>

</body>
</html>
  `;
}

/**
 * Send daily digest emails to all agents
 */
export async function sendDailyDigests(): Promise<void> {
  console.log("[Daily Digest] Starting daily digest generation...");

  try {
    const digests = await generateAgentDigests();

    console.log(`[Daily Digest] Generated ${digests.length} agent digests`);

    const appUrl = process.env.VITE_APP_URL || "https://3000-izwzg4y77byi4vsxpzjkw-5206bc48.manusvm.computer";

    for (const digest of digests) {
      if (digest.totalLeads === 0) {
        console.log(`[Daily Digest] Skipping ${digest.agentName} - no leads needing follow-up`);
        continue;
      }

      const emailHTML = generateDigestEmailHTML(digest, appUrl);

      await sendEmail(
        digest.agentEmail,
        `🌅 Daily Digest: ${digest.totalLeads} Lead${digest.totalLeads !== 1 ? "s" : ""} Need Follow-up`,
        emailHTML
      );

      console.log(`[Daily Digest] Sent digest to ${digest.agentName} (${digest.agentEmail}) - ${digest.totalLeads} leads`);
    }

    console.log("[Daily Digest] Daily digest emails sent successfully");
  } catch (error) {
    console.error("[Daily Digest] Error sending daily digests:", error);
    throw error;
  }
}
