// Spotify API Routes
import { Router } from "express";
import * as spotifyService from "../services/spotifyService.js";

const router = Router();

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Helper to extract token from Authorization header
function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// Helper to make Spotify API request with client-provided token
async function spotifyRequestWithToken(token, endpoint) {
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      return { needsReauth: true };
    }
    if (response.status === 204) {
      return null; // No content
    }
    const error = await response.text();
    throw new Error(`Spotify API error: ${error}`);
  }

  return response.json();
}

// Format track data
function formatTrackData(item) {
  const track = item.track || item;
  return {
    id: track.id,
    name: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    album: track.album?.name,
    albumArt: track.album?.images?.[0]?.url || null,
    duration: track.duration_ms,
    url: track.external_urls?.spotify,
    playedAt: item.played_at || null,
  };
}

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
 * Supports both server tokens and client-provided tokens
 */
router.get("/summary", async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (token) {
      // Use client-provided token
      const [nowPlayingResult, recentlyPlayedResult, topTracksResult, topArtistsResult] = await Promise.all([
        spotifyRequestWithToken(token, "/me/player/currently-playing").catch(() => null),
        spotifyRequestWithToken(token, "/me/player/recently-played?limit=10"),
        spotifyRequestWithToken(token, "/me/top/tracks?time_range=short_term&limit=5"),
        spotifyRequestWithToken(token, "/me/top/artists?time_range=short_term&limit=5"),
      ]);

      // Check for reauth needed
      if (recentlyPlayedResult?.needsReauth || topTracksResult?.needsReauth) {
        return res.json({ needsReauth: true });
      }

      // Parse currently playing
      let currentlyPlaying = null;
      if (nowPlayingResult && nowPlayingResult.item) {
        currentlyPlaying = {
          isPlaying: nowPlayingResult.is_playing,
          track: formatTrackData(nowPlayingResult.item),
          progress: nowPlayingResult.progress_ms,
          device: nowPlayingResult.device?.name,
        };
      }

      // Parse recently played
      const recentlyPlayed = recentlyPlayedResult?.items?.map(formatTrackData) || [];

      // Parse top tracks
      const topTracks = topTracksResult?.items?.map(formatTrackData) || [];

      // Parse top artists
      const topArtists = topArtistsResult?.items?.map((artist) => ({
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url || null,
        genres: artist.genres,
        popularity: artist.popularity,
        url: artist.external_urls?.spotify,
      })) || [];

      // Calculate stats
      let totalListeningMs = 0;
      const uniqueArtists = new Set();
      const uniqueAlbums = new Set();

      for (const track of recentlyPlayed) {
        totalListeningMs += track.duration || 0;
        uniqueArtists.add(track.artist);
        if (track.album) uniqueAlbums.add(track.album);
      }

      const summary = {
        currentlyPlaying,
        recentlyPlayed,
        topTracks,
        topArtists,
        stats: {
          totalListeningMinutes: Math.round(totalListeningMs / 60000),
          uniqueArtists: uniqueArtists.size,
          uniqueAlbums: uniqueAlbums.size,
          tracksPlayed: recentlyPlayed.length,
        },
      };

      return res.json({ source: "spotify", data: summary });
    }

    // Fall back to server-stored tokens
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
