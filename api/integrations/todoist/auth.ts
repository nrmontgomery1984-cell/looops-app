// Todoist OAuth2 Authorization endpoint
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const TODOIST_CLIENT_ID = process.env.TODOIST_CLIENT_ID?.trim();

  if (!TODOIST_CLIENT_ID) {
    return res.status(500).json({ error: 'Todoist not configured' });
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(7);

  // Todoist OAuth2 scopes
  const scopes = 'data:read,data:read_write';

  const authUrl = `https://todoist.com/oauth/authorize?` +
    `client_id=${TODOIST_CLIENT_ID}&` +
    `scope=${scopes}&` +
    `state=${state}`;

  // Set state cookie for verification
  res.setHeader('Set-Cookie', `todoist_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);

  res.redirect(authUrl);
}
