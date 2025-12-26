// Budget Widget - Financial overview for Wealth loop
// Displays spending vs budget, account balances, expenses, and recent transactions
// Categorizes expenses by Life Loops

import React, { useEffect, useState } from "react";
import { LoopId, LOOP_COLORS } from "../../types";

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

// Map expense categories to Loops
const CATEGORY_TO_LOOP: Record<string, LoopId> = {
  // Health
  'gym': 'Health',
  'fitness': 'Health',
  'medical': 'Health',
  'doctor': 'Health',
  'pharmacy': 'Health',
  'health': 'Health',
  'wellness': 'Health',
  'supplements': 'Health',
  'groceries': 'Health',
  'food': 'Health',

  // Wealth
  'investment': 'Wealth',
  'savings': 'Wealth',
  'bank fees': 'Wealth',
  'financial': 'Wealth',
  'taxes': 'Wealth',
  'insurance': 'Wealth',

  // Family
  'childcare': 'Family',
  'babysitter': 'Family',
  'kids': 'Family',
  'family': 'Family',
  'pets': 'Family',
  'gifts': 'Family',

  // Work
  'office': 'Work',
  'business': 'Work',
  'professional': 'Work',
  'education': 'Work',
  'software': 'Work',
  'tools': 'Work',

  // Fun
  'entertainment': 'Fun',
  'dining': 'Fun',
  'restaurants': 'Fun',
  'movies': 'Fun',
  'games': 'Fun',
  'hobbies': 'Fun',
  'travel': 'Fun',
  'vacation': 'Fun',
  'sports': 'Fun',
  'music': 'Fun',
  'streaming': 'Fun',
  'subscriptions': 'Fun',

  // Maintenance
  'utilities': 'Maintenance',
  'rent': 'Maintenance',
  'mortgage': 'Maintenance',
  'housing': 'Maintenance',
  'home': 'Maintenance',
  'car': 'Maintenance',
  'auto': 'Maintenance',
  'gas': 'Maintenance',
  'fuel': 'Maintenance',
  'transport': 'Maintenance',
  'transportation': 'Maintenance',
  'phone': 'Maintenance',
  'internet': 'Maintenance',
  'repairs': 'Maintenance',
  'maintenance': 'Maintenance',
  'cleaning': 'Maintenance',
  'laundry': 'Maintenance',
  'clothing': 'Maintenance',
  'personal care': 'Maintenance',
  'shopping': 'Maintenance',
};

function getCategoryLoop(category: string): LoopId {
  const lower = category.toLowerCase();
  for (const [key, loop] of Object.entries(CATEGORY_TO_LOOP)) {
    if (lower.includes(key)) {
      return loop;
    }
  }
  return 'Maintenance'; // Default
}

function getLoopColor(loop: LoopId): string {
  return LOOP_COLORS[loop]?.border || '#737390';
}

// Data structures
interface BudgetCategory {
  name: string;
  budgeted: number;
  spent: number;
  remaining: number;
  loop: LoopId;
}

interface AccountBalance {
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment';
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  loop: LoopId;
  frequency: 'monthly' | 'weekly' | 'bi-weekly' | 'yearly' | 'one-time';
  dueDate?: string;
  isPaid?: boolean;
  notes?: string;
  // Extended fields
  billingCycle?: number; // Day of month (1-31) or day of week (1-7)
  totalPayable?: number; // Total remaining if finite (like loans)
  paymentMethod?: string; // Credit card, bank account, etc.
  autoPay?: boolean;
  startDate?: string;
  endDate?: string;
  url?: string; // Link to pay or manage
}

interface RecentTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  loop: LoopId;
  account?: string;
  type?: 'income' | 'expense';
}

interface LinkedAccount {
  name: string;
  balance: number;
  type: string;
  lastUpdated?: string;
}

interface BudgetData {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNet: number;
  categories: BudgetCategory[];
  accounts: AccountBalance[];
  expenses: Expense[];
  transactions: RecentTransaction[];
  lastUpdated: string;
}

type ViewMode = 'overview' | 'expenses' | 'categories' | 'accounts' | 'transactions';

