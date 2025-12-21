// Google OAuth2 Authorization endpoint (for Calendar and Sheets)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();

  // Use the production URL directly since VERCEL_URL can vary
  const baseUrl = 'https://looops-app.vercel.app';
  const REDIRECT_URI = `${baseUrl}/api/integrations/google/callback`;

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google not configured', clientId: !!GOOGLE_CLIENT_ID });
  }

  const service = req.query.service as string || 'calendar';

  // Generate state for CSRF protection (includes service type)
  const state = Buffer.from(JSON.stringify({
    csrf: Math.random().toString(36).substring(7),
    service: service,
  })).toString('base64');

  // Google OAuth2 scopes based on service
  const scopes = service === 'sheets'
    ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
    : ['https://www.googleapis.com/auth/calendar.readonly'];

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: scopes.join(' '),
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // Set state cookie for verification
  res.setHeader('Set-Cookie', `google_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  res.redirect(307, authUrl);
}
