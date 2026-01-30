// Integrations Status Route - Returns configuration status for all integrations
import { Router } from "express";

const router = Router();

/**
 * GET /api/integrations/status
 * Returns which integrations are configured on the server
 */
router.get("/status", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.json({
    fitbit: {
      configured: !!(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET),
      authUrl: `/api/oauth?provider=fitbit&action=auth`,
    },
    spotify: {
      configured: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
      authUrl: `/api/oauth?provider=spotify&action=auth`,
    },
    google_calendar: {
      configured: !!(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_SECRET),
      authUrl: `/api/oauth?provider=google_calendar&action=auth`,
    },
    google_sheets: {
      // Google Sheets uses service account, not OAuth
      configured: !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.SHEETS_TILLER_ID),
      authUrl: null,
    },
    todoist: {
      // Todoist can use either OAuth or API token
      configured: !!(process.env.TODOIST_API_TOKEN || (process.env.TODOIST_CLIENT_ID && process.env.TODOIST_CLIENT_SECRET)),
      authUrl: `/api/oauth?provider=todoist&action=auth`,
      // If using API token, client doesn't need OAuth
      usesApiToken: !!process.env.TODOIST_API_TOKEN,
    },
  });
});

export default router;
