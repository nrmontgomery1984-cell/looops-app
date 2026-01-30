// Spotify API - Consolidated endpoint for status, auth, and data
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Hardcode production URL to avoid Vercel preview URL issues
const PRODUCTION_URL = 'https://looops-app.vercel.app';
const APP_URL = PRODUCTION_URL;
const REDIRECT_URI = `${PRODUCTION_URL}/api/integrations/spotify/callback`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action as string;

  try {
    switch (action) {
      case 'status':
        return handleStatus(req, res);
      case 'auth':
        return handleAuth(req, res);
      case 'summary':
        return handleSummary(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action. Use ?action=status|auth|summary' });
    }
  } catch (error) {
    console.error('Spotify API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Check if Spotify is configured
function handleStatus(req: VercelRequest, res: VercelResponse) {
  const configured = !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET);
  return res.json({ configured });
}

// Get Spotify auth URL
function handleAuth(req: VercelRequest, res: VercelResponse) {
  if (!SPOTIFY_CLIENT_ID) {
    return res.status(500).json({ error: 'Spotify not configured' });
  }

  const scopes = [
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-top-read',
  ].join(' ');

  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://accounts.spotify.com/authorize?` +
    `response_type=code&` +
    `client_id=${SPOTIFY_CLIENT_ID}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `state=${state}`;

  return res.json({ authUrl });
}

// Get Spotify listening summary
async function handleSummary(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    // Fetch data in parallel
    const [currentlyPlaying, recentlyPlayed, topTracks] = await Promise.all([
      fetchCurrentlyPlaying(accessToken),
      fetchRecentlyPlayed(accessToken),
      fetchTopTracks(accessToken),
    ]);

    // Calculate stats
    const uniqueArtists = new Set(recentlyPlayed.map(t => t.artist)).size;
    const uniqueAlbums = new Set(recentlyPlayed.filter(t => t.album).map(t => t.album)).size;
    const totalMinutes = recentlyPlayed.reduce((sum, t) => sum + (t.duration / 60000), 0);

    return res.json({
      source: 'spotify',
      data: {
        currentlyPlaying,
        recentlyPlayed,
        topTracks,
        topArtists: [],
        stats: {
          totalListeningMinutes: Math.round(totalMinutes),
          uniqueArtists,
          uniqueAlbums,
          tracksPlayed: recentlyPlayed.length,
        },
      },
    });
  } catch (error: any) {
    if (error.status === 401) {
      return res.json({ needsReauth: true });
    }
    throw error;
  }
}

async function fetchCurrentlyPlaying(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 204 || !response.ok) {
    return null;
  }

  const data = await response.json();
  if (!data.item) return null;

  return {
    isPlaying: data.is_playing,
    track: {
      id: data.item.id,
      name: data.item.name,
      artist: data.item.artists.map((a: any) => a.name).join(', '),
      album: data.item.album?.name || null,
      albumArt: data.item.album?.images?.[0]?.url || null,
      duration: data.item.duration_ms,
      url: data.item.external_urls?.spotify || '',
      playedAt: null,
    },
    progress: data.progress_ms,
    device: data.device?.name || 'Unknown',
  };
}

async function fetchRecentlyPlayed(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=20', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error: any = new Error('Unauthorized');
      error.status = 401;
      throw error;
    }
    return [];
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.track.id,
    name: item.track.name,
    artist: item.track.artists.map((a: any) => a.name).join(', '),
    album: item.track.album?.name || null,
    albumArt: item.track.album?.images?.[1]?.url || null,
    duration: item.track.duration_ms,
    url: item.track.external_urls?.spotify || '',
    playedAt: item.played_at,
  }));
}

async function fetchTopTracks(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return (data.items || []).map((track: any) => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map((a: any) => a.name).join(', '),
    album: track.album?.name || null,
    albumArt: track.album?.images?.[1]?.url || null,
    duration: track.duration_ms,
    url: track.external_urls?.spotify || '',
    playedAt: null,
  }));
}
