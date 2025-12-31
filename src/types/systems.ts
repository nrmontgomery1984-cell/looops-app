// Systems, Habits, and Implementation Intentions
// Inspired by behavior change research - built for Looops

import { LoopId } from "./loops";
import { DayType } from "./dayTypes";

// =============================================================================
// IDENTITY - Who you want to become
// =============================================================================

export interface Identity {
  id: string;
  statement: string; // "I am a person who prioritizes their health"
  loop: LoopId;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// HABITS - The atomic units of behavior change
// =============================================================================

export type HabitFrequency = "daily" | "weekdays" | "weekends" | "weekly" | "custom";

export type HabitType = "build" | "break"; // Building good habits or breaking bad ones

export type HabitTimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

export interface HabitCue {
  type: "time" | "location" | "preceding_action" | "emotional_state";
  value: string; // "7:00 AM", "Kitchen", "After morning coffee", "When stressed"
}

// Day type time override for habits - different times for different day types
export interface HabitDayTypeOverride {
  timeOfDay?: HabitTimeOfDay;
  cueValue?: string; // Override the cue value for this day type
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  loop: LoopId;
  type: HabitType;

  // The 4 Laws
  cue: HabitCue; // Make it obvious
  craving?: string; // Make it attractive - why you want this
  response: string; // Make it easy - the actual behavior (2-minute version)
  reward?: string; // Make it satisfying - immediate reward

  // Scheduling
  frequency: HabitFrequency;
  customDays?: number[]; // 0-6, Sunday-Saturday for custom frequency
  timeOfDay?: HabitTimeOfDay;

  // Day type filtering - which day types this habit applies to
  // If undefined or empty, habit applies to ALL day types (backward compatible)
  dayTypes?: DayType[];

  // Day type schedule overrides - different times for different day types
  dayTypeOverrides?: Partial<Record<DayType, HabitDayTypeOverride>>;

  // Habit stacking
  stackedAfter?: string; // ID of another habit this comes after
  stackedBefore?: string; // ID of another habit this comes before

  // Tracking
  streak: number;
  longestStreak: number;
  totalCompletions: number;

  // System linkage
  systemId?: string; // Part of a larger system

  // Status
  status: "active" | "paused" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: string;
  date: string; // YYYY-MM-DD for easy grouping
  notes?: string;
  difficulty?: 1 | 2 | 3 | 4 | 5; // How hard was it today?
}

// =============================================================================
// IMPLEMENTATION INTENTIONS - Making habits concrete
// =============================================================================

export type IntentionTrigger = "time" | "location" | "action" | "event";

export interface ImplementationIntention {
  id: string;

  // Core intention: "I will [behavior] at [time] in [location]"
  behavior: string;
  when: {
    type: "specific_time" | "time_of_day" | "after_action" | "before_action";
    value: string; // "7:00 AM", "morning", "after dropping kids at school"
  };
  where: string; // "at home gym", "at Riverside Park", "in the kitchen"

  // Obstacle planning: "If [obstacle], then [alternative]"
  obstacles: Array<{
    obstacle: string;
    alternative: string;
  }>;

  // Linkage
  taskId?: string;
  habitId?: string;

  // Tracking
  timesUsed: number;
  timesSucceeded: number;

  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// SYSTEMS - The framework connecting identity to habits
// =============================================================================

export type SystemStatus = "active" | "paused" | "completed" | "archived";

export interface SystemMetric {
  id: string;
  name: string;
  unit: string; // "lbs", "minutes", "$", etc.
  target?: number;
  currentValue?: number;
  entries: Array<{
    date: string;
    value: number;
  }>;
}

export interface EnvironmentTweak {
  id: string;
  description: string;
  type: "add" | "remove" | "modify"; // Add cue, remove friction, modify space
  completed: boolean;
  completedAt?: string;
}

export interface System {
  id: string;
  title: string;
  description?: string;
  loop: LoopId;

  // The goal this system serves
  goalStatement: string; // "Lose 20 pounds"
  linkedGoalId?: string; // Optional link to a Goal object

  // Identity layer
  identity: Identity;

  // Habits that make up this system
  habitIds: string[];

  // Environment design
  environmentTweaks: EnvironmentTweak[];

  // Metrics to track progress
  metrics: SystemMetric[];

  // Common obstacles and solutions (for this specific system)
  obstaclePlaybook: Array<{
    obstacle: string;
    solution: string;
  }>;

