// Routine types for Looops - Multi-step sequences spanning multiple loops

import { LoopId, LoopStateType, Priority } from "./core";
import { TaskConstraints } from "./tasks";
import { DayType, SmartScheduleState } from "./dayTypes";

// Time of day preference for routines
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night" | "anytime";

// Days of week (0=Sunday, 6=Saturday)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Routine frequency
export type RoutineFrequency =
  | "daily"
  | "weekdays"
  | "weekends"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";

// Routine schedule configuration
export type RoutineSchedule = {
  frequency: RoutineFrequency;
  daysOfWeek?: DayOfWeek[]; // For custom weekly schedules
  dayOfMonth?: number; // For monthly routines (1-31)
  timeOfDay: TimeOfDay;
  specificTime?: string; // HH:MM format for specific times
};

// Day type schedule override - different times for different day types
export type DayTypeScheduleOverride = {
  timeOfDay?: TimeOfDay;
  specificTime?: string; // HH:MM format
};

// Routine streak tracking
export type RoutineStreak = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
  totalCompletions: number;
  completionRate: number; // 0-100%
};

// Routine status
export type RoutineStatus = "active" | "paused" | "archived";

// Individual step within a routine
export type RoutineStep = {
  id: string;
  title: string;
  loop: LoopId;
  subLoop?: string;
  estimateMinutes?: number;
  order: number;
  optional?: boolean; // Can be skipped without breaking streak
};

// Routine type - now a multi-step sequence
export type Routine = {
  id: string;
  title: string;
  description?: string;

  // Steps - ordered list of tasks across multiple loops
  steps: RoutineStep[];

  // Schedule
  schedule: RoutineSchedule;

  // Day type filtering - which day types this routine applies to
  // If undefined or empty, routine applies to ALL day types (backward compatible)
  dayTypes?: DayType[];

  // Day type schedule overrides - different times for different day types
  // Key is the day type, value is the schedule override
  dayTypeScheduleOverrides?: Partial<Record<DayType, DayTypeScheduleOverride>>;

  // Metadata
  status: RoutineStatus;
  createdAt: string;
  updatedAt: string;

  // Streak tracking (for overall routine completion)
  streak: RoutineStreak;

  // Visual
  icon?: string;
  color?: string;

  // Tags for filtering
  tags?: string[];
};

// Get total estimated time for a routine
export function getRoutineDuration(routine: Routine): number {
  if (!routine.steps || !Array.isArray(routine.steps)) return 0;
  return routine.steps.reduce((sum, step) => sum + (step.estimateMinutes || 0), 0);
}

// Get loops involved in a routine
export function getRoutineLoops(routine: Routine): LoopId[] {
  if (!routine.steps || !Array.isArray(routine.steps)) return [];
  const loops = new Set<LoopId>();
  routine.steps.forEach(step => loops.add(step.loop));
  return Array.from(loops);
}

// Routine completion record - tracks which steps were completed
export type RoutineCompletion = {
  id: string;
  routineId: string;
  completedAt: string;
  completedSteps: string[]; // IDs of completed steps
  skippedSteps: string[]; // IDs of skipped steps
  notes?: string;
  fullyCompleted: boolean; // All required steps done
};

// Routine templates for quick setup - now with multi-loop steps
export type RoutineTemplate = {
  id: string;
  title: string;
  description: string;
  schedule: RoutineSchedule;
  icon: string;
  tags: string[];
  steps: Omit<RoutineStep, "id">[]; // Steps without IDs (generated on creation)
};

