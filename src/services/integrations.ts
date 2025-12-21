// Integration Services - Client-side API for managing integrations
// Connects to backend services for Fitbit, Todoist, Google Sheets (Tiller)

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

// ============ Fitbit Integration ============

export async function getFitbitStatus(): Promise<IntegrationStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/fitbit/status`);
    if (!res.ok) throw new Error("Failed to fetch Fitbit status");
    return res.json();
  } catch (error) {
    return {
      configured: false,
      authorized: false,
      message: "Server not available",
    };
  }
}

export function getFitbitAuthUrl(): string {
  return `${API_BASE}/api/fitbit/auth`;
}

export async function getFitbitHealth(): Promise<FitbitHealthData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/fitbit/health`);
    if (!res.ok) return null;
    const data = await res.json();
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
  try {
    const res = await fetch(`${API_BASE}/api/todoist/status`);
    if (!res.ok) throw new Error("Failed to fetch Todoist status");
    return res.json();
  } catch (error) {
    return {
      configured: false,
      authorized: false,
      message: "Server not available",
    };
  }
}

export async function syncTodoist(): Promise<{
  success: boolean;
  taskCount?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/todoist/sync`);
    if (!res.ok) throw new Error("Sync failed");
    const data = await res.json();
    if (data.source === "local") {
      return { success: false, error: "Todoist not configured" };
    }
    return {
      success: true,
      taskCount: data.data?.tasks?.length || 0,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getTodoistLabels(): Promise<
  Array<{ id: string; name: string; loop: string | null }>
> {
  try {
    const res = await fetch(`${API_BASE}/api/todoist/labels`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    return [];
  }
}

// ============ Tiller/Google Sheets Integration ============

export async function getTillerStatus(): Promise<IntegrationStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/tiller/status`);
    if (!res.ok) throw new Error("Failed to fetch Tiller status");
    return res.json();
  } catch (error) {
    return {
      configured: false,
      authorized: false,
      message: "Server not available",
    };
  }
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
  try {
    const res = await fetch(`${API_BASE}/api/calendar/status`);
    if (!res.ok) throw new Error("Failed to fetch Calendar status");
    return res.json();
  } catch (error) {
    return {
      configured: false,
      authorized: false,
      message: "Server not available",
    };
  }
}

export function getCalendarAuthUrl(): string {
  return `${API_BASE}/api/calendar/auth`;
}

// ============ Spotify Integration ============

export async function getSpotifyStatus(): Promise<IntegrationStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/spotify/status`);
    if (!res.ok) throw new Error("Failed to fetch Spotify status");
    return res.json();
  } catch (error) {
    return {
      configured: false,
      authorized: false,
      message: "Server not available",
    };
  }
}

export function getSpotifyAuthUrl(): string {
  return `${API_BASE}/api/spotify/auth`;
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
  getFitbitStatus,
  getFitbitAuthUrl,
  getFitbitHealth,
  getFitbitWeekly,
  getTodoistStatus,
  syncTodoist,
  getTodoistLabels,
  getTillerStatus,
  getTillerSummary,
  getTillerTransactions,
  getTillerBalances,
  getCalendarStatus,
  getCalendarAuthUrl,
  getSpotifyStatus,
  getSpotifyAuthUrl,
  getAllIntegrationsStatus,
};
