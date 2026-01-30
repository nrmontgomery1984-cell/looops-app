// Tiller Money Service - Financial data from Google Sheets
// Tiller syncs bank transactions and balances to Google Sheets

import { getSheetData } from "../integrations/googleSheets.js";

// Sheet names commonly used by Tiller
const TILLER_SHEETS = {
  TRANSACTIONS: "Transactions",
  BALANCES: "Balance History",
  CATEGORIES: "Categories",
  ACCOUNTS: "Accounts",
};

/**
 * Check if Tiller is configured
 */
export function isConfigured() {
  return !!process.env.SHEETS_TILLER_ID;
}

/**
 * Get the Tiller sheet ID
 */
function getSheetId() {
  const id = process.env.SHEETS_TILLER_ID;
  if (!id) {
    throw new Error("SHEETS_TILLER_ID not configured");
  }
  return id;
}

/**
 * Get recent transactions
 */
export async function getTransactions(days = 30) {
  if (!isConfigured()) return null;

  try {
    const sheetId = getSheetId();
    const data = await getSheetData(sheetId, TILLER_SHEETS.TRANSACTIONS);

    if (!data || data.length < 2) {
      return [];
    }

    const headers = data[0];
    const dateIdx = headers.indexOf("Date");
    const descIdx = headers.indexOf("Description");
    const categoryIdx = headers.indexOf("Category");
    const amountIdx = headers.indexOf("Amount");
    const accountIdx = headers.indexOf("Account");
    const typeIdx = headers.indexOf("Transaction Type");

    // Calculate date threshold
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    const transactions = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const dateStr = row[dateIdx];

      if (!dateStr) continue;

      // Parse date (Tiller uses MM/DD/YYYY format)
      const dateParts = dateStr.split("/");
      const date = new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[0]) - 1,
        parseInt(dateParts[1])
      );

      if (date < threshold) continue;

      transactions.push({
        date: date.toISOString().split("T")[0],
        description: row[descIdx] || "",
        category: row[categoryIdx] || "Uncategorized",
        amount: parseFloat(row[amountIdx]) || 0,
        account: row[accountIdx] || "",
        type: row[typeIdx] || (parseFloat(row[amountIdx]) >= 0 ? "credit" : "debit"),
      });
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return transactions;
  } catch (error) {
    console.error("Error fetching Tiller transactions:", error.message);
    throw error;
  }
}

/**
 * Get account balances
 */
export async function getBalances() {
  if (!isConfigured()) return null;

  try {
    const sheetId = getSheetId();
    const data = await getSheetData(sheetId, TILLER_SHEETS.BALANCES);

    if (!data || data.length < 2) {
      return [];
    }

    const headers = data[0];
    const dateIdx = headers.indexOf("Date");
    const accountIdx = headers.indexOf("Account");
    const balanceIdx = headers.indexOf("Balance");
    const typeIdx = headers.indexOf("Type") !== -1 ? headers.indexOf("Type") : headers.indexOf("Account Type");

    // Get the most recent balance for each account
    const latestBalances = new Map();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const account = row[accountIdx];
      const dateStr = row[dateIdx];

      if (!account || !dateStr) continue;

      const dateParts = dateStr.split("/");
      const date = new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[0]) - 1,
        parseInt(dateParts[1])
      );

      const existing = latestBalances.get(account);
      if (!existing || date > existing.date) {
        latestBalances.set(account, {
          date,
          account,
          balance: parseFloat(row[balanceIdx]) || 0,
          type: row[typeIdx] || "Unknown",
        });
      }
    }

    const balances = Array.from(latestBalances.values()).map((b) => ({
      account: b.account,
      balance: b.balance,
      type: b.type,
      asOf: b.date.toISOString().split("T")[0],
    }));

    return balances;
  } catch (error) {
    console.error("Error fetching Tiller balances:", error.message);
    throw error;
  }
}

/**
 * Get spending by category for a period
 */
export async function getSpendingByCategory(days = 30) {
  if (!isConfigured()) return null;

  try {
    const transactions = await getTransactions(days);
    if (!transactions) return null;

    const spending = new Map();

    for (const txn of transactions) {
      // Only count expenses (negative amounts)
      if (txn.amount >= 0) continue;

      const category = txn.category || "Uncategorized";
      const current = spending.get(category) || 0;
      spending.set(category, current + Math.abs(txn.amount));
    }

    const categories = Array.from(spending.entries())
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    return categories;
  } catch (error) {
    console.error("Error calculating spending by category:", error.message);
    throw error;
  }
}

/**
 * Get income vs expenses summary
 */
export async function getIncomeExpenses(days = 30) {
  if (!isConfigured()) return null;

  try {
    const transactions = await getTransactions(days);
    if (!transactions) return null;

    let income = 0;
    let expenses = 0;

    for (const txn of transactions) {
      if (txn.amount >= 0) {
        income += txn.amount;
      } else {
        expenses += Math.abs(txn.amount);
      }
    }

    return {
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      net: Math.round((income - expenses) * 100) / 100,
      savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
    };
  } catch (error) {
    console.error("Error calculating income/expenses:", error.message);
    throw error;
  }
}

/**
 * Calculate net worth from balances
 */
export async function getNetWorth() {
  if (!isConfigured()) return null;

  try {
    const balances = await getBalances();
    if (!balances) return null;

    let assets = 0;
    let liabilities = 0;

    for (const account of balances) {
      const type = account.type.toLowerCase();

      // Classify account types
      if (
        type.includes("credit") ||
        type.includes("loan") ||
        type.includes("mortgage") ||
        type.includes("liability")
      ) {
        liabilities += Math.abs(account.balance);
      } else {
        // Checking, savings, investment, etc.
        assets += account.balance;
      }
    }

    return {
      assets: Math.round(assets * 100) / 100,
      liabilities: Math.round(liabilities * 100) / 100,
      netWorth: Math.round((assets - liabilities) * 100) / 100,
      accounts: balances,
    };
  } catch (error) {
    console.error("Error calculating net worth:", error.message);
    throw error;
  }
}

/**
 * Get financial summary for Wealth loop
 */
export async function getFinancialSummary(days = 30) {
  if (!isConfigured()) return null;

  try {
    const [incomeExpenses, spendingByCategory, netWorth, recentTransactions] =
      await Promise.all([
        getIncomeExpenses(days),
        getSpendingByCategory(days),
        getNetWorth(),
        getTransactions(7), // Last 7 days for recent activity
      ]);

    return {
      period: `${days} days`,
      incomeExpenses,
      topCategories: spendingByCategory?.slice(0, 5) || [],
      netWorth,
      recentTransactions: recentTransactions?.slice(0, 10) || [],
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting financial summary:", error.message);
    throw error;
  }
}

export default {
  isConfigured,
  getTransactions,
  getBalances,
  getSpendingByCategory,
  getIncomeExpenses,
  getNetWorth,
  getFinancialSummary,
};
