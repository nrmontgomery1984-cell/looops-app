// Finance Service - handles API calls and data synchronization
import {
  FinanceConnection,
  FinanceAccount,
  FinanceTransaction,
  CategoryRule,
  FinanceCategory,
  LoopId,
} from "../../types";

const API_BASE = import.meta.env.PROD ? "" : "";

// Connect to SimpleFIN using a setup token
export async function connectSimplefin(setupToken: string): Promise<{
  success: boolean;
  accessUrl?: string;
  error?: string;
  message?: string;
}> {
  const response = await fetch(`${API_BASE}/api/finance/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ setupToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error,
      message: data.message,
    };
  }

  return {
    success: true,
    accessUrl: data.accessUrl,
    message: data.message,
  };
}

// Sync accounts and transactions from SimpleFIN
export async function syncSimplefin(
  accessUrl: string,
  options: { startDate?: string; endDate?: string; balancesOnly?: boolean } = {}
): Promise<{
  success: boolean;
  accounts?: FinanceAccount[];
  transactions?: FinanceTransaction[];
  errors?: string[];
  error?: string;
  message?: string;
  needsReauth?: boolean;
}> {
  const response = await fetch(`${API_BASE}/api/finance/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accessUrl,
      ...options,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error,
      message: data.message,
      needsReauth: data.error === "NEEDS_REAUTH",
    };
  }

  // Transform the API response to our types
  const accounts: FinanceAccount[] = data.accounts.map((a: any) => ({
    id: a.id,
    connectionId: "", // Will be set by caller
    name: a.name,
    institution: a.institution,
    institutionDomain: a.institutionDomain,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    availableBalance: a.availableBalance,
    balanceDate: a.balanceDate,
    isHidden: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const transactions: FinanceTransaction[] = data.transactions.map((t: any) => ({
    id: t.id,
    externalId: t.externalId,
    accountId: t.accountId,
    date: t.date,
    postedAt: t.postedAt,
    transactedAt: t.transactedAt,
    amount: t.amount,
    description: t.description,
    cleanDescription: t.cleanDescription,
    pending: t.pending,
    categoryId: null,
    loop: null,
    subcategory: null,
    notes: t.memo || null,
    tags: [],
    isReviewed: false,
    isRecurring: false,
    recurringGroupId: null,
    splits: null,
    parentTransactionId: null,
    source: "simplefin" as const,
    importedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    success: true,
    accounts,
    transactions,
    errors: data.errors,
  };
}

// Apply categorization rules to transactions
export function categorizeTransactions(
  transactions: FinanceTransaction[],
  rules: CategoryRule[],
  categories: FinanceCategory[]
): FinanceTransaction[] {
  // Sort rules by priority (higher first)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  return transactions.map(transaction => {
    // Skip if already categorized and reviewed
    if (transaction.categoryId && transaction.isReviewed) {
      return transaction;
    }

    // Try to match a rule
    for (const rule of sortedRules) {
      const description = transaction.cleanDescription.toLowerCase();
      let matches = false;

      switch (rule.patternType) {
        case "contains":
          matches = description.includes(rule.pattern.toLowerCase());
          break;
        case "starts_with":
          matches = description.startsWith(rule.pattern.toLowerCase());
          break;
        case "regex":
          try {
            const regex = new RegExp(rule.pattern, "i");
            matches = regex.test(description);
          } catch {
            // Invalid regex, skip
          }
          break;
      }

      if (matches) {
        const category = categories.find(c => c.id === rule.categoryId);
        if (category) {
          return {
            ...transaction,
            categoryId: rule.categoryId,
            loop: category.loop as LoopId,
            subcategory: category.subcategory,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    }

    return transaction;
  });
}

// Deduplicate transactions by externalId
export function deduplicateTransactions(
  existing: FinanceTransaction[],
  incoming: FinanceTransaction[]
): { new: FinanceTransaction[]; updated: FinanceTransaction[] } {
  const existingByExternalId = new Map(
    existing.map(t => [t.externalId, t])
  );

  const newTransactions: FinanceTransaction[] = [];
  const updatedTransactions: FinanceTransaction[] = [];

  for (const tx of incoming) {
    const existingTx = existingByExternalId.get(tx.externalId);

    if (!existingTx) {
      // New transaction
      newTransactions.push(tx);
    } else if (existingTx.pending && !tx.pending) {
      // Transaction was pending, now posted - update it but preserve categorization
      updatedTransactions.push({
        ...tx,
        id: existingTx.id, // Keep the same ID
        categoryId: existingTx.categoryId,
        loop: existingTx.loop,
        subcategory: existingTx.subcategory,
        notes: existingTx.notes,
        tags: existingTx.tags,
        isReviewed: existingTx.isReviewed,
        isRecurring: existingTx.isRecurring,
        recurringGroupId: existingTx.recurringGroupId,
        splits: existingTx.splits,
      });
    }
    // If transaction exists and wasn't pending, skip it (no update needed)
  }

  return { new: newTransactions, updated: updatedTransactions };
}

// Merge account data (update balances, preserve settings)
export function mergeAccounts(
  existing: FinanceAccount[],
  incoming: FinanceAccount[],
  connectionId: string
): FinanceAccount[] {
  const existingById = new Map(existing.map(a => [a.id, a]));
  const result: FinanceAccount[] = [];

  for (const acc of incoming) {
    const existingAcc = existingById.get(acc.id);

    if (existingAcc) {
      // Update balance but preserve user settings
      result.push({
        ...existingAcc,
        balance: acc.balance,
        availableBalance: acc.availableBalance,
        balanceDate: acc.balanceDate,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // New account
      result.push({
        ...acc,
        connectionId,
      });
    }
  }

  return result;
}

// Full sync operation that handles everything
export async function performFullSync(
  connection: FinanceConnection,
  existingAccounts: FinanceAccount[],
  existingTransactions: FinanceTransaction[],
  rules: CategoryRule[],
  categories: FinanceCategory[],
  dispatch: (action: any) => void
): Promise<{ success: boolean; error?: string }> {
  // Set syncing status
  dispatch({
    type: "SET_FINANCE_SYNC_STATUS",
    payload: { isSyncing: true, error: null },
  });

  try {
    // Calculate start date (90 days back by default for initial sync, 30 days for updates)
    const startDate = connection.lastSyncAt
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Fetch from SimpleFIN
    console.log("[Finance Service] Fetching from SimpleFIN, startDate:", startDate);
    const syncResult = await syncSimplefin(connection.accessUrl, { startDate });
    console.log("[Finance Service] Sync response:", {
      success: syncResult.success,
      accountCount: syncResult.accounts?.length,
      transactionCount: syncResult.transactions?.length,
      error: syncResult.error,
      errors: syncResult.errors,
    });

    if (!syncResult.success) {
      // Handle reauth needed
      if (syncResult.needsReauth) {
        dispatch({
          type: "UPDATE_FINANCE_CONNECTION",
          payload: { id: connection.id, status: "needs_reauth" },
        });
      }

      dispatch({
        type: "SET_FINANCE_SYNC_STATUS",
        payload: { isSyncing: false, error: syncResult.message || "Sync failed" },
      });

      return { success: false, error: syncResult.message };
    }

    // Merge accounts
    console.log("[Finance Service] Merging accounts...");
    const mergedAccounts = mergeAccounts(
      existingAccounts,
      syncResult.accounts!,
      connection.id
    );
    console.log("[Finance Service] Merged accounts:", mergedAccounts);
    dispatch({ type: "SET_FINANCE_ACCOUNTS", payload: mergedAccounts });

    // Deduplicate and categorize transactions
    const { new: newTxns, updated: updatedTxns } = deduplicateTransactions(
      existingTransactions,
      syncResult.transactions!
    );

    // Categorize new transactions
    const categorizedNew = categorizeTransactions(newTxns, rules, categories);
    const categorizedUpdated = categorizeTransactions(updatedTxns, rules, categories);

    // Upsert transactions
    if (categorizedNew.length > 0 || categorizedUpdated.length > 0) {
      dispatch({
        type: "UPSERT_FINANCE_TRANSACTIONS",
        payload: [...categorizedNew, ...categorizedUpdated],
      });
    }

    // Update connection status
    dispatch({
      type: "UPDATE_FINANCE_CONNECTION",
      payload: {
        id: connection.id,
        status: "active",
        lastSyncAt: new Date().toISOString(),
        lastSyncError: null,
      },
    });

    // Set sync complete
    dispatch({
      type: "SET_FINANCE_SYNC_STATUS",
      payload: {
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        error: null,
      },
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    dispatch({
      type: "SET_FINANCE_SYNC_STATUS",
      payload: { isSyncing: false, error: errorMessage },
    });

    dispatch({
      type: "UPDATE_FINANCE_CONNECTION",
      payload: {
        id: connection.id,
        status: "error",
        lastSyncError: errorMessage,
      },
    });

    return { success: false, error: errorMessage };
  }
}
