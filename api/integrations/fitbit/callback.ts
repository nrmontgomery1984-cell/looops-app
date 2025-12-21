// Fitbit OAuth2 Callback endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID?.trim();
  const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET?.trim();
  const APP_URL = 'https://looops-app.vercel.app';
  const REDIRECT_URI = `${APP_URL}/api/integrations/fitbit/callback`;

  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${APP_URL}?integration=fitbit&error=${error}`);
  }

  if (!code || !FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
    return res.redirect(`${APP_URL}?integration=fitbit&error=missing_config`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Fitbit token error:', errorData);
      return res.redirect(`${APP_URL}?integration=fitbit&error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user profile
    const profileResponse = await fetch('https://api.fitbit.com/1/user/-/profile.json', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    const profile = profileResponse.ok ? await profileResponse.json() : null;

    // Return tokens to frontend via URL params (for localStorage storage)
    // In production, you'd want to store these server-side
    const params = new URLSearchParams({
      integration: 'fitbit',
      success: 'true',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in.toString(),
      user_id: tokens.user_id,
    });

    res.redirect(`${APP_URL}?${params.toString()}`);
  } catch (error) {
    console.error('Fitbit callback error:', error);
    res.redirect(`${APP_URL}?integration=fitbit&error=callback_failed`);
  }
}
