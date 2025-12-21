// Todoist OAuth2 Callback endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

const TODOIST_CLIENT_ID = process.env.TODOIST_CLIENT_ID;
const TODOIST_CLIENT_SECRET = process.env.TODOIST_CLIENT_SECRET;
const APP_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${APP_URL}?integration=todoist&error=${error}`);
  }

  if (!code || !TODOIST_CLIENT_ID || !TODOIST_CLIENT_SECRET) {
    return res.redirect(`${APP_URL}?integration=todoist&error=missing_config`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://todoist.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: TODOIST_CLIENT_ID,
        client_secret: TODOIST_CLIENT_SECRET,
        code: code as string,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Todoist token error:', errorData);
      return res.redirect(`${APP_URL}?integration=todoist&error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Return tokens to frontend
    const params = new URLSearchParams({
      integration: 'todoist',
      success: 'true',
      access_token: tokens.access_token,
    });

    res.redirect(`${APP_URL}?${params.toString()}`);
  } catch (error) {
    console.error('Todoist callback error:', error);
    res.redirect(`${APP_URL}?integration=todoist&error=callback_failed`);
  }
}
