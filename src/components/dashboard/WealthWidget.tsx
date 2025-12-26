// Wealth Widget - Financial data from Google Sheets
// Shows net worth, income/expenses, and spending breakdown

import React, { useEffect, useState } from "react";

const API_BASE = "/api/sheets";

// Helper to get Google Sheets tokens from localStorage
function getSheetsToken(): string | null {
  try {
    const stored = localStorage.getItem('looops_google_sheets_tokens');
    if (stored) {
      const tokens = JSON.parse(stored);
      return tokens.access_token || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

interface IncomeExpenses {
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
}

interface SpendingCategory {
  category: string;
  amount: number;
}

interface AccountBalance {
  account: string;
  balance: number;
  type: string;
  asOf: string;
}

interface NetWorth {
  assets: number;
  liabilities: number;
  netWorth: number;
  accounts: AccountBalance[];
}

interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  account: string;
  type: string;
}

interface FinancialSummary {
  period: string;
  incomeExpenses: IncomeExpenses;
  topCategories: SpendingCategory[];
  netWorth: NetWorth;
  recentTransactions: Transaction[];
  updatedAt: string;
}

export function WealthWidget() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [view, setView] = useState<"overview" | "spending" | "accounts">("overview");

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchSummary();
    }
  }, [isConnected]);

  const checkStatus = async () => {
    // Check if we have Google Sheets token
    const token = getSheetsToken();
    setIsConnected(!!token);
  };

  const fetchSummary = async () => {
    const token = getSheetsToken();

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/budget`, { headers });
      const data = await res.json();

      // Handle token expiration
      if (data.needsReauth) {
        localStorage.removeItem('looops_google_sheets_tokens');
        setIsConnected(false);
        setError("Google Sheets session expired. Please reconnect.");
        return;
      }

      if ((data.source === "tiller" || data.source === "sheets") && data.data) {
        setSummary(data.data);
        setError(null);
      } else if (data.message) {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  // Not connected state
  if (isConnected === false) {
    return (
      <div className="wealth-widget wealth-widget--disconnected">
        <div className="wealth-widget-empty">
          <span className="wealth-widget-icon">💰</span>
          <p>Connect Google Sheets to see your finances</p>
          <small>Go to Integrations and connect Google Sheets</small>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || isConnected === null) {
    return (
      <div className="wealth-widget wealth-widget--loading">
        <div className="wealth-widget-loading">
          <div className="wealth-widget-spinner" />
          <span>Loading finances...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="wealth-widget wealth-widget--error">
        <div className="wealth-widget-error">
          <span className="wealth-widget-error-icon">!</span>
          <p>{error}</p>
          <button className="wealth-widget-retry-btn" onClick={fetchSummary}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { incomeExpenses, topCategories, netWorth, recentTransactions } = summary || {};

  return (
    <div className="wealth-widget">
      {/* Net Worth Header */}
      {netWorth && (
        <div className="wealth-net-worth">
          <span className="wealth-net-worth-label">Net Worth</span>
          <span className={`wealth-net-worth-value ${netWorth.netWorth >= 0 ? "positive" : "negative"}`}>
            {formatCurrency(netWorth.netWorth)}
          </span>
        </div>
      )}

      {/* View Toggle */}
      <div className="wealth-widget-tabs">
        <button
          className={`wealth-widget-tab ${view === "overview" ? "active" : ""}`}
          onClick={() => setView("overview")}
        >
          Overview
        </button>
        <button
          className={`wealth-widget-tab ${view === "spending" ? "active" : ""}`}
          onClick={() => setView("spending")}
        >
          Spending
        </button>
        <button
          className={`wealth-widget-tab ${view === "accounts" ? "active" : ""}`}
          onClick={() => setView("accounts")}
        >
          Accounts
        </button>
      </div>

      {/* Overview View */}
      {view === "overview" && incomeExpenses && (
        <div className="wealth-overview">
          <div className="wealth-stats-grid">
            <div className="wealth-stat wealth-stat--income">
              <span className="wealth-stat-label">Income</span>
              <span className="wealth-stat-value">{formatCurrency(incomeExpenses.income)}</span>
            </div>
            <div className="wealth-stat wealth-stat--expenses">
              <span className="wealth-stat-label">Expenses</span>
              <span className="wealth-stat-value">{formatCurrency(incomeExpenses.expenses)}</span>
            </div>
            <div className="wealth-stat wealth-stat--net">
              <span className="wealth-stat-label">Net</span>
              <span className={`wealth-stat-value ${incomeExpenses.net >= 0 ? "positive" : "negative"}`}>
                {formatCurrency(incomeExpenses.net)}
              </span>
            </div>
            <div className="wealth-stat wealth-stat--savings">
              <span className="wealth-stat-label">Savings Rate</span>
              <span className="wealth-stat-value">{incomeExpenses.savingsRate}%</span>
            </div>
          </div>

          {/* Recent Transactions */}
          {recentTransactions && recentTransactions.length > 0 && (
            <div className="wealth-recent">
              <h4>Recent Transactions</h4>
              <div className="wealth-transactions-list">
                {recentTransactions.slice(0, 5).map((txn, i) => (
                  <div key={i} className="wealth-transaction">
                    <div className="wealth-transaction-info">
                      <span className="wealth-transaction-desc">{txn.description}</span>
                      <span className="wealth-transaction-category">{txn.category}</span>
                    </div>
                    <span className={`wealth-transaction-amount ${txn.amount >= 0 ? "positive" : "negative"}`}>
                      {formatCurrency(txn.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spending View */}
      {view === "spending" && topCategories && (
        <div className="wealth-spending">
          {topCategories.length === 0 ? (
            <div className="wealth-no-data">No spending data</div>
          ) : (
            <div className="wealth-categories-list">
              {topCategories.map((cat, i) => {
                const maxAmount = topCategories[0]?.amount || 1;
                const percentage = (cat.amount / maxAmount) * 100;

                return (
                  <div key={cat.category} className="wealth-category">
                    <div className="wealth-category-header">
                      <span className="wealth-category-name">{cat.category}</span>
                      <span className="wealth-category-amount">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="wealth-category-bar">
                      <div
                        className="wealth-category-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Accounts View */}
      {view === "accounts" && netWorth?.accounts && (
        <div className="wealth-accounts">
          <div className="wealth-accounts-summary">
            <div className="wealth-accounts-item">
              <span className="wealth-accounts-label">Assets</span>
              <span className="wealth-accounts-value positive">{formatCurrency(netWorth.assets)}</span>
            </div>
            <div className="wealth-accounts-item">
              <span className="wealth-accounts-label">Liabilities</span>
              <span className="wealth-accounts-value negative">{formatCurrency(netWorth.liabilities)}</span>
            </div>
          </div>

          <div className="wealth-accounts-list">
            {netWorth.accounts.map((account) => (
              <div key={account.account} className="wealth-account">
                <div className="wealth-account-info">
                  <span className="wealth-account-name">{account.account}</span>
                  <span className="wealth-account-type">{account.type}</span>
                </div>
                <span className={`wealth-account-balance ${account.balance >= 0 ? "positive" : "negative"}`}>
                  {formatCurrency(account.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last updated */}
      {summary?.updatedAt && (
        <div className="wealth-widget-footer">
          <span className="wealth-widget-updated">
            Updated {formatRelativeTime(summary.updatedAt)}
          </span>
          <button className="wealth-widget-refresh" onClick={fetchSummary} title="Refresh">
            ↻
          </button>
        </div>
      )}
    </div>
  );
}

function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absAmount);

  return amount < 0 ? `-${formatted}` : formatted;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
}

export default WealthWidget;