  // Status and tracking
  status: SystemStatus;
  healthScore?: number; // 0-100, calculated from habit adherence
  startedAt: string;
  targetDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// SYSTEM TEMPLATES - Pre-built systems for common goals
// =============================================================================

export interface SystemTemplate {
  id: string;
  title: string;
  description: string;
  loop: LoopId;
  category: string; // "weight_loss", "fitness", "finance", etc.

  // Template content
  goalPrompt: string; // "How much weight do you want to lose?"
  identityTemplate: string; // "I am a person who ${response}"

  suggestedHabits: Array<{
    title: string;
    description: string;
    cue: HabitCue;
    response: string;
    reward?: string;
    frequency: HabitFrequency;
    timeOfDay?: "morning" | "afternoon" | "evening" | "anytime";
  }>;

  suggestedEnvironmentTweaks: Array<{
    description: string;
    type: "add" | "remove" | "modify";
  }>;

  suggestedMetrics: Array<{
    name: string;
    unit: string;
  }>;

  commonObstacles: Array<{
    obstacle: string;
    solution: string;
  }>;

  // Metadata
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: string; // "30 days", "90 days", "ongoing"
  tags: string[];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function calculateStreak(completions: HabitCompletion[], frequency: HabitFrequency): number {
  if (completions.length === 0) return 0;

  const sortedDates = completions
    .map(c => c.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Must have completed today or yesterday to have an active streak
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(sortedDates[0]);

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate);

    if (frequency === "daily") {
      prevDate.setDate(prevDate.getDate() - 1);
    } else if (frequency === "weekdays") {
      // Skip weekends when counting streak
      do {
        prevDate.setDate(prevDate.getDate() - 1);
      } while (prevDate.getDay() === 0 || prevDate.getDay() === 6);
    } else if (frequency === "weekends") {
      // Skip weekdays when counting streak
      do {
        prevDate.setDate(prevDate.getDate() - 1);
      } while (prevDate.getDay() !== 0 && prevDate.getDay() !== 6);
    } else if (frequency === "weekly") {
      prevDate.setDate(prevDate.getDate() - 7);
    }

    const expectedDate = prevDate.toISOString().split("T")[0];

    if (sortedDates[i] === expectedDate) {
      streak++;
      currentDate = new Date(sortedDates[i]);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateSystemHealth(system: System, habits: Habit[], completions: HabitCompletion[]): number {
  if (habits.length === 0) return 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split("T")[0];
  });

  let totalExpected = 0;
  let totalCompleted = 0;

  habits.forEach(habit => {
    if (habit.status !== "active") return;

    last7Days.forEach(date => {
      const dayOfWeek = new Date(date).getDay();
      let shouldComplete = false;

      if (habit.frequency === "daily") {
        shouldComplete = true;
      } else if (habit.frequency === "weekdays") {
        shouldComplete = dayOfWeek !== 0 && dayOfWeek !== 6;
      } else if (habit.frequency === "weekends") {
        shouldComplete = dayOfWeek === 0 || dayOfWeek === 6;
      } else if (habit.frequency === "weekly") {
        // Assume any day is valid for weekly
        shouldComplete = dayOfWeek === 1; // Just count Mondays
      }

      if (shouldComplete) {
        totalExpected++;
        const wasCompleted = completions.some(
          c => c.habitId === habit.id && c.date === date
        );
        if (wasCompleted) {
          totalCompleted++;
        }
      }
    });
  });

  if (totalExpected === 0) return 100;
  return Math.round((totalCompleted / totalExpected) * 100);
}

export function formatIntention(intention: ImplementationIntention): string {
  return `I will ${intention.behavior} ${intention.when.value} ${intention.where}`;
}

// Check if habit matches frequency for the given date
function habitMatchesFrequency(habit: Habit, date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay();

  switch (habit.frequency) {
    case "daily":
      return true;
    case "weekdays":
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    case "weekends":
      return dayOfWeek === 0 || dayOfWeek === 6;
    case "weekly":
      return true; // Show weekly habits every day, user decides when
    case "custom":
      return habit.customDays?.includes(dayOfWeek) ?? false;
    default:
      return false;
  }
}

// Legacy function - no day type filtering
export function getHabitsDueToday(habits: Habit[]): Habit[] {
  return habits.filter(habit => {
    if (habit.status !== "active") return false;
    return habitMatchesFrequency(habit);
  });
}

// Get habits due today with day type filtering
// This is the primary function to use when smart scheduling is enabled
// Accepts single dayType for backward compatibility, or array of dayTypes for multi-type days
export function getHabitsDueTodayWithDayType(
  habits: Habit[],
  dayType: DayType | DayType[],
  date: Date = new Date()
): Habit[] {
  // Normalize to array for consistent handling
  const dayTypes = Array.isArray(dayType) ? dayType : [dayType];

  return habits.filter(habit => {
    if (habit.status !== "active") return false;

    // Check frequency match first
    if (!habitMatchesFrequency(habit, date)) return false;

    // If habit has no dayTypes set, it applies to ALL day types (backward compatible)
    if (!habit.dayTypes || habit.dayTypes.length === 0) {
      return true;
    }

    // Check if ANY of the habit's dayTypes matches ANY of the day's dayTypes
    return habit.dayTypes.some(ht => dayTypes.includes(ht));
  });
}

// Get the effective time of day for a habit on a specific day type
export function getEffectiveHabitTimeOfDay(
  habit: Habit,
  dayType: DayType
): HabitTimeOfDay | undefined {
  // If no overrides, return base time
  if (!habit.dayTypeOverrides || !habit.dayTypeOverrides[dayType]) {
    return habit.timeOfDay;
  }

  const override = habit.dayTypeOverrides[dayType];
  return override.timeOfDay ?? habit.timeOfDay;
}

// Get the effective cue value for a habit on a specific day type
export function getEffectiveHabitCue(
  habit: Habit,
  dayType: DayType
): HabitCue {
  // If no overrides, return base cue
  if (!habit.dayTypeOverrides || !habit.dayTypeOverrides[dayType]) {
    return habit.cue;
  }

  const override = habit.dayTypeOverrides[dayType];
  if (!override.cueValue) {
    return habit.cue;
  }

  return {
    ...habit.cue,
    value: override.cueValue,
  };
}

// =============================================================================
// DEFAULT SYSTEM TEMPLATES
// =============================================================================

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  // HEALTH TEMPLATES
  {
    id: "tpl_weight_loss",
    title: "Sustainable Weight Loss",
    description: "A system for losing weight through small, consistent habits rather than extreme diets.",
    loop: "Health",
    category: "weight_loss",
    goalPrompt: "How much weight would you like to lose?",
    identityTemplate: "I am a person who makes healthy choices and respects my body",
    difficulty: "beginner",
    estimatedDuration: "90 days",
    tags: ["weight", "nutrition", "exercise"],
    suggestedHabits: [
      {
        title: "Track what I eat",
        description: "Log meals without judgment - awareness comes first",
        cue: { type: "time", value: "After each meal" },
        response: "Open app and log what I just ate (2 min)",
        reward: "Check off another logged meal",
        frequency: "daily",
        timeOfDay: "anytime",
      },
      {
        title: "Move for 10 minutes",
        description: "Any movement counts - walk, stretch, dance",
        cue: { type: "time", value: "Morning" },
        response: "Put on shoes and move for just 10 minutes",
        reward: "Energy boost and accomplishment",
        frequency: "daily",
        timeOfDay: "morning",
      },
      {
        title: "Drink water before meals",
        description: "Hydration helps with hunger signals",
        cue: { type: "preceding_action", value: "Before sitting down to eat" },
        response: "Drink a full glass of water",
        reward: "Feeling refreshed",
        frequency: "daily",
        timeOfDay: "anytime",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Keep a water bottle visible on your desk", type: "add" },
      { description: "Put walking shoes by the door", type: "add" },
      { description: "Remove visible junk food from kitchen counter", type: "remove" },
      { description: "Use smaller plates for meals", type: "modify" },
    ],
    suggestedMetrics: [
      { name: "Weight", unit: "lbs" },
      { name: "Daily steps", unit: "steps" },
      { name: "Water intake", unit: "glasses" },
    ],
    commonObstacles: [
      { obstacle: "I don't have time to exercise", solution: "Start with just 2 minutes. Motion creates motivation." },
      { obstacle: "I ate something unhealthy", solution: "One meal doesn't define you. Log it and move on - no guilt spiral." },
      { obstacle: "I'm not seeing results", solution: "Focus on the habits, not the scale. Trust the process for 30 days." },
    ],
  },
  {
    id: "tpl_morning_routine",
    title: "Energizing Morning Routine",
    description: "Start each day with intention and energy through a simple morning ritual.",
    loop: "Health",
    category: "routine",
    goalPrompt: "What do you want to feel by mid-morning?",
    identityTemplate: "I am a person who wins the morning",
    difficulty: "beginner",
    estimatedDuration: "30 days",
    tags: ["morning", "routine", "energy"],
    suggestedHabits: [
      {
        title: "No phone for first 30 minutes",
        description: "Protect your attention before the world demands it",
        cue: { type: "time", value: "Upon waking" },
        response: "Leave phone charging in another room overnight",
        reward: "Peaceful, focused start",
        frequency: "daily",
        timeOfDay: "morning",
      },
      {
        title: "Hydrate immediately",
        description: "Your body is dehydrated after sleep",
        cue: { type: "preceding_action", value: "After getting out of bed" },
        response: "Drink glass of water kept on nightstand",
        reward: "Feeling awake and refreshed",
        frequency: "daily",
        timeOfDay: "morning",
      },
      {
        title: "5-minute movement",
        description: "Wake up your body with gentle movement",
        cue: { type: "preceding_action", value: "After drinking water" },
        response: "Do 5 minutes of stretching or yoga",
        reward: "Body feels loose and ready",
        frequency: "daily",
        timeOfDay: "morning",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Phone charges in another room, not bedroom", type: "modify" },
      { description: "Water glass on nightstand before bed", type: "add" },
      { description: "Yoga mat visible in bedroom", type: "add" },
    ],
    suggestedMetrics: [
      { name: "Wake-up time", unit: "time" },
      { name: "Energy level (1-10)", unit: "rating" },
    ],
    commonObstacles: [
      { obstacle: "I hit snooze repeatedly", solution: "Put alarm across the room. Once you're up, you're up." },
      { obstacle: "I need my phone for alarm", solution: "Buy a $10 alarm clock. It's worth it." },
      { obstacle: "I don't have time in the morning", solution: "Wake up 15 minutes earlier. Start with just the water habit." },
    ],
  },
  {
    id: "tpl_better_sleep",
    title: "Better Sleep System",
    description: "Improve sleep quality through evening habits and environment optimization.",
    loop: "Health",
    category: "sleep",
    goalPrompt: "How many hours of quality sleep do you want?",
    identityTemplate: "I am a person who prioritizes rest and recovery",
    difficulty: "beginner",
    estimatedDuration: "21 days",
    tags: ["sleep", "evening", "recovery"],
    suggestedHabits: [
      {
        title: "Screen-free wind-down",
        description: "No screens 30 minutes before bed",
        cue: { type: "time", value: "30 minutes before target bedtime" },
        response: "Put phone on charger in another room, read or journal instead",
        reward: "Calm mind, easier sleep onset",
        frequency: "daily",
        timeOfDay: "evening",
      },
      {
        title: "Consistent bedtime",
        description: "Same bedtime within 30-minute window",
        cue: { type: "time", value: "Target bedtime" },
        response: "Be in bed with lights out",
        reward: "Well-rested tomorrow",
        frequency: "daily",
        timeOfDay: "evening",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Blackout curtains in bedroom", type: "add" },
      { description: "Remove TV from bedroom", type: "remove" },
      { description: "Keep bedroom cool (65-68°F)", type: "modify" },
      { description: "Phone charges outside bedroom", type: "modify" },
    ],
    suggestedMetrics: [
      { name: "Hours slept", unit: "hours" },
      { name: "Sleep quality (1-10)", unit: "rating" },
      { name: "Bedtime", unit: "time" },
    ],
    commonObstacles: [
      { obstacle: "I can't fall asleep", solution: "If not asleep in 20 min, get up and read until drowsy. Don't force it." },
      { obstacle: "I need to check my phone", solution: "Ask: 'Will this matter at 7am?' It won't. It can wait." },
      { obstacle: "My mind races at night", solution: "Keep a notepad by bed. Write worries down to address tomorrow." },
    ],
  },

  // WEALTH TEMPLATES
  {
    id: "tpl_emergency_fund",
    title: "Build Emergency Fund",
    description: "Create financial peace of mind with a consistent saving habit.",
    loop: "Wealth",
    category: "saving",
    goalPrompt: "What's your emergency fund target? (typically 3-6 months expenses)",
    identityTemplate: "I am a person who pays myself first",
    difficulty: "beginner",
    estimatedDuration: "ongoing",
    tags: ["saving", "emergency", "security"],
    suggestedHabits: [
      {
        title: "Weekly money review",
        description: "10 minutes reviewing spending and progress",
        cue: { type: "time", value: "Sunday evening" },
        response: "Open accounts, review week's spending, check fund progress",
        reward: "Financial clarity and control",
        frequency: "weekly",
        timeOfDay: "evening",
      },
      {
        title: "Auto-transfer check",
        description: "Verify automatic savings are happening",
        cue: { type: "preceding_action", value: "Day after payday" },
        response: "Confirm transfer to savings went through",
        reward: "Watching the fund grow",
        frequency: "weekly",
        timeOfDay: "anytime",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Set up automatic transfer on payday", type: "add" },
      { description: "Name savings account 'Emergency Fund' or 'Peace of Mind'", type: "modify" },
      { description: "Remove saved payment methods from shopping sites", type: "remove" },
    ],
    suggestedMetrics: [
      { name: "Emergency fund balance", unit: "$" },
      { name: "Monthly savings rate", unit: "%" },
    ],
    commonObstacles: [
      { obstacle: "I don't have money left to save", solution: "Start with $5/week. Automate it. You won't miss it." },
      { obstacle: "I keep dipping into savings", solution: "Move it to a separate bank. Add friction." },
      { obstacle: "Saving feels pointless with small amounts", solution: "Track the total. $20/week = $1,040/year. It adds up." },
    ],
  },

  // FAMILY TEMPLATES
  {
    id: "tpl_quality_time",
    title: "Quality Family Time",
    description: "Be more present and connected with family through intentional habits.",
    loop: "Family",
    category: "connection",
    goalPrompt: "Who do you want to be more connected with?",
    identityTemplate: "I am a person who prioritizes the people I love",
    difficulty: "beginner",
    estimatedDuration: "ongoing",
    tags: ["family", "connection", "presence"],
    suggestedHabits: [
      {
        title: "Phone-free dinner",
        description: "Be fully present during family meals",
        cue: { type: "location", value: "Dining table" },
        response: "Put phone in another room before sitting down",
        reward: "Real conversations and connection",
        frequency: "daily",
        timeOfDay: "evening",
      },
      {
        title: "Weekly one-on-one",
        description: "Dedicated time with each family member",
        cue: { type: "time", value: "Weekend" },
        response: "15+ minutes of undivided attention per person",
        reward: "Deeper relationships",
        frequency: "weekly",
        timeOfDay: "anytime",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Phone basket/box at entrance or dining room", type: "add" },
      { description: "Calendar blocking for family time", type: "add" },
      { description: "TV off during meals", type: "modify" },
    ],
    suggestedMetrics: [
      { name: "Quality time minutes", unit: "min" },
      { name: "Phone-free meals", unit: "count" },
    ],
    commonObstacles: [
      { obstacle: "Work always interrupts", solution: "Set boundaries. Turn on Do Not Disturb. Work will survive." },
      { obstacle: "Kids are distracted too", solution: "Lead by example. It takes time but they'll follow." },
      { obstacle: "We don't know what to talk about", solution: "Try conversation cards or 'high/low' of the day." },
    ],
  },

  // WORK TEMPLATES
  {
    id: "tpl_deep_work",
    title: "Deep Work System",
    description: "Protect focused time for your most important work.",
    loop: "Work",
    category: "productivity",
    goalPrompt: "How many hours of deep work per day do you want?",
    identityTemplate: "I am a person who protects my focus",
    difficulty: "intermediate",
    estimatedDuration: "30 days",
    tags: ["focus", "productivity", "deep work"],
    suggestedHabits: [
      {
        title: "Morning focus block",
        description: "90 minutes of uninterrupted deep work",
        cue: { type: "time", value: "Start of workday" },
        response: "Phone away, notifications off, work on ONE thing",
        reward: "Major progress on important work",
        frequency: "weekdays",
        timeOfDay: "morning",
      },
      {
        title: "End-of-day shutdown",
        description: "Clear capture and tomorrow planning",
        cue: { type: "time", value: "End of workday" },
        response: "Write tomorrow's MIT, clear inbox to zero, say 'shutdown complete'",
        reward: "Mental freedom in evening",
        frequency: "weekdays",
        timeOfDay: "evening",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Block distracting sites during focus hours", type: "add" },
      { description: "Noise-canceling headphones at desk", type: "add" },
      { description: "Close email app during focus blocks", type: "remove" },
      { description: "Put phone in drawer during deep work", type: "modify" },
    ],
    suggestedMetrics: [
      { name: "Deep work hours", unit: "hours" },
      { name: "Tasks completed", unit: "count" },
    ],
    commonObstacles: [
      { obstacle: "Meetings fill my calendar", solution: "Block focus time first. Treat it as unmovable." },
      { obstacle: "I get interrupted constantly", solution: "Communicate boundaries. Use a 'focus' signal (headphones, sign)." },
      { obstacle: "I can't focus for 90 minutes", solution: "Start with 25 minutes (Pomodoro). Build up gradually." },
    ],
  },

  // FUN TEMPLATES
  {
    id: "tpl_reading_habit",
    title: "Read More Books",
    description: "Build a sustainable reading habit without pressure.",
    loop: "Fun",
    category: "reading",
    goalPrompt: "How many books do you want to read this year?",
    identityTemplate: "I am a reader",
    difficulty: "beginner",
    estimatedDuration: "ongoing",
    tags: ["reading", "learning", "relaxation"],
    suggestedHabits: [
      {
        title: "Read before bed",
        description: "Replace scrolling with reading",
        cue: { type: "preceding_action", value: "After getting into bed" },
        response: "Read for at least 10 minutes (or 1 chapter)",
        reward: "Better sleep, great stories",
        frequency: "daily",
        timeOfDay: "evening",
      },
      {
        title: "Always have a book",
        description: "Carry a book or e-reader everywhere",
        cue: { type: "location", value: "Leaving the house" },
        response: "Check: keys, wallet, phone, book",
        reward: "Reading during wait times",
        frequency: "daily",
        timeOfDay: "anytime",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Book on nightstand instead of phone", type: "modify" },
      { description: "E-reader in bag always", type: "add" },
      { description: "Uninstall social media apps", type: "remove" },
      { description: "Join library for free books", type: "add" },
    ],
    suggestedMetrics: [
      { name: "Books completed", unit: "books" },
      { name: "Pages read", unit: "pages" },
      { name: "Reading minutes", unit: "min" },
    ],
    commonObstacles: [
      { obstacle: "I don't have time to read", solution: "10 minutes = 20 books/year. You have 10 minutes." },
      { obstacle: "I keep abandoning books", solution: "Give yourself permission to quit. Life's too short for bad books." },
      { obstacle: "I fall asleep when I read", solution: "That's a feature, not a bug. Better than phone-induced insomnia." },
    ],
  },

  // MAINTENANCE TEMPLATES
  {
    id: "tpl_weekly_reset",
    title: "Weekly Reset Routine",
    description: "Stay on top of life admin with a weekly maintenance session.",
    loop: "Maintenance",
    category: "organization",
    goalPrompt: "What areas of life admin stress you most?",
    identityTemplate: "I am a person who stays ahead of life's details",
    difficulty: "beginner",
    estimatedDuration: "ongoing",
    tags: ["organization", "maintenance", "review"],
    suggestedHabits: [
      {
        title: "Weekly review",
        description: "30 minutes to review and plan the week",
        cue: { type: "time", value: "Sunday afternoon" },
        response: "Review calendar, clear inbox, plan priorities",
        reward: "Starting Monday in control",
        frequency: "weekly",
        timeOfDay: "afternoon",
      },
      {
        title: "Daily tidy",
        description: "10-minute reset of main living space",
        cue: { type: "time", value: "After dinner" },
        response: "Set timer, tidy main areas for 10 minutes",
        reward: "Waking up to clean space",
        frequency: "daily",
        timeOfDay: "evening",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Inbox/landing zone by front door", type: "add" },
      { description: "Every item has a home", type: "modify" },
      { description: "Donate/trash bags accessible in closet", type: "add" },
    ],
    suggestedMetrics: [
      { name: "Weekly reviews completed", unit: "count" },
      { name: "Inbox zero days", unit: "days" },
    ],
    commonObstacles: [
      { obstacle: "Sunday review feels like work", solution: "Make it enjoyable: coffee, music, nice space. It's self-care." },
      { obstacle: "My space gets messy too fast", solution: "Focus on high-impact areas only. Perfect is the enemy of good." },
      { obstacle: "I forget to do the review", solution: "Calendar block it. Treat it as non-negotiable appointment with yourself." },
    ],
  },

  // MEANING TEMPLATES
  {
    id: "tpl_daily_reflection",
    title: "Daily Reflection Practice",
    description: "End each day with intentional reflection to build self-awareness and find meaning.",
    loop: "Meaning",
    category: "reflection",
    goalPrompt: "What aspect of your life do you want more clarity on?",
    identityTemplate: "I am a person who lives intentionally and learns from each day",
    difficulty: "beginner",
    estimatedDuration: "ongoing",
    tags: ["reflection", "journaling", "awareness"],
    suggestedHabits: [
      {
        title: "Evening reflection",
        description: "5 minutes to reflect on the day",
        cue: { type: "time", value: "Before bed" },
        response: "Write 3 things: What went well? What did I learn? What will I do differently?",
        reward: "Peace of mind and continuous growth",
        frequency: "daily",
        timeOfDay: "evening",
      },
      {
        title: "Intention setting",
        description: "Start with a clear intention for the day",
        cue: { type: "preceding_action", value: "After morning coffee/tea" },
        response: "Write one sentence: 'Today I will focus on...'",
        reward: "Direction and purpose",
        frequency: "daily",
        timeOfDay: "morning",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Journal and pen on nightstand", type: "add" },
      { description: "Phone charges outside bedroom to reduce distraction", type: "modify" },
      { description: "Create a quiet reflection corner", type: "add" },
    ],
    suggestedMetrics: [
      { name: "Reflection sessions", unit: "count" },
      { name: "Insights captured", unit: "count" },
    ],
    commonObstacles: [
      { obstacle: "I don't know what to write", solution: "Start with 'Today I noticed...' - observation beats analysis." },
      { obstacle: "I fall asleep before reflecting", solution: "Tie it to an earlier cue: right after dinner or before evening routine." },
      { obstacle: "It feels pointless", solution: "Review your entries weekly. Patterns emerge that guide real decisions." },
    ],
  },
  {
    id: "tpl_gratitude_practice",
    title: "Gratitude Practice",
    description: "Train your mind to notice the good through a simple daily gratitude habit.",
    loop: "Meaning",
    category: "gratitude",
    goalPrompt: "What area of life would you like to appreciate more?",
    identityTemplate: "I am a person who notices and appreciates the good in life",
    difficulty: "beginner",
    estimatedDuration: "30 days",
    tags: ["gratitude", "positivity", "mindset"],
    suggestedHabits: [
      {
        title: "Morning gratitude",
        description: "Start the day by acknowledging what's good",
        cue: { type: "preceding_action", value: "While drinking morning coffee/tea" },
        response: "Think of or write 3 specific things I'm grateful for today",
        reward: "Positive mindset to start the day",
        frequency: "daily",
        timeOfDay: "morning",
      },
      {
        title: "Gratitude share",
        description: "Express appreciation to someone",
        cue: { type: "time", value: "During day" },
        response: "Tell one person something specific I appreciate about them",
        reward: "Deeper connection and their smile",
        frequency: "daily",
        timeOfDay: "anytime",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Gratitude prompt on bathroom mirror", type: "add" },
      { description: "Gratitude jar for written notes", type: "add" },
      { description: "Set phone wallpaper to gratitude reminder", type: "modify" },
    ],
    suggestedMetrics: [
      { name: "Days of gratitude practice", unit: "days" },
      { name: "Gratitude notes written", unit: "count" },
    ],
    commonObstacles: [
      { obstacle: "It feels forced or fake", solution: "Be specific: not 'family' but 'how my partner made me laugh yesterday.'" },
      { obstacle: "I can't think of anything", solution: "Start basic: running water, a roof, food. Expand from there." },
      { obstacle: "Bad days make it hard", solution: "Those are the most important days. Even 'I got through today' counts." },
    ],
  },
  {
    id: "tpl_meditation_habit",
    title: "Meditation Habit",
    description: "Build a sustainable meditation practice for calm, focus, and self-awareness.",
    loop: "Meaning",
    category: "meditation",
    goalPrompt: "What do you hope to gain from meditation?",
    identityTemplate: "I am a person who cultivates inner peace",
    difficulty: "beginner",
    estimatedDuration: "60 days",
    tags: ["meditation", "mindfulness", "calm"],
    suggestedHabits: [
      {
        title: "Morning sit",
        description: "Brief meditation to start the day centered",
        cue: { type: "preceding_action", value: "After sitting up in bed, before anything else" },
        response: "Sit for 2 minutes, focusing on breath. Just notice.",
        reward: "Calm, centered start to day",
        frequency: "daily",
        timeOfDay: "morning",
      },
      {
        title: "Mindful pause",
        description: "Brief reset during the day",
        cue: { type: "preceding_action", value: "Before eating lunch" },
        response: "Take 3 deep breaths, notice body sensations, proceed mindfully",
        reward: "Stress relief, renewed focus",
        frequency: "daily",
        timeOfDay: "afternoon",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Meditation cushion or chair in quiet spot", type: "add" },
      { description: "Remove distractions from meditation area", type: "remove" },
      { description: "Meditation app on phone home screen", type: "add" },
    ],
    suggestedMetrics: [
      { name: "Meditation minutes", unit: "min" },
      { name: "Consecutive days", unit: "days" },
      { name: "Average session length", unit: "min" },
    ],
    commonObstacles: [
      { obstacle: "I can't clear my mind", solution: "That's not the goal. Notice thoughts, return to breath. That IS the practice." },
      { obstacle: "I don't have time", solution: "Start with 1 minute. Everyone has 1 minute. Build from there." },
      { obstacle: "I feel restless and uncomfortable", solution: "Normal. Sit with the discomfort. It teaches you more than comfort does." },
    ],
  },
  {
    id: "tpl_purpose_alignment",
    title: "Purpose Check-In",
    description: "Regularly reconnect with your values and life direction.",
    loop: "Meaning",
    category: "purpose",
    goalPrompt: "What matters most to you in life?",
    identityTemplate: "I am a person who lives in alignment with my values",
    difficulty: "intermediate",
    estimatedDuration: "ongoing",
    tags: ["purpose", "values", "direction"],
    suggestedHabits: [
      {
        title: "Weekly purpose review",
        description: "Check if your actions align with your values",
        cue: { type: "time", value: "Sunday morning" },
        response: "Review calendar: Did my time reflect my priorities? Adjust next week.",
        reward: "Living intentionally, not by default",
        frequency: "weekly",
        timeOfDay: "morning",
      },
      {
        title: "Values-based decisions",
        description: "Pause before big decisions to check alignment",
        cue: { type: "emotional_state", value: "When facing a significant decision" },
        response: "Ask: Does this align with who I want to be? Write out pros/cons through values lens.",
        reward: "Decisions I don't regret",
        frequency: "daily",
        timeOfDay: "anytime",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Values list visible on desk or wall", type: "add" },
      { description: "Monthly calendar for life visioning", type: "add" },
      { description: "Remove commitments that don't serve your values", type: "remove" },
    ],
    suggestedMetrics: [
      { name: "Alignment score (1-10)", unit: "rating" },
      { name: "Intentional decisions made", unit: "count" },
    ],
    commonObstacles: [
      { obstacle: "I don't know my values", solution: "Start with: When do I feel most alive? What would I fight for? Those reveal values." },
      { obstacle: "Life demands conflict with values", solution: "What's one small thing you can change this week? Start there." },
      { obstacle: "It feels self-indulgent", solution: "An examined life serves others better. You can't give from an empty cup." },
    ],
  },
  {
    id: "tpl_learning_growth",
    title: "Continuous Learning",
    description: "Feed your curiosity and grow through intentional learning habits.",
    loop: "Meaning",
    category: "learning",
    goalPrompt: "What skill or topic do you want to learn about?",
    identityTemplate: "I am a lifelong learner who grows every day",
    difficulty: "beginner",
    estimatedDuration: "ongoing",
    tags: ["learning", "growth", "curiosity"],
    suggestedHabits: [
      {
        title: "Daily learning block",
        description: "Dedicated time for intentional learning",
        cue: { type: "time", value: "Lunch break or commute" },
        response: "15 minutes of podcast, audiobook, article, or course on chosen topic",
        reward: "New knowledge and insights",
        frequency: "daily",
        timeOfDay: "anytime",
      },
      {
        title: "Capture insights",
        description: "Write down what you learn so it sticks",
        cue: { type: "preceding_action", value: "After learning session" },
        response: "Write one key takeaway in notes app or learning journal",
        reward: "Building personal knowledge base",
        frequency: "daily",
        timeOfDay: "anytime",
      },
      {
        title: "Teach what you learn",
        description: "Solidify learning by sharing it",
        cue: { type: "time", value: "Weekly" },
        response: "Explain one concept I learned to a friend, colleague, or in writing",
        reward: "Deeper understanding and connection",
        frequency: "weekly",
        timeOfDay: "anytime",
      },
    ],
    suggestedEnvironmentTweaks: [
      { description: "Learning app on phone home screen", type: "add" },
      { description: "Queue of podcasts/audiobooks ready", type: "add" },
      { description: "Unsubscribe from mindless content, subscribe to educational", type: "modify" },
    ],
    suggestedMetrics: [
      { name: "Learning minutes", unit: "min" },
      { name: "Books/courses completed", unit: "count" },
      { name: "Insights captured", unit: "count" },
    ],
    commonObstacles: [
      { obstacle: "I don't have time to learn", solution: "Replace 15 min of scrolling. Use commute, walks, chores for audio." },
      { obstacle: "I forget what I learn", solution: "Write it down. Teach it. Spaced repetition works." },
      { obstacle: "I start courses but don't finish", solution: "Finish what you start, or officially quit. No half-commitments." },
    ],
  },
];
