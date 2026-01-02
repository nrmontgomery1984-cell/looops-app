// Widget System Types for Loop Dashboards

import { LoopId } from "./loops";

// =============================================================================
// WIDGET TYPES
// =============================================================================

export type WidgetType =
  | "tasks"
  | "habits"
  | "notes"
  | "metrics"
  | "goals"
  | "calendar"
  | "quick_links"
  | "timer"
  | "checklist"
  | "journal"
  | "system_health"
  | "babysitter"
  | "special_dates"
  | "health_data"
  | "google_calendar"
  | "spotify"
  | "wealth"
  | "budget"
  | "media"
  | "sleep_readiness"
  | "activity"
  | "nutrition"
  | "hooomz"
  | "hooomz_life"
  | "meditation"
  | "weather"
  | "good_times"
  | "steps"
  | "loop_ai"
  | "wasted_money"
  | "workout"
  | "finance_manager"
  | "meal_prep"
  | "zero_waste";

export type WidgetSize = "small" | "medium" | "large" | "full";

// =============================================================================
// WIDGET CONFIGURATION
// =============================================================================

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title?: string; // Override default title
  size: WidgetSize;
  position: {
    row: number;
    col: number;
  };
  // Grid-based sizing (in grid units) - used when edit mode is enabled
  // Grid is 4 columns wide, widgets can span 1-4 columns and 1-4 rows
  gridSize?: {
    colSpan: number; // 1-4 columns
    rowSpan: number; // 1-4 rows
  };
  // Pinned widgets cannot be moved or resized in edit mode
  pinned?: boolean;
  settings: Record<string, unknown>; // Widget-specific settings
}

export interface LoopDashboard {
  loopId: LoopId;
  widgets: WidgetConfig[];
  updatedAt: string;
  // Edit mode enables drag-to-reorder and resize handles
  editMode?: boolean;
}

// =============================================================================
// WIDGET DEFINITIONS
// =============================================================================

export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultSize: WidgetSize;
  availableSizes: WidgetSize[];
  defaultSettings: Record<string, unknown>;
}

