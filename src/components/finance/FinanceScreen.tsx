// FinanceScreen - Main finance dashboard for bank account management
// Wealth loop integration for transaction tracking and budgeting

import { useState, useMemo, useCallback } from "react";
import {
  useFinance,
  useFinanceAccounts,
  useFinanceTransactions,
  useFinanceCategories,
  useFinanceRules,
  useApp,
} from "../../context";
import {
  FinanceTransaction,
  FinanceAccount,
  FinanceCategory,
  FinanceConnection,
  formatFinanceCurrency,
  calculateNetWorth,
  getSpendingByCategory,
  getSpendingByLoop,
  LOOP_COLORS,
} from "../../types";
import { connectSimplefin, performFullSync } from "../../lib/finance/service";

type FinanceView = "overview" | "transactions" | "accounts" | "categories" | "rules" | "settings";

export function FinanceScreen() {
  const { dispatch } = useApp();
  const finance = useFinance();
  const accounts = useFinanceAccounts();
  const transactions = useFinanceTransactions();
  const categories = useFinanceCategories();
  const rules = useFinanceRules();

  const [activeView, setActiveView] = useState<FinanceView>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  // Handle sync for active connection
  const handleSync = useCallback(async () => {
    const activeConnection = finance.connections.find(c => c.status === "active");
    if (!activeConnection) return;

    await performFullSync(
      activeConnection,
      accounts,
      transactions,
      rules,
      categories,
      dispatch
    );
  }, [finance.connections, accounts, transactions, rules, categories, dispatch]);

  // Calculate net worth
  const netWorth = useMemo(() => calculateNetWorth(accounts), [accounts]);

  // Filter transactions by date range and search
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by account
    if (selectedAccountId) {
      filtered = filtered.filter((t) => t.accountId === selectedAccountId);
    }

    // Filter by date range
    if (dateRange !== "all") {
      const now = new Date();
      const daysAgo = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      filtered = filtered.filter((t) => t.date >= cutoffStr);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.cleanDescription.toLowerCase().includes(query) ||
          (t.notes && t.notes.toLowerCase().includes(query))
      );
    }

    // Sort by date descending
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedAccountId, dateRange, searchQuery]);

  // Calculate spending by category for the filtered transactions
  const spendingByCategory = useMemo(
    () => getSpendingByCategory(filteredTransactions, categories),
    [filteredTransactions, categories]
  );

  // Calculate spending by loop
  const spendingByLoop = useMemo(
    () => getSpendingByLoop(filteredTransactions),
    [filteredTransactions]
  );

  const hasConnection = finance.connections.length > 0;

  return (
    <div className="finance-screen">
      <div className="finance-header">
        <div className="finance-header-title">
          <h2>Finance</h2>
          <span className="finance-header-subtitle">Bank accounts & transactions</span>
        </div>
        <div className="finance-header-actions">
          {hasConnection && (
            <button
              className="finance-sync-btn"
              disabled={finance.syncStatus.isSyncing}
              onClick={handleSync}
            >
              {finance.syncStatus.isSyncing ? "Syncing..." : "Sync"}
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="finance-tabs">
        {(["overview", "transactions", "accounts", "categories", "settings"] as FinanceView[]).map(
          (view) => (
            <button
              key={view}
              className={`finance-tab ${activeView === view ? "active" : ""}`}
              onClick={() => setActiveView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          )
        )}
      </div>

      <div className="finance-content">
        {activeView === "overview" && (
          <OverviewView
            accounts={accounts}
            netWorth={netWorth}
            spendingByLoop={spendingByLoop}
            spendingByCategory={spendingByCategory}
            recentTransactions={filteredTransactions.slice(0, 10)}
            categories={categories}
            hasConnection={hasConnection}
            onConnectBank={() => setActiveView("settings")}
          />
        )}

        {activeView === "transactions" && (
          <TransactionsView
            transactions={filteredTransactions}
            accounts={accounts}
            categories={categories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            dispatch={dispatch}
          />
        )}

        {activeView === "accounts" && (
          <AccountsView
            accounts={accounts}
            netWorth={netWorth}
            connections={finance.connections}
          />
        )}

        {activeView === "categories" && (
          <CategoriesView categories={categories} dispatch={dispatch} />
        )}

        {activeView === "settings" && (
          <SettingsView
            connections={finance.connections}
            settings={finance.settings}
            syncStatus={finance.syncStatus}
            dispatch={dispatch}
            accounts={accounts}
            transactions={transactions}
            rules={rules}
            categories={categories}
          />
        )}
      </div>
    </div>
  );
}

// Overview sub-component
function OverviewView({
  accounts,
  netWorth,
  spendingByLoop,
  spendingByCategory,
  recentTransactions,
  categories,
  hasConnection,
  onConnectBank,
}: {
  accounts: FinanceAccount[];
  netWorth: { assets: number; liabilities: number; netWorth: number };
  spendingByLoop: Array<{ loop: string; total: number; count: number }>;
  spendingByCategory: Array<{ category: FinanceCategory; total: number; count: number }>;
  recentTransactions: FinanceTransaction[];
  categories: FinanceCategory[];
  hasConnection: boolean;
  onConnectBank: () => void;
}) {
  if (!hasConnection && accounts.length === 0) {
    return (
      <div className="finance-empty-state">
        <div className="finance-empty-icon">🏦</div>
        <h3>Connect Your Bank Accounts</h3>
        <p>
          Track your spending, manage budgets, and see where your money goes across all your Life
          Loops.
        </p>
        <button className="finance-connect-btn" onClick={onConnectBank}>
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div className="finance-overview">
      {/* Net Worth Card */}
      <div className="finance-card finance-networth">
        <h3>Net Worth</h3>
        <div className="finance-networth-value">{formatFinanceCurrency(netWorth.netWorth)}</div>
        <div className="finance-networth-breakdown">
          <div className="finance-networth-item">
            <span>Assets</span>
            <span className="positive">{formatFinanceCurrency(netWorth.assets)}</span>
          </div>
          <div className="finance-networth-item">
            <span>Liabilities</span>
            <span className="negative">-{formatFinanceCurrency(netWorth.liabilities)}</span>
          </div>
        </div>
      </div>

      {/* Spending by Loop */}
      <div className="finance-card finance-spending-loops">
        <h3>Spending by Loop (Last 30 Days)</h3>
        {spendingByLoop.length === 0 ? (
          <p className="finance-empty-text">No spending data yet</p>
        ) : (
          <div className="finance-loop-bars">
            {spendingByLoop.map(({ loop, total, count }) => {
              const colors = LOOP_COLORS[loop as keyof typeof LOOP_COLORS];
              return (
                <div key={loop} className="finance-loop-bar-row">
                  <span className="finance-loop-label" style={{ color: colors?.text }}>
                    {loop}
                  </span>
                  <div className="finance-loop-bar-container">
                    <div
                      className="finance-loop-bar-fill"
                      style={{
                        backgroundColor: colors?.bg,
                        width: `${Math.min(100, (total / spendingByLoop[0].total) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="finance-loop-amount">{formatFinanceCurrency(total)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="finance-card finance-recent">
        <h3>Recent Transactions</h3>
        {recentTransactions.length === 0 ? (
          <p className="finance-empty-text">No transactions yet</p>
        ) : (
          <div className="finance-transaction-list">
            {recentTransactions.map((t) => {
              const category = categories.find((c) => c.id === t.categoryId);
              return (
                <div key={t.id} className="finance-transaction-row">
                  <div className="finance-transaction-icon">
                    {category?.icon || "💳"}
                  </div>
                  <div className="finance-transaction-details">
                    <span className="finance-transaction-desc">{t.cleanDescription || t.description}</span>
                    <span className="finance-transaction-date">{t.date}</span>
                  </div>
                  <div
                    className={`finance-transaction-amount ${t.amount < 0 ? "negative" : "positive"}`}
                  >
                    {formatFinanceCurrency(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Transactions sub-component
function TransactionsView({
  transactions,
  accounts,
  categories,
  searchQuery,
  onSearchChange,
  selectedAccountId,
  onAccountChange,
  dateRange,
  onDateRangeChange,
  dispatch,
}: {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedAccountId: string | null;
  onAccountChange: (id: string | null) => void;
  dateRange: "7d" | "30d" | "90d" | "all";
  onDateRangeChange: (range: "7d" | "30d" | "90d" | "all") => void;
  dispatch: React.Dispatch<any>;
}) {
  return (
    <div className="finance-transactions">
      {/* Filters */}
      <div className="finance-filters">
        <input
          type="text"
          className="finance-search"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select
          className="finance-filter-select"
          value={selectedAccountId || "all"}
          onChange={(e) => onAccountChange(e.target.value === "all" ? null : e.target.value)}
        >
          <option value="all">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          className="finance-filter-select"
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value as "7d" | "30d" | "90d" | "all")}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Transaction list */}
      <div className="finance-transaction-list-full">
        {transactions.length === 0 ? (
          <div className="finance-empty-text">No transactions found</div>
        ) : (
          transactions.map((t) => {
            const category = categories.find((c) => c.id === t.categoryId);
            const account = accounts.find((a) => a.id === t.accountId);
            return (
              <div key={t.id} className="finance-transaction-item">
                <div className="finance-transaction-icon-lg">
                  {category?.icon || "💳"}
                </div>
                <div className="finance-transaction-info">
                  <div className="finance-transaction-main">
                    <span className="finance-transaction-desc">
                      {t.cleanDescription || t.description}
                    </span>
                    {t.pending && <span className="finance-pending-badge">Pending</span>}
                  </div>
                  <div className="finance-transaction-meta">
                    <span>{t.date}</span>
                    {account && <span>• {account.name}</span>}
                    {category && (
                      <span className="finance-category-badge" style={{ backgroundColor: category.color }}>
                        {category.name}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`finance-transaction-amount-lg ${t.amount < 0 ? "negative" : "positive"}`}
                >
                  {formatFinanceCurrency(t.amount)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Accounts sub-component
function AccountsView({
  accounts,
  netWorth,
  connections,
}: {
  accounts: FinanceAccount[];
  netWorth: { assets: number; liabilities: number; netWorth: number };
  connections: any[];
}) {
  const visibleAccounts = accounts.filter((a) => !a.isHidden);
  const hiddenAccounts = accounts.filter((a) => a.isHidden);

  return (
    <div className="finance-accounts">
      <div className="finance-card">
        <h3>Connected Accounts</h3>
        {visibleAccounts.length === 0 ? (
          <p className="finance-empty-text">No accounts connected yet</p>
        ) : (
          <div className="finance-accounts-list">
            {visibleAccounts.map((account) => (
              <div key={account.id} className="finance-account-card">
                <div className="finance-account-info">
                  <span className="finance-account-name">{account.name}</span>
                  <span className="finance-account-institution">{account.institution}</span>
                </div>
                <div
                  className={`finance-account-balance ${
                    account.type === "credit" ? "negative" : "positive"
                  }`}
                >
                  {formatFinanceCurrency(account.balance)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hiddenAccounts.length > 0 && (
        <div className="finance-card">
          <h3>Hidden Accounts</h3>
          <div className="finance-accounts-list">
            {hiddenAccounts.map((account) => (
              <div key={account.id} className="finance-account-card hidden">
                <div className="finance-account-info">
                  <span className="finance-account-name">{account.name}</span>
                  <span className="finance-account-institution">{account.institution}</span>
                </div>
                <div className="finance-account-balance">{formatFinanceCurrency(account.balance)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Categories sub-component
function CategoriesView({
  categories,
  dispatch,
}: {
  categories: FinanceCategory[];
  dispatch: React.Dispatch<any>;
}) {
  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="finance-categories">
      <div className="finance-card">
        <h3>Transaction Categories</h3>
        <div className="finance-categories-grid">
          {sortedCategories.map((cat) => (
            <div
              key={cat.id}
              className="finance-category-item"
              style={{ borderLeftColor: cat.color }}
            >
              <span className="finance-category-icon">{cat.icon}</span>
              <div className="finance-category-info">
                <span className="finance-category-name">{cat.name}</span>
                <span className="finance-category-loop">{cat.loop}</span>
              </div>
              {!cat.isDefault && (
                <button
                  className="finance-category-delete"
                  onClick={() => dispatch({ type: "DELETE_FINANCE_CATEGORY", payload: cat.id })}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Settings sub-component
function SettingsView({
  connections,
  settings,
  syncStatus,
  dispatch,
  accounts,
  transactions,
  rules,
  categories,
}: {
  connections: FinanceConnection[];
  settings: any;
  syncStatus: any;
  dispatch: React.Dispatch<any>;
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  rules: any[];
  categories: FinanceCategory[];
}) {
  const [setupToken, setSetupToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState(false);

  const handleConnect = async () => {
    if (!setupToken.trim()) return;

    setIsConnecting(true);
    setConnectError(null);
    setConnectSuccess(false);

    try {
      // Step 1: Claim the token and get access URL
      const result = await connectSimplefin(setupToken.trim());

      if (!result.success) {
        setConnectError(result.message || "Failed to connect");
        setIsConnecting(false);
        return;
      }

      // Step 2: Create the connection in state
      const newConnection: FinanceConnection = {
        id: `conn_${Date.now()}`,
        provider: "simplefin",
        accessUrl: result.accessUrl!,
        status: "active",
        lastSyncAt: null,
        lastSyncError: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "SET_FINANCE_CONNECTION", payload: newConnection });

      // Step 3: Perform initial sync
      await performFullSync(
        newConnection,
        accounts,
        transactions,
        rules,
        categories,
        dispatch
      );

      setConnectSuccess(true);
      setSetupToken("");
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="finance-settings">
      {/* Connection Setup */}
      <div className="finance-card">
        <h3>Connect Bank Accounts</h3>
        <p className="finance-settings-desc">
          Connect your bank accounts using SimpleFIN Bridge. This service costs ~$15/year and
          supports Canadian banks including BMO and Rogers Bank.
        </p>
        <ol className="finance-setup-steps">
          <li>
            Sign up at{" "}
            <a href="https://beta-bridge.simplefin.org" target="_blank" rel="noopener noreferrer">
              SimpleFIN Bridge
            </a>
          </li>
          <li>Connect your bank accounts in the SimpleFIN dashboard</li>
          <li>Generate a "Setup Token" and paste it below</li>
        </ol>
        <div className="finance-token-input">
          <input
            type="text"
            placeholder="Paste your SimpleFIN setup token here..."
            value={setupToken}
            onChange={(e) => setSetupToken(e.target.value)}
            disabled={isConnecting}
          />
          <button onClick={handleConnect} disabled={!setupToken.trim() || isConnecting}>
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </div>
        {connectError && (
          <div className="finance-error-message">{connectError}</div>
        )}
        {connectSuccess && (
          <div className="finance-success-message">
            Successfully connected! Your accounts are now syncing.
          </div>
        )}
        {syncStatus.isSyncing && (
          <div className="finance-sync-message">
            Syncing your accounts and transactions...
          </div>
        )}
      </div>

      {/* Existing Connections */}
      {connections.length > 0 && (
        <div className="finance-card">
          <h3>Connected Services</h3>
          {connections.map((conn) => (
            <div key={conn.id} className="finance-connection-item">
              <div className="finance-connection-info">
                <span className="finance-connection-provider">SimpleFIN</span>
                <span className="finance-connection-status">
                  {conn.status === "active" ? "Connected" : conn.status}
                </span>
              </div>
              <div className="finance-connection-meta">
                Last sync: {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleDateString() : "Never"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CSV Import */}
      <div className="finance-card">
        <h3>Import Transactions (CSV)</h3>
        <p className="finance-settings-desc">
          Import transactions from CSV files exported from your bank. Supported formats: Rogers
          Bank Mastercard, BMO.
        </p>
        <button className="finance-import-btn" disabled>
          Import CSV (Coming Soon)
        </button>
      </div>

      {/* Settings */}
      <div className="finance-card">
        <h3>Settings</h3>
        <div className="finance-settings-options">
          <label className="finance-setting-item">
            <span>Auto-categorize transactions</span>
            <input
              type="checkbox"
              checked={settings.autoCategorizationEnabled}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_FINANCE_SETTINGS",
                  payload: { autoCategorizationEnabled: e.target.checked },
                })
              }
            />
          </label>
          <label className="finance-setting-item">
            <span>Currency</span>
            <select
              value={settings.currency}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_FINANCE_SETTINGS",
                  payload: { currency: e.target.value },
                })
              }
            >
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

export default FinanceScreen;
