// Integration Services - Client-side API for managing integrations
// Connects to Vercel serverless functions for OAuth and backend services

// Use relative URLs for Vercel API routes, fall back to localhost for development
const API_BASE = "";

// Storage keys for tokens
const STORAGE_KEYS = {
  fitbit: 'looops_fitbit_tokens',
  google_calendar: 'looops_google_calendar_tokens',
  google_sheets: 'looops_google_sheets_tokens',
  todoist: 'looops_todoist_tokens',
  spotify: 'looops_spotify_tokens',
};

// Token storage helpers
interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user_id?: string;
}

function getStoredTokens(integration: keyof typeof STORAGE_KEYS): StoredTokens | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[integration]);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function storeTokens(integration: keyof typeof STORAGE_KEYS, tokens: StoredTokens): void {
  localStorage.setItem(STORAGE_KEYS[integration], JSON.stringify(tokens));
}

function clearTokens(integration: keyof typeof STORAGE_KEYS): void {
  localStorage.removeItem(STORAGE_KEYS[integration]);
}

// Handle OAuth callback from URL params
export function handleOAuthCallback(): { integration: string; success: boolean; error?: string } | null {
  const params = new URLSearchParams(window.location.search);
  const integration = params.get('integration');
  const success = params.get('success') === 'true';
  const error = params.get('error');

  if (!integration) return null;

  if (success) {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresIn = params.get('expires_in');
    const userId = params.get('user_id');

    if (accessToken) {
      const storageKey = integration.replace('google_', 'google_') as keyof typeof STORAGE_KEYS;
      storeTokens(storageKey, {
        access_token: accessToken,
        refresh_token: refreshToken || undefined,
        expires_at: expiresIn ? Date.now() + parseInt(expiresIn) * 1000 : undefined,
        user_id: userId || undefined,
      });
    }
  }

  // Clean up URL
  window.history.replaceState({}, document.title, window.location.pathname);

  return { integration, success, error: error || undefined };
}

// Integration status types
export interface IntegrationStatus {
  configured: boolean;
  authorized: boolean;
  message: string;
  lastSync?: string;
}

export interface FitbitHealthData {
  today: {
    date: string;
    steps: number;
    distanceKm: number;
    caloriesBurned: number;
    activeMinutes: number;
    restingHeartRate: number | null;
    sleepDurationHours: number;
    sleepScore: number | null;
    deepSleepMinutes: number;
    remSleepMinutes: number;
    weightKg: number | null;
    scores: {
      steps: number | null;
      sleep: number | null;
      activity: number | null;
      readiness: number | null;
    };
  };
  heartRateZones: Array<{
    name: string;
    min: number;
    max: number;
    minutes: number;
  }>;
  error?: string;
}

export interface TillerFinancialData {
  period: string;
  incomeExpenses: {
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
  } | null;
  topCategories: Array<{ category: string; amount: number }>;
  netWorth: {
    assets: number;
    liabilities: number;
    netWorth: number;
    accounts: Array<{
      account: string;
      balance: number;
      type: string;
      asOf: string;
    }>;
  } | null;
  recentTransactions: Array<{
    date: string;
    description: string;
    category: string;
    amount: number;
    account: string;
    type: string;
  }>;
  updatedAt: string;
}

// ============ Integration Status Check ============

interface BackendStatus {
  fitbit: { configured: boolean; authUrl: string };
  google_calendar: { configured: boolean; authUrl: string };
  google_sheets: { configured: boolean; authUrl: string };
  todoist: { configured: boolean; authUrl: string };
  spotify: { configured: boolean; authUrl: string };
}

let cachedBackendStatus: BackendStatus | null = null;

async function getBackendStatus(): Promise<BackendStatus | null> {
  if (cachedBackendStatus) return cachedBackendStatus;

  try {
    const res = await fetch('/api/integrations/status');
    if (res.ok) {
      cachedBackendStatus = await res.json();
      return cachedBackendStatus;
    }
  } catch {
    // Backend not available
  }
  return null;
}

// ============ Fitbit Integration ============

