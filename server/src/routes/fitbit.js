// Fitbit API routes
import { Router } from "express";
import * as fitbitService from "../services/fitbitService.js";

const router = Router();

// Helper to extract token from Authorization header
function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// Helper to make Fitbit API request with client-provided token
async function fitbitRequestWithToken(token, endpoint) {
  const response = await fetch(`https://api.fitbit.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { needsReauth: true };
    }
    const error = await response.text();
    throw new Error(`Fitbit API error: ${error}`);
  }

  return response.json();
}

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
 * GET /api/fitbit/health
 * Get health data using client-provided access token
 * This is the main endpoint used by the client app
 */
router.get("/health", async (req, res) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      // Fall back to server-stored token
      const summary = await fitbitService.getHealthSummary();
      if (summary.error) {
        return res.json({ source: "local", data: null, message: summary.error });
      }
      return res.json({ source: "fitbit", data: summary });
    }

    // Use client-provided token
    const today = new Date().toISOString().split("T")[0];

    // Fetch activity data
    const activityResult = await fitbitRequestWithToken(
      token,
      `/1/user/-/activities/date/${today}.json`
    );
    if (activityResult.needsReauth) {
      return res.json({ needsReauth: true });
    }

    // Fetch sleep data
    const sleepResult = await fitbitRequestWithToken(
      token,
      `/1.2/user/-/sleep/date/${today}.json`
    );

    // Fetch heart rate data
    let heartRateResult = null;
    try {
      heartRateResult = await fitbitRequestWithToken(
        token,
        `/1/user/-/activities/heart/date/${today}/1d.json`
      );
    } catch {
      // Heart rate might not be available
    }

    // Parse activity data
    const activity = activityResult.summary || {};
    const steps = activity.steps || 0;
    const distanceKm = activity.distances?.find((d) => d.activity === "total")?.distance || 0;
    const caloriesBurned = activity.caloriesOut || 0;
    const activeMinutes = (activity.fairlyActiveMinutes || 0) + (activity.veryActiveMinutes || 0);
    const restingHeartRate = activity.restingHeartRate || heartRateResult?.["activities-heart"]?.[0]?.value?.restingHeartRate || null;

    // Parse sleep data
    const mainSleep = sleepResult?.sleep?.find((s) => s.isMainSleep) || sleepResult?.sleep?.[0];
    const sleepDurationHours = mainSleep ? Math.round((mainSleep.duration / 3600000) * 10) / 10 : 0;
    const sleepScore = mainSleep?.efficiency || null;
    const stages = mainSleep?.levels?.summary || {};
    const deepSleepMinutes = stages.deep?.minutes || 0;
    const remSleepMinutes = stages.rem?.minutes || 0;

    // Calculate scores
    const scores = {
      steps: steps >= 10000 ? 100 : steps >= 7500 ? 80 : steps >= 5000 ? 60 : steps >= 2500 ? 40 : 20,
      sleep: sleepScore,
      activity: activeMinutes >= 60 ? 100 : activeMinutes >= 45 ? 80 : activeMinutes >= 30 ? 60 : activeMinutes >= 15 ? 40 : 20,
      readiness: null,
    };

    // Calculate readiness as average of valid scores
    const validScores = [scores.steps, scores.sleep, scores.activity].filter((s) => s !== null);
    scores.readiness = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : null;

    const healthData = {
      today: {
        date: today,
        steps,
        distanceKm,
        caloriesBurned,
        activeMinutes,
        restingHeartRate,
        sleepDurationHours,
        sleepScore,
        deepSleepMinutes,
        remSleepMinutes,
        mindfulnessMinutes: 0, // Fitbit doesn't have this
        weightKg: null,
        scores,
      },
      heartRateZones: heartRateResult?.["activities-heart"]?.[0]?.value?.heartRateZones || [],
    };

    res.json({ source: "fitbit", data: healthData });
  } catch (err) {
    console.error("Fitbit health error:", err);
    res.status(500).json({ source: "error", error: err.message });
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
