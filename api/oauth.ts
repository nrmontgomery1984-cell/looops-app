// Consolidated OAuth Handler - Handles auth and callback for all integrations
// This consolidates multiple OAuth endpoints to stay within Vercel's function limit
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PRODUCTION_URL = 'https://looops-app-master.vercel.app';

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID?.trim();
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET?.trim();
const TODOIST_CLIENT_ID = process.env.TODOIST_CLIENT_ID?.trim();
const TODOIST_CLIENT_SECRET = process.env.TODOIST_CLIENT_SECRET?.trim();
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID?.trim();
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET?.trim();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { provider, action } = req.query;

  if (!provider || !action) {
    return res.status(400).json({ error: 'Missing provider or action. Use ?provider=X&action=auth|callback' });
  }

  try {
    if (action === 'auth') {
      return handleAuth(req, res, provider as string);
    } else if (action === 'callback') {
      return handleCallback(req, res, provider as string);
    } else {
      return res.status(400).json({ error: 'Invalid action. Use auth or callback' });
    }
  } catch (error) {
    console.error(`OAuth error for ${provider}/${action}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function handleAuth(req: VercelRequest, res: VercelResponse, provider: string) {
  const redirectUri = `${PRODUCTION_URL}/api/oauth?provider=${provider}&action=callback`;

  switch (provider) {
    case 'google':
    case 'google_calendar':
    case 'google_sheets': {
      if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: 'Google not configured' });
      }
      const service = provider === 'google_sheets' ? 'sheets' : 'calendar';
      const scopes = service === 'sheets'
        ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
        : ['https://www.googleapis.com/auth/calendar.readonly'];

      const state = Buffer.from(JSON.stringify({
        csrf: Math.random().toString(36).substring(7),
        service: service,
      })).toString('base64');

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
        state: state,
        access_type: 'offline',
        prompt: 'consent',
      });

      return res.redirect(307, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    }

    case 'fitbit': {
      if (!FITBIT_CLIENT_ID) {
        return res.status(500).json({ error: 'Fitbit not configured' });
      }
      const scopes = 'activity heartrate sleep weight nutrition profile';
      const state = Math.random().toString(36).substring(7);
      const authUrl = `https://www.fitbit.com/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${FITBIT_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${state}`;
      return res.redirect(authUrl);
    }

    case 'todoist': {
      if (!TODOIST_CLIENT_ID) {
        return res.status(500).json({ error: 'Todoist not configured' });
      }
      const state = Math.random().toString(36).substring(7);
      const scopes = 'data:read';
      const authUrl = `https://todoist.com/oauth/authorize?` +
        `client_id=${TODOIST_CLIENT_ID}&` +
        `scope=${scopes}&` +
        `state=${state}`;
      return res.redirect(authUrl);
    }

    case 'spotify': {
      if (!SPOTIFY_CLIENT_ID) {
        return res.status(500).json({ error: 'Spotify not configured' });
      }
      const state = Math.random().toString(36).substring(7);
      const scopes = [
        'user-read-currently-playing',
        'user-read-recently-played',
        'user-top-read',
      ].join(' ');
      const authUrl = `https://accounts.spotify.com/authorize?` +
        `response_type=code&` +
        `client_id=${SPOTIFY_CLIENT_ID}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;
      return res.redirect(authUrl);
    }

    default:
      return res.status(400).json({ error: 'Unknown provider' });
  }
}

async function handleCallback(req: VercelRequest, res: VercelResponse, provider: string) {
  const { code, error, state } = req.query;
  const redirectUri = `${PRODUCTION_URL}/api/oauth?provider=${provider}&action=callback`;

  if (error) {
    return res.redirect(`${PRODUCTION_URL}?integration=${provider}&error=${error}`);
  }

  if (!code) {
    return res.redirect(`${PRODUCTION_URL}?integration=${provider}&error=no_code`);
  }

  try {
    switch (provider) {
      case 'google':
      case 'google_calendar':
      case 'google_sheets': {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
          return res.redirect(`${PRODUCTION_URL}?integration=${provider}&error=not_configured`);
        }

        // Determine service from state
        let service = 'calendar';
        try {
          const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
          service = stateData.service || 'calendar';
        } catch {}

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: code as string,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenResponse.ok) {
          console.error('Google token error:', await tokenResponse.text());
          return res.redirect(`${PRODUCTION_URL}?integration=google_${service}&error=token_exchange_failed`);
        }

        const tokens = await tokenResponse.json();
        const params = new URLSearchParams({
          integration: `google_${service}`,
          success: 'true',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || '',
          expires_in: tokens.expires_in?.toString() || '3600',
        });
        return res.redirect(`${PRODUCTION_URL}?${params.toString()}`);
      }

      case 'fitbit': {
        if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
          return res.redirect(`${PRODUCTION_URL}?integration=fitbit&error=not_configured`);
        }

        const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            code: code as string,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          console.error('Fitbit token error:', await tokenResponse.text());
          return res.redirect(`${PRODUCTION_URL}?integration=fitbit&error=token_exchange_failed`);
        }

        const tokens = await tokenResponse.json();
        const params = new URLSearchParams({
          integration: 'fitbit',
          success: 'true',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || '',
          expires_in: tokens.expires_in?.toString() || '28800',
          user_id: tokens.user_id || '',
        });
        return res.redirect(`${PRODUCTION_URL}?${params.toString()}`);
      }

      case 'todoist': {
        if (!TODOIST_CLIENT_ID || !TODOIST_CLIENT_SECRET) {
          return res.redirect(`${PRODUCTION_URL}?integration=todoist&error=not_configured`);
        }

        const tokenResponse = await fetch('https://todoist.com/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: TODOIST_CLIENT_ID,
            client_secret: TODOIST_CLIENT_SECRET,
            code: code as string,
          }),
        });

        if (!tokenResponse.ok) {
          console.error('Todoist token error:', await tokenResponse.text());
          return res.redirect(`${PRODUCTION_URL}?integration=todoist&error=token_exchange_failed`);
        }

        const tokens = await tokenResponse.json();
        const params = new URLSearchParams({
          integration: 'todoist',
          success: 'true',
          access_token: tokens.access_token,
        });
        return res.redirect(`${PRODUCTION_URL}?${params.toString()}`);
      }

      case 'spotify': {
        if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
          return res.redirect(`${PRODUCTION_URL}?integration=spotify&error=not_configured`);
        }

        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code as string,
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          console.error('Spotify token error:', await tokenResponse.text());
          return res.redirect(`${PRODUCTION_URL}?integration=spotify&error=token_exchange_failed`);
        }

        const tokens = await tokenResponse.json();
        const params = new URLSearchParams({
          integration: 'spotify',
          success: 'true',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || '',
          expires_in: tokens.expires_in?.toString() || '3600',
        });
        return res.redirect(`${PRODUCTION_URL}?${params.toString()}`);
      }

      default:
        return res.redirect(`${PRODUCTION_URL}?integration=${provider}&error=unknown_provider`);
    }
  } catch (err) {
    console.error(`Callback error for ${provider}:`, err);
    return res.redirect(`${PRODUCTION_URL}?integration=${provider}&error=callback_failed`);
  }
}
