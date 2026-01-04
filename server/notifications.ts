import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER!;

export interface NotificationPayload {
  userId: number;
  userPhone?: string;
  userEmail?: string;
  userName?: string;
  title: string;
  message: string;
  type: 'lead_assigned' | 'follow_up_ready' | 'status_change' | 'daily_digest';
  leadId?: number;
  leadAddress?: string;
}

/**
 * Send SMS notification via Twilio
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: to,
    });
    console.log(`✅ SMS sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error(`❌ SMS failed to ${to}:`, error.message);
    return false;
  }
}

/**
 * Send email notification using built-in Manus notification API
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/v1/notification/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html: body,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API returned ${response.status}`);
    }

    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    return false;
  }
}

/**
 * Send push notification using built-in Manus notification API
 */
export async function sendPushNotification(
  userId: number,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/v1/notification/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
      },
      body: JSON.stringify({
        userId,
        title,
        body,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Push API returned ${response.status}`);
    }

    console.log(`✅ Push notification sent to user ${userId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Push notification failed for user ${userId}:`, error.message);
    return false;
  }
}

/**
 * Send notification via all enabled channels
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { userId, userPhone, userEmail, userName, title, message, type, leadId, leadAddress } = payload;

  // Send push notification (always)
  await sendPushNotification(userId, title, message, {
    type,
    leadId,
    leadAddress,
  });

  // Send SMS if phone number available
  if (userPhone) {
    const smsMessage = `${title}\n\n${message}${leadAddress ? `\n\nAddress: ${leadAddress}` : ''}`;
    await sendSMS(userPhone, smsMessage);
  }

  // Send email if email available
  if (userEmail) {
    const emailBody = `
      <h2>${title}</h2>
      <p>${message}</p>
      ${leadAddress ? `<p><strong>Address:</strong> ${leadAddress}</p>` : ''}
      ${leadId ? `<p><a href="${process.env.VITE_FRONTEND_FORGE_API_URL}/leads/${leadId}">View Lead</a></p>` : ''}
      <hr>
      <p style="color: #666; font-size: 12px;">Hail Solutions Group CRM</p>
    `;
    await sendEmail(userEmail, title, emailBody);
  }
}

/**
 * Notify agent when a new lead is assigned
 */
export async function notifyNewLead(
  agentId: number,
  agentName: string,
  agentPhone: string | undefined,
  agentEmail: string | undefined,
  leadId: number,
  leadAddress: string
): Promise<void> {
  await sendNotification({
    userId: agentId,
    userName: agentName,
    userPhone: agentPhone,
    userEmail: agentEmail,
    title: '🎯 New Lead Assigned',
    message: `You have been assigned a new lead at ${leadAddress}`,
    type: 'lead_assigned',
    leadId,
    leadAddress,
  });
}

/**
 * Notify agent when follow-up cooldown expires (ready to follow up)
 */
export async function notifyFollowUpReady(
  agentId: number,
  agentName: string,
  agentPhone: string | undefined,
  agentEmail: string | undefined,
  leadId: number,
  leadAddress: string,
  customerName: string
): Promise<void> {
  await sendNotification({
    userId: agentId,
    userName: agentName,
    userPhone: agentPhone,
    userEmail: agentEmail,
    title: '⏰ Follow-up Ready',
    message: `${customerName || 'Lead'} at ${leadAddress} is ready for follow-up (72+ hours since last contact)`,
    type: 'follow_up_ready',
    leadId,
    leadAddress,
  });
}

/**
 * Notify agent when lead status changes
 */
export async function notifyStatusChange(
  agentId: number,
  agentName: string,
  agentPhone: string | undefined,
  agentEmail: string | undefined,
  leadId: number,
  leadAddress: string,
  customerName: string,
  newStatus: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    scheduled: '📅 has been scheduled for shop visit',
    in_shop: '🔧 vehicle is now in the shop',
    awaiting_pickup: '✅ vehicle is ready for pickup',
    complete: '🎉 has completed the process',
  };

  const message = statusMessages[newStatus] || `status changed to ${newStatus}`;

  await sendNotification({
    userId: agentId,
    userName: agentName,
    userPhone: agentPhone,
    userEmail: agentEmail,
    title: '📊 Status Update',
    message: `${customerName || 'Lead'} at ${leadAddress} ${message}`,
    type: 'status_change',
    leadId,
    leadAddress,
  });
}

/**
 * Send daily digest of leads needing follow-up
 */
export async function sendDailyDigest(
  agentId: number,
  agentName: string,
  agentPhone: string | undefined,
  agentEmail: string | undefined,
  leadsNeedingFollowUp: Array<{ id: number; name: string; address: string; hoursSinceLastContact: number }>
): Promise<void> {
  if (leadsNeedingFollowUp.length === 0) {
    return; // No digest if no leads need follow-up
  }

  const leadsList = leadsNeedingFollowUp
    .map(lead => `• ${lead.name || 'Unnamed'} - ${lead.address} (${Math.floor(lead.hoursSinceLastContact)}h ago)`)
    .join('\n');

  const message = `You have ${leadsNeedingFollowUp.length} lead(s) ready for follow-up:\n\n${leadsList}`;

  await sendNotification({
    userId: agentId,
    userName: agentName,
    userPhone: agentPhone,
    userEmail: agentEmail,
    title: `📋 Daily Digest - ${leadsNeedingFollowUp.length} Leads Need Follow-up`,
    message,
    type: 'daily_digest',
  });
}
