// Spotify OAuth2 Authorization endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/integrations/spotify/callback`
  : 'http://localhost:3000/api/integrations/spotify/callback';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!SPOTIFY_CLIENT_ID) {
    return res.status(500).json({ error: 'Spotify not configured' });
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(7);

  // Spotify OAuth2 scopes
  const scopes = [
    'user-read-currently-playing',
    'user-read-recently-played',
    'user-top-read',
  ].join(' ');

  const authUrl = `https://accounts.spotify.com/authorize?` +
    `response_type=code&` +
    `client_id=${SPOTIFY_CLIENT_ID}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `state=${state}`;

  // Set state cookie for verification
  res.setHeader('Set-Cookie', `spotify_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  res.redirect(authUrl);
}
