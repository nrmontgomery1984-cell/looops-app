// SimpleFIN Bridge API Client
// Documentation: https://beta-api.simplefin.org/

import {
  FinanceAccount,
  FinanceTransaction,
  FinanceConnection,
  LoopId,
} from "../../types";

// SimpleFIN API Response Types
interface SimplefinOrganization {
  domain: string;
  name: string;
  sfin_url?: string;
  url?: string;
}

interface SimplefinTransaction {
  id: string;
  posted: number; // Unix timestamp
  amount: string; // Decimal string
  description: string;
  payee?: string;
  memo?: string;
  transacted_at?: number; // Unix timestamp
  pending?: boolean;
  extra?: Record<string, unknown>;
}

interface SimplefinAccount {
  id: string;
  org: SimplefinOrganization;
  name: string;
  currency: string;
  balance: string; // Decimal string
  "available-balance"?: string;
  "balance-date": number; // Unix timestamp
  transactions: SimplefinTransaction[];
  extra?: Record<string, unknown>;
}

interface SimplefinAccountSet {
  errors: string[];
  accounts: SimplefinAccount[];
}

interface SimplefinResponse {
  errors: string[];
  accounts: SimplefinAccount[];
}

// Parse base64 setup token to get claim URL
export function parseSetupToken(setupToken: string): string {
  try {
    // The setup token is a base64-encoded URL
    const decoded = atob(setupToken.trim());
    return decoded;
  } catch (error) {
    throw new Error("Invalid setup token format. Please paste the complete token from SimpleFIN.");
  }
}

// Claim the setup token to get access URL (one-time operation)
// This must be done server-side to protect the access URL
export async function claimSimplefinToken(claimUrl: string): Promise<string> {
  // POST to the claim URL with no body
  // Returns the access URL that should be stored securely
  const response = await fetch(claimUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("This setup token has already been claimed. Please generate a new one in SimpleFIN.");
    }
    throw new Error(`Failed to claim token: ${response.status} ${response.statusText}`);
  }

  const accessUrl = await response.text();
  return accessUrl.trim();
}

// Parse access URL to extract credentials and base URL
export function parseAccessUrl(accessUrl: string): { baseUrl: string; username: string; password: string } {
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
    throw new Error("Invalid access URL format");
  }
}

// Fetch accounts and transactions from SimpleFIN
export interface FetchOptions {
  startDate?: Date;
  endDate?: Date;
  accountIds?: string[];
  pendingOnly?: boolean;
  balancesOnly?: boolean;
}

export async function fetchSimplefinData(
  accessUrl: string,
  options: FetchOptions = {}
): Promise<SimplefinResponse> {
  const { baseUrl, username, password } = parseAccessUrl(accessUrl);

  // Build query parameters
  const params = new URLSearchParams();

  if (options.startDate) {
    params.set("start-date", Math.floor(options.startDate.getTime() / 1000).toString());
  }
  if (options.endDate) {
    params.set("end-date", Math.floor(options.endDate.getTime() / 1000).toString());
  }
  if (options.accountIds && options.accountIds.length > 0) {
    options.accountIds.forEach(id => params.append("account", id));
  }
  if (options.pendingOnly) {
    params.set("pending", "1");
  }
  if (options.balancesOnly) {
    params.set("balances-only", "1");
  }

  const url = `${baseUrl}accounts?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${btoa(`${username}:${password}`)}`,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("NEEDS_REAUTH");
    }
    throw new Error(`SimpleFIN API error: ${response.status} ${response.statusText}`);
  }

  const data: SimplefinAccountSet = await response.json();
  return data;
}

