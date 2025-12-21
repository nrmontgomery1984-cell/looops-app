// Calendar API Routes - Google Calendar Integration
import { Router } from "express";
import * as calendarService from "../services/calendarService.js";

const router = Router();

/**
 * GET /api/calendar/status
 * Check if Google Calendar is configured and authorized
 */
router.get("/status", (req, res) => {
  const configured = calendarService.isConfigured();
  res.json({
    configured,
    message: configured
      ? "Google Calendar is connected"
      : "Google Calendar requires authorization",
  });
});

/**
 * GET /api/calendar/auth
 * Get the authorization URL for OAuth flow
 */
router.get("/auth", (req, res) => {
  const authUrl = calendarService.getAuthUrl();
  if (!authUrl) {
    return res.status(500).json({
      error: "OAuth not configured",
      message: "Google Calendar OAuth credentials are not set up",
    });
  }
  res.json({ authUrl });
});

/**
 * GET /api/calendar/callback
 * OAuth callback - exchange code for tokens
 */
router.get("/callback", async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: "Authorization code required" });
    }

    const tokens = await calendarService.exchangeCode(code);

    // In production, you'd save the refresh token securely
    // For now, display it so user can add to .env
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1>Google Calendar Connected!</h1>
          <p>Add this refresh token to your server/.env file:</p>
          <code style="background: #f0f0f0; padding: 10px; display: block; word-break: break-all;">
            GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refreshToken}
          </code>
          <p style="margin-top: 20px;">Then restart the server.</p>
          <p><a href="http://localhost:5173">Return to Looops</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/calendars
 * Get list of user's calendars
 */
router.get("/calendars", async (req, res, next) => {
  try {
    const calendars = await calendarService.getCalendarList();
    if (calendars === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "google", data: calendars });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/events
 * Get events from all calendars
 * Query params: startDate, endDate, loop (optional filter)
 */
router.get("/events", async (req, res, next) => {
  try {
    const { startDate, endDate, loop } = req.query;

    let events = await calendarService.getEvents({ startDate, endDate });
    if (events === null) {
      return res.json({ source: "local", data: null });
    }

    // Filter by loop if specified
    if (loop) {
      events = events.filter((e) => e.loop === loop);
    }

    res.json({ source: "google", data: events });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/today
 * Get today's events
 */
router.get("/today", async (req, res, next) => {
  try {
    const events = await calendarService.getTodayEvents();
    if (events === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "google", data: events });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/week
 * Get this week's events
 */
router.get("/week", async (req, res, next) => {
  try {
    const events = await calendarService.getWeekEvents();
    if (events === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "google", data: events });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calendar/loop/:loopId
 * Get events for a specific loop
 */
router.get("/loop/:loopId", async (req, res, next) => {
  try {
    const { loopId } = req.params;
    const { days } = req.query;

    const events = await calendarService.getEventsForLoop(
      loopId,
      days ? parseInt(days) : 7
    );

    if (events === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "google", data: events });
  } catch (error) {
    next(error);
  }
});

export default router;
