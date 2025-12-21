// Health/Fitbit data types for Health loop

// Daily health data from Fitbit (via IFTTT -> Google Sheets)
export type HealthData = {
  id: string;
  date: string; // YYYY-MM-DD
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
  activeMinutes: number;
  restingHeartRate: number | null;
  sleepDurationHours: number;
  sleepScore: number | null;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  mindfulnessMinutes: number;
  weightKg: number | null;
  syncedAt: string | null;
};

// Calculated health scores
export type HealthScores = {
  steps: number | null; // 0-100
  sleep: number | null; // 0-100
  activity: number | null; // 0-100
  readiness: number | null; // 0-100 (average of above)
};

// Health summary from API
export type HealthSummary = {
  today: (HealthData & { scores: HealthScores }) | null;
  weeklyAvg: {
    steps: number;
    sleepHours: number;
    activeMinutes: number;
    mindfulnessMinutes: number;
  } | null;
  weeklyData: HealthData[];
  mindfulnessStreak: number;
};

// Health state slice
export type HealthState = {
  summary: HealthSummary | null;
  lastSynced: string | null;
  isLoading: boolean;
  error: string | null;
};

// Score thresholds for display colors
export const HEALTH_THRESHOLDS = {
  readiness: { good: 65, ok: 30 },
  sleep: { good: 80, ok: 60 },
  steps: { good: 10000, ok: 5000 },
  activity: { good: 60, ok: 30 },
} as const;

// Get status color based on score
export function getHealthStatusColor(
  metric: keyof typeof HEALTH_THRESHOLDS,
  value: number | null
): "green" | "yellow" | "red" | "gray" {
  if (value === null) return "gray";

  const thresholds = HEALTH_THRESHOLDS[metric];
  if (value >= thresholds.good) return "green";
  if (value >= thresholds.ok) return "yellow";
  return "red";
}

// Format display values
export function formatSteps(steps: number): string {
  if (steps >= 1000) {
    return `${(steps / 1000).toFixed(1)}k`;
  }
  return steps.toString();
}

export function formatSleepHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Initial state
export const INITIAL_HEALTH_STATE: HealthState = {
  summary: null,
  lastSynced: null,
  isLoading: false,
  error: null,
};
