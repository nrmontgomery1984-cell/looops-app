// Babysitter tracking types for Family loop

// Caregiver definition
export type Caregiver = {
  id: string;
  name: string;
  hourlyRate: number;
  email?: string; // For e-transfer matching
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
  // Payment tracking
  paymentStatus: "unpaid" | "paid";
  paymentId?: string; // Links to BabysitterPayment
  createdAt: string;
  updatedAt?: string;
};

// Payment record for tracking e-transfer payments
export type BabysitterPayment = {
  id: string;
  caregiverId: string;
  caregiverName: string;
  referenceCode: string; // e.g., "W01-K" (Week 01, Kylie)
  amount: number; // Total amount in cents
  sessionIds: string[]; // Sessions covered by this payment
  status: "pending" | "matched" | "confirmed";
  // Transaction matching
  matchedTransactionId?: string; // Links to FinanceTransaction.id
  matchedAt?: string;
  // Metadata
  weekNumber: number; // ISO week number
  year: number;
  createdAt: string;
  paidAt?: string;
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
    paymentStatus: "unpaid",
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

// ============================================
// Babysitter Portal Types
// ============================================

// Username/password-based access for babysitters
export type BabysitterAccess = {
  username: string; // Caregiver's login username
  password: string; // Simple password (not hashed - this is low-security family use)
  caregiverId: string; // Links to which caregiver this PIN is for
  createdAt: string;
  lastAccessedAt?: string;
};

// Emergency contact for household info
export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string; // "Mom", "Dad", "Neighbor", "Doctor", etc.
  phone: string;
  isPrimary: boolean;
};

// Child/kid info
export type KidInfo = {
  id: string;
  name: string;
  age?: number;
  birthDate?: string;
  allergies?: string[];
  medications?: string[];
  bedtime?: string;
  notes?: string;
};

// Daily routine entry
export type DailyRoutine = {
  id: string;
  time: string; // "6:00 PM", "After dinner", etc.
  activity: string;
  notes?: string;
};

// Complete household info for babysitters
export type HouseholdInfo = {
  emergencyContacts: EmergencyContact[];
  kids: KidInfo[];
  houseRules: string[];
  wifiName?: string;
  wifiPassword?: string;
  routines: DailyRoutine[];
  notes?: string;
  updatedAt?: string;
};

// Schedule entry for babysitter scheduling
export type ScheduleEntry = {
  id: string;
  caregiverId: string;
  caregiverName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "6:00 PM"
  endTime: string; // "10:00 PM"
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

// Factory functions
export function createEmergencyContact(
  name: string,
  relationship: string,
  phone: string,
  isPrimary: boolean = false
): EmergencyContact {
  return {
    id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    relationship,
    phone,
    isPrimary,
  };
}

export function createKidInfo(name: string, options?: Partial<Omit<KidInfo, "id" | "name">>): KidInfo {
  return {
    id: `kid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    ...options,
  };
}

export function createDailyRoutine(time: string, activity: string, notes?: string): DailyRoutine {
  return {
    id: `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    time,
    activity,
    notes,
  };
}

export function createScheduleEntry(
  caregiverId: string,
  caregiverName: string,
  date: string,
  startTime: string,
  endTime: string,
  notes?: string
): ScheduleEntry {
  return {
    id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    caregiverId,
    caregiverName,
    date,
    startTime,
    endTime,
    status: "pending",
    notes,
    createdAt: new Date().toISOString(),
  };
}

export function createBabysitterAccess(
  caregiverId: string,
  username: string,
  password: string
): BabysitterAccess {
  return {
    username,
    password,
    caregiverId,
    createdAt: new Date().toISOString(),
  };
}

// Default/initial household info
export const INITIAL_HOUSEHOLD_INFO: HouseholdInfo = {
  emergencyContacts: [],
  kids: [],
  houseRules: [],
  routines: [],
};

// ============================================
// Payment Reference Code Helpers
// ============================================

// Get ISO week number for a date
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Generate payment reference code: W##-X (Week number + first initial)
// e.g., W01-K for Week 1, Kylie
export function generatePaymentReferenceCode(
  caregiverName: string,
  weekNumber: number
): string {
  const initial = caregiverName.charAt(0).toUpperCase();
  const weekStr = weekNumber.toString().padStart(2, "0");
  return `W${weekStr}-${initial}`;
}

// Create a payment record for unpaid sessions
export function createBabysitterPayment(
  caregiver: Caregiver,
  sessions: BabysitterSession[],
  weekNumber: number,
  year: number
): BabysitterPayment {
  const totalAmount = sessions.reduce((sum, s) => sum + s.amount, 0);
  const referenceCode = generatePaymentReferenceCode(caregiver.name, weekNumber);

  return {
    id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    caregiverId: caregiver.id,
    caregiverName: caregiver.name,
    referenceCode,
    amount: Math.round(totalAmount * 100), // Convert to cents
    sessionIds: sessions.map((s) => s.id),
    status: "pending",
    weekNumber,
    year,
    createdAt: new Date().toISOString(),
  };
}

// Match a transaction description against payment reference codes
// Returns the matching reference code if found
export function matchTransactionToPayment(
  description: string,
  payments: BabysitterPayment[]
): BabysitterPayment | null {
  const upperDesc = description.toUpperCase();

  for (const payment of payments) {
    // Check if the reference code appears in the transaction description
    if (upperDesc.includes(payment.referenceCode)) {
      return payment;
    }
  }

  return null;
}

// Get unpaid sessions grouped by caregiver and week
export function getUnpaidSessionsByWeek(
  sessions: BabysitterSession[]
): Map<string, { caregiver: string; weekNumber: number; year: number; sessions: BabysitterSession[] }> {
  const groups = new Map<string, { caregiver: string; weekNumber: number; year: number; sessions: BabysitterSession[] }>();

  for (const session of sessions) {
    if (session.paymentStatus === "unpaid") {
      const sessionDate = new Date(session.date);
      const weekNumber = getISOWeekNumber(sessionDate);
      const year = sessionDate.getFullYear();
      const key = `${session.caregiverId}-${year}-W${weekNumber}`;

      if (!groups.has(key)) {
        groups.set(key, {
          caregiver: session.caregiverName,
          weekNumber,
          year,
          sessions: [],
        });
      }
      groups.get(key)!.sessions.push(session);
    }
  }

  return groups;
}
