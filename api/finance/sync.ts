// SimpleFIN Sync endpoint - fetches accounts and transactions
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const username = url.username;
    const password = url.password;

    // Remove credentials from URL to get base URL
    url.username = "";
    url.password = "";
    const baseUrl = url.toString();

    return { baseUrl, username, password };
  } catch (error) {
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

    if (!accessUrl || typeof accessUrl !== 'string') {
      return res.status(400).json({
        error: 'Missing access URL',
        message: 'Please provide the SimpleFIN access URL.'
      });
    }

    // Parse the access URL
    const parsed = parseAccessUrl(accessUrl);
    if (!parsed) {
      return res.status(400).json({
        error: 'Invalid access URL',
        message: 'The access URL appears to be invalid.'
      });
    }

    const { baseUrl, username, password } = parsed;

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

    // Fetch from SimpleFIN
    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        return res.status(401).json({
          error: 'NEEDS_REAUTH',
          message: 'SimpleFIN access has expired. Please reconnect your accounts.'
        });
      }

      const errorText = await response.text();
      console.error('SimpleFIN API error:', response.status, errorText);

      return res.status(500).json({
        error: 'Sync failed',
        message: 'Could not fetch data from SimpleFIN.'
      });
    }

    const data: SimplefinResponse = await response.json();

    // Transform accounts
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
    console.error('SimpleFIN sync error:', error);
    return res.status(500).json({
      error: 'Sync failed',
      message: 'Failed to sync with SimpleFIN. Please try again later.'
    });
  }
}