export function BudgetWidget() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('overview');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getSheetsToken();
    setIsConnected(!!token);
    if (token) {
      fetchBudgetData();
    } else {
      // Load local expenses if no sheets connection
      loadLocalExpenses();
      setIsLoading(false);
    }
  }, []);

  const loadLocalExpenses = () => {
    let expenses: Expense[] = [];
    let transactions: RecentTransaction[] = [];
    let accounts: AccountBalance[] = [];

    // Load expenses
    const storedExpenses = localStorage.getItem('looops_expenses');
    if (storedExpenses) {
      try {
        expenses = JSON.parse(storedExpenses);
      } catch {
        // Ignore parse errors
      }
    }

    // Load transactions
    const storedTransactions = localStorage.getItem('looops_transactions');
    if (storedTransactions) {
      try {
        transactions = JSON.parse(storedTransactions);
      } catch {
        // Ignore parse errors
      }
    }

    // Load accounts
    const storedAccounts = localStorage.getItem('looops_accounts');
    if (storedAccounts) {
      try {
        accounts = JSON.parse(storedAccounts);
      } catch {
        // Ignore parse errors
      }
    }

    setData({
      monthlyIncome: 0,
      monthlyExpenses: expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0),
      monthlyNet: 0,
      categories: [],
      accounts,
      expenses,
      transactions,
      lastUpdated: new Date().toISOString(),
    });
  };

  const saveLocalExpenses = (expenses: Expense[]) => {
    localStorage.setItem('looops_expenses', JSON.stringify(expenses));
  };

  const fetchBudgetData = async () => {
    const token = getSheetsToken();
    if (!token) {
      loadLocalExpenses();
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/sheets/budget', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();

      // Handle 401 or needsReauth
      if (res.status === 401 || result.needsReauth) {
        localStorage.removeItem('looops_google_sheets_tokens');
        setIsConnected(false);
        loadLocalExpenses(); // Fall back to local expenses
        setError("Session expired. Please reconnect Google Sheets.");
        setIsLoading(false);
        return;
      }

      if (result.data) {
        // Load local expenses and merge with sheet data
        const storedExpenses = localStorage.getItem('looops_expenses');
        let expenses: Expense[] = [];
        if (storedExpenses) {
          try {
            expenses = JSON.parse(storedExpenses);
          } catch {
            // Ignore
          }
        }

        // Transform API response to BudgetData format
        const budgetData: BudgetData = {
          monthlyIncome: result.data.incomeExpenses?.income || 0,
          monthlyExpenses: result.data.incomeExpenses?.expenses || 0,
          monthlyNet: result.data.incomeExpenses?.net || 0,
          categories: (result.data.topCategories || []).map((cat: any) => ({
            name: cat.category,
            budgeted: 0,
            spent: cat.amount,
            remaining: 0,
            loop: getCategoryLoop(cat.category),
          })),
          accounts: (result.data.netWorth?.accounts || []).map((acc: any) => ({
            name: acc.account,
            balance: acc.balance,
            type: acc.type?.toLowerCase().includes('credit') ? 'credit'
                : acc.type?.toLowerCase().includes('saving') ? 'savings'
                : acc.type?.toLowerCase().includes('invest') ? 'investment'
                : 'checking',
          })),
          expenses,
          transactions: (result.data.recentTransactions || []).map((txn: any) => ({
            date: txn.date,
            description: txn.description,
            amount: txn.amount,
            category: txn.category,
            loop: getCategoryLoop(txn.category),
          })),
          lastUpdated: result.data.updatedAt || new Date().toISOString(),
        };
        setData(budgetData);
        setError(null);
      } else if (result.message) {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budget data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp_${Date.now()}`,
    };
    const updatedExpenses = [...(data?.expenses || []), newExpense];
    saveLocalExpenses(updatedExpenses);
    setData(prev => prev ? {
      ...prev,
      expenses: updatedExpenses,
      monthlyExpenses: updatedExpenses.reduce((sum, e) => sum + e.amount, 0),
    } : null);
  };

  const handleUpdateExpense = (expense: Expense) => {
    const updatedExpenses = (data?.expenses || []).map(e =>
      e.id === expense.id ? expense : e
    );
    saveLocalExpenses(updatedExpenses);
    setData(prev => prev ? {
      ...prev,
      expenses: updatedExpenses,
      monthlyExpenses: updatedExpenses.reduce((sum, e) => sum + e.amount, 0),
    } : null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = (data?.expenses || []).filter(e => e.id !== expenseId);
    saveLocalExpenses(updatedExpenses);
    setData(prev => prev ? {
      ...prev,
      expenses: updatedExpenses,
      monthlyExpenses: updatedExpenses.reduce((sum, e) => sum + e.amount, 0),
    } : null);
  };

  const handleImportFromSheets = async () => {
    const token = getSheetsToken();
    if (!token) {
      setError("Please connect Google Sheets first");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/sheets/budget?action=expenses', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();

      if (result.needsReauth) {
        localStorage.removeItem('looops_google_sheets_tokens');
        setIsConnected(false);
        setError("Session expired. Please reconnect Google Sheets.");
        return;
      }

      if (result.expenses && result.expenses.length > 0) {
        // Valid loop names
        const validLoops: LoopId[] = ['Health', 'Wealth', 'Family', 'Work', 'Fun', 'Maintenance', 'Meaning'];

        // Convert imported expenses to our format
        const importedExpenses: Expense[] = result.expenses.map((exp: any, idx: number) => {
          // Check if category directly matches a Loop name
          const categoryAsLoop = validLoops.find(l => l.toLowerCase() === (exp.category || '').toLowerCase());

          return {
            id: `import_${Date.now()}_${idx}`,
            name: exp.name || 'Unknown',
            amount: exp.amount || 0,
            category: exp.category || exp.name || 'Uncategorized',
            loop: categoryAsLoop || (exp.category ? getCategoryLoop(exp.category) : getCategoryLoop(exp.name || '')),
            frequency: (exp.frequency as Expense['frequency']) || 'monthly',
            dueDate: exp.dueDate,
            notes: exp.notes,
          };
        });

        // Merge with existing expenses (avoid duplicates by name)
        const existingNames = new Set((data?.expenses || []).map(e => e.name.toLowerCase()));
        const newExpenses = importedExpenses.filter(
          e => !existingNames.has(e.name.toLowerCase())
        );

        if (newExpenses.length === 0) {
          setError(`All ${importedExpenses.length} expenses already exist`);
          return;
        }

        const updatedExpenses = [...(data?.expenses || []), ...newExpenses];
        saveLocalExpenses(updatedExpenses);
        setData(prev => prev ? {
          ...prev,
          expenses: updatedExpenses,
          monthlyExpenses: updatedExpenses.reduce((sum, e) => sum + e.amount, 0),
        } : null);

        // Show success message briefly
        setSuccessMessage(`Imported ${newExpenses.length} expenses from "${result.sheetName}"`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        // Show more helpful info
        const sheetInfo = result.sheetName ? ` in "${result.sheetName}"` : '';
        const headerInfo = result.headers ? ` (Headers: ${result.headers.slice(0, 3).join(', ')}...)` : '';
        setError(result.message || `No expenses found${sheetInfo}${headerInfo}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import expenses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportTransactions = async () => {
    const token = getSheetsToken();
    if (!token) {
      setError("Please connect Google Sheets first");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/sheets/budget?action=transactions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();

      if (result.needsReauth) {
        localStorage.removeItem('looops_google_sheets_tokens');
        setIsConnected(false);
        setError("Session expired. Please reconnect Google Sheets.");
        return;
      }

      if (result.transactions && result.transactions.length > 0) {
        // Convert to our format with loop assignment
        const importedTransactions: RecentTransaction[] = result.transactions.map((txn: any) => ({
          date: txn.date || '',
          description: txn.description || 'Unknown',
          amount: txn.amount || 0,
          category: txn.category || 'Uncategorized',
          loop: getCategoryLoop(txn.category || txn.description || ''),
          account: txn.account || '',
          type: txn.type || (txn.amount >= 0 ? 'income' : 'expense'),
        }));

        // Save to localStorage
        localStorage.setItem('looops_transactions', JSON.stringify(importedTransactions));

        setData(prev => prev ? {
          ...prev,
          transactions: importedTransactions,
        } : null);

        setSuccessMessage(`Imported ${importedTransactions.length} transactions from "${result.sheetName}"`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const sheetInfo = result.sheetName ? ` in "${result.sheetName}"` : '';
        setError(result.message || `No transactions found${sheetInfo}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportAccounts = async () => {
    const token = getSheetsToken();
    if (!token) {
      setError("Please connect Google Sheets first");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/sheets/budget?action=accounts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();

      if (result.needsReauth) {
        localStorage.removeItem('looops_google_sheets_tokens');
        setIsConnected(false);
        setError("Session expired. Please reconnect Google Sheets.");
        return;
      }

      if (result.accounts && result.accounts.length > 0) {
        // Convert to our format
        const importedAccounts: AccountBalance[] = result.accounts.map((acc: any) => ({
          name: acc.account || acc.name || 'Unknown Account',
          balance: acc.balance || 0,
          type: acc.type?.toLowerCase().includes('credit') ? 'credit'
              : acc.type?.toLowerCase().includes('saving') ? 'savings'
              : acc.type?.toLowerCase().includes('invest') ? 'investment'
              : 'checking',
        }));

        // Save to localStorage
        localStorage.setItem('looops_accounts', JSON.stringify(importedAccounts));

        setData(prev => prev ? {
          ...prev,
          accounts: importedAccounts,
        } : null);

        setSuccessMessage(`Imported ${importedAccounts.length} accounts from "${result.sheetName}"`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const sheetInfo = result.sheetName ? ` in "${result.sheetName}"` : '';
        setError(result.message || `No accounts found${sheetInfo}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import accounts");
    } finally {
      setIsLoading(false);
    }
  };

  // Not connected but can still use local expenses
  if (isConnected === false && !data) {
    return (
      <div className="budget-widget">
        <div className="budget-header">
          <div className="budget-summary">
            <div className="budget-month-net">
              <span className="budget-net-value">$0</span>
              <span className="budget-net-label">this month</span>
            </div>
          </div>
        </div>
        <div className="budget-tabs">
          <button className="budget-tab active" onClick={() => setView('expenses')}>
            Expenses
          </button>
        </div>
        <div className="budget-content">
          <ExpensesView
            expenses={[]}
            onAdd={handleAddExpense}
            onUpdate={handleUpdateExpense}
            onDelete={handleDeleteExpense}
          />
        </div>
        <div className="budget-footer">
          <small>Connect Google Sheets for full features</small>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="budget-widget budget-widget--loading">
        <div className="budget-loading">
          <div className="budget-spinner" />
          <span>Loading budget...</span>
        </div>
      </div>
    );
  }

  // Error state - only show full error screen if we have no data
  if (error && !data) {
    return (
      <div className="budget-widget budget-widget--error">
        <span className="budget-error-icon">⚠️</span>
        <p>{error}</p>
        <button className="budget-retry-btn" onClick={fetchBudgetData}>
          Retry
        </button>
      </div>
    );
  }

  // No data state - still allow adding expenses
  if (!data) {
    setData({
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyNet: 0,
      categories: [],
      accounts: [],
      expenses: [],
      transactions: [],
      lastUpdated: new Date().toISOString(),
    });
    return null;
  }

  const savingsRate = data.monthlyIncome > 0
    ? Math.round((data.monthlyNet / data.monthlyIncome) * 100)
    : 0;

  return (
    <div className="budget-widget">
      {/* Success/Error messages */}
      {successMessage && (
        <div className="budget-toast budget-toast--success">
          <span>✓</span> {successMessage}
        </div>
      )}
      {error && (
        <div className="budget-toast budget-toast--error">
          <span>⚠️</span> {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Header with month summary */}
      <div className="budget-header">
        <div className="budget-summary">
          <div className="budget-month-net">
            <span className={`budget-net-value ${data.monthlyNet >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(data.monthlyNet)}
            </span>
            <span className="budget-net-label">this month</span>
          </div>
          <div className="budget-savings-rate">
            <span className={`budget-rate-value ${savingsRate >= 20 ? 'good' : savingsRate >= 0 ? 'ok' : 'bad'}`}>
              {savingsRate}%
            </span>
            <span className="budget-rate-label">saved</span>
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="budget-tabs">
        <button
          className={`budget-tab ${view === 'overview' ? 'active' : ''}`}
          onClick={() => setView('overview')}
        >
          Overview
        </button>
        <button
          className={`budget-tab ${view === 'expenses' ? 'active' : ''}`}
          onClick={() => setView('expenses')}
        >
          Expenses
        </button>
        <button
          className={`budget-tab ${view === 'categories' ? 'active' : ''}`}
          onClick={() => setView('categories')}
        >
          By Loop
        </button>
        <button
          className={`budget-tab ${view === 'accounts' ? 'active' : ''}`}
          onClick={() => setView('accounts')}
        >
          Accounts
        </button>
        <button
          className={`budget-tab ${view === 'transactions' ? 'active' : ''}`}
          onClick={() => setView('transactions')}
        >
          Recent
        </button>
      </div>

      {/* Content views */}
      <div className="budget-content">
        {view === 'overview' && (
          <OverviewView data={data} />
        )}
        {view === 'expenses' && (
          <ExpensesView
            expenses={data.expenses}
            onAdd={handleAddExpense}
            onUpdate={handleUpdateExpense}
            onDelete={handleDeleteExpense}
            onImportFromSheets={handleImportFromSheets}
          />
        )}
        {view === 'categories' && (
          <LoopCategoriesView
            categories={data.categories}
            transactions={data.transactions}
            expenses={data.expenses}
          />
        )}
        {view === 'accounts' && (
          <AccountsView
            accounts={data.accounts}
            onImportAccounts={handleImportAccounts}
          />
        )}
        {view === 'transactions' && (
          <TransactionsView
            transactions={data.transactions}
            onImportTransactions={handleImportTransactions}
          />
        )}
      </div>

      {/* Footer */}
      <div className="budget-footer">
        <span className="budget-updated">
          Updated {formatRelativeTime(data.lastUpdated)}
        </span>
        <button className="budget-refresh" onClick={fetchBudgetData} title="Refresh">
          ↻
        </button>
      </div>
    </div>
  );
}

// Overview View - Income vs Expenses bars
function OverviewView({ data }: { data: BudgetData }) {
  const maxValue = Math.max(data.monthlyIncome, data.monthlyExpenses, 1);
  const incomePercent = (data.monthlyIncome / maxValue) * 100;
  const expensePercent = (data.monthlyExpenses / maxValue) * 100;

  // Group expenses by loop
  const expensesByLoop: Record<LoopId, number> = {
    Health: 0,
    Wealth: 0,
    Family: 0,
    Work: 0,
    Fun: 0,
    Maintenance: 0,
    Meaning: 0,
  };

  data.expenses.forEach(e => {
    expensesByLoop[e.loop] = (expensesByLoop[e.loop] || 0) + e.amount;
  });

  return (
    <div className="budget-overview">
      <div className="budget-bar-group">
        <div className="budget-bar-row">
          <span className="budget-bar-label">Income</span>
          <div className="budget-bar">
            <div
              className="budget-bar-fill budget-bar--income"
              style={{ width: `${incomePercent}%` }}
            />
          </div>
          <span className="budget-bar-value">{formatCurrency(data.monthlyIncome)}</span>
        </div>
        <div className="budget-bar-row">
          <span className="budget-bar-label">Spent</span>
          <div className="budget-bar">
            <div
              className="budget-bar-fill budget-bar--expense"
              style={{ width: `${expensePercent}%` }}
            />
          </div>
          <span className="budget-bar-value">{formatCurrency(data.monthlyExpenses)}</span>
        </div>
      </div>

      {/* Loop breakdown */}
      {data.expenses.length > 0 && (
        <div className="budget-loop-breakdown">
          <h4>Expenses by Loop</h4>
          <div className="budget-loop-chips">
            {(Object.entries(expensesByLoop) as [LoopId, number][])
              .filter(([_, amount]) => amount > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([loop, amount]) => (
                <div
                  key={loop}
                  className="budget-loop-chip"
                  style={{ borderColor: getLoopColor(loop) }}
                >
                  <span className="budget-loop-chip-name">{loop}</span>
                  <span className="budget-loop-chip-amount">{formatCurrency(amount)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="budget-quick-stats">
        {data.accounts.length > 0 && (
          <div className="budget-stat">
            <span className="budget-stat-label">Total Cash</span>
            <span className="budget-stat-value">
              {formatCurrency(
                data.accounts
                  .filter(a => a.type === 'checking' || a.type === 'savings')
                  .reduce((sum, a) => sum + a.balance, 0)
              )}
            </span>
          </div>
        )}
        {data.expenses.length > 0 && (
          <div className="budget-stat">
            <span className="budget-stat-label">Monthly Bills</span>
            <span className="budget-stat-value">
              {formatCurrency(data.expenses.reduce((sum, e) => sum + e.amount, 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Expenses View - Editable expense list
function ExpensesView({
  expenses,
  onAdd,
  onUpdate,
  onDelete,
  onImportFromSheets,
}: {
  expenses: Expense[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onImportFromSheets?: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    name: '',
    amount: '',
    category: '',
    loop: 'Maintenance' as LoopId,
    frequency: 'monthly' as const,
  });

  const loops: LoopId[] = ['Health', 'Wealth', 'Family', 'Work', 'Fun', 'Maintenance', 'Meaning'];

  const handleAdd = () => {
    if (!newExpense.name || !newExpense.amount) return;
    onAdd({
      name: newExpense.name,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category || newExpense.name,
      loop: newExpense.loop,
      frequency: newExpense.frequency,
    });
    setNewExpense({
      name: '',
      amount: '',
      category: '',
      loop: 'Maintenance',
      frequency: 'monthly',
    });
    setShowAdd(false);
  };

  // Group expenses by loop
  const expensesByLoop = expenses.reduce((acc, exp) => {
    if (!acc[exp.loop]) acc[exp.loop] = [];
    acc[exp.loop].push(exp);
    return acc;
  }, {} as Record<LoopId, Expense[]>);

  const totalMonthly = expenses.reduce((sum, e) => {
    if (e.frequency === 'monthly') return sum + e.amount;
    if (e.frequency === 'weekly') return sum + (e.amount * 4.33);
    if (e.frequency === 'bi-weekly') return sum + (e.amount * 2.17);
    if (e.frequency === 'yearly') return sum + (e.amount / 12);
    return sum;
  }, 0);

  return (
    <div className="budget-expenses">
      {/* Total */}
      <div className="budget-expenses-total">
        <span>Monthly Total:</span>
        <strong>{formatCurrency(totalMonthly)}</strong>
      </div>

      {/* Expenses grouped by loop */}
      {loops.map(loop => {
        const loopExpenses = expensesByLoop[loop] || [];
        if (loopExpenses.length === 0) return null;

        const loopTotal = loopExpenses.reduce((sum, e) => sum + e.amount, 0);

        return (
          <div key={loop} className="budget-expense-group">
            <div
              className="budget-expense-group-header"
              style={{ borderLeftColor: getLoopColor(loop) }}
            >
              <span className="budget-expense-group-name">{loop}</span>
              <span className="budget-expense-group-total">{formatCurrency(loopTotal)}</span>
            </div>
            <div className="budget-expense-list">
              {loopExpenses.map(expense => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  isEditing={editingId === expense.id}
                  onEdit={() => setEditingId(expense.id)}
                  onSave={(updated) => {
                    onUpdate(updated);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => onDelete(expense.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {expenses.length === 0 && !showAdd && (
        <div className="budget-expenses-empty">
          <p>No expenses tracked yet</p>
          <small>Add your monthly bills and recurring expenses</small>
        </div>
      )}

      {/* Action buttons */}
      <div className="budget-expense-actions">
        {!showAdd && (
          <button className="budget-add-expense-btn" onClick={() => setShowAdd(true)}>
            + Add Expense
          </button>
        )}
        {onImportFromSheets && !showAdd && (
          <button className="budget-import-btn" onClick={onImportFromSheets}>
            📥 Import from Sheets
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd ? (
        <div className="budget-expense-form">
          <input
            type="text"
            placeholder="Expense name"
            value={newExpense.name}
            onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
            className="budget-expense-input"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newExpense.amount}
            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
            className="budget-expense-input budget-expense-input--amount"
          />
          <select
            value={newExpense.loop}
            onChange={e => setNewExpense({ ...newExpense, loop: e.target.value as LoopId })}
            className="budget-expense-select"
          >
            {loops.map(loop => (
              <option key={loop} value={loop}>{loop}</option>
            ))}
          </select>
          <select
            value={newExpense.frequency}
            onChange={e => setNewExpense({ ...newExpense, frequency: e.target.value as any })}
            className="budget-expense-select"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="yearly">Yearly</option>
            <option value="one-time">One-time</option>
          </select>
          <div className="budget-expense-form-actions">
            <button className="budget-expense-btn budget-expense-btn--save" onClick={handleAdd}>
              Add
            </button>
            <button className="budget-expense-btn budget-expense-btn--cancel" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Individual expense row with expandable detail view
function ExpenseRow({
  expense,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  expense: Expense;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [editedExpense, setEditedExpense] = useState(expense);
  const [isExpanded, setIsExpanded] = useState(false);
  const loops: LoopId[] = ['Health', 'Wealth', 'Family', 'Work', 'Fun', 'Maintenance', 'Meaning'];
  const paymentMethods = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'PayPal', 'Other'];

  useEffect(() => {
    setEditedExpense(expense);
  }, [expense]);

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
    setIsExpanded(true);
  };

  const handleSave = () => {
    onSave(editedExpense);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setEditedExpense(expense);
    onCancel();
  };

  // Calculate annual cost
  const getAnnualCost = () => {
    switch (expense.frequency) {
      case 'monthly': return expense.amount * 12;
      case 'weekly': return expense.amount * 52;
      case 'bi-weekly': return expense.amount * 26;
      case 'yearly': return expense.amount;
      case 'one-time': return expense.amount;
      default: return expense.amount * 12;
    }
  };

  return (
    <div className={`budget-expense-item ${isExpanded ? 'expanded' : ''} ${isEditing ? 'editing' : ''}`}>
      {/* Collapsed row */}
      <div className="budget-expense-row" onClick={handleRowClick}>
        <span className="budget-expense-chevron">{isExpanded ? '▼' : '▶'}</span>
        <span className="budget-expense-name">{expense.name}</span>
        <span className="budget-expense-frequency">{expense.frequency}</span>
        <span className="budget-expense-amount">{formatCurrency(expense.amount)}</span>
        {!isEditing && (
          <button className="budget-expense-edit-btn" onClick={handleEditClick} title="Edit">
            ✎
          </button>
        )}
      </div>

      {/* Expanded detail view */}
      {isExpanded && (
        <div className="budget-expense-details">
          {isEditing ? (
            /* Edit mode */
            <div className="budget-expense-edit-form">
              <div className="budget-expense-field">
                <label>Name</label>
                <input
                  type="text"
                  value={editedExpense.name}
                  onChange={e => setEditedExpense({ ...editedExpense, name: e.target.value })}
                />
              </div>

              <div className="budget-expense-field-row">
                <div className="budget-expense-field">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={editedExpense.amount}
                    onChange={e => setEditedExpense({ ...editedExpense, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="budget-expense-field">
                  <label>Frequency</label>
                  <select
                    value={editedExpense.frequency}
                    onChange={e => setEditedExpense({ ...editedExpense, frequency: e.target.value as Expense['frequency'] })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
              </div>

              <div className="budget-expense-field-row">
                <div className="budget-expense-field">
                  <label>Loop</label>
                  <select
                    value={editedExpense.loop}
                    onChange={e => setEditedExpense({ ...editedExpense, loop: e.target.value as LoopId })}
                  >
                    {loops.map(loop => (
                      <option key={loop} value={loop}>{loop}</option>
                    ))}
                  </select>
                </div>
                <div className="budget-expense-field">
                  <label>Category</label>
                  <input
                    type="text"
                    value={editedExpense.category || ''}
                    onChange={e => setEditedExpense({ ...editedExpense, category: e.target.value })}
                    placeholder="e.g., Utilities"
                  />
                </div>
              </div>

              <div className="budget-expense-field-row">
                <div className="budget-expense-field">
                  <label>Due Date</label>
                  <input
                    type="text"
                    value={editedExpense.dueDate || ''}
                    onChange={e => setEditedExpense({ ...editedExpense, dueDate: e.target.value })}
                    placeholder="e.g., 15th or 7/16/2025"
                  />
                </div>
                <div className="budget-expense-field">
                  <label>Billing Day</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editedExpense.billingCycle || ''}
                    onChange={e => setEditedExpense({ ...editedExpense, billingCycle: parseInt(e.target.value) || undefined })}
                    placeholder="Day of month"
                  />
                </div>
              </div>

              <div className="budget-expense-field-row">
                <div className="budget-expense-field">
                  <label>Payment Method</label>
                  <select
                    value={editedExpense.paymentMethod || ''}
                    onChange={e => setEditedExpense({ ...editedExpense, paymentMethod: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div className="budget-expense-field">
                  <label>Total Remaining</label>
                  <input
                    type="number"
                    value={editedExpense.totalPayable || ''}
                    onChange={e => setEditedExpense({ ...editedExpense, totalPayable: parseFloat(e.target.value) || undefined })}
                    placeholder="For loans/finite"
                  />
                </div>
              </div>

              <div className="budget-expense-field-row">
                <div className="budget-expense-field checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={editedExpense.autoPay || false}
                      onChange={e => setEditedExpense({ ...editedExpense, autoPay: e.target.checked })}
                    />
                    Auto-pay enabled
                  </label>
                </div>
                <div className="budget-expense-field checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={editedExpense.isPaid || false}
                      onChange={e => setEditedExpense({ ...editedExpense, isPaid: e.target.checked })}
                    />
                    Paid this period
                  </label>
                </div>
              </div>

              <div className="budget-expense-field">
                <label>Payment URL</label>
                <input
                  type="url"
                  value={editedExpense.url || ''}
                  onChange={e => setEditedExpense({ ...editedExpense, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="budget-expense-field">
                <label>Notes</label>
                <textarea
                  value={editedExpense.notes || ''}
                  onChange={e => setEditedExpense({ ...editedExpense, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>

              <div className="budget-expense-edit-actions">
                <button className="budget-expense-btn save" onClick={handleSave}>Save</button>
                <button className="budget-expense-btn cancel" onClick={handleCancel}>Cancel</button>
                <button className="budget-expense-btn delete" onClick={onDelete}>Delete</button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="budget-expense-detail-view">
              <div className="budget-expense-detail-grid">
                <div className="budget-expense-detail-item">
                  <span className="detail-label">Monthly</span>
                  <span className="detail-value">
                    {formatCurrency(expense.frequency === 'monthly' ? expense.amount :
                      expense.frequency === 'weekly' ? expense.amount * 4.33 :
                      expense.frequency === 'bi-weekly' ? expense.amount * 2.17 :
                      expense.frequency === 'yearly' ? expense.amount / 12 :
                      expense.amount)}
                  </span>
                </div>
                <div className="budget-expense-detail-item">
                  <span className="detail-label">Annual</span>
                  <span className="detail-value">{formatCurrency(getAnnualCost())}</span>
                </div>
                <div className="budget-expense-detail-item">
                  <span className="detail-label">Frequency</span>
                  <span className="detail-value">{expense.frequency}</span>
                </div>
                <div className="budget-expense-detail-item">
                  <span className="detail-label">Loop</span>
                  <span className="detail-value" style={{ color: getLoopColor(expense.loop) }}>{expense.loop}</span>
                </div>
                {expense.dueDate && (
                  <div className="budget-expense-detail-item">
                    <span className="detail-label">Due Date</span>
                    <span className="detail-value">{expense.dueDate}</span>
                  </div>
                )}
                {expense.billingCycle && (
                  <div className="budget-expense-detail-item">
                    <span className="detail-label">Bills On</span>
                    <span className="detail-value">{expense.billingCycle}{getOrdinalSuffix(expense.billingCycle)} of month</span>
                  </div>
                )}
                {expense.paymentMethod && (
                  <div className="budget-expense-detail-item">
                    <span className="detail-label">Payment</span>
                    <span className="detail-value">{expense.paymentMethod}</span>
                  </div>
                )}
                {expense.totalPayable && (
                  <div className="budget-expense-detail-item">
                    <span className="detail-label">Total Remaining</span>
                    <span className="detail-value">{formatCurrency(expense.totalPayable)}</span>
                  </div>
                )}
                {expense.autoPay !== undefined && (
                  <div className="budget-expense-detail-item">
                    <span className="detail-label">Auto-pay</span>
                    <span className="detail-value">{expense.autoPay ? '✓ Yes' : '✗ No'}</span>
                  </div>
                )}
                {expense.category && (
                  <div className="budget-expense-detail-item">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{expense.category}</span>
                  </div>
                )}
              </div>
              {expense.notes && (
                <div className="budget-expense-notes">
                  <span className="detail-label">Notes</span>
                  <p>{expense.notes}</p>
                </div>
              )}
              {expense.url && (
                <a
                  href={expense.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="budget-expense-link"
                  onClick={e => e.stopPropagation()}
                >
                  Pay / Manage →
                </a>
              )}
              <button className="budget-expense-edit-btn-large" onClick={handleEditClick}>
                Edit Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper for ordinal suffixes
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Loop Categories View - Spending grouped by Loop
function LoopCategoriesView({
  categories,
  transactions,
  expenses,
}: {
  categories: BudgetCategory[];
  transactions: RecentTransaction[];
  expenses: Expense[];
}) {
  const loops: LoopId[] = ['Health', 'Wealth', 'Family', 'Work', 'Fun', 'Maintenance', 'Meaning'];

  // Aggregate spending by loop from transactions
  const spendingByLoop: Record<LoopId, { spent: number; items: string[] }> = {
    Health: { spent: 0, items: [] },
    Wealth: { spent: 0, items: [] },
    Family: { spent: 0, items: [] },
    Work: { spent: 0, items: [] },
    Fun: { spent: 0, items: [] },
    Maintenance: { spent: 0, items: [] },
    Meaning: { spent: 0, items: [] },
  };

  transactions.forEach(txn => {
    if (txn.amount < 0) {
      const loop = txn.loop;
      spendingByLoop[loop].spent += Math.abs(txn.amount);
      if (!spendingByLoop[loop].items.includes(txn.category)) {
        spendingByLoop[loop].items.push(txn.category);
      }
    }
  });

  // Also add from expenses
  expenses.forEach(exp => {
    spendingByLoop[exp.loop].spent += exp.amount;
    if (!spendingByLoop[exp.loop].items.includes(exp.name)) {
      spendingByLoop[exp.loop].items.push(exp.name);
    }
  });

  const maxSpent = Math.max(...Object.values(spendingByLoop).map(l => l.spent), 1);

  const sortedLoops = loops
    .filter(loop => spendingByLoop[loop].spent > 0)
    .sort((a, b) => spendingByLoop[b].spent - spendingByLoop[a].spent);

  if (sortedLoops.length === 0) {
    return <div className="budget-empty-view">No spending data by loop</div>;
  }

  return (
    <div className="budget-loop-categories">
      {sortedLoops.map(loop => {
        const data = spendingByLoop[loop];
        const percent = (data.spent / maxSpent) * 100;

        return (
          <div key={loop} className="budget-loop-category">
            <div className="budget-loop-category-header">
              <span
                className="budget-loop-category-name"
                style={{ color: getLoopColor(loop) }}
              >
                {loop}
              </span>
              <span className="budget-loop-category-amount">
                {formatCurrency(data.spent)}
              </span>
            </div>
            <div className="budget-loop-category-bar">
              <div
                className="budget-loop-category-fill"
                style={{
                  width: `${percent}%`,
                  backgroundColor: getLoopColor(loop),
                }}
              />
            </div>
            {data.items.length > 0 && (
              <div className="budget-loop-category-items">
                {data.items.slice(0, 3).join(', ')}
                {data.items.length > 3 && ` +${data.items.length - 3} more`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Accounts View - Account balances
function AccountsView({
  accounts,
  onImportAccounts,
}: {
  accounts: AccountBalance[];
  onImportAccounts?: () => void;
}) {
  const totalAssets = accounts
    .filter(a => a.type !== 'credit')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalDebt = accounts
    .filter(a => a.type === 'credit')
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const netWorth = totalAssets - totalDebt;

  return (
    <div className="budget-accounts">
      {accounts.length > 0 && (
        <>
          <div className="budget-accounts-summary">
            <div className="budget-account-total">
              <span className="budget-total-label">Assets</span>
              <span className="budget-total-value positive">{formatCurrency(totalAssets)}</span>
            </div>
            {totalDebt > 0 && (
              <div className="budget-account-total">
                <span className="budget-total-label">Debt</span>
                <span className="budget-total-value negative">-{formatCurrency(totalDebt)}</span>
              </div>
            )}
            <div className="budget-account-total budget-net-worth">
              <span className="budget-total-label">Net Worth</span>
              <span className={`budget-total-value ${netWorth >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(netWorth)}
              </span>
            </div>
          </div>

          <div className="budget-accounts-list">
            {accounts.map((account, i) => (
              <div key={`${account.name}-${i}`} className="budget-account">
                <div className="budget-account-info">
                  <span className="budget-account-icon">
                    {account.type === 'checking' ? '🏦'
                      : account.type === 'savings' ? '💰'
                      : account.type === 'credit' ? '💳'
                      : '📈'}
                  </span>
                  <span className="budget-account-name">{account.name}</span>
                  <span className="budget-account-type">{account.type}</span>
                </div>
                <span className={`budget-account-balance ${account.balance >= 0 ? 'positive' : 'negative'}`}>
                  {account.balance < 0 ? '-' : ''}{formatCurrency(account.balance)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {accounts.length === 0 && (
        <div className="budget-empty-view">
          <p>No linked accounts</p>
          <small>Import accounts from your spreadsheet</small>
        </div>
      )}

      {onImportAccounts && (
        <div className="budget-import-actions">
          <button className="budget-import-btn" onClick={onImportAccounts}>
            🏦 Import Accounts from Sheets
          </button>
        </div>
      )}
    </div>
  );
}

// Transactions View - Recent transactions with loop colors
function TransactionsView({
  transactions,
  onImportTransactions,
}: {
  transactions: RecentTransaction[];
  onImportTransactions?: () => void;
}) {
  // Calculate summary stats
  const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="budget-transactions">
      {transactions.length > 0 && (
        <>
          <div className="budget-transactions-summary">
            <div className="budget-txn-stat">
              <span className="budget-txn-stat-label">Income</span>
              <span className="budget-txn-stat-value positive">+{formatCurrency(income)}</span>
            </div>
            <div className="budget-txn-stat">
              <span className="budget-txn-stat-label">Expenses</span>
              <span className="budget-txn-stat-value negative">-{formatCurrency(expenses)}</span>
            </div>
            <div className="budget-txn-stat">
              <span className="budget-txn-stat-label">Net</span>
              <span className={`budget-txn-stat-value ${income - expenses >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(income - expenses)}
              </span>
            </div>
          </div>

          <div className="budget-transactions-list">
            {transactions.slice(0, 50).map((txn, i) => (
              <div
                key={i}
                className="budget-transaction"
                style={{ borderLeftColor: getLoopColor(txn.loop) }}
              >
                <div className="budget-txn-info">
                  <span className="budget-txn-desc">{txn.description}</span>
                  <span className="budget-txn-meta">
                    <span
                      className="budget-txn-loop"
                      style={{ color: getLoopColor(txn.loop) }}
                    >
                      {txn.loop}
                    </span>
                    {txn.account && (
                      <>
                        {' • '}
                        <span className="budget-txn-account">{txn.account}</span>
                      </>
                    )}
                    {' • '}
                    {formatDate(txn.date)}
                  </span>
                </div>
                <span className={`budget-txn-amount ${txn.amount >= 0 ? 'positive' : 'negative'}`}>
                  {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {transactions.length === 0 && (
        <div className="budget-empty-view">
          <p>No transactions yet</p>
          <small>Import from BAS_Transactions sheet</small>
        </div>
      )}

      {onImportTransactions && (
        <div className="budget-import-actions">
          <button className="budget-import-btn" onClick={onImportTransactions}>
            📥 Import from BAS_Transactions
          </button>
        </div>
      )}
    </div>
  );
}

// Utility functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
}

export default BudgetWidget;
