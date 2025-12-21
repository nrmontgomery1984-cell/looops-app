// Calendar Service - Google Calendar Integration
// Uses OAuth2 for user-authorized access to Google Calendar

import { google } from "googleapis";

// OAuth2 client setup
// Note: Requires user to complete OAuth flow once to get refresh token
let oauth2Client = null;
let calendarApi = null;

// Calendar to Loop mapping (can be customized via settings)
const DEFAULT_CALENDAR_MAPPING = {
  Health: "Health",
  Fitness: "Health",
  Workouts: "Health",
  "Doctor Appointments": "Health",
  Medical: "Health",
  Wealth: "Wealth",
  Finance: "Wealth",
  Family: "Family",
  Kids: "Family",
  School: "Family",
  Work: "Work",
  Meetings: "Work",
  Fun: "Fun",
  Entertainment: "Fun",
  Social: "Fun",
  Maintenance: "Maintenance",
  Home: "Maintenance",
  Errands: "Maintenance",
  Meaning: "Meaning",
  "Personal Growth": "Meaning",
};

/**
 * Initialize OAuth2 client with credentials
 */
function initializeOAuth() {
  if (oauth2Client) return oauth2Client;

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    console.warn("Google Calendar OAuth credentials not configured");
    return null;
  }

  oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost:3001/api/calendar/callback"
  );

  if (refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    calendarApi = google.calendar({ version: "v3", auth: oauth2Client });
  }

  return oauth2Client;
}

/**
 * Get the authorization URL for OAuth flow
 */
export function getAuthUrl() {
  const client = initializeOAuth();
  if (!client) return null;

  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
  ];

  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCode(code) {
  const client = initializeOAuth();
  if (!client) throw new Error("OAuth client not configured");

  const { tokens } = await client.getToken(code);
  oauth2Client.setCredentials(tokens);
  calendarApi = google.calendar({ version: "v3", auth: oauth2Client });

  return {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
    expiresAt: tokens.expiry_date,
  };
}

/**
 * Check if calendar API is configured and authorized
 */
export function isConfigured() {
  initializeOAuth();
  return calendarApi !== null;
}

/**
 * Map calendar name to loop
 */
function mapCalendarToLoop(calendarName, customMapping = {}) {
  const mapping = { ...DEFAULT_CALENDAR_MAPPING, ...customMapping };

  // Exact match
  if (mapping[calendarName]) {
    return mapping[calendarName];
  }

  // Case-insensitive match
  const lowerName = calendarName.toLowerCase();
  for (const [key, loop] of Object.entries(mapping)) {
    if (key.toLowerCase() === lowerName) {
      return loop;
    }
  }

  // Partial match
  for (const [key, loop] of Object.entries(mapping)) {
    if (
      lowerName.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(lowerName)
    ) {
      return loop;
    }
  }

  // Default to Maintenance
  return "Maintenance";
}

/**
 * Get list of user's calendars
 */
export async function getCalendarList() {
  if (!calendarApi) {
    initializeOAuth();
    if (!calendarApi) return null;
  }

  try {
    const response = await calendarApi.calendarList.list();
    const calendars = response.data.items || [];

    return calendars.map((cal) => ({
      id: cal.id,
      name: cal.summary,
      color: cal.backgroundColor || "#4285f4",
      loop: mapCalendarToLoop(cal.summary),
      visible: true,
      primary: cal.primary || false,
    }));
  } catch (error) {
    console.error("Error fetching calendar list:", error.message);
    throw error;
  }
}

/**
 * Get events from all calendars for a date range
 */
export async function getEvents({
  startDate,
  endDate,
  calendarIds,
  customMapping,
} = {}) {
  if (!calendarApi) {
    initializeOAuth();
    if (!calendarApi) return null;
  }

  try {
    // Default to today + 7 days
    const timeMin = startDate
      ? new Date(startDate).toISOString()
      : new Date().toISOString();

    const timeMaxDate = endDate
      ? new Date(endDate)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const timeMax = timeMaxDate.toISOString();

    // Get list of calendars if not specified
    let calendars;
    if (calendarIds && calendarIds.length > 0) {
      calendars = calendarIds.map((id) => ({ id }));
    } else {
      const calendarList = await getCalendarList();
      calendars = calendarList || [];
    }

    // Fetch events from each calendar
    const allEvents = [];

    for (const calendar of calendars) {
      try {
        const response = await calendarApi.events.list({
          calendarId: calendar.id,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 100,
        });

        const events = response.data.items || [];
        const calendarInfo = await calendarApi.calendars.get({
          calendarId: calendar.id,
        });
        const calendarName = calendarInfo.data.summary;

        for (const event of events) {
          if (event.status === "cancelled") continue;

          const startTime = event.start.dateTime || event.start.date;
          const endTime = event.end.dateTime || event.end.date;
          const isAllDay = !event.start.dateTime;

          allEvents.push({
            id: event.id,
            title: event.summary || "(No title)",
            description: event.description || "",
            startTime,
            endTime,
            allDay: isAllDay,
            location: event.location || "",
            calendarId: calendar.id,
            calendarName,
            loop: mapCalendarToLoop(calendarName, customMapping),
            color: event.colorId ? getEventColor(event.colorId) : null,
            recurring: !!event.recurringEventId,
            status: event.status || "confirmed",
          });
        }
      } catch (calError) {
        console.warn(
          `Error fetching events from calendar ${calendar.id}:`,
          calError.message
        );
      }
    }

    // Sort all events by start time
    allEvents.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return allEvents;
  } catch (error) {
    console.error("Error fetching calendar events:", error.message);
    throw error;
  }
}

/**
 * Get today's events
 */
export async function getTodayEvents(customMapping) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getEvents({
    startDate: today.toISOString(),
    endDate: tomorrow.toISOString(),
    customMapping,
  });
}

/**
 * Get this week's events
 */
export async function getWeekEvents(customMapping) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return getEvents({
    startDate: today.toISOString(),
    endDate: nextWeek.toISOString(),
    customMapping,
  });
}

/**
 * Get events for a specific loop
 */
export async function getEventsForLoop(loopId, days = 7) {
  const events = await getEvents({
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (!events) return null;

  return events.filter((e) => e.loop === loopId);
}

/**
 * Map Google Calendar color IDs to hex colors
 */
function getEventColor(colorId) {
  const colors = {
    "1": "#7986cb", // Lavender
    "2": "#33b679", // Sage
    "3": "#8e24aa", // Grape
    "4": "#e67c73", // Flamingo
    "5": "#f6c026", // Banana
    "6": "#f5511d", // Tangerine
    "7": "#039be5", // Peacock
    "8": "#616161", // Graphite
    "9": "#3f51b5", // Blueberry
    "10": "#0b8043", // Basil
    "11": "#d60000", // Tomato
  };
  return colors[colorId] || null;
}

export default {
  isConfigured,
  getAuthUrl,
  exchangeCode,
  getCalendarList,
  getEvents,
  getTodayEvents,
  getWeekEvents,
  getEventsForLoop,
};
