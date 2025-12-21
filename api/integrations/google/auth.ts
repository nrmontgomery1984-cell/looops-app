// Google OAuth2 Authorization endpoint (for Calendar and Sheets)
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/integrations/google/callback`
  : 'http://localhost:3000/api/integrations/google/callback';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google not configured' });
  }

  const { service } = req.query; // 'calendar' or 'sheets'

  // Generate state for CSRF protection (includes service type)
  const state = JSON.stringify({
    csrf: Math.random().toString(36).substring(7),
    service: service || 'calendar',
  });

  // Google OAuth2 scopes based on service
  const scopes = service === 'sheets'
    ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
    : ['https://www.googleapis.com/auth/calendar.readonly'];

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code&` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scopes.join(' '))}&` +
    `state=${encodeURIComponent(state)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  // Set state cookie for verification
  res.setHeader('Set-Cookie', `google_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  res.redirect(authUrl);
}
