// Consolidated Calendar API endpoint
// Handles: status, week (events), calendars list
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  description?: string;
  calendarId: string;
  calendarName: string;
  color?: string;
  loop: string;
  recurring: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

// Map calendar name to loop
function mapCalendarToLoop(calendarName: string): string {
  const name = calendarName.toLowerCase();
  if (name.includes('health') || name.includes('fitness') || name.includes('workout') || name.includes('medical') || name.includes('doctor')) return 'Health';
  if (name.includes('wealth') || name.includes('finance') || name.includes('investment') || name.includes('money')) return 'Wealth';
  if (name.includes('family') || name.includes('kids') || name.includes('birthday') || name.includes('school')) return 'Family';
  if (name.includes('work') || name.includes('meeting') || name.includes('business') || name.includes('project')) return 'Work';
  if (name.includes('fun') || name.includes('entertainment') || name.includes('social') || name.includes('hobby')) return 'Fun';
  if (name.includes('meaning') || name.includes('personal growth') || name.includes('volunteer') || name.includes('spiritual')) return 'Meaning';
  return 'Maintenance';
}

interface CalendarInfo {
  id: string;
  name: string;
  color?: string;
  primary: boolean;
  accessRole: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string || 'status';

  // Get access token from Authorization header
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Status check
  if (action === 'status') {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const isConfigured = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

    return res.json({
      configured: isConfigured && !!accessToken,
      backendConfigured: isConfigured,
      hasToken: !!accessToken,
    });
  }

  // All other actions require auth
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authorized', source: 'local' });
  }

  // Fetch week events
  if (action === 'week') {
    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

      // Get list of calendars
      const calendarsResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!calendarsResponse.ok) {
        if (calendarsResponse.status === 401) {
          return res.json({ needsReauth: true, source: 'local' });
        }
        throw new Error(`Calendar API error: ${calendarsResponse.status}`);
      }

      const calendarsData = await calendarsResponse.json();
      const calendars = calendarsData.items || [];

      // Fetch events from each calendar
      const allEvents: CalendarEvent[] = [];

      for (const calendar of calendars) {
        if (calendar.accessRole === 'freeBusyReader') continue;

        try {
          const eventsResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?` +
            new URLSearchParams({
              timeMin,
              timeMax,
              singleEvents: 'true',
              orderBy: 'startTime',
              maxResults: '50',
            }),
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            const events = eventsData.items || [];

            for (const event of events) {
              if (event.status === 'cancelled') continue;

              const isAllDay = !!event.start?.date;
              const calendarName = calendar.summary || 'Calendar';
              allEvents.push({
                id: event.id,
                title: event.summary || '(No title)',
                startTime: isAllDay ? event.start.date : event.start.dateTime,
                endTime: isAllDay ? event.end.date : event.end.dateTime,
                allDay: isAllDay,
                location: event.location,
                description: event.description,
                calendarId: calendar.id,
                calendarName,
                color: calendar.backgroundColor,
                loop: mapCalendarToLoop(calendarName),
                recurring: !!event.recurringEventId,
                status: event.status || 'confirmed',
              });
            }
          }
        } catch (err) {
          console.error(`Failed to fetch events from calendar ${calendar.id}:`, err);
        }
      }

      allEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      return res.json({
        source: 'google',
        data: allEvents,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Calendar fetch error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch calendar',
        source: 'local',
      });
    }
  }

  // Fetch calendars list
  if (action === 'calendars') {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        if (response.status === 401) {
          return res.json({ needsReauth: true, source: 'local' });
        }
        throw new Error(`Calendar API error: ${response.status}`);
      }

      const data = await response.json();
      const calendars: CalendarInfo[] = (data.items || []).map((cal: any) => ({
        id: cal.id,
        name: cal.summary || 'Untitled',
        color: cal.backgroundColor,
        primary: cal.primary || false,
        accessRole: cal.accessRole,
      }));

      calendars.sort((a, b) => {
        if (a.primary && !b.primary) return -1;
        if (!a.primary && b.primary) return 1;
        return a.name.localeCompare(b.name);
      });

      return res.json({
        source: 'google',
        data: calendars,
      });
    } catch (error) {
      console.error('Calendars fetch error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch calendars',
        source: 'local',
      });
    }
  }

  res.status(400).json({ error: 'Unknown action' });
}
