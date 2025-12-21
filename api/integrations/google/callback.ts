// Google OAuth2 Callback endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173';
const REDIRECT_URI = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/integrations/google/callback`
  : 'http://localhost:3000/api/integrations/google/callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  // Parse state to get service type
  let service = 'calendar';
  try {
    const stateObj = JSON.parse(state as string);
    service = stateObj.service || 'calendar';
  } catch {
    // Default to calendar
  }

  if (error) {
    return res.redirect(`${APP_URL}?integration=google_${service}&error=${error}`);
  }

  if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${APP_URL}?integration=google_${service}&error=missing_config`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: REDIRECT_URI,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Google token error:', errorData);
      return res.redirect(`${APP_URL}?integration=google_${service}&error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Return tokens to frontend
    const params = new URLSearchParams({
      integration: `google_${service}`,
      success: 'true',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      expires_in: tokens.expires_in.toString(),
    });

    res.redirect(`${APP_URL}?${params.toString()}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${APP_URL}?integration=google_${service}&error=callback_failed`);
  }
}
