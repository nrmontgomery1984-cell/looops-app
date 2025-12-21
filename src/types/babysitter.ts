// Babysitter tracking types for Family loop

// Caregiver definition
export type Caregiver = {
  id: string;
  name: string;
  hourlyRate: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

// Babysitting session
export type BabysitterSession = {
  id: string;
  date: string; // YYYY-MM-DD
  caregiverId: string;
  caregiverName: string; // Denormalized for display
  hours: number; // Supports decimals (e.g., 2.5)
  rateAtTime: number; // Rate when session was logged
  amount: number; // Calculated: hours * rateAtTime
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

// Summary statistics
export type BabysitterSummary = {
  currentWeek: {
    totalHours: number;
    totalAmount: number;
    sessionCount: number;
    byCaregiver: Record<string, { hours: number; amount: number }>;
  };
  currentMonth: {
    totalHours: number;
    totalAmount: number;
    sessionCount: number;
    byCaregiver: Record<string, { hours: number; amount: number }>;
  };
  yearToDate: {
    totalHours: number;
    totalAmount: number;
    sessionCount: number;
    byCaregiver: Record<string, { hours: number; amount: number }>;
  };
};

// State slice for babysitter tracking
export type BabysitterState = {
  caregivers: Caregiver[];
  sessions: BabysitterSession[];
};

// Default caregivers
export const DEFAULT_CAREGIVERS: Caregiver[] = [
  {
    id: "caregiver_kylie",
    name: "Kylie",
    hourlyRate: 15,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "caregiver_danika",
    name: "Danika",
    hourlyRate: 15,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "caregiver_meagan",
    name: "Meagan",
    hourlyRate: 15,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

// Factory function to create a new caregiver
export function createCaregiver(
  name: string,
  hourlyRate: number = 15
): Caregiver {
  return {
    id: `caregiver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    hourlyRate,
    active: true,
    createdAt: new Date().toISOString(),
  };
}

// Factory function to create a new session
export function createBabysitterSession(
  caregiverId: string,
  caregiverName: string,
  date: string,
  hours: number,
  rateAtTime: number,
  notes?: string
): BabysitterSession {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date,
    caregiverId,
    caregiverName,
    hours,
    rateAtTime,
    amount: hours * rateAtTime,
    notes,
    createdAt: new Date().toISOString(),
  };
}

// Helper: Get start of current week (Sunday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: Get start of current month
function getMonthStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper: Get start of current year
function getYearStart(date: Date): Date {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Calculate summary statistics from sessions
export function calculateBabysitterSummary(
  sessions: BabysitterSession[]
): BabysitterSummary {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const monthStart = getMonthStart(now);
  const yearStart = getYearStart(now);

  const createPeriodSummary = () => ({
    totalHours: 0,
    totalAmount: 0,
    sessionCount: 0,
    byCaregiver: {} as Record<string, { hours: number; amount: number }>,
  });

  const summary: BabysitterSummary = {
    currentWeek: createPeriodSummary(),
    currentMonth: createPeriodSummary(),
    yearToDate: createPeriodSummary(),
  };

  sessions.forEach((session) => {
    const sessionDate = new Date(session.date);

    // Helper to add session to a period
    const addToPeriod = (
      period: BabysitterSummary["currentWeek"]
    ) => {
      period.totalHours += session.hours;
      period.totalAmount += session.amount;
      period.sessionCount += 1;

      if (!period.byCaregiver[session.caregiverName]) {
        period.byCaregiver[session.caregiverName] = { hours: 0, amount: 0 };
      }
      period.byCaregiver[session.caregiverName].hours += session.hours;
      period.byCaregiver[session.caregiverName].amount += session.amount;
    };

    // Check which periods this session falls into
    if (sessionDate >= weekStart) {
      addToPeriod(summary.currentWeek);
    }
    if (sessionDate >= monthStart) {
      addToPeriod(summary.currentMonth);
    }
    if (sessionDate >= yearStart) {
      addToPeriod(summary.yearToDate);
    }
  });

  return summary;
}

// Get sessions for a specific week (returns sessions grouped by day)
export function getSessionsByWeek(
  sessions: BabysitterSession[],
  weekStartDate?: Date
): Record<string, BabysitterSession[]> {
  const weekStart = weekStartDate || getWeekStart(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const result: Record<string, BabysitterSession[]> = {};

  // Initialize all 7 days
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const dateKey = day.toISOString().split("T")[0];
    result[dateKey] = [];
  }

  // Add sessions to their respective days
  sessions.forEach((session) => {
    const sessionDate = new Date(session.date);
    if (sessionDate >= weekStart && sessionDate < weekEnd) {
      const dateKey = session.date;
      if (result[dateKey]) {
        result[dateKey].push(session);
      }
    }
  });

  return result;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Format hours (e.g., 2.5 -> "2.5h" or "2h 30m")
export function formatHours(hours: number, verbose: boolean = false): string {
  if (verbose) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }
  return `${hours}h`;
}

// Initial state
export const INITIAL_BABYSITTER_STATE: BabysitterState = {
  caregivers: DEFAULT_CAREGIVERS,
  sessions: [],
};