// Preset routine templates - multi-step, multi-loop routines
export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  // Morning Routine
  {
    id: "morning_routine",
    title: "Morning Routine",
    description: "Start your day right with this comprehensive morning sequence",
    schedule: { frequency: "daily", timeOfDay: "morning" },
    icon: "🌅",
    tags: ["morning", "daily", "energy"],
    steps: [
      { title: "Make bed", loop: "Maintenance", estimateMinutes: 2, order: 0 },
      { title: "Hydrate - drink water", loop: "Health", subLoop: "Nutrition", estimateMinutes: 1, order: 1 },
      { title: "Stretch or light exercise", loop: "Health", subLoop: "Exercise", estimateMinutes: 10, order: 2 },
      { title: "Shower & hygiene", loop: "Maintenance", estimateMinutes: 15, order: 3 },
      { title: "Healthy breakfast", loop: "Health", subLoop: "Nutrition", estimateMinutes: 15, order: 4 },
      { title: "Review today's schedule", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 5 },
      { title: "Set daily intention", loop: "Meaning", subLoop: "Reflection", estimateMinutes: 2, order: 6, optional: true },
    ],
  },

  // Bedtime Routine
  {
    id: "bedtime_routine",
    title: "Bedtime Routine",
    description: "Wind down properly for quality sleep",
    schedule: { frequency: "daily", timeOfDay: "night" },
    icon: "🌙",
    tags: ["evening", "sleep", "daily"],
    steps: [
      { title: "Tidy living space", loop: "Maintenance", estimateMinutes: 10, order: 0 },
      { title: "Prepare tomorrow's clothes", loop: "Maintenance", estimateMinutes: 5, order: 1 },
      { title: "Review tomorrow's calendar", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 2 },
      { title: "Brush & floss teeth", loop: "Maintenance", estimateMinutes: 5, order: 3 },
      { title: "Skincare routine", loop: "Health", estimateMinutes: 5, order: 4, optional: true },
      { title: "Journal or gratitude", loop: "Meaning", subLoop: "Reflection", estimateMinutes: 10, order: 5, optional: true },
      { title: "No screens - read or relax", loop: "Health", subLoop: "Sleep", estimateMinutes: 15, order: 6 },
    ],
  },

  // Weekly Review
  {
    id: "weekly_review",
    title: "Weekly Review",
    description: "Reflect on the week and plan ahead",
    schedule: { frequency: "weekly", daysOfWeek: [0], timeOfDay: "afternoon" },
    icon: "📊",
    tags: ["weekly", "planning", "review"],
    steps: [
      { title: "Clear all inboxes", loop: "Work", subLoop: "Admin", estimateMinutes: 15, order: 0 },
      { title: "Review completed tasks", loop: "Work", subLoop: "Admin", estimateMinutes: 10, order: 1 },
      { title: "Review goals progress", loop: "Meaning", subLoop: "Goals", estimateMinutes: 10, order: 2 },
      { title: "Plan next week's priorities", loop: "Work", subLoop: "Admin", estimateMinutes: 15, order: 3 },
      { title: "Schedule family time", loop: "Family", estimateMinutes: 5, order: 4 },
      { title: "Review finances/budget", loop: "Wealth", subLoop: "Budgeting", estimateMinutes: 10, order: 5 },
      { title: "Schedule fun activities", loop: "Fun", estimateMinutes: 5, order: 6, optional: true },
    ],
  },

  // Exercise Routine
  {
    id: "exercise_routine",
    title: "Workout Session",
    description: "Complete exercise with proper warm-up and cool-down",
    schedule: { frequency: "weekdays", timeOfDay: "morning" },
    icon: "💪",
    tags: ["exercise", "health", "fitness"],
    steps: [
      { title: "Warm-up stretches", loop: "Health", subLoop: "Exercise", estimateMinutes: 5, order: 0 },
      { title: "Main workout", loop: "Health", subLoop: "Exercise", estimateMinutes: 30, order: 1 },
      { title: "Cool-down stretches", loop: "Health", subLoop: "Exercise", estimateMinutes: 5, order: 2 },
      { title: "Log workout", loop: "Health", subLoop: "Exercise", estimateMinutes: 2, order: 3, optional: true },
      { title: "Protein shake or snack", loop: "Health", subLoop: "Nutrition", estimateMinutes: 5, order: 4, optional: true },
    ],
  },

  // Work Day Startup
  {
    id: "workday_startup",
    title: "Work Day Startup",
    description: "Get into work mode efficiently",
    schedule: { frequency: "weekdays", timeOfDay: "morning" },
    icon: "💼",
    tags: ["work", "productivity", "morning"],
    steps: [
      { title: "Review calendar & meetings", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 0 },
      { title: "Check priority messages", loop: "Work", subLoop: "Admin", estimateMinutes: 10, order: 1 },
      { title: "Identify top 3 tasks", loop: "Work", estimateMinutes: 5, order: 2 },
      { title: "Clear quick wins (<5 min)", loop: "Work", estimateMinutes: 15, order: 3, optional: true },
      { title: "Start deep work block", loop: "Work", estimateMinutes: 5, order: 4 },
    ],
  },

  // Work Day Shutdown
  {
    id: "workday_shutdown",
    title: "Work Day Shutdown",
    description: "Close out work properly to separate work from life",
    schedule: { frequency: "weekdays", timeOfDay: "evening" },
    icon: "🔚",
    tags: ["work", "evening", "boundaries"],
    steps: [
      { title: "Document progress & blockers", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 0 },
      { title: "Update task statuses", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 1 },
      { title: "Write tomorrow's priority list", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 2 },
      { title: "Clear inbox to zero", loop: "Work", subLoop: "Admin", estimateMinutes: 10, order: 3, optional: true },
      { title: "Close work apps", loop: "Work", estimateMinutes: 1, order: 4 },
      { title: "Transition activity (walk, snack)", loop: "Health", estimateMinutes: 10, order: 5, optional: true },
    ],
  },

  // Family Evening
  {
    id: "family_evening",
    title: "Family Evening",
    description: "Quality time with family after work",
    schedule: { frequency: "weekdays", timeOfDay: "evening" },
    icon: "👨‍👩‍👧‍👦",
    tags: ["family", "evening", "connection"],
    steps: [
      { title: "Greet family - be present", loop: "Family", subLoop: "Quality Time", estimateMinutes: 10, order: 0 },
      { title: "Help with dinner prep", loop: "Maintenance", estimateMinutes: 20, order: 1, optional: true },
      { title: "Family dinner together", loop: "Family", subLoop: "Quality Time", estimateMinutes: 30, order: 2 },
      { title: "Cleanup together", loop: "Maintenance", estimateMinutes: 15, order: 3 },
      { title: "Family activity or conversation", loop: "Family", subLoop: "Quality Time", estimateMinutes: 30, order: 4 },
    ],
  },

  // Sunday Reset
  {
    id: "sunday_reset",
    title: "Sunday Reset",
    description: "Prepare for the week ahead",
    schedule: { frequency: "weekly", daysOfWeek: [0], timeOfDay: "afternoon" },
    icon: "🔄",
    tags: ["weekly", "planning", "maintenance"],
    steps: [
      { title: "Laundry - wash, dry, fold", loop: "Maintenance", estimateMinutes: 30, order: 0 },
      { title: "Meal plan for the week", loop: "Health", subLoop: "Nutrition", estimateMinutes: 15, order: 1 },
      { title: "Grocery list & shopping", loop: "Maintenance", subLoop: "Shopping", estimateMinutes: 60, order: 2 },
      { title: "Meal prep", loop: "Maintenance", estimateMinutes: 60, order: 3, optional: true },
      { title: "Home tidy/clean", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 30, order: 4 },
      { title: "Review upcoming week", loop: "Work", subLoop: "Admin", estimateMinutes: 15, order: 5 },
      { title: "Self-care activity", loop: "Fun", estimateMinutes: 30, order: 6, optional: true },
    ],
  },

  // Meditation & Mindfulness
  {
    id: "meditation_practice",
    title: "Meditation Practice",
    description: "Daily mindfulness for mental clarity",
    schedule: { frequency: "daily", timeOfDay: "morning" },
    icon: "🧘",
    tags: ["meditation", "mindfulness", "daily"],
    steps: [
      { title: "Find quiet space", loop: "Health", subLoop: "Mental", estimateMinutes: 1, order: 0 },
      { title: "Breathing exercises", loop: "Health", subLoop: "Mental", estimateMinutes: 3, order: 1 },
      { title: "Meditation session", loop: "Health", subLoop: "Mental", estimateMinutes: 10, order: 2 },
      { title: "Set intention for day", loop: "Meaning", subLoop: "Reflection", estimateMinutes: 2, order: 3, optional: true },
      { title: "Gratitude reflection", loop: "Meaning", subLoop: "Gratitude", estimateMinutes: 3, order: 4, optional: true },
    ],
  },

  // Financial Check-in
  {
    id: "financial_checkin",
    title: "Financial Check-in",
    description: "Regular review of finances and budget",
    schedule: { frequency: "weekly", daysOfWeek: [0], timeOfDay: "afternoon" },
    icon: "💰",
    tags: ["finance", "weekly", "wealth"],
    steps: [
      { title: "Review bank accounts", loop: "Wealth", subLoop: "Budgeting", estimateMinutes: 5, order: 0 },
      { title: "Categorize recent transactions", loop: "Wealth", subLoop: "Budgeting", estimateMinutes: 10, order: 1 },
      { title: "Check budget vs actual", loop: "Wealth", subLoop: "Budgeting", estimateMinutes: 5, order: 2 },
      { title: "Review upcoming bills", loop: "Wealth", subLoop: "Bills", estimateMinutes: 5, order: 3 },
      { title: "Update financial goals", loop: "Wealth", subLoop: "Investments", estimateMinutes: 5, order: 4, optional: true },
    ],
  },
];

