// OAuth Routes - Unified OAuth handler for all integrations
// Handles auth initiation and callbacks, returns tokens to client
import { Router } from "express";

const router = Router();

// Client URL for redirects after OAuth
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ============ Fitbit OAuth ============

function getFitbitAuthUrl(redirectUri) {
  const clientId = process.env.FITBIT_CLIENT_ID;
  if (!clientId) return null;

  const scopes = ["activity", "heartrate", "sleep", "weight", "profile"].join(" ");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    expires_in: "604800",
  });

  return `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
}

async function exchangeFitbitCode(code, redirectUri) {
  const clientId = process.env.FITBIT_CLIENT_ID;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fitbit token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    user_id: data.user_id,
  };
}

// ============ Spotify OAuth ============

function getSpotifyAuthUrl(redirectUri) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) return null;

  const scopes = [
    "user-read-recently-played",
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-top-read",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

async function exchangeSpotifyCode(code, redirectUri) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

// ============ Google Calendar OAuth ============

function getGoogleCalendarAuthUrl(redirectUri) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  if (!clientId) return null;

  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeGoogleCode(code, redirectUri) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

// ============ Todoist OAuth ============

function getTodoistAuthUrl(redirectUri) {
  const clientId = process.env.TODOIST_CLIENT_ID;
  // Todoist also supports API token auth (simpler, no OAuth needed)
  if (!clientId && process.env.TODOIST_API_TOKEN) {
    // Return null - we'll use API token instead
    return null;
  }
  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "data:read_write,data:delete",
    state: "looops",
  });

  return `https://todoist.com/oauth/authorize?${params.toString()}`;
}

async function exchangeTodoistCode(code, redirectUri) {
  const clientId = process.env.TODOIST_CLIENT_ID;
  const clientSecret = process.env.TODOIST_CLIENT_SECRET;

  const response = await fetch("https://todoist.com/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Todoist token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    // Todoist tokens don't expire
    expires_in: null,
  };
}

// ============ Route Handlers ============

// GET /api/oauth?provider=X&action=auth - Redirect to OAuth provider
router.get("/", async (req, res) => {
  const { provider, action } = req.query;

  if (action !== "auth") {
    return res.status(400).json({ error: "Invalid action" });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${baseUrl}/api/oauth/callback/${provider}`;

  let authUrl;
  switch (provider) {
    case "fitbit":
      authUrl = getFitbitAuthUrl(redirectUri);
      break;
    case "spotify":
      authUrl = getSpotifyAuthUrl(redirectUri);
      break;
    case "google_calendar":
      authUrl = getGoogleCalendarAuthUrl(redirectUri);
      break;
    case "todoist":
      authUrl = getTodoistAuthUrl(redirectUri);
      // If using API token, redirect with pre-filled token
      if (!authUrl && process.env.TODOIST_API_TOKEN) {
        const params = new URLSearchParams({
          integration: "todoist",
          success: "true",
          access_token: process.env.TODOIST_API_TOKEN,
        });
        return res.redirect(`${CLIENT_URL}/integrations?${params.toString()}`);
      }
      break;
    default:
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
  }

  if (!authUrl) {
    return res.status(500).json({ error: `${provider} not configured on server` });
  }

  res.redirect(authUrl);
});

// GET /api/oauth/callback/:provider - Handle OAuth callback
router.get("/callback/:provider", async (req, res) => {
  const { provider } = req.params;
  const { code, error } = req.query;

  if (error) {
    const params = new URLSearchParams({
      integration: provider,
      success: "false",
      error: error.toString(),
    });
    return res.redirect(`${CLIENT_URL}/integrations?${params.toString()}`);
  }

  if (!code) {
    const params = new URLSearchParams({
      integration: provider,
      success: "false",
      error: "No authorization code received",
    });
    return res.redirect(`${CLIENT_URL}/integrations?${params.toString()}`);
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${baseUrl}/api/oauth/callback/${provider}`;

  try {
    let tokens;
    switch (provider) {
      case "fitbit":
        tokens = await exchangeFitbitCode(code, redirectUri);
        break;
      case "spotify":
        tokens = await exchangeSpotifyCode(code, redirectUri);
        break;
      case "google_calendar":
        tokens = await exchangeGoogleCode(code, redirectUri);
        break;
      case "todoist":
        tokens = await exchangeTodoistCode(code, redirectUri);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    // Redirect back to client with tokens in URL
    const params = new URLSearchParams({
      integration: provider,
      success: "true",
      access_token: tokens.access_token,
    });
    if (tokens.refresh_token) {
      params.set("refresh_token", tokens.refresh_token);
    }
    if (tokens.expires_in) {
      params.set("expires_in", tokens.expires_in.toString());
    }
    if (tokens.user_id) {
      params.set("user_id", tokens.user_id);
    }

    res.redirect(`${CLIENT_URL}/integrations?${params.toString()}`);
  } catch (err) {
    console.error(`OAuth callback error for ${provider}:`, err);
    const params = new URLSearchParams({
      integration: provider,
      success: "false",
      error: err.message,
    });
    res.redirect(`${CLIENT_URL}/integrations?${params.toString()}`);
  }
});

export default router;
