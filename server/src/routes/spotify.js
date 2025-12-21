// Spotify API Routes
import { Router } from "express";
import * as spotifyService from "../services/spotifyService.js";

const router = Router();

/**
 * GET /api/spotify/status
 * Check if Spotify is configured
 */
router.get("/status", (req, res) => {
  const configured = spotifyService.isConfigured();
  res.json({
    configured,
    message: configured
      ? "Spotify is connected"
      : "Spotify requires authorization",
  });
});

/**
 * GET /api/spotify/auth
 * Get the authorization URL for OAuth flow
 */
router.get("/auth", (req, res) => {
  const authUrl = spotifyService.getAuthUrl();
  if (!authUrl) {
    return res.status(500).json({
      error: "OAuth not configured",
      message: "Spotify OAuth credentials are not set up",
    });
  }
  res.json({ authUrl });
});

/**
 * GET /api/spotify/callback
 * OAuth callback - exchange code for tokens
 */
router.get("/callback", async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: "Authorization code required" });
    }

    const tokens = await spotifyService.exchangeCode(code);

    // Display refresh token for user to add to .env
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1>Spotify Connected!</h1>
          <p>Add this refresh token to your server/.env file:</p>
          <code style="background: #f0f0f0; padding: 10px; display: block; word-break: break-all;">
            SPOTIFY_REFRESH_TOKEN=${tokens.refreshToken}
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
 * GET /api/spotify/now-playing
 * Get currently playing track
 */
router.get("/now-playing", async (req, res, next) => {
  try {
    const data = await spotifyService.getCurrentlyPlaying();
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "spotify", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/spotify/recently-played
 * Get recently played tracks
 */
router.get("/recently-played", async (req, res, next) => {
  try {
    const { limit } = req.query;
    const data = await spotifyService.getRecentlyPlayed(
      limit ? parseInt(limit) : 20
    );
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "spotify", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/spotify/top-tracks
 * Get top tracks
 */
router.get("/top-tracks", async (req, res, next) => {
  try {
    const { time_range, limit } = req.query;
    const data = await spotifyService.getTopTracks(
      time_range || "short_term",
      limit ? parseInt(limit) : 10
    );
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "spotify", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/spotify/top-artists
 * Get top artists
 */
router.get("/top-artists", async (req, res, next) => {
  try {
    const { time_range, limit } = req.query;
    const data = await spotifyService.getTopArtists(
      time_range || "short_term",
      limit ? parseInt(limit) : 10
    );
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "spotify", data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/spotify/summary
 * Get full listening summary for Fun loop
 */
router.get("/summary", async (req, res, next) => {
  try {
    const data = await spotifyService.getListeningSummary();
    if (data === null) {
      return res.json({ source: "local", data: null });
    }
    res.json({ source: "spotify", data });
  } catch (error) {
    next(error);
  }
});

export default router;
