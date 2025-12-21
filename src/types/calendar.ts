// Calendar Types - Google Calendar Integration
// Maps calendar events to loops based on calendar name

import { LoopId } from "./loops";

// =============================================================================
// CALENDAR EVENT TYPES
// =============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  allDay: boolean;
  location?: string;
  calendarId: string;
  calendarName: string;
  loop: LoopId;
  color?: string;
  recurring: boolean;
  status: "confirmed" | "tentative" | "cancelled";
}

export interface CalendarState {
  events: CalendarEvent[];
  calendars: CalendarInfo[];
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

export interface CalendarInfo {
  id: string;
  name: string;
  color: string;
  loop: LoopId;
  visible: boolean;
}

// =============================================================================
// CALENDAR → LOOP MAPPING
// =============================================================================

// Default calendar name to loop mapping
// User can customize this in settings
export const DEFAULT_CALENDAR_MAPPING: Record<string, LoopId> = {
  // Health
  Health: "Health",
  Fitness: "Health",
  Workouts: "Health",
  "Doctor Appointments": "Health",
  Medical: "Health",

  // Wealth
  Wealth: "Wealth",
  Finance: "Wealth",
  "Financial Planning": "Wealth",
  Investments: "Wealth",

  // Family
  Family: "Family",
  Kids: "Family",
  "Family Events": "Family",
  Birthdays: "Family",
  School: "Family",

  // Work
  Work: "Work",
  "Work Calendar": "Work",
  Meetings: "Work",
  "Business Calendar": "Work",
  Projects: "Work",

  // Fun
  Fun: "Fun",
  Entertainment: "Fun",
  Social: "Fun",
  Hobbies: "Fun",
  Events: "Fun",

  // Maintenance
  Maintenance: "Maintenance",
  Home: "Maintenance",
  "Home Maintenance": "Maintenance",
  Errands: "Maintenance",
  Chores: "Maintenance",
  Bills: "Maintenance",

  // Meaning
  Meaning: "Meaning",
  "Personal Growth": "Meaning",
  Volunteering: "Meaning",
  Spiritual: "Meaning",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function mapCalendarToLoop(
  calendarName: string,
  customMapping?: Record<string, LoopId>
): LoopId {
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

  // Default to Maintenance if no match
  return "Maintenance";
}

export function getEventsForLoop(
  events: CalendarEvent[],
  loop: LoopId
): CalendarEvent[] {
  return events.filter((e) => e.loop === loop && e.status !== "cancelled");
}

export function getEventsForDate(
  events: CalendarEvent[],
  date: string // YYYY-MM-DD
): CalendarEvent[] {
  return events.filter((e) => {
    const eventDate = e.startTime.split("T")[0];
    return eventDate === date && e.status !== "cancelled";
  });
}

export function getUpcomingEvents(
  events: CalendarEvent[],
  days: number = 7
): CalendarEvent[] {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return events
    .filter((e) => {
      const eventDate = new Date(e.startTime);
      return (
        eventDate >= now && eventDate <= future && e.status !== "cancelled"
      );
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function getTodaysEvents(events: CalendarEvent[]): CalendarEvent[] {
  const today = new Date().toISOString().split("T")[0];
  return getEventsForDate(events, today).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

export function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) {
    return "All day";
  }

  const start = new Date(event.startTime);
  const hours = start.getHours();
  const minutes = start.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${ampm}`;
}

export function formatEventDuration(event: CalendarEvent): string {
  if (event.allDay) {
    return "All day";
  }

  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.round(durationMs / (1000 * 60));

  if (durationMinutes < 60) {
    return `${durationMinutes}m`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

// =============================================================================
// DEFAULT STATE
// =============================================================================

export const defaultCalendarState: CalendarState = {
  events: [],
  calendars: [],
  loading: false,
  error: null,
  lastFetched: null,
};
