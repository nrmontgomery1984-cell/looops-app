// Spotify OAuth2 Callback endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const APP_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173';
const REDIRECT_URI = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/integrations/spotify/callback`
  : 'http://localhost:3000/api/integrations/spotify/callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${APP_URL}?integration=spotify&error=${error}`);
  }

  if (!code || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.redirect(`${APP_URL}?integration=spotify&error=missing_config`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Spotify token error:', errorData);
      return res.redirect(`${APP_URL}?integration=spotify&error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Return tokens to frontend
    const params = new URLSearchParams({
      integration: 'spotify',
      success: 'true',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in.toString(),
    });

    res.redirect(`${APP_URL}?${params.toString()}`);
  } catch (error) {
    console.error('Spotify callback error:', error);
    res.redirect(`${APP_URL}?integration=spotify&error=callback_failed`);
  }
}
