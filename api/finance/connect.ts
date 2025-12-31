// SimpleFIN Connect endpoint - claims setup token and returns access URL
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { setupToken } = req.body;

    if (!setupToken || typeof setupToken !== 'string') {
      return res.status(400).json({
        error: 'Missing setup token',
        message: 'Please provide the SimpleFIN setup token.'
      });
    }

    // Decode the base64 setup token to get the claim URL
    let claimUrl: string;
    try {
      claimUrl = Buffer.from(setupToken.trim(), 'base64').toString('utf-8');
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid token format',
        message: 'The setup token appears to be invalid. Please copy the complete token from SimpleFIN.'
      });
    }

    // Validate it looks like a URL
    if (!claimUrl.startsWith('https://')) {
      return res.status(400).json({
        error: 'Invalid token format',
        message: 'The setup token does not contain a valid URL. Please copy the complete token from SimpleFIN.'
      });
    }

    // Claim the token by POSTing to the claim URL
    // This is a one-time operation - the token can only be claimed once
    const claimResponse = await fetch(claimUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!claimResponse.ok) {
      if (claimResponse.status === 403) {
        return res.status(400).json({
          error: 'Token already claimed',
          message: 'This setup token has already been used. Please generate a new token in SimpleFIN.'
        });
      }

      const errorText = await claimResponse.text();
      console.error('SimpleFIN claim error:', claimResponse.status, errorText);

      return res.status(500).json({
        error: 'Failed to claim token',
        message: 'Could not connect to SimpleFIN. Please try again later.'
      });
    }

    // The response is the access URL
    const accessUrl = (await claimResponse.text()).trim();

    // Validate the access URL
    if (!accessUrl.includes('@') || !accessUrl.startsWith('https://')) {
      return res.status(500).json({
        error: 'Invalid response',
        message: 'SimpleFIN returned an unexpected response. Please try again.'
      });
    }

    // Return the access URL
    // The client should store this securely (it contains credentials)
    return res.status(200).json({
      success: true,
      accessUrl,
      message: 'Successfully connected to SimpleFIN!'
    });

  } catch (error) {
    console.error('SimpleFIN connect error:', error);
    return res.status(500).json({
      error: 'Connection failed',
      message: 'Failed to connect to SimpleFIN. Please check your internet connection and try again.'
    });
  }
}
