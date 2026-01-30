// Integration status endpoint - returns which integrations are configured
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Check which integrations have their environment variables configured
  const integrations = {
    fitbit: {
      configured: !!(process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET),
      authUrl: '/api/integrations/fitbit/auth',
    },
    google_calendar: {
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      authUrl: '/api/integrations/google/auth?service=calendar',
    },
    google_sheets: {
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      authUrl: '/api/integrations/google/auth?service=sheets',
    },
    todoist: {
      configured: !!(process.env.TODOIST_CLIENT_ID && process.env.TODOIST_CLIENT_SECRET),
      authUrl: '/api/integrations/todoist/auth',
    },
    spotify: {
      configured: !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
      authUrl: '/api/integrations/spotify/auth',
    },
  };

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  res.status(200).json(integrations);
}
