// Calendar Widget - Displays Google Calendar events
// Shows today's events and upcoming events for the loop

import React, { useEffect, useState } from "react";
import { useApp } from "../../context";
import {
  CalendarEvent,
  CalendarInfo,
  LoopId,
  formatEventTime,
  formatEventDuration,
  getEventsForLoop,
  getTodaysEvents,
  getUpcomingEvents,
} from "../../types";

const API_BASE = "/api";

interface CalendarWidgetProps {
  loop?: LoopId;
  daysAhead?: number;
}

export function CalendarWidget({ loop, daysAhead = 7 }: CalendarWidgetProps) {
  const { state, dispatch } = useApp();
  const { events, calendars, loading, error, lastFetched } = state.calendar;

  const [view, setView] = useState<"today" | "upcoming">("today");
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Check connection status
  useEffect(() => {
    checkStatus();
  }, []);

  // Fetch events on mount and when connected
  useEffect(() => {
    if (isConnected) {
      fetchEvents();
    }
  }, [isConnected]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/calendar/status`);
      const data = await res.json();
      setIsConnected(data.configured);
    } catch (err) {
      setIsConnected(false);
    }
  };

  const fetchEvents = async () => {
    dispatch({ type: "SET_CALENDAR_LOADING", payload: true });

    try {
      // Fetch events
      const eventsRes = await fetch(`${API_BASE}/calendar/week`);
      const eventsData = await eventsRes.json();

      if (eventsData.source === "google" && eventsData.data) {
        dispatch({ type: "SET_CALENDAR_EVENTS", payload: eventsData.data });
      }

      // Fetch calendars list
      const calendarsRes = await fetch(`${API_BASE}/calendar/calendars`);
      const calendarsData = await calendarsRes.json();

      if (calendarsData.source === "google" && calendarsData.data) {
        dispatch({ type: "SET_CALENDAR_CALENDARS", payload: calendarsData.data });
      }
    } catch (err) {
      dispatch({
        type: "SET_CALENDAR_ERROR",
        payload: err instanceof Error ? err.message : "Failed to fetch calendar",
      });
    }
  };

  const handleConnect = async () => {
    try {
      const res = await fetch(`${API_BASE}/calendar/auth`);
      const data = await res.json();
      if (data.authUrl) {
        window.open(data.authUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to get auth URL:", err);
    }
  };

  // Filter events for this loop if specified
  const filteredEvents = loop ? getEventsForLoop(events, loop) : events;
  const todaysEvents = getTodaysEvents(filteredEvents);
  const upcomingEvents = getUpcomingEvents(filteredEvents, daysAhead);

  // Not connected state
  if (isConnected === false) {
    return (
      <div className="calendar-widget calendar-widget--disconnected">
        <div className="calendar-widget-empty">
          <span className="calendar-widget-empty-icon">📅</span>
          <p>Connect Google Calendar to see your events</p>
          <button className="calendar-widget-connect-btn" onClick={handleConnect}>
            Connect Calendar
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || isConnected === null) {
    return (
      <div className="calendar-widget calendar-widget--loading">
        <div className="calendar-widget-loading">
          <div className="calendar-widget-spinner" />
          <span>Loading calendar...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="calendar-widget calendar-widget--error">
        <div className="calendar-widget-error">
          <span className="calendar-widget-error-icon">!</span>
          <p>{error}</p>
          <button className="calendar-widget-retry-btn" onClick={fetchEvents}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayEvents = view === "today" ? todaysEvents : upcomingEvents;

  return (
    <div className="calendar-widget">
      {/* View Toggle */}
      <div className="calendar-widget-tabs">
        <button
          className={`calendar-widget-tab ${view === "today" ? "active" : ""}`}
          onClick={() => setView("today")}
        >
          Today ({todaysEvents.length})
        </button>
        <button
          className={`calendar-widget-tab ${view === "upcoming" ? "active" : ""}`}
          onClick={() => setView("upcoming")}
        >
          Upcoming
        </button>
      </div>

      {/* Events List */}
      <div className="calendar-widget-events">
        {displayEvents.length === 0 ? (
          <div className="calendar-widget-no-events">
            <span>No {view === "today" ? "events today" : "upcoming events"}</span>
          </div>
        ) : (
          displayEvents.map((event) => (
            <CalendarEventCard key={event.id} event={event} showDate={view === "upcoming"} />
          ))
        )}
      </div>

      {/* Last synced */}
      {lastFetched && (
        <div className="calendar-widget-footer">
          <span className="calendar-widget-synced">
            Synced {formatRelativeTime(lastFetched)}
          </span>
          <button className="calendar-widget-refresh" onClick={fetchEvents} title="Refresh">
            ↻
          </button>
        </div>
      )}
    </div>
  );
}

// Individual event card
function CalendarEventCard({
  event,
  showDate,
}: {
  event: CalendarEvent;
  showDate: boolean;
}) {
  const eventDate = new Date(event.startTime);
  const isToday = new Date().toDateString() === eventDate.toDateString();

  return (
    <div className="calendar-event-card">
      <div className="calendar-event-time">
        {showDate && !isToday && (
          <span className="calendar-event-date">
            {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        )}
        <span className="calendar-event-hour">{formatEventTime(event)}</span>
        <span className="calendar-event-duration">{formatEventDuration(event)}</span>
      </div>
      <div className="calendar-event-details">
        <span className="calendar-event-title">{event.title}</span>
        {event.location && (
          <span className="calendar-event-location">📍 {event.location}</span>
        )}
        <span className="calendar-event-calendar">{event.calendarName}</span>
      </div>
      {event.color && (
        <div
          className="calendar-event-color"
          style={{ backgroundColor: event.color }}
        />
      )}
    </div>
  );
}

// Helper to format relative time
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
}

export default CalendarWidget;
