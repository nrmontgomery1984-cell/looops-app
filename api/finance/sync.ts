// SimpleFIN Sync endpoint - fetches accounts and transactions
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Allow up to 30 seconds for SimpleFIN to respond (hobby plan max is 60s)
export const config = {
  maxDuration: 30,
};

interface SimplefinOrganization {
  domain: string;
  name: string;
}

interface SimplefinTransaction {
  id: string;
  posted: number;
  amount: string;
  description: string;
  payee?: string;
  memo?: string;
  transacted_at?: number;
  pending?: boolean;
}

interface SimplefinAccount {
  id: string;
  org: SimplefinOrganization;
  name: string;
  currency: string;
  balance: string;
  "available-balance"?: string;
  "balance-date": number;
  transactions: SimplefinTransaction[];
}

interface SimplefinResponse {
  errors: string[];
  accounts: SimplefinAccount[];
}

// Parse access URL to extract credentials and base URL
function parseAccessUrl(accessUrl: string): { baseUrl: string; username: string; password: string } | null {
  try {
    const url = new URL(accessUrl);
    const username = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);

    // Build base URL manually to ensure correct format
    // SimpleFIN expects: https://beta-bridge.simplefin.org/simplefin/
    let baseUrl = `${url.protocol}//${url.host}${url.pathname}`;

    // Ensure trailing slash for SimpleFIN API
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }

    console.log('[Sync API] parseAccessUrl result:', {
      originalLength: accessUrl.length,
      baseUrl,
      hasUsername: !!username,
      hasPassword: !!password,
      usernameLength: username.length,
    });

    return { baseUrl, username, password };
  } catch (error) {
    console.error('[Sync API] parseAccessUrl error:', error);
    return null;
  }
}

