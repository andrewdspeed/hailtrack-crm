import { google } from 'googleapis';

const GOOGLE_CLIENT_ID = "1063441965110-la0j4ev77redn95uto6lbc2jsste4qdr.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";

// This will be dynamically set based on the request origin
let REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

export function getOAuth2Client(redirectUri?: string) {
  if (redirectUri) {
    REDIRECT_URI = redirectUri;
  }
  
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

/**
 * Generate Google OAuth URL for user to authorize calendar access
 */
export function getAuthUrl(redirectUri: string): string {
  const oauth2Client = getOAuth2Client(redirectUri);
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    prompt: 'consent'
  });
}

/**
 * Exchange authorization code for access token
 */
export async function getTokensFromCode(code: string, redirectUri: string) {
  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Create a calendar event for a scheduled lead
 */
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string | null | undefined,
  leadData: {
    customerName: string;
    address: string;
    phone?: string;
    vehicleInfo?: string;
    appointmentType: string;
    scheduledDate: Date;
    duration?: number; // in minutes, default 60
    notes?: string;
  }
): Promise<{ eventId: string; eventLink: string }> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const startTime = leadData.scheduledDate;
  const endTime = new Date(startTime.getTime() + (leadData.duration || 60) * 60000);

  const event = {
    summary: `${leadData.appointmentType}: ${leadData.customerName}`,
    location: leadData.address,
    description: `
Customer: ${leadData.customerName}
Phone: ${leadData.phone || 'N/A'}
Vehicle: ${leadData.vehicleInfo || 'N/A'}
${leadData.notes ? `\nNotes: ${leadData.notes}` : ''}

--- Hail Solutions Group CRM ---
    `.trim(),
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'America/Chicago',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/Chicago',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 }, // 30 minutes before
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return {
    eventId: response.data.id!,
    eventLink: response.data.htmlLink!,
  };
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string | null | undefined,
  eventId: string,
  updates: {
    scheduledDate?: Date;
    duration?: number;
    notes?: string;
  }
): Promise<void> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event: any = {};

  if (updates.scheduledDate) {
    const startTime = updates.scheduledDate;
    const endTime = new Date(startTime.getTime() + (updates.duration || 60) * 60000);
    
    event.start = {
      dateTime: startTime.toISOString(),
      timeZone: 'America/Chicago',
    };
    event.end = {
      dateTime: endTime.toISOString(),
      timeZone: 'America/Chicago',
    };
  }

  if (updates.notes) {
    event.description = updates.notes;
  }

  await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: event,
  });
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string | null | undefined,
  eventId: string
): Promise<void> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

/**
 * List upcoming calendar events
 */
export async function listUpcomingEvents(
  accessToken: string,
  refreshToken: string | null | undefined,
  maxResults: number = 10
) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}
