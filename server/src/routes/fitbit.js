// Fitbit API routes
import { Router } from "express";
import * as fitbitService from "../services/fitbitService.js";

const router = Router();

/**
 * GET /api/fitbit/status
 * Check if Fitbit is configured and authorized
 */
router.get("/status", (req, res) => {
  res.json({
    configured: fitbitService.isConfigured(),
    authorized: fitbitService.isAuthorized(),
  });
});

/**
 * GET /api/fitbit/auth
 * Redirect to Fitbit OAuth authorization
 */
router.get("/auth", (req, res) => {
  if (!fitbitService.isConfigured()) {
    return res.status(500).json({
      error: "Fitbit not configured. Set FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET in .env",
    });
  }

  const redirectUri = `${req.protocol}://${req.get("host")}/api/fitbit/callback`;
  const authUrl = fitbitService.getAuthUrl(redirectUri);
  res.redirect(authUrl);
});

/**
 * GET /api/fitbit/callback
 * OAuth callback - exchange code for tokens
 */
router.get("/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`Authorization failed: ${error}`);
  }

  if (!code) {
    return res.status(400).send("No authorization code received");
  }

  try {
    const redirectUri = `${req.protocol}://${req.get("host")}/api/fitbit/callback`;
    const tokens = await fitbitService.exchangeCodeForTokens(code, redirectUri);

    // Display the refresh token for the user to save
    res.send(`
      <html>
        <head>
          <title>Fitbit Connected!</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { color: #22c55e; }
            .token { background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; margin: 10px 0; }
            code { font-size: 12px; }
          </style>
        </head>
        <body>
          <h1 class="success">Fitbit Connected Successfully!</h1>
          <p>Your Fitbit account is now linked to Looops.</p>
          <p><strong>Important:</strong> Save this refresh token to your <code>.env</code> file:</p>
          <div class="token">
            <code>FITBIT_REFRESH_TOKEN=${tokens.refreshToken}</code>
          </div>
          <p>After saving, the connection will persist across server restarts.</p>
          <p><a href="/api/fitbit/summary">View your health data</a></p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Fitbit callback error:", err);
    res.status(500).send(`Failed to complete authorization: ${err.message}`);
  }
});

/**
 * GET /api/fitbit/summary
 * Get comprehensive health summary
 */
router.get("/summary", async (req, res) => {
  try {
    const summary = await fitbitService.getHealthSummary();
    res.json(summary);
  } catch (err) {
    console.error("Fitbit summary error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fitbit/activity
 * Get today's activity data
 */
router.get("/activity", async (req, res) => {
  try {
    const activity = await fitbitService.getTodayActivity();
    res.json(activity);
  } catch (err) {
    console.error("Fitbit activity error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fitbit/sleep
 * Get today's sleep data
 */
router.get("/sleep", async (req, res) => {
  try {
    const sleep = await fitbitService.getTodaySleep();
    res.json(sleep);
  } catch (err) {
    console.error("Fitbit sleep error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fitbit/heartrate
 * Get today's heart rate data
 */
router.get("/heartrate", async (req, res) => {
  try {
    const heartRate = await fitbitService.getTodayHeartRate();
    res.json(heartRate);
  } catch (err) {
    console.error("Fitbit heart rate error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fitbit/weight
 * Get latest weight data
 */
router.get("/weight", async (req, res) => {
  try {
    const weight = await fitbitService.getLatestWeight();
    res.json(weight || { message: "No weight data available" });
  } catch (err) {
    console.error("Fitbit weight error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fitbit/week
 * Get weekly activity summary
 */
router.get("/week", async (req, res) => {
  try {
    const weekData = await fitbitService.getWeekActivity();
    res.json(weekData);
  } catch (err) {
    console.error("Fitbit week error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