// Helper to create a new routine
export function createRoutine(
  title: string,
  steps: RoutineStep[],
  schedule: RoutineSchedule,
  options?: Partial<Omit<Routine, "id" | "title" | "steps" | "schedule" | "createdAt" | "updatedAt" | "streak">>
): Routine {
  const now = new Date().toISOString();
  return {
    id: `routine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    steps,
    schedule,
    status: "active",
    createdAt: now,
    updatedAt: now,
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate: 0,
    },
    ...options,
  };
}

// Create routine from template
export function createRoutineFromTemplate(template: RoutineTemplate): Routine {
  // Generate IDs for each step
  const steps: RoutineStep[] = template.steps.map((step, index) => ({
    ...step,
    id: `step_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
  }));

  return createRoutine(template.title, steps, template.schedule, {
    description: template.description,
    icon: template.icon,
    tags: template.tags,
  });
}

// Check if routine matches frequency for the given date
function matchesFrequency(routine: Routine, date: Date): boolean {
  const dayOfWeek = date.getDay() as DayOfWeek;
  const dayOfMonth = date.getDate();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isWeekday = !isWeekend;
  const { schedule } = routine;

  switch (schedule.frequency) {
    case "daily":
      return true;

    case "weekdays":
      return isWeekday;

    case "weekends":
      return isWeekend;

    case "weekly":
      if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        return schedule.daysOfWeek.includes(dayOfWeek);
      }
      return true;

    case "biweekly":
      if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        return schedule.daysOfWeek.includes(dayOfWeek);
      }
      return false;

    case "monthly":
      return schedule.dayOfMonth === dayOfMonth;

    case "custom":
      if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        return schedule.daysOfWeek.includes(dayOfWeek);
      }
      return false;

    default:
      return false;
  }
}

