// FinanceScreen - Main finance dashboard for bank account management
// Wealth loop integration for transaction tracking and budgeting

import { useState, useMemo, useCallback } from "react";
import {
  useFinance,
  useFinanceAccounts,
  useFinanceTransactions,
  useFinanceCategories,
  useFinanceRules,
  useFinanceExpenses,
  useLoopBudgets,
  useMonthlyIncome,
  useApp,
} from "../../context";
import {
  FinanceTransaction,
  FinanceAccount,
  FinanceCategory,
  FinanceConnection,
  BudgetExpense,
  LoopBudget,
  LoopId,
  ALL_LOOPS,
  formatFinanceCurrency,
  calculateNetWorth,
  getSpendingByCategory,
  getSpendingByLoop,
  LOOP_COLORS,
} from "../../types";
import { connectSimplefin, performFullSync } from "../../lib/finance/service";

type FinanceView = "overview" | "transactions" | "expenses" | "accounts" | "categories" | "settings";

export function FinanceScreen() {
  const { dispatch } = useApp();
  const finance = useFinance();
  const accounts = useFinanceAccounts();
  const transactions = useFinanceTransactions();
  const categories = useFinanceCategories();
  const rules = useFinanceRules();
  const expenses = useFinanceExpenses();
  const loopBudgets = useLoopBudgets();
  const monthlyIncome = useMonthlyIncome();

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
        {(["overview", "transactions", "expenses", "accounts", "categories", "settings"] as FinanceView[]).map(
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

        {activeView === "expenses" && (
          <ExpensesView
            expenses={expenses}
            loopBudgets={loopBudgets}
            monthlyIncome={monthlyIncome}
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

// Expenses sub-component - Recurring bills and budgets (shared with Budget widget)
function ExpensesView({
  expenses,
  loopBudgets,
  monthlyIncome,
  dispatch,
}: {
  expenses: BudgetExpense[];
  loopBudgets: LoopBudget[];
  monthlyIncome: number;
  dispatch: React.Dispatch<any>;
}) {
  const [editingExpense, setEditingExpense] = useState<BudgetExpense | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(monthlyIncome.toString());

  // Group expenses by loop
  const expensesByLoop = useMemo(() => {
    const grouped: Record<string, BudgetExpense[]> = {};
    ALL_LOOPS.forEach(loop => {
      grouped[loop] = expenses.filter(e => e.loop === loop);
    });
    return grouped;
  }, [expenses]);

  // Calculate totals
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => {
      // Convert to monthly for consistent comparison
      let monthly = e.amount;
      if (e.frequency === "weekly") monthly = e.amount * 4.33;
      else if (e.frequency === "bi-weekly") monthly = e.amount * 2.17;
      else if (e.frequency === "yearly") monthly = e.amount / 12;
      return sum + monthly;
    }, 0);
  }, [expenses]);

  const handleSaveIncome = () => {
    const value = parseFloat(incomeInput) || 0;
    dispatch({ type: "SET_MONTHLY_INCOME", payload: value });
    setEditingIncome(false);
  };

  const handleDeleteExpense = (id: string) => {
    dispatch({ type: "DELETE_FINANCE_EXPENSE", payload: id });
  };

  const handleSaveExpense = (expense: BudgetExpense) => {
    if (editingExpense) {
      dispatch({ type: "UPDATE_FINANCE_EXPENSE", payload: expense });
    } else {
      dispatch({ type: "ADD_FINANCE_EXPENSE", payload: expense });
    }
    setEditingExpense(null);
    setShowAddExpense(false);
  };

  return (
    <div className="finance-expenses">
      {/* Monthly Income Card */}
      <div className="finance-card finance-income-card">
        <h3>Monthly Income</h3>
        {editingIncome ? (
          <div className="finance-income-edit">
            <input
              type="number"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
            <button onClick={handleSaveIncome} className="finance-save-btn">Save</button>
            <button onClick={() => setEditingIncome(false)} className="finance-cancel-btn">Cancel</button>
          </div>
        ) : (
          <div className="finance-income-display" onClick={() => { setIncomeInput(monthlyIncome.toString()); setEditingIncome(true); }}>
            <span className="finance-income-value">${monthlyIncome.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
            <span className="finance-edit-hint">Click to edit</span>
          </div>
        )}
        <div className="finance-budget-summary">
          <div className="finance-budget-item">
            <span>Total Monthly Expenses:</span>
            <span className="negative">${totalExpenses.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="finance-budget-item">
            <span>Remaining:</span>
            <span className={monthlyIncome - totalExpenses >= 0 ? "positive" : "negative"}>
              ${(monthlyIncome - totalExpenses).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Add Expense Button */}
      <div className="finance-card">
        <div className="finance-expenses-header">
          <h3>Recurring Bills & Expenses</h3>
          <button className="finance-add-btn" onClick={() => setShowAddExpense(true)}>
            + Add Expense
          </button>
        </div>
        <p className="finance-settings-desc">
          These expenses are shared with the Budget widget on your Wealth dashboard.
        </p>
      </div>

      {/* Expenses by Loop */}
      {ALL_LOOPS.filter(loop => expensesByLoop[loop].length > 0).map(loop => {
        const colors = LOOP_COLORS[loop as keyof typeof LOOP_COLORS];
        const loopExpenses = expensesByLoop[loop];
        const loopTotal = loopExpenses.reduce((sum, e) => {
          let monthly = e.amount;
          if (e.frequency === "weekly") monthly = e.amount * 4.33;
          else if (e.frequency === "bi-weekly") monthly = e.amount * 2.17;
          else if (e.frequency === "yearly") monthly = e.amount / 12;
          return sum + monthly;
        }, 0);

        return (
          <div key={loop} className="finance-card finance-loop-expenses" style={{ borderLeftColor: colors?.bg }}>
            <div className="finance-loop-header">
              <h4 style={{ color: colors?.text }}>{loop}</h4>
              <span className="finance-loop-total">${loopTotal.toLocaleString('en-CA', { minimumFractionDigits: 2 })}/mo</span>
            </div>
            <div className="finance-expense-list">
              {loopExpenses.map(expense => (
                <div key={expense.id} className="finance-expense-row">
                  <div className="finance-expense-info">
                    <span className="finance-expense-name">{expense.name}</span>
                    <span className="finance-expense-meta">
                      {expense.category} • {expense.frequency}
                      {expense.dueDate && ` • Due: ${expense.dueDate}`}
                    </span>
                  </div>
                  <div className="finance-expense-actions">
                    <span className="finance-expense-amount">${expense.amount.toFixed(2)}</span>
                    <button
                      className="finance-expense-edit"
                      onClick={() => setEditingExpense(expense)}
                    >
                      Edit
                    </button>
                    <button
                      className="finance-expense-delete"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="finance-card finance-empty-expenses">
          <div className="finance-empty-icon">💸</div>
          <h4>No expenses tracked yet</h4>
          <p>Add your recurring bills and expenses to track your budget.</p>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {(showAddExpense || editingExpense) && (
        <ExpenseModal
          expense={editingExpense}
          onSave={handleSaveExpense}
          onCancel={() => { setEditingExpense(null); setShowAddExpense(false); }}
        />
      )}
    </div>
  );
}

// Expense Edit Modal
function ExpenseModal({
  expense,
  onSave,
  onCancel,
}: {
  expense: BudgetExpense | null;
  onSave: (expense: BudgetExpense) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(expense?.name || "");
  const [amount, setAmount] = useState(expense?.amount?.toString() || "");
  const [category, setCategory] = useState(expense?.category || "Bills");
  const [loop, setLoop] = useState<LoopId>(expense?.loop || "Maintenance");
  const [frequency, setFrequency] = useState<BudgetExpense["frequency"]>(expense?.frequency || "monthly");
  const [dueDate, setDueDate] = useState(expense?.dueDate || "");
  const [notes, setNotes] = useState(expense?.notes || "");
  const [url, setUrl] = useState(expense?.url || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: expense?.id || `exp_${Date.now()}`,
      name,
      amount: parseFloat(amount) || 0,
      category,
      loop,
      frequency,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
      url: url || undefined,
    });
  };

  return (
    <div className="finance-modal-overlay" onClick={onCancel}>
      <div className="finance-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{expense ? "Edit Expense" : "Add Expense"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="finance-form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix, Rent, Phone Bill..."
              required
            />
          </div>
          <div className="finance-form-row">
            <div className="finance-form-group">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="finance-form-group">
              <label>Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as BudgetExpense["frequency"])}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="yearly">Yearly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>
          </div>
          <div className="finance-form-row">
            <div className="finance-form-group">
              <label>Loop</label>
              <select value={loop} onChange={(e) => setLoop(e.target.value as LoopId)}>
                {ALL_LOOPS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="finance-form-group">
              <label>Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Bills, Subscription, etc."
              />
            </div>
          </div>
          <div className="finance-form-group">
            <label>Due Date (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="finance-form-group">
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>
          <div className="finance-form-group">
            <label>Payment URL (optional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="finance-modal-actions">
            <button type="button" onClick={onCancel} className="finance-cancel-btn">Cancel</button>
            <button type="submit" className="finance-save-btn">Save</button>
          </div>
        </form>
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
      console.log("[Finance] Claiming setup token...");
      const result = await connectSimplefin(setupToken.trim());
      console.log("[Finance] Connect result:", result);

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

      console.log("[Finance] Saving connection...");
      dispatch({ type: "SET_FINANCE_CONNECTION", payload: newConnection });

      // Step 3: Perform initial sync
      console.log("[Finance] Starting initial sync...");
      const syncResult = await performFullSync(
        newConnection,
        accounts,
        transactions,
        rules,
        categories,
        dispatch
      );
      console.log("[Finance] Sync result:", syncResult);

      if (!syncResult.success) {
        setConnectError(syncResult.error || "Sync failed after connection");
      } else {
        setConnectSuccess(true);
      }
      setSetupToken("");
    } catch (error) {
      console.error("[Finance] Connection error:", error);
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