// Clean up transaction description
function cleanDescription(description: string): string {
  let cleaned = description;

  // Remove common prefixes
  cleaned = cleaned.replace(/^(POS |INTERAC |VISA |MC |DEBIT |CREDIT |CHQ |CK |DD |EFT |TFR |XFER )/i, "");

  // Remove transaction IDs and reference numbers (long numbers)
  cleaned = cleaned.replace(/\s*#?\d{6,}\s*/g, " ");

  // Remove date patterns
  cleaned = cleaned.replace(/\s*\d{2}\/\d{2}(\/\d{2,4})?\s*/g, " ");
  cleaned = cleaned.replace(/\s*\d{4}-\d{2}-\d{2}\s*/g, " ");

  // Remove city/province suffixes
  cleaned = cleaned.replace(/\s+[A-Z]{2}\s*$/i, "");

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Title case if all caps
  if (cleaned === cleaned.toUpperCase() && cleaned.length > 3) {
    cleaned = cleaned.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  return cleaned || description;
}

// Determine account type from name
function getAccountType(name: string, balance: number): "checking" | "savings" | "credit" | "investment" | "other" {
  const nameLower = name.toLowerCase();

  if (nameLower.includes("credit") || nameLower.includes("mastercard") || nameLower.includes("visa")) {
    return "credit";
  }
  if (nameLower.includes("saving")) {
    return "savings";
  }
  if (nameLower.includes("invest") || nameLower.includes("rrsp") || nameLower.includes("tfsa")) {
    return "investment";
  }
  if (nameLower.includes("chequ") || nameLower.includes("check")) {
    return "checking";
  }

  return "checking";
}

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
    const { accessUrl, startDate, endDate, balancesOnly } = req.body;

    console.log('[Sync API] Request received:', {
      hasAccessUrl: !!accessUrl,
      accessUrlType: typeof accessUrl,
      accessUrlLength: accessUrl?.length,
      startDate,
      endDate,
      balancesOnly,
    });

    if (!accessUrl || typeof accessUrl !== 'string') {
      console.log('[Sync API] Missing or invalid accessUrl');
      return res.status(400).json({
        error: 'Missing access URL',
        message: 'Please provide the SimpleFIN access URL.'
      });
    }

    // Parse the access URL
    console.log('[Sync API] Parsing access URL...');
    const parsed = parseAccessUrl(accessUrl);
    if (!parsed) {
      console.log('[Sync API] Failed to parse access URL');
      return res.status(400).json({
        error: 'Invalid access URL',
        message: 'The access URL appears to be invalid.'
      });
    }

    const { baseUrl, username, password } = parsed;
    console.log('[Sync API] Parsed URL:', {
      baseUrl: baseUrl.substring(0, 50) + '...',
      hasUsername: !!username,
      hasPassword: !!password,
    });

    // Build query parameters
    const params = new URLSearchParams();

    if (startDate) {
      params.set("start-date", Math.floor(new Date(startDate).getTime() / 1000).toString());
    }
    if (endDate) {
      params.set("end-date", Math.floor(new Date(endDate).getTime() / 1000).toString());
    }
    if (balancesOnly) {
      params.set("balances-only", "1");
    }

    const fetchUrl = `${baseUrl}accounts?${params.toString()}`;
    console.log('[Sync API] Fetching from SimpleFIN:', fetchUrl.substring(0, 60) + '...');

    // Fetch from SimpleFIN with 25 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response: Response;
    try {
      response = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log('[Sync API] SimpleFIN response status:', response.status);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const error = fetchError as Error;
      console.error('[Sync API] Fetch error:', error.name, error.message);

      if (error.name === 'AbortError') {
        return res.status(504).json({
          error: 'Timeout',
          message: 'SimpleFIN is taking too long to respond. Please try again.'
        });
      }

      return res.status(500).json({
        error: 'Fetch failed',
        message: `Failed to connect to SimpleFIN: ${error?.message || 'Network error'}`
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Sync API] SimpleFIN API error:', response.status, errorText);

      if (response.status === 403 || response.status === 401) {
        return res.status(401).json({
          error: 'NEEDS_REAUTH',
          message: 'SimpleFIN access has expired. Please reconnect your accounts.'
        });
      }

      if (response.status === 404) {
        return res.status(401).json({
          error: 'NEEDS_REAUTH',
          message: 'SimpleFIN access URL not found. The token may have expired. Please reconnect.'
        });
      }

      return res.status(500).json({
        error: 'Sync failed',
        message: `SimpleFIN returned error ${response.status}: ${errorText.substring(0, 100) || 'Unknown error'}`
      });
    }

    // Read response as text first for debugging
    const responseText = await response.text();
    console.log('[Sync API] Raw response length:', responseText.length);
    console.log('[Sync API] Raw response preview:', responseText.substring(0, 300));

    let data: SimplefinResponse;
    try {
      data = JSON.parse(responseText);
      console.log('[Sync API] SimpleFIN data received:', {
        accountCount: data.accounts?.length,
        errorCount: data.errors?.length,
        errors: data.errors,
      });
    } catch (jsonError) {
      console.error('[Sync API] JSON parse error:', jsonError);
      return res.status(500).json({
        error: 'Parse failed',
        message: 'SimpleFIN returned invalid JSON response'
      });
    }

    // Validate data structure
    if (!data.accounts || !Array.isArray(data.accounts)) {
      console.error('[Sync API] Invalid data structure - missing accounts array');
      return res.status(500).json({
        error: 'Invalid data',
        message: 'SimpleFIN returned an unexpected data structure'
      });
    }

    // Transform accounts
    console.log('[Sync API] Transforming', data.accounts.length, 'accounts...');
    const accounts = data.accounts.map(sfAccount => {
      const balanceFloat = parseFloat(sfAccount.balance);
      const balance = Math.round(balanceFloat * 100);
      const accountType = getAccountType(sfAccount.name, balance);

      // For credit cards, store balance as negative (liability)
      const adjustedBalance = accountType === "credit" ? -Math.abs(balance) : balance;

      let availableBalance: number | null = null;
      if (sfAccount["available-balance"]) {
        availableBalance = Math.round(parseFloat(sfAccount["available-balance"]) * 100);
      }

      return {
        id: sfAccount.id,
        name: sfAccount.name,
        institution: sfAccount.org.name,
        institutionDomain: sfAccount.org.domain,
        type: accountType,
        currency: sfAccount.currency === "CAD" || sfAccount.currency === "USD" ? sfAccount.currency : "CAD",
        balance: adjustedBalance,
        availableBalance,
        balanceDate: new Date(sfAccount["balance-date"] * 1000).toISOString(),
      };
    });

    // Transform transactions
    const transactions: any[] = [];
    for (const sfAccount of data.accounts) {
      for (const sfTx of sfAccount.transactions) {
        const amountFloat = parseFloat(sfTx.amount);
        const amount = Math.round(amountFloat * 100);
        const description = sfTx.description || sfTx.payee || "Unknown";
        const postedAt = new Date(sfTx.posted * 1000).toISOString();

        transactions.push({
          id: `sf_${sfTx.id}`,
          externalId: sfTx.id,
          accountId: sfAccount.id,
          date: postedAt.split("T")[0],
          postedAt,
          transactedAt: sfTx.transacted_at ? new Date(sfTx.transacted_at * 1000).toISOString() : null,
          amount,
          description,
          cleanDescription: cleanDescription(description),
          pending: sfTx.pending || false,
          memo: sfTx.memo || null,
        });
      }
    }

    // Sort transactions by date descending
    transactions.sort((a, b) => b.date.localeCompare(a.date));

    return res.status(200).json({
      success: true,
      accounts,
      transactions,
      errors: data.errors,
      syncedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Sync API] Exception caught:', error);
    console.error('[Sync API] Error details:', {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return res.status(500).json({
      error: 'Sync failed',
      message: `Failed to sync with SimpleFIN: ${(error as Error)?.message || 'Unknown error'}`
    });
  }
}
