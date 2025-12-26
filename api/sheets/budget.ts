// Google Sheets Budget API - Reads financial data from user's budget spreadsheet
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  account: string;
  type: 'income' | 'expense';
}

interface AccountBalance {
  account: string;
  balance: number;
  type: string;
  asOf: string;
}

interface BudgetSummary {
  period: string;
  incomeExpenses: {
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
  };
  topCategories: Array<{ category: string; amount: number }>;
  netWorth: {
    assets: number;
    liabilities: number;
    netWorth: number;
    accounts: AccountBalance[];
  } | null;
  recentTransactions: Transaction[];
  updatedAt: string;
}

// Helper to fetch from Google Sheets API
async function fetchSheet(accessToken: string, spreadsheetId: string, range: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error(`Sheets API error: ${response.status}`);
  }

  const data = await response.json();
  return data.values || [];
}

// Parse a transaction row - adjust column indices based on your sheet structure
function parseTransactionRow(row: string[], headers: string[]): Transaction | null {
  try {
    // Common column names to look for
    const dateIdx = headers.findIndex(h => /date/i.test(h));
    const descIdx = headers.findIndex(h => /description|memo|payee|merchant/i.test(h));
    const categoryIdx = headers.findIndex(h => /category|type/i.test(h));
    const amountIdx = headers.findIndex(h => /amount/i.test(h));
    const accountIdx = headers.findIndex(h => /account/i.test(h));

    if (dateIdx === -1 || amountIdx === -1) return null;

    const amount = parseFloat(row[amountIdx]?.replace(/[$,]/g, '') || '0');
    if (isNaN(amount)) return null;

    return {
      date: row[dateIdx] || '',
      description: row[descIdx] || 'Unknown',
      category: row[categoryIdx] || 'Uncategorized',
      amount,
      account: row[accountIdx] || 'Unknown',
      type: amount >= 0 ? 'income' : 'expense',
    };
  } catch {
    return null;
  }
}

// Parse balance sheet row
function parseBalanceRow(row: string[], headers: string[]): AccountBalance | null {
  try {
    const accountIdx = headers.findIndex(h => /account|name/i.test(h));
    const balanceIdx = headers.findIndex(h => /balance|amount|value/i.test(h));
    const typeIdx = headers.findIndex(h => /type|class/i.test(h));

    if (balanceIdx === -1) return null;

    const balance = parseFloat(row[balanceIdx]?.replace(/[$,]/g, '') || '0');
    if (isNaN(balance)) return null;

    return {
      account: row[accountIdx] || 'Unknown Account',
      balance,
      type: row[typeIdx] || 'Asset',
      asOf: new Date().toISOString().split('T')[0],
    };
  } catch {
    return null;
  }
}

