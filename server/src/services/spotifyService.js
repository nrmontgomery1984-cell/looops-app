// Spotify Service - Recently played and currently playing
// Uses Spotify Web API with OAuth2

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_AUTH_BASE = "https://accounts.spotify.com";

let accessToken = null;
let tokenExpiry = null;

/**
 * Check if Spotify is configured
 */
export function isConfigured() {
  return !!(
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.SPOTIFY_REFRESH_TOKEN
  );
}

/**
 * Get the authorization URL for OAuth flow
 */
export function getAuthUrl() {
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
    redirect_uri: "http://localhost:3001/api/spotify/callback",
    scope: scopes,
  });

  return `${SPOTIFY_AUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCode(code) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const response = await fetch(`${SPOTIFY_AUTH_BASE}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "http://localhost:3001/api/spotify/callback",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify auth error: ${error}`);
  }

  const tokens = await response.json();
  accessToken = tokens.access_token;
  tokenExpiry = Date.now() + tokens.expires_in * 1000;

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  };
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Spotify credentials not configured");
  }

  const response = await fetch(`${SPOTIFY_AUTH_BASE}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh error: ${error}`);
  }

  const tokens = await response.json();
  accessToken = tokens.access_token;
  tokenExpiry = Date.now() + tokens.expires_in * 1000;

  return accessToken;
}

/**
 * Get valid access token (refreshing if necessary)
 */
async function getAccessToken() {
  if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry - 60000) {
    await refreshAccessToken();
  }
  return accessToken;
}

/**
 * Make authenticated request to Spotify API
 */
async function spotifyRequest(endpoint) {
  const token = await getAccessToken();

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 204) {
      return null; // No content (e.g., nothing playing)
    }
    const error = await response.text();
    throw new Error(`Spotify API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Format track data
 */
function formatTrack(item) {
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
 * Get currently playing track
 */
export async function getCurrentlyPlaying() {
  if (!isConfigured()) return null;

  try {
    const data = await spotifyRequest("/me/player/currently-playing");

    if (!data || !data.item) {
      return { isPlaying: false, track: null };
    }

    return {
      isPlaying: data.is_playing,
      track: formatTrack(data.item),
      progress: data.progress_ms,
      device: data.device?.name,
    };
  } catch (error) {
    console.error("Error getting currently playing:", error.message);
    return null;
  }
}

/**
 * Get recently played tracks
 */
export async function getRecentlyPlayed(limit = 20) {
  if (!isConfigured()) return null;

  try {
    const data = await spotifyRequest(`/me/player/recently-played?limit=${limit}`);

    if (!data || !data.items) {
      return [];
    }

    return data.items.map(formatTrack);
  } catch (error) {
    console.error("Error getting recently played:", error.message);
    return null;
  }
}

/**
 * Get top tracks
 */
export async function getTopTracks(timeRange = "short_term", limit = 10) {
  if (!isConfigured()) return null;

  try {
    const data = await spotifyRequest(
      `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
    );

    if (!data || !data.items) {
      return [];
    }

    return data.items.map(formatTrack);
  } catch (error) {
    console.error("Error getting top tracks:", error.message);
    return null;
  }
}

/**
 * Get top artists
 */
export async function getTopArtists(timeRange = "short_term", limit = 10) {
  if (!isConfigured()) return null;

  try {
    const data = await spotifyRequest(
      `/me/top/artists?time_range=${timeRange}&limit=${limit}`
    );

    if (!data || !data.items) {
      return [];
    }

    return data.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      image: artist.images?.[0]?.url || null,
      genres: artist.genres,
      popularity: artist.popularity,
      url: artist.external_urls?.spotify,
    }));
  } catch (error) {
    console.error("Error getting top artists:", error.message);
    return null;
  }
}

/**
 * Get listening summary for the Fun loop
 */
export async function getListeningSummary() {
  if (!isConfigured()) return null;

  try {
    const [currentlyPlaying, recentlyPlayed, topTracks, topArtists] =
      await Promise.all([
        getCurrentlyPlaying(),
        getRecentlyPlayed(10),
        getTopTracks("short_term", 5),
        getTopArtists("short_term", 5),
      ]);

    // Calculate listening stats from recently played
    let totalListeningMs = 0;
    const uniqueArtists = new Set();
    const uniqueAlbums = new Set();

    if (recentlyPlayed) {
      for (const track of recentlyPlayed) {
        totalListeningMs += track.duration || 0;
        uniqueArtists.add(track.artist);
        if (track.album) uniqueAlbums.add(track.album);
      }
    }

    return {
      currentlyPlaying,
      recentlyPlayed,
      topTracks,
      topArtists,
      stats: {
        totalListeningMinutes: Math.round(totalListeningMs / 60000),
        uniqueArtists: uniqueArtists.size,
        uniqueAlbums: uniqueAlbums.size,
        tracksPlayed: recentlyPlayed?.length || 0,
      },
    };
  } catch (error) {
    console.error("Error getting listening summary:", error.message);
    return null;
  }
}

export default {
  isConfigured,
  getAuthUrl,
  exchangeCode,
  getCurrentlyPlaying,
  getRecentlyPlayed,
  getTopTracks,
  getTopArtists,
  getListeningSummary,
};