export async function getFitbitStatus(): Promise<IntegrationStatus> {
  const tokens = getStoredTokens('fitbit');
  const backend = await getBackendStatus();

  if (tokens?.access_token) {
    return {
      configured: true,
      authorized: true,
      message: "Connected",
      lastSync: new Date().toISOString(),
    };
  }

  if (backend?.fitbit?.configured) {
    return {
      configured: true,
      authorized: false,
      message: "Click Connect to authorize",
    };
  }

  return {
    configured: false,
    authorized: false,
    message: "Server not available",
  };
}

export function getFitbitAuthUrl(): string {
  return '/api/oauth?provider=fitbit&action=auth';
}

export function disconnectFitbit(): void {
  clearTokens('fitbit');
}

export async function getFitbitHealth(): Promise<FitbitHealthData | null> {
  try {
    const tokens = getStoredTokens('fitbit');
    if (!tokens?.access_token) return null;

    const res = await fetch(`${API_BASE}/api/fitbit/health`, {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Handle token expiration
    if (data.needsReauth) {
      clearTokens('fitbit');
      return null;
    }

    return data.source === "local" ? null : data.data;
  } catch (error) {
    console.error("Failed to fetch Fitbit health:", error);
    return null;
  }
}

export async function getFitbitWeekly(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/fitbit/week`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.source === "local" ? null : data.data;
  } catch (error) {
    console.error("Failed to fetch Fitbit weekly:", error);
    return null;
  }
}

// ============ Todoist Integration ============

export async function getTodoistStatus(): Promise<IntegrationStatus> {
  const tokens = getStoredTokens('todoist');
  const backend = await getBackendStatus();

  if (tokens?.access_token) {
    return {
      configured: true,
      authorized: true,
      message: "Connected",
      lastSync: new Date().toISOString(),
    };
  }

  if (backend?.todoist?.configured) {
    return {
      configured: true,
      authorized: false,
      message: "Click Connect to authorize",
    };
  }

  return {
    configured: false,
    authorized: false,
    message: "Server not available",
  };
}

export function getTodoistAuthUrl(): string {
  return '/api/oauth?provider=todoist&action=auth';
}

export function disconnectTodoist(): void {
  clearTokens('todoist');
}

// Todoist task shape from sync API
export interface TodoistSyncTask {
  id: string;
  todoistId: string;
  title: string;
  description: string;
  loop: string;
  labels: string[];
  projectId: string;
  projectName: string | null;
  sectionId: string | null;
  parentId: string | null;
  priority: number;
  dueDate: string | null;
  dueString: string | null;
  isRecurring: boolean;
  url: string;
  order: number;
  createdAt: string;
}

export interface TodoistSyncResult {
  success: boolean;
  taskCount?: number;
  tasks?: TodoistSyncTask[];
  labels?: Array<{ id: string; name: string; loop: string | null }>;
  projects?: Array<{ id: string; name: string }>;
  error?: string;
}

export async function syncTodoist(): Promise<TodoistSyncResult> {
  try {
    const tokens = getStoredTokens('todoist');
    if (!tokens?.access_token) {
      return { success: false, error: "Todoist not connected" };
    }

    const res = await fetch(`${API_BASE}/api/todoist/sync`, {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });
    if (!res.ok) throw new Error("Sync failed");
    const data = await res.json();

    // Handle token expiration
    if (data.needsReauth) {
      clearTokens('todoist');
      return { success: false, error: "Todoist session expired. Please reconnect." };
    }

    if (data.source === "local") {
      return { success: false, error: "Todoist not configured" };
    }

    return {
      success: true,
      taskCount: data.data?.tasks?.length || 0,
      tasks: data.data?.tasks || [],
      labels: data.data?.labels || [],
      projects: data.data?.projects || [],
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getTodoistLabels(): Promise<
  Array<{ id: string; name: string; loop: string | null }>
> {
  try {
    const tokens = getStoredTokens('todoist');
    if (!tokens?.access_token) return [];

    const res = await fetch(`${API_BASE}/api/todoist/sync`, {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.labels || [];
  } catch (error) {
    return [];
  }
}

// ============ Tiller/Google Sheets Integration ============

export async function getTillerStatus(): Promise<IntegrationStatus> {
  const tokens = getStoredTokens('google_sheets');
  const backend = await getBackendStatus();

  if (tokens?.access_token) {
    return {
      configured: true,
      authorized: true,
      message: "Connected",
      lastSync: new Date().toISOString(),
    };
  }

  if (backend?.google_sheets?.configured) {
    return {
      configured: true,
      authorized: false,
      message: "Click Connect to authorize",
    };
  }

  return {
    configured: false,
    authorized: false,
    message: "Server not available",
  };
}

export function getTillerAuthUrl(): string {
  return '/api/oauth?provider=google_sheets&action=auth';
}

export function disconnectTiller(): void {
  clearTokens('google_sheets');
}

export async function getTillerSummary(
  days: number = 30
): Promise<TillerFinancialData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tiller/summary?days=${days}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.source === "local" ? null : data.data;
  } catch (error) {
    console.error("Failed to fetch Tiller summary:", error);
    return null;
  }
}

export async function getTillerTransactions(
  days: number = 30
): Promise<TillerFinancialData["recentTransactions"]> {
  try {
    const res = await fetch(`${API_BASE}/api/tiller/transactions?days=${days}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    return [];
  }
}

export async function getTillerBalances(): Promise<
  Array<{ account: string; balance: number; type: string; asOf: string }>
> {
  try {
    const res = await fetch(`${API_BASE}/api/tiller/balances`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    return [];
  }
}

// ============ Google Calendar Integration ============

export async function getCalendarStatus(): Promise<IntegrationStatus> {
  const tokens = getStoredTokens('google_calendar');
  const backend = await getBackendStatus();

  if (tokens?.access_token) {
    return {
      configured: true,
      authorized: true,
      message: "Connected",
      lastSync: new Date().toISOString(),
    };
  }

  if (backend?.google_calendar?.configured) {
    return {
      configured: true,
      authorized: false,
      message: "Click Connect to authorize",
    };
  }

  return {
    configured: false,
    authorized: false,
    message: "Server not available",
  };
}

export function getCalendarAuthUrl(): string {
  return '/api/oauth?provider=google_calendar&action=auth';
}

export function disconnectCalendar(): void {
  clearTokens('google_calendar');
}

// ============ Spotify Integration ============

export async function getSpotifyStatus(): Promise<IntegrationStatus> {
  const tokens = getStoredTokens('spotify');
  const backend = await getBackendStatus();

  if (tokens?.access_token) {
    return {
      configured: true,
      authorized: true,
      message: "Connected",
      lastSync: new Date().toISOString(),
    };
  }

  if (backend?.spotify?.configured) {
    return {
      configured: true,
      authorized: false,
      message: "Click Connect to authorize",
    };
  }

  return {
    configured: false,
    authorized: false,
    message: "Server not available",
  };
}

export function getSpotifyAuthUrl(): string {
  return '/api/oauth?provider=spotify&action=auth';
}

export function disconnectSpotify(): void {
  clearTokens('spotify');
}

export function getSpotifyTokens(): StoredTokens | null {
  return getStoredTokens('spotify');
}

// ============ All Integrations Status ============

export interface AllIntegrationsStatus {
  fitbit: IntegrationStatus;
  todoist: IntegrationStatus;
  tiller: IntegrationStatus;
  calendar: IntegrationStatus;
  spotify: IntegrationStatus;
}

export async function getAllIntegrationsStatus(): Promise<AllIntegrationsStatus> {
  const [fitbit, todoist, tiller, calendar, spotify] = await Promise.all([
    getFitbitStatus(),
    getTodoistStatus(),
    getTillerStatus(),
    getCalendarStatus(),
    getSpotifyStatus(),
  ]);

  return { fitbit, todoist, tiller, calendar, spotify };
}

export default {
  // OAuth callback handler
  handleOAuthCallback,
  // Fitbit
  getFitbitStatus,
  getFitbitAuthUrl,
  getFitbitHealth,
  getFitbitWeekly,
  disconnectFitbit,
  // Todoist
  getTodoistStatus,
  getTodoistAuthUrl,
  syncTodoist,
  getTodoistLabels,
  disconnectTodoist,
  // Tiller/Google Sheets
  getTillerStatus,
  getTillerAuthUrl,
  getTillerSummary,
  getTillerTransactions,
  getTillerBalances,
  disconnectTiller,
  // Google Calendar
  getCalendarStatus,
  getCalendarAuthUrl,
  disconnectCalendar,
  // Spotify
  getSpotifyStatus,
  getSpotifyAuthUrl,
  getSpotifyTokens,
  disconnectSpotify,
  // All
  getAllIntegrationsStatus,
};
