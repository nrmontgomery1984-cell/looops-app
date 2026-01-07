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
  // =============================================================================
  // DAILY ROUTINES - SOLO DAY
  // =============================================================================

  // Morning Routine - Solo Day (6:00 AM, 95 min)
  {
    id: "morning_me",
    title: "Morning - Me",
    description: "Solo day morning routine starting at 6:00 AM",
    schedule: { frequency: "daily", timeOfDay: "morning", specificTime: "06:00" },
    icon: "🌅",
    tags: ["morning", "daily", "solo"],
    steps: [
      { title: "Hydrate (16oz minimum)", loop: "Health", subLoop: "Nutrition", estimateMinutes: 5, order: 0 },
      { title: "Bathroom", loop: "Maintenance", estimateMinutes: 3, order: 1 },
      { title: "Brush/floss", loop: "Health", estimateMinutes: 5, order: 2 },
      { title: "Make bed, open blinds", loop: "Maintenance", estimateMinutes: 2, order: 3 },
      { title: "Feed cats", loop: "Maintenance", estimateMinutes: 5, order: 4 },
      { title: "Workout (strength or cardio)", loop: "Health", subLoop: "Exercise", estimateMinutes: 45, order: 5 },
      { title: "Post-workout hydration", loop: "Health", subLoop: "Nutrition", estimateMinutes: 3, order: 6 },
      { title: "Meditate", loop: "Health", subLoop: "Mental", estimateMinutes: 10, order: 7, optional: true },
      { title: "Shower and dress", loop: "Maintenance", estimateMinutes: 10, order: 8 },
      { title: "Make cappuccino", loop: "Fun", estimateMinutes: 5, order: 9 },
      { title: "Review daily plan", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 10, optional: true },
    ],
  },

  // After Work Routine - Solo Day (45 min)
  {
    id: "afterwork_me",
    title: "After Work - Me",
    description: "Solo day wind-down after work on workdays",
    schedule: { frequency: "weekdays", timeOfDay: "afternoon" },
    icon: "🏠",
    tags: ["afternoon", "daily", "solo", "workday"],
    steps: [
      { title: "Gear management", loop: "Maintenance", estimateMinutes: 3, order: 0 },
      { title: "Clean containers", loop: "Maintenance", estimateMinutes: 5, order: 1 },
      { title: "Remove boots", loop: "Maintenance", estimateMinutes: 2, order: 2 },
      { title: "Laundry", loop: "Maintenance", estimateMinutes: 3, order: 3 },
      { title: "Wash up", loop: "Health", estimateMinutes: 5, order: 4 },
      { title: "Change clothes", loop: "Maintenance", estimateMinutes: 3, order: 5 },
      { title: "Stretch", loop: "Health", subLoop: "Exercise", estimateMinutes: 5, order: 6 },
      { title: "Hydrate", loop: "Health", subLoop: "Nutrition", estimateMinutes: 2, order: 7 },
      { title: "Message check", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 8 },
      { title: "Work notes", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 9 },
      { title: "Evening planning", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 10 },
    ],
  },

  // Bedtime Routine - Solo Day (9:30 PM, 45 min, lights out 10:00-10:30)
  {
    id: "bedtime_me",
    title: "Bedtime - Me",
    description: "Solo day wind-down routine starting at 9:30 PM, lights out by 10:30",
    schedule: { frequency: "daily", timeOfDay: "night", specificTime: "21:30" },
    icon: "🌙",
    tags: ["evening", "daily", "solo", "sleep"],
    steps: [
      { title: "Phone charging", loop: "Maintenance", estimateMinutes: 2, order: 0 },
      { title: "Tidy space", loop: "Maintenance", estimateMinutes: 10, order: 1 },
      { title: "Prep tomorrow's clothes", loop: "Maintenance", estimateMinutes: 5, order: 2 },
      { title: "Make tea", loop: "Health", estimateMinutes: 5, order: 3 },
      { title: "Hygiene routine", loop: "Health", estimateMinutes: 10, order: 4 },
      { title: "Journaling", loop: "Health", subLoop: "Mental", estimateMinutes: 10, order: 5, optional: true },
      { title: "Reading (no screens)", loop: "Fun", estimateMinutes: 15, order: 6 },
    ],
  },

  // =============================================================================
  // DAILY ROUTINES - GIRLS DAY
  // =============================================================================

  // Morning Routine - Girls Day (6:00 AM, 120 min)
  {
    id: "morning_girls",
    title: "Morning - Girls",
    description: "Daughter's day morning routine - prep before wake-up, girls up at 7:30 AM",
    schedule: { frequency: "daily", timeOfDay: "morning", specificTime: "06:00" },
    icon: "👧",
    tags: ["morning", "daily", "family", "girls"],
    steps: [
      { title: "Hydrate (16oz minimum)", loop: "Health", subLoop: "Nutrition", estimateMinutes: 5, order: 0 },
      { title: "Bathroom", loop: "Maintenance", estimateMinutes: 3, order: 1 },
      { title: "Brush/floss", loop: "Health", estimateMinutes: 5, order: 2 },
      { title: "Make bed, open blinds", loop: "Maintenance", estimateMinutes: 2, order: 3 },
      { title: "Feed cats", loop: "Maintenance", estimateMinutes: 5, order: 4 },
      { title: "Workout (strength or cardio)", loop: "Health", subLoop: "Exercise", estimateMinutes: 45, order: 5 },
      { title: "Post-workout hydration", loop: "Health", subLoop: "Nutrition", estimateMinutes: 3, order: 6 },
      { title: "Shower and dress", loop: "Maintenance", estimateMinutes: 10, order: 7 },
      { title: "Prep breakfast (have ready before wake-up)", loop: "Family", estimateMinutes: 10, order: 8 },
      { title: "Wake girls at 7:30 AM", loop: "Family", estimateMinutes: 5, order: 9 },
      { title: "Breakfast together + vitamins", loop: "Family", estimateMinutes: 15, order: 10 },
      { title: "Help girls get ready (clothes, hair, teeth)", loop: "Family", estimateMinutes: 15, order: 11 },
    ],
  },

  // After Work Routine - Girls Day (75 min)
  {
    id: "afterwork_girls",
    title: "After Work - Girls",
    description: "Daughter's day after-work routine - connection before tasks",
    schedule: { frequency: "weekdays", timeOfDay: "afternoon" },
    icon: "👨‍👧‍👧",
    tags: ["afternoon", "daily", "family", "girls", "workday"],
    steps: [
      { title: "Gear management", loop: "Maintenance", estimateMinutes: 3, order: 0 },
      { title: "Clean containers", loop: "Maintenance", estimateMinutes: 5, order: 1 },
      { title: "Remove boots", loop: "Maintenance", estimateMinutes: 2, order: 2 },
      { title: "Laundry", loop: "Maintenance", estimateMinutes: 3, order: 3 },
      { title: "Wash up", loop: "Health", estimateMinutes: 5, order: 4 },
      { title: "Change clothes", loop: "Maintenance", estimateMinutes: 3, order: 5 },
      { title: "Stretch", loop: "Health", subLoop: "Exercise", estimateMinutes: 5, order: 6 },
      { title: "Hydrate", loop: "Health", subLoop: "Nutrition", estimateMinutes: 2, order: 7 },
      { title: "Check-in conversation (connection before tasks)", loop: "Family", estimateMinutes: 10, order: 8 },
      { title: "Dinner prep", loop: "Maintenance", estimateMinutes: 15, order: 9 },
      { title: "Message check", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 10 },
      { title: "Work notes", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 11 },
      { title: "Evening planning", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 12 },
    ],
  },

  // Bedtime Routine - Girls Day (7:30 PM start, 60 min)
  {
    id: "bedtime_girls",
    title: "Bedtime - Girls",
    description: "Daughter's day bedtime routine starting at 7:30 PM",
    schedule: { frequency: "daily", timeOfDay: "evening", specificTime: "19:30" },
    icon: "🛏️",
    tags: ["evening", "daily", "family", "girls"],
    steps: [
      { title: "Announce routine", loop: "Family", estimateMinutes: 2, order: 0 },
      { title: "Pajamas", loop: "Family", estimateMinutes: 5, order: 1 },
      { title: "Teeth brushing", loop: "Family", estimateMinutes: 5, order: 2 },
      { title: "Pick tomorrow's clothes", loop: "Family", estimateMinutes: 5, order: 3 },
      { title: "Story time", loop: "Family", estimateMinutes: 15, order: 4 },
      { title: "Tuck in", loop: "Family", estimateMinutes: 5, order: 5 },
      { title: "Settling time", loop: "Family", estimateMinutes: 5, order: 6 },
      { title: "Transition to personal time", loop: "Family", estimateMinutes: 5, order: 7 },
    ],
  },

  // =============================================================================
  // WEEKLY ROUTINES
  // =============================================================================

  // Weekly Review - All Loops (Sunday morning, 60 min)
  {
    id: "weekly_review",
    title: "Weekly Review - All Loops",
    description: "Sunday morning review of all life loops",
    schedule: { frequency: "weekly", daysOfWeek: [0], timeOfDay: "morning" },
    icon: "📊",
    tags: ["weekly", "planning", "review", "sunday"],
    steps: [
      { title: "Review Health loop - progress & adjustments", loop: "Health", estimateMinutes: 8, order: 0 },
      { title: "Review Wealth loop - finances & budget", loop: "Wealth", estimateMinutes: 8, order: 1 },
      { title: "Review Family loop - upcoming events & quality time", loop: "Family", estimateMinutes: 8, order: 2 },
      { title: "Review Work loop - projects & priorities", loop: "Work", estimateMinutes: 8, order: 3 },
      { title: "Review Fun loop - activities & balance", loop: "Fun", estimateMinutes: 8, order: 4 },
      { title: "Review Maintenance loop - home & admin", loop: "Maintenance", estimateMinutes: 8, order: 5 },
      { title: "Plan next week's priorities", loop: "Work", subLoop: "Admin", estimateMinutes: 10, order: 6 },
      { title: "Calendar review & scheduling", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 7 },
    ],
  },

  // House Clean - Basic (Weekend, 90 min)
  {
    id: "house_clean_basic",
    title: "House Clean - Basic",
    description: "Weekly basic house cleaning routine",
    schedule: { frequency: "weekly", daysOfWeek: [6], timeOfDay: "anytime" },
    icon: "🧹",
    tags: ["weekly", "cleaning", "maintenance", "weekend"],
    steps: [
      { title: "Declutter surfaces", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 0 },
      { title: "Vacuum all floors", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 20, order: 1 },
      { title: "Mop hard floors", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 15, order: 2 },
      { title: "Clean bathrooms (quick)", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 15, order: 3 },
      { title: "Kitchen wipe-down", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 4 },
      { title: "Take out trash/recycling", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 5, order: 5 },
      { title: "Laundry (wash, dry, fold)", loop: "Maintenance", estimateMinutes: 15, order: 6 },
    ],
  },

  // Detailed Loop Review - Rotating (Midweek evening, 30 min)
  {
    id: "detailed_loop_review",
    title: "Detailed Loop Review (Rotating)",
    description: "Deep dive into one loop each week, rotating through all six",
    schedule: { frequency: "weekly", daysOfWeek: [3], timeOfDay: "evening" },
    icon: "🔍",
    tags: ["weekly", "review", "planning", "midweek"],
    steps: [
      { title: "Select this week's focus loop", loop: "Work", subLoop: "Admin", estimateMinutes: 2, order: 0 },
      { title: "Review loop goals & systems", loop: "Work", subLoop: "Admin", estimateMinutes: 8, order: 1 },
      { title: "Analyze what's working", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 2 },
      { title: "Identify improvements needed", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 3 },
      { title: "Create action items", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 4 },
      { title: "Schedule implementation", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 5 },
    ],
  },

  // =============================================================================
  // MONTHLY ROUTINES
  // =============================================================================

  // Deep Clean - Bathrooms (Monthly, 60 min)
  {
    id: "deep_clean_bathrooms",
    title: "Deep Clean - Bathrooms",
    description: "Monthly deep cleaning of all bathrooms",
    schedule: { frequency: "monthly", dayOfMonth: 1, timeOfDay: "anytime" },
    icon: "🚿",
    tags: ["monthly", "cleaning", "maintenance"],
    steps: [
      { title: "Scrub toilets thoroughly", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 0 },
      { title: "Deep clean shower/tub", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 15, order: 1 },
      { title: "Clean mirrors & glass", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 5, order: 2 },
      { title: "Wipe all surfaces & fixtures", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 3 },
      { title: "Scrub floors", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 4 },
      { title: "Clean exhaust fan", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 5, order: 5 },
      { title: "Restock supplies", loop: "Maintenance", estimateMinutes: 5, order: 6 },
    ],
  },

  // Deep Clean - Kitchen (Monthly, 90 min)
  {
    id: "deep_clean_kitchen",
    title: "Deep Clean - Kitchen",
    description: "Monthly deep cleaning of kitchen",
    schedule: { frequency: "monthly", dayOfMonth: 8, timeOfDay: "anytime" },
    icon: "🍳",
    tags: ["monthly", "cleaning", "maintenance"],
    steps: [
      { title: "Clean inside refrigerator", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 20, order: 0 },
      { title: "Clean oven/stovetop", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 15, order: 1 },
      { title: "Clean microwave", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 5, order: 2 },
      { title: "Wipe cabinet fronts", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 3 },
      { title: "Deep clean sink & disposal", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 4 },
      { title: "Clean backsplash", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 5 },
      { title: "Scrub floors", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 15, order: 6 },
      { title: "Clean trash cans", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 5, order: 7 },
    ],
  },

  // Deep Clean - Public Spaces (Monthly, 75 min)
  {
    id: "deep_clean_public",
    title: "Deep Clean - Public Spaces",
    description: "Monthly deep cleaning of living room, dining room, entry",
    schedule: { frequency: "monthly", dayOfMonth: 15, timeOfDay: "anytime" },
    icon: "🛋️",
    tags: ["monthly", "cleaning", "maintenance"],
    steps: [
      { title: "Dust all surfaces & shelves", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 15, order: 0 },
      { title: "Clean windows (interior)", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 15, order: 1 },
      { title: "Vacuum upholstery", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 2 },
      { title: "Clean light fixtures", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 3 },
      { title: "Wipe baseboards", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 4 },
      { title: "Deep vacuum/mop floors", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 15, order: 5 },
    ],
  },

  // Deep Clean - Private Spaces (Monthly, 60 min)
  {
    id: "deep_clean_private",
    title: "Deep Clean - Private Spaces",
    description: "Monthly deep cleaning of bedrooms and office",
    schedule: { frequency: "monthly", dayOfMonth: 22, timeOfDay: "anytime" },
    icon: "🛏️",
    tags: ["monthly", "cleaning", "maintenance"],
    steps: [
      { title: "Dust all surfaces", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 0 },
      { title: "Wash bedding", loop: "Maintenance", estimateMinutes: 10, order: 1 },
      { title: "Vacuum mattress", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 5, order: 2 },
      { title: "Clean under beds", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 3 },
      { title: "Organize closets (quick)", loop: "Maintenance", estimateMinutes: 10, order: 4 },
      { title: "Vacuum/mop floors", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 5 },
      { title: "Wipe light switches & door handles", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 5, order: 6 },
    ],
  },

  // Clean Vehicle (Monthly, 45 min)
  {
    id: "clean_vehicle",
    title: "Clean - Vehicle",
    description: "Monthly vehicle cleaning inside and out",
    schedule: { frequency: "monthly", dayOfMonth: 28, timeOfDay: "anytime" },
    icon: "🚗",
    tags: ["monthly", "cleaning", "maintenance"],
    steps: [
      { title: "Remove trash & items", loop: "Maintenance", estimateMinutes: 5, order: 0 },
      { title: "Vacuum interior", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 1 },
      { title: "Wipe dashboard & surfaces", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 2 },
      { title: "Clean windows (inside)", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 5, order: 3 },
      { title: "Wash exterior (or car wash)", loop: "Maintenance", estimateMinutes: 15, order: 4 },
    ],
  },

  // =============================================================================
  // SEASONAL ROUTINES (Quarterly)
  // =============================================================================

  // Stock Pantry (Seasonal, 120 min)
  {
    id: "stock_pantry",
    title: "Stock Pantry",
    description: "Quarterly pantry inventory and restocking",
    schedule: { frequency: "monthly", dayOfMonth: 1, timeOfDay: "anytime" },
    icon: "🥫",
    tags: ["seasonal", "quarterly", "maintenance", "shopping"],
    steps: [
      { title: "Take inventory of current stock", loop: "Maintenance", estimateMinutes: 20, order: 0 },
      { title: "Check expiration dates", loop: "Maintenance", estimateMinutes: 15, order: 1 },
      { title: "Remove expired items", loop: "Maintenance", estimateMinutes: 5, order: 2 },
      { title: "Create shopping list", loop: "Maintenance", subLoop: "Shopping", estimateMinutes: 15, order: 3 },
      { title: "Shop for staples", loop: "Maintenance", subLoop: "Shopping", estimateMinutes: 45, order: 4 },
      { title: "Organize & stock pantry", loop: "Maintenance", estimateMinutes: 20, order: 5 },
    ],
  },

  // Stock Freezer (Seasonal, 180 min)
  {
    id: "stock_freezer",
    title: "Stock Freezer",
    description: "Quarterly freezer organization and bulk meal prep",
    schedule: { frequency: "monthly", dayOfMonth: 1, timeOfDay: "anytime" },
    icon: "🧊",
    tags: ["seasonal", "quarterly", "maintenance", "meal-prep"],
    steps: [
      { title: "Empty & defrost freezer", loop: "Maintenance", estimateMinutes: 30, order: 0 },
      { title: "Take inventory", loop: "Maintenance", estimateMinutes: 15, order: 1 },
      { title: "Discard old/freezer-burned items", loop: "Maintenance", estimateMinutes: 10, order: 2 },
      { title: "Plan bulk meals to prep", loop: "Health", subLoop: "Nutrition", estimateMinutes: 15, order: 3 },
      { title: "Shop for ingredients", loop: "Maintenance", subLoop: "Shopping", estimateMinutes: 45, order: 4 },
      { title: "Batch cook & portion meals", loop: "Maintenance", estimateMinutes: 45, order: 5 },
      { title: "Label & organize freezer", loop: "Maintenance", estimateMinutes: 20, order: 6 },
    ],
  },

  // Organize/Purge Closets (Seasonal, 120 min)
  {
    id: "organize_closets",
    title: "Organize/Purge - Closets",
    description: "Quarterly closet declutter and seasonal rotation",
    schedule: { frequency: "monthly", dayOfMonth: 1, timeOfDay: "anytime" },
    icon: "👕",
    tags: ["seasonal", "quarterly", "organizing", "maintenance"],
    steps: [
      { title: "Pull everything out", loop: "Maintenance", estimateMinutes: 15, order: 0 },
      { title: "Sort: keep, donate, trash", loop: "Maintenance", estimateMinutes: 30, order: 1 },
      { title: "Clean closet space", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 2 },
      { title: "Rotate seasonal items", loop: "Maintenance", estimateMinutes: 15, order: 3 },
      { title: "Organize by category", loop: "Maintenance", estimateMinutes: 20, order: 4 },
      { title: "Bag donations", loop: "Maintenance", estimateMinutes: 10, order: 5 },
      { title: "Schedule donation drop-off", loop: "Maintenance", estimateMinutes: 5, order: 6 },
      { title: "Update wardrobe needs list", loop: "Maintenance", estimateMinutes: 15, order: 7 },
    ],
  },

  // Organize/Purge Kitchen (Seasonal, 90 min)
  {
    id: "organize_kitchen",
    title: "Organize/Purge - Kitchen",
    description: "Quarterly kitchen organization and declutter",
    schedule: { frequency: "monthly", dayOfMonth: 1, timeOfDay: "anytime" },
    icon: "🍴",
    tags: ["seasonal", "quarterly", "organizing", "maintenance"],
    steps: [
      { title: "Empty cabinets one-by-one", loop: "Maintenance", estimateMinutes: 15, order: 0 },
      { title: "Purge unused items", loop: "Maintenance", estimateMinutes: 20, order: 1 },
      { title: "Clean cabinet interiors", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 15, order: 2 },
      { title: "Reorganize by frequency of use", loop: "Maintenance", estimateMinutes: 20, order: 3 },
      { title: "Check small appliances", loop: "Maintenance", estimateMinutes: 10, order: 4 },
      { title: "Update kitchen needs list", loop: "Maintenance", estimateMinutes: 10, order: 5 },
    ],
  },

  // Organize/Purge Office (Seasonal, 90 min)
  {
    id: "organize_office",
    title: "Organize/Purge - Office",
    description: "Quarterly office declutter and paper purge",
    schedule: { frequency: "monthly", dayOfMonth: 1, timeOfDay: "anytime" },
    icon: "📁",
    tags: ["seasonal", "quarterly", "organizing", "maintenance"],
    steps: [
      { title: "Clear desk completely", loop: "Maintenance", estimateMinutes: 10, order: 0 },
      { title: "Sort papers: file, scan, shred", loop: "Maintenance", estimateMinutes: 25, order: 1 },
      { title: "Purge old files", loop: "Maintenance", estimateMinutes: 15, order: 2 },
      { title: "Organize supplies", loop: "Maintenance", estimateMinutes: 10, order: 3 },
      { title: "Clean electronics & screens", loop: "Maintenance", subLoop: "Cleaning", estimateMinutes: 10, order: 4 },
      { title: "Update digital file organization", loop: "Work", subLoop: "Admin", estimateMinutes: 15, order: 5 },
      { title: "Backup important files", loop: "Work", subLoop: "Admin", estimateMinutes: 5, order: 6 },
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