export const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinition> = {
  tasks: {
    type: "tasks",
    name: "Tasks",
    description: "View and manage tasks for this loop",
    icon: "✓",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showCompleted: false,
      limit: 5,
    },
  },
  habits: {
    type: "habits",
    name: "Habits",
    description: "Track daily habits and streaks",
    icon: "🔥",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showStreaks: true,
    },
  },
  notes: {
    type: "notes",
    name: "Notes",
    description: "Quick notes and reference information",
    icon: "📝",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large", "full"],
    defaultSettings: {
      sortBy: "updated",
    },
  },
  metrics: {
    type: "metrics",
    name: "Metrics",
    description: "Track numbers over time",
    icon: "📊",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      chartType: "line",
      showTrend: true,
    },
  },
  goals: {
    type: "goals",
    name: "Goals Progress",
    description: "Visual progress toward loop goals",
    icon: "🎯",
    defaultSize: "small",
    availableSizes: ["small", "medium"],
    defaultSettings: {
      showPercentage: true,
    },
  },
  calendar: {
    type: "calendar",
    name: "Calendar",
    description: "Upcoming events and deadlines",
    icon: "📅",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      daysAhead: 7,
    },
  },
  quick_links: {
    type: "quick_links",
    name: "Quick Links",
    description: "Bookmarks, resources, and contacts",
    icon: "🔗",
    defaultSize: "small",
    availableSizes: ["small", "medium"],
    defaultSettings: {},
  },
  timer: {
    type: "timer",
    name: "Focus Timer",
    description: "Pomodoro and focus sessions",
    icon: "⏱️",
    defaultSize: "small",
    availableSizes: ["small", "medium"],
    defaultSettings: {
      defaultMinutes: 25,
      breakMinutes: 5,
    },
  },
  checklist: {
    type: "checklist",
    name: "Checklist",
    description: "Reusable checklists",
    icon: "☑️",
    defaultSize: "small",
    availableSizes: ["small", "medium"],
    defaultSettings: {},
  },
  journal: {
    type: "journal",
    name: "Journal",
    description: "Daily entries and reflections",
    icon: "📖",
    defaultSize: "medium",
    availableSizes: ["medium", "large", "full"],
    defaultSettings: {
      promptEnabled: true,
    },
  },
  system_health: {
    type: "system_health",
    name: "System Health",
    description: "Track your behavior systems",
    icon: "💪",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showHabits: true,
      showScore: true,
    },
  },
  babysitter: {
    type: "babysitter",
    name: "Babysitter",
    description: "Track babysitting hours and expenses",
    icon: "👶",
    defaultSize: "large",
    availableSizes: ["medium", "large", "full"],
    defaultSettings: {},
  },
  special_dates: {
    type: "special_dates",
    name: "Special Dates",
    description: "Track birthdays, anniversaries, and remembrance days",
    icon: "🎂",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {},
  },
  health_data: {
    type: "health_data",
    name: "Health Data",
    description: "Fitbit health metrics and readiness score",
    icon: "❤️",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showTrends: true,
      autoRefresh: true,
    },
  },
  google_calendar: {
    type: "google_calendar",
    name: "Google Calendar",
    description: "Events from Google Calendar",
    icon: "📆",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      daysAhead: 7,
    },
  },
  spotify: {
    type: "spotify",
    name: "Spotify",
    description: "Now playing and recently listened",
    icon: "🎵",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showStats: true,
    },
  },
  wealth: {
    type: "wealth",
    name: "Finances",
    description: "Net worth, spending, and transactions",
    icon: "💰",
    defaultSize: "large",
    availableSizes: ["medium", "large", "full"],
    defaultSettings: {
      period: 30,
    },
  },
  budget: {
    type: "budget",
    name: "Budget",
    description: "Monthly budget tracking and spending categories",
    icon: "📊",
    defaultSize: "large",
    availableSizes: ["medium", "large", "full"],
    defaultSettings: {},
  },
  media: {
    type: "media",
    name: "Media Log",
    description: "Track movies, TV shows, books, and games",
    icon: "🎬",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showRecent: true,
    },
  },
  sleep_readiness: {
    type: "sleep_readiness",
    name: "Sleep & Readiness",
    description: "Sleep duration, quality, and daily readiness score",
    icon: "😴",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showTrends: true,
    },
  },
  activity: {
    type: "activity",
    name: "Activity",
    description: "Steps, active minutes, distance, and calories burned",
    icon: "🏃",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showGoals: true,
    },
  },
  nutrition: {
    type: "nutrition",
    name: "Nutrition",
    description: "Calories, water intake, and weight tracking",
    icon: "🥗",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showCalorieBalance: true,
    },
  },
  hooomz: {
    type: "hooomz",
    name: "Hooomz OS",
    description: "Project management and task tracking",
    icon: "📋",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showProjects: true,
    },
  },
  hooomz_life: {
    type: "hooomz_life",
    name: "Hooomz Life",
    description: "Smart home control and automation",
    icon: "🏠",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showQuickActions: true,
    },
  },
  meditation: {
    type: "meditation",
    name: "Meditation",
    description: "Mindfulness minutes and meditation streaks",
    icon: "🧘",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showStreak: true,
    },
  },
  weather: {
    type: "weather",
    name: "Weather",
    description: "Current weather and forecast",
    icon: "🌤️",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showForecast: true,
      units: "imperial",
    },
  },
  good_times: {
    type: "good_times",
    name: "Good Times",
    description: "Log and remember memorable moments",
    icon: "🌟",
    defaultSize: "medium",
    availableSizes: ["small", "medium", "large"],
    defaultSettings: {
      showStats: true,
    },
  },
  steps: {
    type: "steps",
    name: "Steps",
    description: "Daily step count with goal progress",
    icon: "👟",
    defaultSize: "small",
    availableSizes: ["small", "medium"],
    defaultSettings: {
      goal: 10000,
    },
  },
  loop_ai: {
    type: "loop_ai",
    name: "AI Assistant",
    description: "Chat with Claude about this loop",
    icon: "🤖",
    defaultSize: "medium",
    availableSizes: ["medium", "large"],
    defaultSettings: {
      compact: false,
    },
  },
  wasted_money: {
    type: "wasted_money",
    name: "Wasted Money",
    description: "Track discretionary spending like eating out, cannabis, and wasted food",
    icon: "💸",
    defaultSize: "large",
    availableSizes: ["medium", "large", "full"],
    defaultSettings: {
      showBreakdown: true,
    },
  },
  workout: {
    type: "workout",
    name: "Workout",
    description: "Generate workouts, track exercises, and plan training",
    icon: "🏋️",
    defaultSize: "large",
    availableSizes: ["medium", "large", "full"],
    defaultSettings: {
      showQuickGenerate: true,
      compact: false,
    },
  },
  finance_manager: {
    type: "finance_manager",
    name: "Finance Manager",
    description: "Full finance management with accounts, transactions, and budgets",
    icon: "💰",
    defaultSize: "full",
    availableSizes: ["large", "full"],
    defaultSettings: {
      embedded: true,
    },
  },
  meal_prep: {
    type: "meal_prep",
    name: "Meal Prep",
    description: "Plan meals, manage recipes, and generate shopping lists",
    icon: "🍽️",
    defaultSize: "full",
    availableSizes: ["large", "full"],
    defaultSettings: {
      embedded: true,
    },
  },
  zero_waste: {
    type: "zero_waste",
    name: "Zero Waste",
    description: "Track waste reduction goals and sustainable habits",
    icon: "♻️",
    defaultSize: "large",
    availableSizes: ["medium", "large", "full"],
    defaultSettings: {},
  },
};

// =============================================================================
// WIDGET DATA TYPES
// =============================================================================

// Notes Widget
export interface Note {
  id: string;
  title: string;
  content: string;
  loop: LoopId;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Quick Links Widget
export interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  loop: LoopId;
  order: number;
}

// Checklist Widget
export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  order: number;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
  loop: LoopId;
  isTemplate: boolean; // Reusable template vs one-time list
  createdAt: string;
  updatedAt: string;
}