// Get routines due today (legacy - no day type filtering)
export function getRoutinesDueToday(routines: Routine[], date: Date = new Date()): Routine[] {
  return routines.filter((routine) => {
    if (routine.status !== "active") return false;
    return matchesFrequency(routine, date);
  });
}

// Get routines due today with day type filtering
// This is the primary function to use when smart scheduling is enabled
// Accepts single dayType for backward compatibility, or array of dayTypes for multi-type days
export function getRoutinesDueTodayWithDayType(
  routines: Routine[],
  dayType: DayType | DayType[],
  date: Date = new Date()
): Routine[] {
  // Normalize to array for consistent handling
  const dayTypes = Array.isArray(dayType) ? dayType : [dayType];

  return routines.filter((routine) => {
    if (routine.status !== "active") return false;

    // Check frequency match first
    if (!matchesFrequency(routine, date)) return false;

    // If routine has no dayTypes set, it applies to ALL day types (backward compatible)
    if (!routine.dayTypes || routine.dayTypes.length === 0) {
      return true;
    }

    // Check if ANY of the routine's dayTypes matches ANY of the day's dayTypes
    return routine.dayTypes.some(rt => dayTypes.includes(rt));
  });
}

// Get the effective schedule for a routine on a specific day type
// Returns the base schedule with any day type overrides applied
export function getEffectiveSchedule(
  routine: Routine,
  dayType: DayType
): RoutineSchedule {
  const baseSchedule = routine.schedule;

  // If no overrides, return base schedule
  if (!routine.dayTypeScheduleOverrides || !routine.dayTypeScheduleOverrides[dayType]) {
    return baseSchedule;
  }

  const override = routine.dayTypeScheduleOverrides[dayType];

  return {
    ...baseSchedule,
    timeOfDay: override.timeOfDay ?? baseSchedule.timeOfDay,
    specificTime: override.specificTime ?? baseSchedule.specificTime,
  };
}

// Get schedule description
export function getScheduleDescription(schedule: RoutineSchedule): string {
  const { frequency, daysOfWeek, dayOfMonth, timeOfDay } = schedule;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const timeLabels: Record<TimeOfDay, string> = {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
    anytime: "Anytime",
  };

  let frequencyStr = "";
  switch (frequency) {
    case "daily":
      frequencyStr = "Daily";
      break;
    case "weekdays":
      frequencyStr = "Weekdays";
      break;
    case "weekends":
      frequencyStr = "Weekends";
      break;
    case "weekly":
      if (daysOfWeek && daysOfWeek.length > 0) {
        frequencyStr = daysOfWeek.map(d => dayNames[d]).join(", ");
      } else {
        frequencyStr = "Weekly";
      }
      break;
    case "biweekly":
      frequencyStr = "Every 2 weeks";
      break;
    case "monthly":
      frequencyStr = dayOfMonth ? `Monthly on the ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}` : "Monthly";
      break;
    case "custom":
      if (daysOfWeek && daysOfWeek.length > 0) {
        frequencyStr = daysOfWeek.map(d => dayNames[d]).join(", ");
      } else {
        frequencyStr = "Custom";
      }
      break;
  }

  return `${frequencyStr} • ${timeLabels[timeOfDay]}`;
}

// Helper for ordinal suffix
function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Sort routines by time of day
export function sortRoutinesByTimeOfDay(routines: Routine[]): Routine[] {
  const timeOrder: TimeOfDay[] = ["morning", "afternoon", "evening", "night", "anytime"];
  return [...routines].sort((a, b) => {
    return timeOrder.indexOf(a.schedule.timeOfDay) - timeOrder.indexOf(b.schedule.timeOfDay);
  });
}