// Get spreadsheet metadata to list all sheets
async function listSheets(accessToken: string, spreadsheetId: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error(`Sheets API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.sheets || []).map((sheet: any) => sheet.properties?.title || 'Unknown');
}

// Parse expense row from a generic expense sheet
function parseExpenseRow(row: string[], headers: string[], index: number): any | null {
  try {
    // Find column indices - check for exact matches first, then patterns
    const nameIdx = headers.findIndex(h => h === 'description' || /name|expense|item|bill/i.test(h));
    const amountIdx = headers.findIndex(h => h === 'amount' || /cost|price|value|\$|monthly/i.test(h));
    const categoryIdx = headers.findIndex(h => h === 'category' || /type|group|loop/i.test(h));
    const frequencyIdx = headers.findIndex(h => h === 'payments' || /frequency|recurring|period|schedule/i.test(h));
    const dueDateIdx = headers.findIndex(h => h === 'due' || /due date|when/i.test(h));
    const notesIdx = headers.findIndex(h => /notes|comments|memo/i.test(h));

    // Get name - use first non-empty column if no name column found
    let name = '';
    if (nameIdx >= 0) {
      name = row[nameIdx]?.trim() || '';
    } else {
      // Try first column
      name = row[0]?.trim() || '';
    }

    // Skip empty rows
    if (!name) return null;

    // Get amount
    let amount = 0;
    if (amountIdx >= 0) {
      const amountStr = row[amountIdx]?.replace(/[$,]/g, '').trim() || '0';
      amount = parseFloat(amountStr) || 0;
    } else {
      // Try to find a number in the row
      for (let i = 0; i < row.length; i++) {
        if (i === 0) continue; // Skip name column
        const val = row[i]?.replace(/[$,]/g, '').trim() || '';
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
          amount = num;
          break;
        }
      }
    }

    // Skip if no valid amount
    if (amount <= 0) return null;

    // Get category
    const category = categoryIdx >= 0 ? row[categoryIdx]?.trim() || '' : '';

    // Get frequency
    let frequency = 'monthly';
    if (frequencyIdx >= 0) {
      const freqStr = row[frequencyIdx]?.toLowerCase()?.trim() || '';
      if (freqStr.includes('bi-week') || freqStr.includes('biweek')) frequency = 'bi-weekly';
      else if (freqStr.includes('week')) frequency = 'weekly';
      else if (freqStr.includes('year') || freqStr.includes('annual')) frequency = 'yearly';
      else if (freqStr.includes('one') || freqStr.includes('once')) frequency = 'one-time';
    }

    // Get due date
    const dueDate = dueDateIdx >= 0 ? row[dueDateIdx]?.trim() || '' : '';

    // Get notes
    const notes = notesIdx >= 0 ? row[notesIdx]?.trim() || '' : '';

    return {
      id: `sheet_${index}`,
      name,
      amount,
      category,
      frequency,
      dueDate,
      notes,
    };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get access token from Authorization header
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken) {
    return res.status(200).json({
      source: 'local',
      data: null,
      message: 'No Google Sheets access token. Connect Google Sheets in Integrations.',
    });
  }

  // Get spreadsheet ID from query or env
  const spreadsheetId = (req.query.sheetId as string) || process.env.BUDGET_SHEET_ID;

  if (!spreadsheetId) {
    return res.status(200).json({
      source: 'local',
      data: null,
      message: 'No spreadsheet ID configured. Add BUDGET_SHEET_ID to environment or pass ?sheetId=',
    });
  }

  // Check for action parameter
  const action = req.query.action as string;

  // Handle expenses import action
  if (action === 'expenses') {
    try {
      const sheetNames = await listSheets(accessToken, spreadsheetId);

      // Try expense sheet candidates
      const expenseSheetCandidates = ['Expenses', 'expenses', 'Monthly Expenses', 'Bills', 'Budget'];
      let expenseSheetName = expenseSheetCandidates.find(name => sheetNames.includes(name));

      // If no match, find any sheet with relevant keywords
      if (!expenseSheetName) {
        expenseSheetName = sheetNames.find((name: string) =>
          /expense|bill|budget/i.test(name)
        );
      }

      // Default to first sheet
      if (!expenseSheetName && sheetNames.length > 0) {
        expenseSheetName = sheetNames[0];
      }

      if (!expenseSheetName) {
        return res.status(200).json({
          expenses: [],
          sheets: sheetNames,
          message: 'No expense sheet found',
        });
      }

      // Fetch expense data
      const rows = await fetchSheet(accessToken, spreadsheetId, `${expenseSheetName}!A1:Z100`);

      if (rows.length < 2) {
        return res.status(200).json({
          expenses: [],
          sheetName: expenseSheetName,
          sheets: sheetNames,
          message: 'No data found in sheet',
        });
      }

      // Find the header row - look for a row with "description" or "amount" in first few rows
      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const rowLower = (rows[i] || []).map((c: string) => (c || '').toLowerCase().trim());
        if (rowLower.includes('description') || rowLower.includes('amount') || rowLower.includes('name') || rowLower.includes('expense')) {
          headerRowIdx = i;
          break;
        }
      }

      const headers = (rows[headerRowIdx] || []).map((h: string) => h?.toLowerCase()?.trim() || '');
      const dataRows = rows.slice(headerRowIdx + 1);

      const expenses = dataRows
        .map((row: string[], idx: number) => parseExpenseRow(row, headers, idx))
        .filter((e: any) => e !== null);

      // If no expenses found with header matching, try simple 2-column format (name, amount)
      if (expenses.length === 0 && dataRows.length > 0) {
        const simpleExpenses = dataRows
          .map((row: string[], idx: number) => {
            const name = row[0]?.trim();
            if (!name) return null;

            // Find first numeric value in the row
            for (let i = 1; i < row.length; i++) {
              const val = row[i]?.replace(/[$,]/g, '').trim();
              const amount = parseFloat(val || '0');
              if (!isNaN(amount) && amount > 0) {
                return {
                  id: `sheet_${idx}`,
                  name,
                  amount,
                  category: '',
                  frequency: 'monthly',
                  dueDate: '',
                  notes: '',
                };
              }
            }
            return null;
          })
          .filter((e: any) => e !== null);

        if (simpleExpenses.length > 0) {
          return res.status(200).json({
            expenses: simpleExpenses,
            sheetName: expenseSheetName,
            sheets: sheetNames,
            headers: rows[headerRowIdx],
            debug: { parseMode: 'simple', rowCount: rows.length, headerRowIdx },
          });
        }
      }

      return res.status(200).json({
        expenses,
        sheetName: expenseSheetName,
        sheets: sheetNames,
        headers: rows[headerRowIdx],
        debug: { parseMode: 'headers', rowCount: rows.length, headerRowIdx, headersFound: headers, sampleRow: dataRows[0] },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        return res.status(401).json({
          expenses: [],
          message: 'Token expired',
          needsReauth: true,
        });
      }
      return res.status(500).json({
        expenses: [],
        message: error instanceof Error ? error.message : 'Failed to fetch expenses',
      });
    }
  }

  // Handle transactions import action
  if (action === 'transactions') {
    try {
      const sheetNames = await listSheets(accessToken, spreadsheetId);

      // Look for BAS_Transactions or similar transaction sheets
      const transactionSheetCandidates = [
        'BAS_Transactions',
        'BAS Transactions',
        'Transactions',
        'transactions',
        'Transaction History',
      ];
      let transactionSheetName = transactionSheetCandidates.find(name => sheetNames.includes(name));

      // If no match, find any sheet with "transaction" in the name
      if (!transactionSheetName) {
        transactionSheetName = sheetNames.find((name: string) =>
          /transaction/i.test(name)
        );
      }

      if (!transactionSheetName) {
        return res.status(200).json({
          transactions: [],
          sheets: sheetNames,
          message: 'No transaction sheet found. Available sheets: ' + sheetNames.join(', '),
        });
      }

      // Fetch transaction data (get more rows for transactions)
      const rows = await fetchSheet(accessToken, spreadsheetId, `${transactionSheetName}!A1:Z500`);

      if (rows.length < 2) {
        return res.status(200).json({
          transactions: [],
          sheetName: transactionSheetName,
          sheets: sheetNames,
          message: 'No data found in sheet',
        });
      }

      // Find the header row
      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const rowLower = (rows[i] || []).map((c: string) => (c || '').toLowerCase().trim());
        if (rowLower.includes('date') || rowLower.includes('amount') || rowLower.includes('description')) {
          headerRowIdx = i;
          break;
        }
      }

      const headers = (rows[headerRowIdx] || []).map((h: string) => h?.toLowerCase()?.trim() || '');
      const dataRows = rows.slice(headerRowIdx + 1);

      const transactions = dataRows
        .map((row: string[]) => parseTransactionRow(row, headers))
        .filter((t: Transaction | null): t is Transaction => t !== null)
        .slice(0, 100); // Limit to 100 most recent

      return res.status(200).json({
        transactions,
        sheetName: transactionSheetName,
        sheets: sheetNames,
        headers: rows[headerRowIdx],
        count: transactions.length,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        return res.status(401).json({
          transactions: [],
          message: 'Token expired',
          needsReauth: true,
        });
      }
      return res.status(500).json({
        transactions: [],
        message: error instanceof Error ? error.message : 'Failed to fetch transactions',
      });
    }
  }

  // Handle accounts import action
  if (action === 'accounts') {
    try {
      const sheetNames = await listSheets(accessToken, spreadsheetId);

      // Look for account/balance sheets
      const accountSheetCandidates = [
        'BAS_Accounts',
        'BAS Accounts',
        'Accounts',
        'accounts',
        'Balances',
        'Balance History',
        'Net Worth',
        'Bank Info',
      ];
      let accountSheetName = accountSheetCandidates.find(name => sheetNames.includes(name));

      // If no match, find any sheet with "account" or "balance" in the name
      if (!accountSheetName) {
        accountSheetName = sheetNames.find((name: string) =>
          /account|balance|bank/i.test(name)
        );
      }

      if (!accountSheetName) {
        return res.status(200).json({
          accounts: [],
          sheets: sheetNames,
          message: 'No account sheet found. Available sheets: ' + sheetNames.join(', '),
        });
      }

      // Fetch account data
      const rows = await fetchSheet(accessToken, spreadsheetId, `${accountSheetName}!A1:Z100`);

      if (rows.length < 2) {
        return res.status(200).json({
          accounts: [],
          sheetName: accountSheetName,
          sheets: sheetNames,
          message: 'No data found in sheet',
        });
      }

      // Find the header row
      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const rowLower = (rows[i] || []).map((c: string) => (c || '').toLowerCase().trim());
        if (rowLower.includes('account') || rowLower.includes('balance') || rowLower.includes('name')) {
          headerRowIdx = i;
          break;
        }
      }

      const headers = (rows[headerRowIdx] || []).map((h: string) => h?.toLowerCase()?.trim() || '');
      const dataRows = rows.slice(headerRowIdx + 1);

      const accounts = dataRows
        .map((row: string[]) => parseBalanceRow(row, headers))
        .filter((a: AccountBalance | null): a is AccountBalance => a !== null);

      return res.status(200).json({
        accounts,
        sheetName: accountSheetName,
        sheets: sheetNames,
        headers: rows[headerRowIdx],
        count: accounts.length,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
        return res.status(401).json({
          accounts: [],
          message: 'Token expired',
          needsReauth: true,
        });
      }
      return res.status(500).json({
        accounts: [],
        message: error instanceof Error ? error.message : 'Failed to fetch accounts',
      });
    }
  }

  try {
    // Try to read transactions - user's specific sheets + common names
    // User has: "BAS_Transactions" sheet
    const transactionSheetNames = [
      'BAS_Transactions',
      'BAS Transactions',
      'Expenses',
      'expenses',
      'expenses sheet',
      'Transactions',
      'transactions',
      'Sheet1',
      'Data'
    ];
    let transactions: Transaction[] = [];
    let transactionsFound = false;

    for (const sheetName of transactionSheetNames) {
      try {
        const rows = await fetchSheet(accessToken, spreadsheetId, `${sheetName}!A1:Z1000`);
        if (rows.length > 1) {
          const headers = rows[0].map((h: string) => h.toLowerCase());
          transactions = rows.slice(1)
            .map((row: string[]) => parseTransactionRow(row, headers))
            .filter((t: Transaction | null): t is Transaction => t !== null);
          transactionsFound = true;
          break;
        }
      } catch {
        continue;
      }
    }

    // Try to read balances - user's specific sheets + common names
    // User has: "budgetsheets bank info transfer sheet"
    const balanceSheetNames = [
      'budgetsheets bank info transfer',
      'Bank Info Transfer',
      'bank info transfer',
      'Balances',
      'Balance History',
      'Accounts',
      'Net Worth'
    ];
    let accounts: AccountBalance[] = [];

    for (const sheetName of balanceSheetNames) {
      try {
        const rows = await fetchSheet(accessToken, spreadsheetId, `${sheetName}!A1:Z100`);
        if (rows.length > 1) {
          const headers = rows[0].map((h: string) => h.toLowerCase());
          accounts = rows.slice(1)
            .map((row: string[]) => parseBalanceRow(row, headers))
            .filter((a: AccountBalance | null): a is AccountBalance => a !== null);
          break;
        }
      } catch {
        continue;
      }
    }

    // Calculate summary from transactions
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const monthTransactions = transactions.filter(t => t.date.startsWith(thisMonth));

    const income = monthTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = Math.abs(monthTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));

    const net = income - expenses;
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

    // Top spending categories
    const categorySpending: Record<string, number> = {};
    monthTransactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
      });

    const topCategories = Object.entries(categorySpending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Calculate net worth from accounts
    let netWorth = null;
    if (accounts.length > 0) {
      const assets = accounts
        .filter(a => !/(credit|loan|debt|liability)/i.test(a.type))
        .reduce((sum, a) => sum + a.balance, 0);

      const liabilities = Math.abs(accounts
        .filter(a => /(credit|loan|debt|liability)/i.test(a.type))
        .reduce((sum, a) => sum + a.balance, 0));

      netWorth = {
        assets,
        liabilities,
        netWorth: assets - liabilities,
        accounts,
      };
    }

    // Recent transactions (last 10)
    const recentTransactions = transactions
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);

    const summary: BudgetSummary = {
      period: thisMonth,
      incomeExpenses: {
        income,
        expenses,
        net,
        savingsRate,
      },
      topCategories,
      netWorth,
      recentTransactions,
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json({
      source: 'sheets',
      data: summary,
      debug: {
        transactionsFound,
        transactionCount: transactions.length,
        accountsCount: accounts.length,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        source: 'error',
        data: null,
        message: 'Google Sheets token expired. Please reconnect.',
        needsReauth: true,
      });
    }

    console.error('Budget API error:', error);
    return res.status(500).json({
      source: 'error',
      data: null,
      message: 'Failed to fetch budget data',
    });
  }
}