// Convert SimpleFIN account to our FinanceAccount type
export function parseSimplefinAccount(sfAccount: SimplefinAccount): FinanceAccount {
  // Determine account type based on balance (negative = credit) and name
  let accountType: FinanceAccount["type"] = "checking";
  const nameLower = sfAccount.name.toLowerCase();

  if (nameLower.includes("credit") || nameLower.includes("mastercard") || nameLower.includes("visa")) {
    accountType = "credit";
  } else if (nameLower.includes("saving")) {
    accountType = "savings";
  } else if (nameLower.includes("invest") || nameLower.includes("rrsp") || nameLower.includes("tfsa")) {
    accountType = "investment";
  }

  // Parse balance from string to cents (integer)
  const balanceFloat = parseFloat(sfAccount.balance);
  const balance = Math.round(balanceFloat * 100);

  // For credit cards, the balance from SimpleFIN is typically positive when you owe money
  // We want to store it as negative (liability)
  const adjustedBalance = accountType === "credit" ? -Math.abs(balance) : balance;

  // Parse available balance if present
  let availableBalance: number | null = null;
  if (sfAccount["available-balance"]) {
    availableBalance = Math.round(parseFloat(sfAccount["available-balance"]) * 100);
  }

  return {
    id: sfAccount.id,
    connectionId: "", // Will be set when creating connection
    name: sfAccount.name,
    institution: sfAccount.org.name,
    institutionDomain: sfAccount.org.domain,
    type: accountType,
    currency: (sfAccount.currency === "CAD" || sfAccount.currency === "USD") ? sfAccount.currency : "CAD",
    balance: adjustedBalance,
    availableBalance,
    balanceDate: new Date(sfAccount["balance-date"] * 1000).toISOString(),
    isHidden: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Convert SimpleFIN transaction to our FinanceTransaction type
export function parseSimplefinTransaction(
  sfTransaction: SimplefinTransaction,
  accountId: string
): FinanceTransaction {
  // Parse amount from string to cents (integer)
  const amountFloat = parseFloat(sfTransaction.amount);
  const amount = Math.round(amountFloat * 100);

  // Clean up description
  const description = sfTransaction.description || sfTransaction.payee || "Unknown";
  const cleanDescription = cleanTransactionDescription(description);

  // Parse dates
  const postedAt = new Date(sfTransaction.posted * 1000).toISOString();
  const date = postedAt.split("T")[0];

  let transactedAt: string | null = null;
  if (sfTransaction.transacted_at) {
    transactedAt = new Date(sfTransaction.transacted_at * 1000).toISOString();
  }

  return {
    id: `sf_${sfTransaction.id}`,
    externalId: sfTransaction.id,
    accountId,
    date,
    postedAt,
    transactedAt,
    amount,
    description,
    cleanDescription,
    pending: sfTransaction.pending || false,
    categoryId: null,
    loop: null,
    subcategory: null,
    notes: sfTransaction.memo || null,
    tags: [],
    isReviewed: false,
    isRecurring: false,
    recurringGroupId: null,
    splits: null,
    parentTransactionId: null,
    source: "simplefin",
    importedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Clean up transaction description for better readability
export function cleanTransactionDescription(description: string): string {
  let cleaned = description;

  // Remove common prefixes
  cleaned = cleaned.replace(/^(POS |INTERAC |VISA |MC |DEBIT |CREDIT |CHQ |CK |DD |EFT |TFR |XFER )/i, "");

  // Remove transaction IDs and reference numbers (long numbers)
  cleaned = cleaned.replace(/\s*#?\d{6,}\s*/g, " ");

  // Remove date patterns like 01/15 or 2024-01-15
  cleaned = cleaned.replace(/\s*\d{2}\/\d{2}(\/\d{2,4})?\s*/g, " ");
  cleaned = cleaned.replace(/\s*\d{4}-\d{2}-\d{2}\s*/g, " ");

  // Remove city/province suffixes like "TORONTO ON" or "VANCOUVER BC"
  cleaned = cleaned.replace(/\s+[A-Z]{2}\s*$/i, "");

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Title case if all caps
  if (cleaned === cleaned.toUpperCase() && cleaned.length > 3) {
    cleaned = cleaned.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  return cleaned || description;
}

// Parse all accounts and transactions from SimpleFIN response
export function parseSimplefinResponse(
  response: SimplefinResponse,
  connectionId: string
): {
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  errors: string[];
} {
  const accounts: FinanceAccount[] = [];
  const transactions: FinanceTransaction[] = [];

  for (const sfAccount of response.accounts) {
    // Parse account
    const account = parseSimplefinAccount(sfAccount);
    account.connectionId = connectionId;
    accounts.push(account);

    // Parse transactions for this account
    for (const sfTransaction of sfAccount.transactions) {
      const transaction = parseSimplefinTransaction(sfTransaction, sfAccount.id);
      transactions.push(transaction);
    }
  }

  return {
    accounts,
    transactions,
    errors: response.errors,
  };
}

// Create a new connection object
export function createConnection(accessUrl: string): FinanceConnection {
  return {
    id: `conn_${Date.now()}`,
    provider: "simplefin",
    accessUrl,
    status: "active",
    lastSyncAt: null,
    lastSyncError: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Deduplicate transactions by externalId
export function deduplicateTransactions(
  existing: FinanceTransaction[],
  incoming: FinanceTransaction[]
): FinanceTransaction[] {
  const existingIds = new Set(existing.map(t => t.externalId));
  const newTransactions = incoming.filter(t => !existingIds.has(t.externalId));
  return newTransactions;
}

// Detect potential recurring transactions
export function detectRecurringTransactions(
  transactions: FinanceTransaction[]
): Map<string, string[]> {
  // Group transactions by similar description and amount
  const groups = new Map<string, FinanceTransaction[]>();

  for (const t of transactions) {
    // Create a key from cleaned description and rounded amount
    const amountBucket = Math.round(Math.abs(t.amount) / 100) * 100; // Round to nearest dollar
    const key = `${t.cleanDescription.toLowerCase().substring(0, 20)}_${amountBucket}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(t);
  }

  // Find groups with 2+ transactions that occur regularly
  const recurringGroups = new Map<string, string[]>();

  for (const [key, txns] of groups) {
    if (txns.length >= 2) {
      // Check if they occur with some regularity (within 35 days of each other)
      const sortedDates = txns.map(t => new Date(t.date).getTime()).sort();
      const intervals: number[] = [];

      for (let i = 1; i < sortedDates.length; i++) {
        intervals.push(sortedDates[i] - sortedDates[i - 1]);
      }

      // If average interval is between 7 and 35 days, likely recurring
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const avgDays = avgInterval / (1000 * 60 * 60 * 24);

      if (avgDays >= 7 && avgDays <= 35) {
        const groupId = `recurring_${Date.now()}_${key.substring(0, 10)}`;
        recurringGroups.set(groupId, txns.map(t => t.id));
      }
    }
  }

  return recurringGroups;
}
