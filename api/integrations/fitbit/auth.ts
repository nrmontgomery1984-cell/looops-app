// Fitbit OAuth2 Authorization endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID?.trim();
  const REDIRECT_URI = 'https://looops-app.vercel.app/api/integrations/fitbit/callback';

  if (!FITBIT_CLIENT_ID) {
    return res.status(500).json({ error: 'Fitbit not configured' });
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(7);

  // Fitbit OAuth2 scopes
  const scopes = [
    'activity',
    'heartrate',
    'sleep',
    'weight',
    'profile',
  ].join('%20');

  const authUrl = `https://www.fitbit.com/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${FITBIT_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${scopes}&` +
    `state=${state}`;

  // Set state cookie for verification
  res.setHeader('Set-Cookie', `fitbit_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  res.redirect(authUrl);
}