// Journal Widget
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  loop?: LoopId; // Optional - can be general or loop-specific
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Timer Widget
export interface TimerSession {
  id: string;
  loop?: LoopId;
  taskId?: string;
  duration: number; // minutes
  completedAt: string;
  type: "focus" | "break";
}

// =============================================================================
// DEFAULT DASHBOARDS
// =============================================================================

export function getDefaultDashboard(loopId: LoopId): LoopDashboard {
  const baseWidgets: WidgetConfig[] = [
    {
      id: `${loopId}_tasks`,
      type: "tasks",
      size: "medium",
      position: { row: 0, col: 0 },
      settings: { showCompleted: false, limit: 5 },
    },
    {
      id: `${loopId}_habits`,
      type: "habits",
      size: "medium",
      position: { row: 0, col: 1 },
      settings: { showStreaks: true },
    },
    {
      id: `${loopId}_goals`,
      type: "goals",
      size: "small",
      position: { row: 1, col: 0 },
      settings: { showPercentage: true },
    },
    {
      id: `${loopId}_system_health`,
      type: "system_health",
      size: "small",
      position: { row: 1, col: 1 },
      settings: { showHabits: true, showScore: true },
    },
  ];

  // Add loop-specific widgets
  const loopSpecificWidgets: Partial<Record<LoopId, WidgetConfig[]>> = {
    Health: [
      {
        id: `${loopId}_meal_prep`,
        type: "meal_prep",
        size: "full",
        position: { row: 2, col: 0 },
        gridSize: { colSpan: 4, rowSpan: 4 },
        settings: { embedded: true },
      },
      {
        id: `${loopId}_zero_waste`,
        type: "zero_waste",
        size: "large",
        position: { row: 6, col: 0 },
        gridSize: { colSpan: 4, rowSpan: 3 },
        settings: {},
      },
      {
        id: `${loopId}_sleep_readiness`,
        type: "sleep_readiness",
        size: "medium",
        position: { row: 9, col: 0 },
        settings: { showTrends: true },
      },
      {
        id: `${loopId}_activity`,
        type: "activity",
        size: "medium",
        position: { row: 9, col: 1 },
        settings: { showGoals: true },
      },
      {
        id: `${loopId}_nutrition`,
        type: "nutrition",
        size: "medium",
        position: { row: 10, col: 0 },
        settings: { showCalorieBalance: true },
      },
      {
        id: `${loopId}_meditation`,
        type: "meditation",
        size: "medium",
        position: { row: 10, col: 1 },
        settings: { showStreak: true },
      },
      {
        id: `${loopId}_workout`,
        type: "workout",
        size: "large",
        position: { row: 11, col: 0 },
        settings: { showQuickGenerate: true, compact: false },
      },
    ],
    Wealth: [
      {
        id: `${loopId}_finance_manager`,
        type: "finance_manager",
        size: "full",
        position: { row: 2, col: 0 },
        gridSize: { colSpan: 4, rowSpan: 5 },
        settings: { embedded: true },
      },
      {
        id: `${loopId}_wealth`,
        type: "wealth",
        size: "large",
        position: { row: 7, col: 0 },
        settings: { period: 30 },
      },
    ],
    Family: [
      {
        id: `${loopId}_babysitter`,
        type: "babysitter",
        size: "large",
        position: { row: 2, col: 0 },
        settings: {},
      },
      {
        id: `${loopId}_special_dates`,
        type: "special_dates",
        size: "medium",
        position: { row: 3, col: 0 },
        settings: {},
      },
    ],
    Work: [
      {
        id: `${loopId}_timer`,
        type: "timer",
        size: "small",
        position: { row: 2, col: 0 },
        settings: { defaultMinutes: 25, breakMinutes: 5 },
      },
      {
        id: `${loopId}_hooomz`,
        type: "hooomz",
        size: "medium",
        position: { row: 2, col: 1 },
        settings: { showQuickActions: true },
      },
    ],
    Fun: [
      {
        id: `${loopId}_spotify`,
        type: "spotify",
        size: "medium",
        position: { row: 2, col: 0 },
        settings: { showStats: true },
      },
      {
        id: `${loopId}_media`,
        type: "media",
        size: "medium",
        position: { row: 2, col: 1 },
        settings: { showRecent: true },
      },
      {
        id: `${loopId}_journal`,
        type: "journal",
        size: "medium",
        position: { row: 3, col: 0 },
        settings: { promptEnabled: true },
      },
    ],
    Maintenance: [
      {
        id: `${loopId}_checklist`,
        type: "checklist",
        size: "medium",
        position: { row: 2, col: 0 },
        settings: {},
      },
      {
        id: `${loopId}_hooomz_life`,
        type: "hooomz_life",
        size: "medium",
        position: { row: 2, col: 1 },
        settings: { showQuickActions: true },
      },
    ],
  };

  return {
    loopId,
    widgets: [...baseWidgets, ...(loopSpecificWidgets[loopId] || [])],
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getWidgetGridClass(size: WidgetSize): string {
  switch (size) {
    case "small":
      return "widget-small";
    case "medium":
      return "widget-medium";
    case "large":
      return "widget-large";
    case "full":
      return "widget-full";
    default:
      return "widget-medium";
  }
}
