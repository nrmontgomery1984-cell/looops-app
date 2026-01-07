// Main application context with useReducer for state management

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { markUserChange } from "../hooks/useFirebaseSync";
import {
  LoopId,
  LoopStateType,
  TabId,
  Task,
  Challenge,
  UserPrototype,
  LoopState,
  Goal,
  GoalHierarchy,
  CascadeRule,
  ALL_LOOPS,
  createDefaultLoopState,
  createEmptyGoalHierarchy,
  DEFAULT_CASCADE_RULES,
  Project,
  Label,
  createNextRecurrence,
  Routine,
  RoutineCompletion,
  // Systems & Habits
  System,
  SystemComponent,
  SystemMilestone,
  ComponentCompletion,
  Habit,
  HabitCompletion,
  ImplementationIntention,
  // Widgets
  LoopDashboard,
  Note,
  QuickLink,
  Checklist,
  JournalEntry,
  TimerSession,
  getDefaultDashboard,
  // Babysitter
  BabysitterState,
  Caregiver,
  BabysitterSession,
  BabysitterPayment,
  INITIAL_BABYSITTER_STATE,
  // Babysitter Portal
  BabysitterAccess,
  HouseholdInfo,
  ScheduleEntry,
  INITIAL_HOUSEHOLD_INFO,
  // Health
  HealthState,
  HealthSummary,
  INITIAL_HEALTH_STATE,
  // Calendar
  CalendarState,
  CalendarEvent,
  CalendarInfo,
  defaultCalendarState,
  // Media
  MediaState,
  MediaEntry,
  DEFAULT_MEDIA_STATE,
  // Directional
  DirectionalDocument,
  CoreDirections,
  LoopDirections,
} from "../types";
import { STORAGE_KEYS } from "../storage";
import { findTemplateById, BUILT_IN_TEMPLATES } from "../data/taskTemplates";
import { TaskTemplate } from "../types/taskTemplates";
import { createTask, ActiveTimer, TimeEntry } from "../types/tasks";
import { createProject } from "../types/projects";
import {
  SmartScheduleState,
  MarkedDate,
  DayTypeConfig,
  createDefaultSmartScheduleState,
} from "../types/dayTypes";
import {
  MealPrepState,
  KitchenProfile,
  Recipe,
  MealPlan,
  TechniqueEntry,
  WasteEntry,
  getDefaultMealPrepState,
} from "../types/mealPrep";
import {
  WorkoutState,
  GymProfile,
  Exercise,
  TrainingTipEntry,
  WorkoutPlan,
  WorkoutLog,
  getDefaultWorkoutState,
  getDefaultExercises,
} from "../types/workout";
import {
  FinanceState,
  FinanceConnection,
  FinanceAccount,
  FinanceTransaction,
  FinanceCategory,
  CategoryRule,
  FinanceSettings,
  BudgetExpense,
  LoopBudget,
  getDefaultFinanceState,
  DEFAULT_FINANCE_CATEGORIES,
  DEFAULT_CATEGORY_RULES,
  loadExpensesFromLocalStorage,
  saveExpensesToLocalStorage,
  loadLoopBudgetsFromLocalStorage,
  saveLoopBudgetsToLocalStorage,
  loadMonthlyIncomeFromLocalStorage,
  saveMonthlyIncomeToLocalStorage,
} from "../types/finance";
import {
  SpecialDatesState,
  SpecialDate,
  Person,
  INITIAL_SPECIAL_DATES_STATE,
} from "../types/specialDates";
import {
  DecisionsState,
  Decision,
  QuickDecision,
  INITIAL_DECISIONS_STATE,
} from "../types/decisions";
import { SEED_RECIPES, SEED_TECHNIQUES } from "../data/mealPrepSeedData";

// User profile type
export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  timezone?: string;
  birthday?: string; // ISO date string (e.g., "1984-08-26")
  lifeSeason?: string;
  majorTransition?: string;
  transitionDescription?: string;
  primaryChallenges?: string[];
  createdAt: string;
};

// App state shape
export type AppState = {
  // User
  user: {
    profile: UserProfile | null;
    prototype: UserPrototype | null;
    onboardingComplete: boolean;
  };

  // Loops
  loops: {
    states: Record<LoopId, LoopState>;
    cascadeRules: CascadeRule[];
  };

  // Tasks
  tasks: {
    items: Task[];
    todayStack: string[]; // Task IDs for today
  };

  // Projects
  projects: Project[];

  // Labels
  labels: Label[];

  // Goals
  goals: GoalHierarchy;

  // Routines
  routines: {
    items: Routine[];
    completions: RoutineCompletion[];
  };

  // Systems & Habits (habits deprecated, use components within systems)
  systems: {
    items: System[];
    completions: ComponentCompletion[]; // Component completions across all systems
  };

  // @deprecated - Use systems.completions and system.components instead
  habits: {
    items: Habit[];
    completions: HabitCompletion[];
  };

  intentions: {
    items: ImplementationIntention[];
  };

  // Widgets & Dashboard Data
  dashboards: Record<LoopId, LoopDashboard>;

  notes: Note[];
  quickLinks: QuickLink[];
  checklists: Checklist[];
  journal: JournalEntry[];
  timerSessions: TimerSession[];

  // Challenges
  challenges: {
    items: Challenge[];
    activeIds: string[];
  };

  // Babysitter (Family loop)
  babysitter: BabysitterState;

  // Babysitter Portal (for babysitter access)
  householdInfo: HouseholdInfo;
  babysitterPins: BabysitterAccess[];
  babysitterSchedule: ScheduleEntry[];
  babysitterPayments: BabysitterPayment[];

  // Health (Health loop)
  health: HealthState;

  // Calendar
  calendar: CalendarState;

  // Media (Fun loop)
  media: MediaState;

  // Directional Document (personal direction framework)
  directionalDocument: DirectionalDocument | null;

  // Custom task templates
  customTemplates: TaskTemplate[];

  // Smart Scheduler (day type system)
  smartSchedule: SmartScheduleState;

  // Meal Prep (Health loop)
  mealPrep: MealPrepState;

  // Workout (Health loop)
  workout: WorkoutState;

  // Finance (Wealth loop)
  finance: FinanceState;

  // Special Dates (Family loop)
  specialDates: SpecialDatesState;

  // Decisions (cross-loop decision tracking)
  decisions: DecisionsState;

  // Active task timer (only one can run at a time)
  activeTimer: ActiveTimer | null;

  // UI State
  ui: {
    activeTab: TabId;
    selectedLoop: LoopId | null;
    viewMode: "visual" | "kanban";
    modals: {
      onboarding: boolean;
      challengeDetail: string | null;
      weeklyPlanning: boolean;
      taskDetail: string | null;
    };
  };
};

// Initialize default loop states
function createDefaultLoopStates(): Record<LoopId, LoopState> {
  const states: Partial<Record<LoopId, LoopState>> = {};
  for (const loopId of ALL_LOOPS) {
    states[loopId] = createDefaultLoopState(loopId);
  }
  return states as Record<LoopId, LoopState>;
}

// Initialize default dashboards for each loop
function createDefaultDashboards(): Record<LoopId, LoopDashboard> {
  const dashboards: Partial<Record<LoopId, LoopDashboard>> = {};
  for (const loopId of ALL_LOOPS) {
    dashboards[loopId] = getDefaultDashboard(loopId);
  }
  return dashboards as Record<LoopId, LoopDashboard>;
}

// Default state
const defaultState: AppState = {
  user: {
    profile: null,
    prototype: null,
    onboardingComplete: false,
  },
  loops: {
    states: createDefaultLoopStates(),
    cascadeRules: DEFAULT_CASCADE_RULES,
  },
  tasks: {
    items: [],
    todayStack: [],
  },
  projects: [],
  labels: [],
  goals: createEmptyGoalHierarchy(),
  routines: {
    items: [],
    completions: [],
  },
  // Systems & Habits (habits deprecated)
  systems: {
    items: [],
    completions: [],
  },
  // @deprecated - being migrated to system.components
  habits: {
    items: [],
    completions: [],
  },
  intentions: {
    items: [],
  },
  // Widgets & Dashboard Data
  dashboards: createDefaultDashboards(),
  notes: [],
  quickLinks: [],
  checklists: [],
  journal: [],
  timerSessions: [],
  // Challenges
  challenges: {
    items: [],
    activeIds: [],
  },
  // Babysitter
  babysitter: INITIAL_BABYSITTER_STATE,
  // Babysitter Portal
  householdInfo: INITIAL_HOUSEHOLD_INFO,
  babysitterPins: [
    // Sample credentials for testing - Username: kylie, Password: 1234
    { username: "kylie", password: "1234", caregiverId: "caregiver_kylie", createdAt: new Date().toISOString() },
  ],
  babysitterSchedule: [],
  babysitterPayments: [],
  // Health
  health: INITIAL_HEALTH_STATE,
  // Calendar
  calendar: defaultCalendarState,
  // Media
  media: DEFAULT_MEDIA_STATE,
  // Directional Document
  directionalDocument: null,
  // Custom Templates
  customTemplates: [],
  // Smart Schedule
  smartSchedule: createDefaultSmartScheduleState(),
  // Meal Prep - with seed data from trusted sources
  mealPrep: {
    ...getDefaultMealPrepState(),
    recipes: SEED_RECIPES,
    techniqueLibrary: SEED_TECHNIQUES,
  },
  // Workout
  workout: getDefaultWorkoutState(),
  // Finance
  finance: getDefaultFinanceState(),
  // Special Dates
  specialDates: INITIAL_SPECIAL_DATES_STATE,
  // Decisions
  decisions: INITIAL_DECISIONS_STATE,
  // Active Timer
  activeTimer: null,
  ui: {
    activeTab: "today",
    selectedLoop: null,
    viewMode: "visual",
    modals: {
      onboarding: false,
      challengeDetail: null,
      weeklyPlanning: false,
      taskDetail: null,
    },
  },
};

// Action types
export type AppAction =
  // User actions
  | { type: "SET_USER_PROFILE"; payload: UserProfile }
  | { type: "SET_PROTOTYPE"; payload: UserPrototype }
  | { type: "COMPLETE_ONBOARDING" }
  | { type: "RESET_ONBOARDING" }

  // Loop actions
  | { type: "SET_LOOP_STATE"; payload: { loopId: LoopId; state: LoopStateType } }
  | { type: "SET_ALL_LOOP_STATES"; payload: Record<LoopId, LoopStateType> }
  | { type: "UPDATE_LOOP_FLOOR"; payload: { loopId: LoopId; floor: LoopStateType } }
  | { type: "UPDATE_LOOP_CEILING"; payload: { loopId: LoopId; ceiling: LoopStateType } }

  // Task actions
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "COMPLETE_TASK"; payload: string }
  | { type: "UNCOMPLETE_TASK"; payload: string }
  | { type: "SET_TODAY_STACK"; payload: string[] }
  | { type: "REORDER_TASKS"; payload: { taskIds: string[]; projectId?: string; sectionId?: string } }

  // Project actions
  | { type: "SET_PROJECTS"; payload: Project[] }
  | { type: "ADD_PROJECT"; payload: Project }
  | { type: "UPDATE_PROJECT"; payload: Project }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "ARCHIVE_PROJECT"; payload: string }

  // Label actions
  | { type: "SET_LABELS"; payload: Label[] }
  | { type: "ADD_LABEL"; payload: Label }
  | { type: "UPDATE_LABEL"; payload: Label }
  | { type: "DELETE_LABEL"; payload: string }

  // Goal actions
  | { type: "SET_GOALS"; payload: GoalHierarchy }
  | { type: "ADD_GOAL"; payload: Goal }
  | { type: "UPDATE_GOAL"; payload: Goal }
  | { type: "DELETE_GOAL"; payload: string }

  // Routine actions
  | { type: "SET_ROUTINES"; payload: Routine[] }
  | { type: "ADD_ROUTINE"; payload: Routine }
  | { type: "UPDATE_ROUTINE"; payload: Routine }
  | { type: "DELETE_ROUTINE"; payload: string }
  | { type: "ADD_ROUTINE_COMPLETION"; payload: RoutineCompletion }

  // System actions
  | { type: "ADD_SYSTEM"; payload: System }
  | { type: "UPDATE_SYSTEM"; payload: System }
  | { type: "DELETE_SYSTEM"; payload: string }

  // System Component actions (components are embedded within systems)
  | { type: "ADD_COMPONENT"; payload: { systemId: string; component: SystemComponent } }
  | { type: "UPDATE_COMPONENT"; payload: { systemId: string; component: SystemComponent } }
  | { type: "DELETE_COMPONENT"; payload: { systemId: string; componentId: string } }
  | { type: "COMPLETE_COMPONENT"; payload: { systemId: string; componentId: string; date: string; notes?: string } }
  | { type: "UNCOMPLETE_COMPONENT"; payload: { systemId: string; componentId: string; date: string } }

  // System Milestone actions
  | { type: "ADD_MILESTONE"; payload: { systemId: string; milestone: SystemMilestone } }
  | { type: "UPDATE_MILESTONE"; payload: { systemId: string; milestone: SystemMilestone } }
  | { type: "DELETE_MILESTONE"; payload: { systemId: string; milestoneId: string } }
  | { type: "COMPLETE_MILESTONE"; payload: { systemId: string; milestoneId: string } }

  // Migration action - convert standalone habits to system components
  | { type: "MIGRATE_HABITS_TO_COMPONENTS" }

  // Habit actions (@deprecated - use component actions instead)
  | { type: "ADD_HABIT"; payload: Habit }
  | { type: "UPDATE_HABIT"; payload: Habit }
  | { type: "DELETE_HABIT"; payload: string }
  | { type: "COMPLETE_HABIT"; payload: { habitId: string; date: string; notes?: string } }
  | { type: "UNCOMPLETE_HABIT"; payload: { habitId: string; date: string } }

  // Implementation Intention actions
  | { type: "ADD_INTENTION"; payload: ImplementationIntention }
  | { type: "UPDATE_INTENTION"; payload: ImplementationIntention }
  | { type: "DELETE_INTENTION"; payload: string }

  // Note actions
  | { type: "ADD_NOTE"; payload: Note }
  | { type: "UPDATE_NOTE"; payload: Note }
  | { type: "DELETE_NOTE"; payload: string }

  // Quick Link actions
  | { type: "ADD_QUICK_LINK"; payload: QuickLink }
  | { type: "UPDATE_QUICK_LINK"; payload: QuickLink }
  | { type: "DELETE_QUICK_LINK"; payload: string }

  // Checklist actions
  | { type: "ADD_CHECKLIST"; payload: Checklist }
  | { type: "UPDATE_CHECKLIST"; payload: Checklist }
  | { type: "DELETE_CHECKLIST"; payload: string }

  // Journal actions
  | { type: "ADD_JOURNAL_ENTRY"; payload: JournalEntry }
  | { type: "UPDATE_JOURNAL_ENTRY"; payload: JournalEntry }
  | { type: "DELETE_JOURNAL_ENTRY"; payload: string }

  // Timer actions (Pomodoro-style sessions)
  | { type: "ADD_TIMER_SESSION"; payload: TimerSession }

  // Task Timer actions (time tracking for tasks)
  | { type: "START_TASK_TIMER"; payload: string } // taskId
  | { type: "PAUSE_TASK_TIMER" }
  | { type: "RESUME_TASK_TIMER" }
  | { type: "STOP_TASK_TIMER"; payload?: { note?: string } }
  | { type: "CANCEL_TASK_TIMER" }

  // Dashboard actions
  | { type: "UPDATE_DASHBOARD"; payload: LoopDashboard }

  // Challenge actions
  | { type: "SET_CHALLENGES"; payload: Challenge[] }
  | { type: "ACTIVATE_CHALLENGE"; payload: string }
  | { type: "DEACTIVATE_CHALLENGE"; payload: string }

  // Babysitter actions
  | { type: "ADD_CAREGIVER"; payload: Caregiver }
  | { type: "UPDATE_CAREGIVER"; payload: Caregiver }
  | { type: "DEACTIVATE_CAREGIVER"; payload: string }
  | { type: "ADD_BABYSITTER_SESSION"; payload: BabysitterSession }
  | { type: "UPDATE_BABYSITTER_SESSION"; payload: BabysitterSession }
  | { type: "DELETE_BABYSITTER_SESSION"; payload: string }

  // Babysitter Portal actions
  | { type: "SET_HOUSEHOLD_INFO"; payload: HouseholdInfo }
  | { type: "UPDATE_HOUSEHOLD_INFO"; payload: Partial<HouseholdInfo> }
  | { type: "ADD_BABYSITTER_PIN"; payload: BabysitterAccess }
  | { type: "UPDATE_BABYSITTER_PIN"; payload: BabysitterAccess }
  | { type: "DELETE_BABYSITTER_PIN"; payload: string } // caregiverId
  | { type: "ADD_SCHEDULE_ENTRY"; payload: ScheduleEntry }
  | { type: "UPDATE_SCHEDULE_ENTRY"; payload: ScheduleEntry }
  | { type: "DELETE_SCHEDULE_ENTRY"; payload: string }
  | { type: "ADD_BABYSITTER_PAYMENT"; payload: BabysitterPayment }
  | { type: "UPDATE_BABYSITTER_PAYMENT"; payload: BabysitterPayment }
  | { type: "DELETE_BABYSITTER_PAYMENT"; payload: string }
  | { type: "MARK_SESSIONS_PAID"; payload: { sessionIds: string[]; paymentId: string } }

  // Health actions
  | { type: "SET_HEALTH_SUMMARY"; payload: HealthSummary }
  | { type: "SET_HEALTH_LOADING"; payload: boolean }
  | { type: "SET_HEALTH_ERROR"; payload: string | null }

  // Calendar actions
  | { type: "SET_CALENDAR_EVENTS"; payload: CalendarEvent[] }
  | { type: "SET_CALENDAR_CALENDARS"; payload: CalendarInfo[] }
  | { type: "SET_CALENDAR_LOADING"; payload: boolean }
  | { type: "SET_CALENDAR_ERROR"; payload: string | null }
  | { type: "SET_CALENDAR_EMBED_URL"; payload: string | undefined }

  // Media actions
  | { type: "ADD_MEDIA_ENTRY"; payload: MediaEntry }
  | { type: "UPDATE_MEDIA_ENTRY"; payload: MediaEntry }
  | { type: "DELETE_MEDIA_ENTRY"; payload: string }
  | { type: "SET_MEDIA_ENTRIES"; payload: MediaEntry[] }

  // Directional Document actions
  | { type: "SET_DIRECTIONAL_DOCUMENT"; payload: DirectionalDocument | null }
  | { type: "UPDATE_CORE_DIRECTIONS"; payload: Partial<CoreDirections> }
  | { type: "UPDATE_LOOP_DIRECTIONS"; payload: { loopId: LoopId; directions: Partial<LoopDirections> } }

  // Template actions
  | { type: "CREATE_FROM_TEMPLATE"; payload: { templateId: string; projectName?: string } }
  | { type: "ADD_CUSTOM_TEMPLATE"; payload: TaskTemplate }
  | { type: "UPDATE_CUSTOM_TEMPLATE"; payload: TaskTemplate }
  | { type: "DELETE_CUSTOM_TEMPLATE"; payload: string }

  // Smart Schedule actions
  | { type: "SET_SMART_SCHEDULE_ENABLED"; payload: boolean }
  | { type: "MARK_DATE"; payload: MarkedDate }
  | { type: "UNMARK_DATE"; payload: string }
  | { type: "UPDATE_DAY_TYPE_CONFIG"; payload: DayTypeConfig }
  | { type: "BULK_MARK_DATES"; payload: MarkedDate[] }
  | { type: "ADD_CUSTOM_DAY_TYPE"; payload: DayTypeConfig }
  | { type: "UPDATE_CUSTOM_DAY_TYPE"; payload: DayTypeConfig }
  | { type: "DELETE_CUSTOM_DAY_TYPE"; payload: string }

  // Meal Prep actions
  | { type: "SET_KITCHEN_PROFILE"; payload: KitchenProfile }
  | { type: "UPDATE_KITCHEN_PROFILE"; payload: Partial<KitchenProfile> }
  | { type: "COMPLETE_MEAL_PREP_ONBOARDING" }
  | { type: "ADD_RECIPE"; payload: Recipe }
  | { type: "UPDATE_RECIPE"; payload: Recipe }
  | { type: "DELETE_RECIPE"; payload: string }
  | { type: "TOGGLE_RECIPE_FAVORITE"; payload: string }
  | { type: "LOG_RECIPE_MADE"; payload: { recipeId: string; date: string } }
  | { type: "SET_MEAL_PLAN"; payload: MealPlan }
  | { type: "UPDATE_MEAL_PLAN"; payload: MealPlan }
  | { type: "ADD_TECHNIQUE_ENTRY"; payload: TechniqueEntry }
  | { type: "UPDATE_TECHNIQUE_ENTRY"; payload: TechniqueEntry }
  | { type: "DELETE_TECHNIQUE_ENTRY"; payload: string }
  | { type: "TOGGLE_TECHNIQUE_FAVORITE"; payload: string }
  | { type: "UPDATE_TECHNIQUE_NOTES"; payload: { techniqueId: string; notes: string } }
  | { type: "TOGGLE_TIP_HIGHLIGHT"; payload: { techniqueId: string; tipId: string } }

  // Waste tracking actions
  | { type: "ADD_WASTE_ENTRY"; payload: WasteEntry }
  | { type: "UPDATE_WASTE_ENTRY"; payload: WasteEntry }
  | { type: "DELETE_WASTE_ENTRY"; payload: string }

  // Workout actions
  | { type: "SET_GYM_PROFILE"; payload: GymProfile }
  | { type: "UPDATE_GYM_PROFILE"; payload: Partial<GymProfile> }
  | { type: "COMPLETE_WORKOUT_ONBOARDING" }
  | { type: "ADD_EXERCISE"; payload: Exercise }
  | { type: "UPDATE_EXERCISE"; payload: Exercise }
  | { type: "DELETE_EXERCISE"; payload: string }
  | { type: "TOGGLE_EXERCISE_FAVORITE"; payload: string }
  | { type: "LOG_EXERCISE_PERFORMED"; payload: { exerciseId: string; date: string } }
  | { type: "ADD_TRAINING_TIP"; payload: TrainingTipEntry }
  | { type: "UPDATE_TRAINING_TIP"; payload: TrainingTipEntry }
  | { type: "DELETE_TRAINING_TIP"; payload: string }
  | { type: "TOGGLE_TRAINING_TIP_FAVORITE"; payload: string }
  | { type: "SET_WORKOUT_PLAN"; payload: WorkoutPlan }
  | { type: "UPDATE_WORKOUT_PLAN"; payload: WorkoutPlan }
  | { type: "DELETE_WORKOUT_PLAN"; payload: string }
  | { type: "ADD_WORKOUT_LOG"; payload: WorkoutLog }
  | { type: "UPDATE_WORKOUT_LOG"; payload: WorkoutLog }
  | { type: "DELETE_WORKOUT_LOG"; payload: string }

  // Finance actions
  | { type: "SET_FINANCE_CONNECTION"; payload: FinanceConnection }
  | { type: "UPDATE_FINANCE_CONNECTION"; payload: Partial<FinanceConnection> & { id: string } }
  | { type: "DELETE_FINANCE_CONNECTION"; payload: string }
  | { type: "SET_FINANCE_ACCOUNTS"; payload: FinanceAccount[] }
  | { type: "UPDATE_FINANCE_ACCOUNT"; payload: Partial<FinanceAccount> & { id: string } }
  | { type: "SET_FINANCE_TRANSACTIONS"; payload: FinanceTransaction[] }
  | { type: "UPSERT_FINANCE_TRANSACTIONS"; payload: FinanceTransaction[] }
  | { type: "UPDATE_FINANCE_TRANSACTION"; payload: Partial<FinanceTransaction> & { id: string } }
  | { type: "DELETE_FINANCE_TRANSACTION"; payload: string }
  | { type: "BULK_CATEGORIZE_TRANSACTIONS"; payload: { ids: string[]; categoryId: string; loop: LoopId } }
  | { type: "ADD_FINANCE_CATEGORY"; payload: FinanceCategory }
  | { type: "UPDATE_FINANCE_CATEGORY"; payload: Partial<FinanceCategory> & { id: string } }
  | { type: "DELETE_FINANCE_CATEGORY"; payload: string }
  | { type: "ADD_CATEGORY_RULE"; payload: CategoryRule }
  | { type: "UPDATE_CATEGORY_RULE"; payload: Partial<CategoryRule> & { id: string } }
  | { type: "DELETE_CATEGORY_RULE"; payload: string }
  | { type: "SET_FINANCE_SYNC_STATUS"; payload: Partial<FinanceState["syncStatus"]> }
  | { type: "RESET_ALL_FINANCE" }
  | { type: "UPDATE_FINANCE_SETTINGS"; payload: Partial<FinanceSettings> }

  // Budget Expenses (shared with Budget widget)
  | { type: "SET_FINANCE_EXPENSES"; payload: BudgetExpense[] }
  | { type: "ADD_FINANCE_EXPENSE"; payload: BudgetExpense }
  | { type: "UPDATE_FINANCE_EXPENSE"; payload: BudgetExpense }
  | { type: "DELETE_FINANCE_EXPENSE"; payload: string }

  // Loop Budgets
  | { type: "SET_LOOP_BUDGETS"; payload: LoopBudget[] }
  | { type: "UPDATE_LOOP_BUDGET"; payload: LoopBudget }

  // Monthly Income
  | { type: "SET_MONTHLY_INCOME"; payload: number }

  // Special Dates actions
  | { type: "ADD_PERSON"; payload: Person }
  | { type: "UPDATE_PERSON"; payload: Person }
  | { type: "DELETE_PERSON"; payload: string }
  | { type: "ADD_SPECIAL_DATE"; payload: SpecialDate }
  | { type: "UPDATE_SPECIAL_DATE"; payload: SpecialDate }
  | { type: "DELETE_SPECIAL_DATE"; payload: string }

  // Decision actions
  | { type: "ADD_DECISION"; payload: Decision }
  | { type: "UPDATE_DECISION"; payload: Decision }
  | { type: "DELETE_DECISION"; payload: string }
  | { type: "ADD_QUICK_DECISION"; payload: QuickDecision }
  | { type: "UPDATE_QUICK_DECISION"; payload: QuickDecision }
  | { type: "DELETE_QUICK_DECISION"; payload: string }

  // UI actions
  | { type: "SET_ACTIVE_TAB"; payload: TabId }
  | { type: "SELECT_LOOP"; payload: LoopId | null }
  | { type: "SET_VIEW_MODE"; payload: "visual" | "kanban" }
  | { type: "OPEN_MODAL"; payload: { modal: keyof AppState["ui"]["modals"]; value: string | boolean } }
  | { type: "CLOSE_MODAL"; payload: keyof AppState["ui"]["modals"] }

  // Hydration
  | { type: "HYDRATE"; payload: Partial<AppState> }

  // Reset state (for user switching)
  | { type: "RESET_STATE" };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // User
    case "SET_USER_PROFILE":
      return {
        ...state,
        user: { ...state.user, profile: action.payload },
      };

    case "SET_PROTOTYPE":
      return {
        ...state,
        user: { ...state.user, prototype: action.payload },
      };

    case "COMPLETE_ONBOARDING":
      return {
        ...state,
        user: { ...state.user, onboardingComplete: true },
        ui: { ...state.ui, modals: { ...state.ui.modals, onboarding: false } },
      };

    case "RESET_ONBOARDING":
      return {
        ...state,
        user: { ...state.user, onboardingComplete: false, prototype: null, profile: null },
      };

    // Loops
    case "SET_LOOP_STATE": {
      const { loopId, state: newState } = action.payload;
      const currentLoopState = state.loops.states[loopId];
      return {
        ...state,
        loops: {
          ...state.loops,
          states: {
            ...state.loops.states,
            [loopId]: {
              ...currentLoopState,
              currentState: newState,
              lastStateChange: new Date().toISOString(),
              stateHistory: [
                ...currentLoopState.stateHistory,
                {
                  fromState: currentLoopState.currentState,
                  toState: newState,
                  timestamp: new Date().toISOString(),
                  reason: "User changed",
                  triggeredBy: "user" as const,
                },
              ],
            },
          },
        },
      };
    }

    case "SET_ALL_LOOP_STATES": {
      const newStates = { ...state.loops.states };
      for (const [loopId, newLoopState] of Object.entries(action.payload)) {
        const current = newStates[loopId as LoopId];
        newStates[loopId as LoopId] = {
          ...current,
          currentState: newLoopState,
          lastStateChange: new Date().toISOString(),
        };
      }
      return {
        ...state,
        loops: { ...state.loops, states: newStates },
      };
    }

    case "UPDATE_LOOP_FLOOR": {
      const { loopId, floor } = action.payload;
      return {
        ...state,
        loops: {
          ...state.loops,
          states: {
            ...state.loops.states,
            [loopId]: { ...state.loops.states[loopId], floor },
          },
        },
      };
    }

    case "UPDATE_LOOP_CEILING": {
      const { loopId, ceiling } = action.payload;
      return {
        ...state,
        loops: {
          ...state.loops,
          states: {
            ...state.loops.states,
            [loopId]: { ...state.loops.states[loopId], ceiling },
          },
        },
      };
    }

    // Tasks
    case "SET_TASKS":
      return {
        ...state,
        tasks: { ...state.tasks, items: action.payload },
      };

    case "ADD_TASK":
      return {
        ...state,
        tasks: { ...state.tasks, items: [...state.tasks.items, action.payload] },
      };

    case "UPDATE_TASK":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: state.tasks.items.map((t) =>
            t.id === action.payload.id ? action.payload : t
          ),
        },
      };

    case "DELETE_TASK":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: state.tasks.items.filter((t) => t.id !== action.payload),
          todayStack: state.tasks.todayStack.filter((id) => id !== action.payload),
        },
      };

    case "COMPLETE_TASK": {
      const taskToComplete = state.tasks.items.find((t) => t.id === action.payload);
      const completedItems = state.tasks.items.map((t) =>
        t.id === action.payload
          ? { ...t, status: "done" as const, completedAt: new Date().toISOString() }
          : t
      );

      // If task has recurrence, create the next occurrence
      let newItems = completedItems;
      if (taskToComplete?.recurrence) {
        const nextTask = createNextRecurrence(taskToComplete);
        if (nextTask) {
          newItems = [...completedItems, nextTask];
        }
      }

      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: newItems,
        },
      };
    }

    case "SET_TODAY_STACK":
      return {
        ...state,
        tasks: { ...state.tasks, todayStack: action.payload },
      };

    case "UNCOMPLETE_TASK":
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: state.tasks.items.map((t) =>
            t.id === action.payload
              ? { ...t, status: "todo" as const, completedAt: undefined }
              : t
          ),
        },
      };

    case "REORDER_TASKS": {
      const { taskIds } = action.payload;
      const reorderedItems = state.tasks.items.map((task) => {
        const newOrder = taskIds.indexOf(task.id);
        if (newOrder !== -1) {
          return { ...task, order: newOrder };
        }
        return task;
      });
      return {
        ...state,
        tasks: { ...state.tasks, items: reorderedItems },
      };
    }

    // Projects
    case "SET_PROJECTS":
      return { ...state, projects: action.payload };

    case "ADD_PROJECT":
      return { ...state, projects: [...state.projects, action.payload] };

    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case "DELETE_PROJECT":
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
        // Also remove project from tasks
        tasks: {
          ...state.tasks,
          items: state.tasks.items.map((t) =>
            t.projectId === action.payload ? { ...t, projectId: undefined } : t
          ),
        },
      };

    case "ARCHIVE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload ? { ...p, archived: true, updatedAt: new Date().toISOString() } : p
        ),
      };

    // Labels
    case "SET_LABELS":
      return { ...state, labels: action.payload };

    case "ADD_LABEL":
      return { ...state, labels: [...state.labels, action.payload] };

    case "UPDATE_LABEL":
      return {
        ...state,
        labels: state.labels.map((l) =>
          l.id === action.payload.id ? action.payload : l
        ),
      };

    case "DELETE_LABEL":
      return {
        ...state,
        labels: state.labels.filter((l) => l.id !== action.payload),
        // Also remove label from tasks
        tasks: {
          ...state.tasks,
          items: state.tasks.items.map((t) => ({
            ...t,
            labels: t.labels?.filter((lid) => lid !== action.payload),
          })),
        },
      };

    // Goals
    case "SET_GOALS":
      return { ...state, goals: action.payload };

    case "ADD_GOAL": {
      const goal = action.payload;
      return {
        ...state,
        goals: {
          ...state.goals,
          [goal.timeframe]: [...state.goals[goal.timeframe], goal],
        },
      };
    }

    case "UPDATE_GOAL": {
      const goal = action.payload;
      return {
        ...state,
        goals: {
          ...state.goals,
          [goal.timeframe]: state.goals[goal.timeframe].map((g) =>
            g.id === goal.id ? goal : g
          ),
        },
      };
    }

    case "DELETE_GOAL": {
      const goalId = action.payload;
      const newGoals = { ...state.goals };
      for (const timeframe of Object.keys(newGoals) as Array<keyof GoalHierarchy>) {
        newGoals[timeframe] = newGoals[timeframe].filter((g) => g.id !== goalId);
      }
      return { ...state, goals: newGoals };
    }

    // Routines
    case "SET_ROUTINES":
      return {
        ...state,
        routines: { ...state.routines, items: action.payload },
      };

    case "ADD_ROUTINE": {
      // Prevent duplicate routines - check if one with same ID already exists
      const existingRoutine = state.routines.items.find(r => r.id === action.payload.id);
      if (existingRoutine) {
        console.log('[AppContext] Skipping duplicate routine:', action.payload.id);
        return state;
      }
      return {
        ...state,
        routines: { ...state.routines, items: [...state.routines.items, action.payload] },
      };
    }

    case "UPDATE_ROUTINE":
      return {
        ...state,
        routines: {
          ...state.routines,
          items: state.routines.items.map((r) =>
            r.id === action.payload.id ? action.payload : r
          ),
        },
      };

    case "DELETE_ROUTINE":
      return {
        ...state,
        routines: {
          ...state.routines,
          items: state.routines.items.filter((r) => r.id !== action.payload),
        },
      };

    case "ADD_ROUTINE_COMPLETION":
      return {
        ...state,
        routines: {
          ...state.routines,
          completions: [...state.routines.completions, action.payload],
        },
      };

    // Systems
    case "ADD_SYSTEM":
      return {
        ...state,
        systems: {
          ...state.systems,
          items: [...state.systems.items, action.payload],
        },
      };

    case "UPDATE_SYSTEM":
      return {
        ...state,
        systems: {
          ...state.systems,
          items: state.systems.items.map((s) =>
            s.id === action.payload.id ? action.payload : s
          ),
        },
      };

    case "DELETE_SYSTEM":
      return {
        ...state,
        systems: {
          ...state.systems,
          items: state.systems.items.filter((s) => s.id !== action.payload),
          // Also remove completions for this system
          completions: state.systems.completions.filter((c) => c.systemId !== action.payload),
        },
      };

    // System Components (embedded within systems)
    case "ADD_COMPONENT": {
      const { systemId, component } = action.payload;
      return {
        ...state,
        systems: {
          ...state.systems,
          items: state.systems.items.map((s) =>
            s.id === systemId
              ? { ...s, components: [...(s.components || []), component], updatedAt: new Date().toISOString() }
              : s
          ),
        },
      };
    }

    case "UPDATE_COMPONENT": {
      const { systemId, component } = action.payload;
      return {
        ...state,
        systems: {
          ...state.systems,
          items: state.systems.items.map((s) =>
            s.id === systemId
              ? {
                  ...s,
                  components: (s.components || []).map((c) =>
                    c.id === component.id ? component : c
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        },
      };
    }

    case "DELETE_COMPONENT": {
      const { systemId, componentId } = action.payload;
      return {
        ...state,
        systems: {
          ...state.systems,
          items: state.systems.items.map((s) =>
            s.id === systemId
              ? {
                  ...s,
                  components: (s.components || []).filter((c) => c.id !== componentId),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
          // Remove completions for deleted component
          completions: state.systems.completions.filter((c) => c.componentId !== componentId),
        },
      };
    }

    case "COMPLETE_COMPONENT": {
      const { systemId, componentId, date, notes } = action.payload;
      const completion: ComponentCompletion = {
        id: `cc_${Date.now()}`,
        componentId,
        systemId,
        date,
        completedAt: new Date().toISOString(),
        notes,
      };
      // Update streak on component within its system
      return {
        ...state,
        systems: {
          ...state.systems,
          items: state.systems.items.map((s) => {
            if (s.id !== systemId) return s;
            return {
              ...s,
              components: (s.components || []).map((c) => {
                if (c.id !== componentId) return c;
                const newStreak = c.streak + 1;
                return {
                  ...c,
                  streak: newStreak,
                  longestStreak: Math.max(c.longestStreak, newStreak),
                  totalCompletions: c.totalCompletions + 1,
                  updatedAt: new Date().toISOString(),
                };
              }),
              updatedAt: new Date().toISOString(),
            };
          }),
          completions: [...state.systems.completions, completion],
        },
      };
    }

    case "UNCOMPLETE_COMPONENT": {
      const { systemId, componentId, date } = action.payload;
      return {
        ...state,
        systems: {
          ...state.systems,
          completions: state.systems.completions.filter(
            (c) => !(c.componentId === componentId && c.date === date)
          ),
        },
      };
    }

    // System Milestones (embedded within systems)
    case "ADD_MILESTONE": {
      const { systemId, milestone } = action.payload;
      return {
        ...state,
        systems: {
          ...state.systems,
          items: state.systems.items.map((s) =>
            s.id === systemId
              ? { ...s, milestones: [...(s.milestones || []), milestone], updatedAt: new Date().toISOString() }
              : s
          ),
        },
      };
    }

    case "UPDATE_MILESTONE": {
      const { systemId, milestone } = action.payload;
      return {
        ...state,
        systems: {
          ...state.systems,
          items: state.systems.items.map((s) =>
            s.id === systemId
              ? {
                  ...s,
                  milestones: (s.milestones || []).map((m) =>
                    m.id === milestone.id ? milestone : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        },
      };
    }

    case "DELETE_MILESTONE": {
      const { systemId, milestoneId } = action.payload;
      return {
        ...state,
        systems: {
          ...state.systems,
          items: state.systems.items.map((s) =>
            s.id === systemId
              ? {
                  ...s,
                  milestones: (s.milestones || []).filter((m) => m.id !== milestoneId),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        },
      };
    }

    case "COMPLETE_MILESTONE": {
      const { systemId, milestoneId } = action.payload;
      return {
        ...state,
        systems: {
          ...state.systems,
          items: state.systems.items.map((s) =>
            s.id === systemId
              ? {
                  ...s,
                  milestones: (s.milestones || []).map((m) =>
                    m.id === milestoneId
                      ? { ...m, status: "achieved" as const, completedAt: new Date().toISOString() }
                      : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : s
          ),
        },
      };
    }

    // Migration: Convert standalone habits to system components
    case "MIGRATE_HABITS_TO_COMPONENTS": {
      if (state.habits.items.length === 0) {
        return state; // Nothing to migrate
      }

      // Group habits by their systemId, or by loop for orphaned habits
      const habitsBySystem = new Map<string, Habit[]>();
      const orphanedHabitsByLoop = new Map<string, Habit[]>();

      state.habits.items.forEach((habit) => {
        if (habit.systemId) {
          const existing = habitsBySystem.get(habit.systemId) || [];
          habitsBySystem.set(habit.systemId, [...existing, habit]);
        } else {
          // Orphaned habit - group by loop
          const loopKey = habit.loop || "Health";
          const existing = orphanedHabitsByLoop.get(loopKey) || [];
          orphanedHabitsByLoop.set(loopKey, [...existing, habit]);
        }
      });

      // Convert habits to components and add to existing systems
      let updatedSystems = state.systems.items.map((system) => {
        const systemHabits = habitsBySystem.get(system.id) || [];
        if (systemHabits.length === 0) return system;

        const newComponents: SystemComponent[] = systemHabits.map((habit) => ({
          id: habit.id, // Keep same ID for completion mapping
          title: habit.title,
          description: habit.description,
          type: habit.frequency === "daily" ? "daily" : habit.frequency === "weekly" ? "weekly" : "custom",
          cue: habit.cue,
          craving: habit.craving,
          response: habit.response,
          reward: habit.reward,
          frequency: habit.frequency,
          customDays: habit.customDays,
          timeOfDay: habit.timeOfDay,
          dayTypes: habit.dayTypes,
          dayTypeOverrides: habit.dayTypeOverrides,
          stackedAfter: habit.stackedAfter,
          stackedBefore: habit.stackedBefore,
          streak: habit.streak,
          longestStreak: habit.longestStreak,
          totalCompletions: habit.totalCompletions,
          status: habit.status,
          createdAt: habit.createdAt,
          updatedAt: new Date().toISOString(),
        }));

        return {
          ...system,
          components: [...(system.components || []), ...newComponents],
          updatedAt: new Date().toISOString(),
        };
      });

      // Create new "Legacy" systems for orphaned habits
      const newLegacySystems: System[] = [];
      orphanedHabitsByLoop.forEach((habits, loop) => {
        const now = new Date().toISOString();
        const newSystem: System = {
          id: `legacy_${loop.toLowerCase()}_${Date.now()}`,
          title: `${loop} Habits (Migrated)`,
          description: "Auto-created system from migrated standalone habits",
          loop: loop as LoopId,
          goalStatement: `Maintain my ${loop.toLowerCase()} habits`,
          linkedGoalId: undefined,
          identity: {
            id: `identity_${loop.toLowerCase()}_${Date.now()}`,
            statement: `I am someone who maintains ${loop.toLowerCase()} habits`,
            loop: loop as LoopId,
            createdAt: now,
            updatedAt: now,
          },
          components: habits.map((habit) => ({
            id: habit.id,
            title: habit.title,
            description: habit.description,
            type: habit.frequency === "daily" ? "daily" : habit.frequency === "weekly" ? "weekly" : "custom",
            cue: habit.cue,
            craving: habit.craving,
            response: habit.response,
            reward: habit.reward,
            frequency: habit.frequency,
            customDays: habit.customDays,
            timeOfDay: habit.timeOfDay,
            dayTypes: habit.dayTypes,
            dayTypeOverrides: habit.dayTypeOverrides,
            stackedAfter: habit.stackedAfter,
            stackedBefore: habit.stackedBefore,
            streak: habit.streak,
            longestStreak: habit.longestStreak,
            totalCompletions: habit.totalCompletions,
            status: habit.status,
            createdAt: habit.createdAt,
            updatedAt: now,
          })),
          milestones: [],
          metrics: [],
          environmentTweaks: [],
          obstaclePlaybook: [],
          status: "active",
          startedAt: now,
          createdAt: now,
          updatedAt: now,
        };
        newLegacySystems.push(newSystem);
      });

      // Convert habit completions to component completions
      const newCompletions: ComponentCompletion[] = state.habits.completions.map((hc) => {
        // Find which system this habit belongs to
        const habit = state.habits.items.find((h) => h.id === hc.habitId);
        const systemId = habit?.systemId || newLegacySystems.find((s) =>
          s.components?.some((c) => c.id === hc.habitId)
        )?.id || "";

        return {
          id: `cc_${hc.id}`,
          componentId: hc.habitId,
          systemId,
          date: hc.date,
          completedAt: hc.completedAt,
          notes: hc.notes,
        };
      });

      return {
        ...state,
        systems: {
          items: [...updatedSystems, ...newLegacySystems],
          completions: [...state.systems.completions, ...newCompletions],
        },
        // Clear habits after migration
        habits: {
          items: [],
          completions: [],
        },
      };
    }

    // Habits (@deprecated - use component actions)
    // Keeping for backward compatibility during migration
    case "ADD_HABIT":
      return {
        ...state,
        habits: {
          ...state.habits,
          items: [...state.habits.items, action.payload],
        },
      };

    case "UPDATE_HABIT":
      return {
        ...state,
        habits: {
          ...state.habits,
          items: state.habits.items.map((h) =>
            h.id === action.payload.id ? action.payload : h
          ),
        },
      };

    case "DELETE_HABIT":
      return {
        ...state,
        habits: {
          ...state.habits,
          items: state.habits.items.filter((h) => h.id !== action.payload),
        },
      };

    case "COMPLETE_HABIT": {
      const { habitId, date, notes } = action.payload;
      const completion: HabitCompletion = {
        id: `hc_${Date.now()}`,
        habitId,
        date,
        completedAt: new Date().toISOString(),
        notes,
      };
      // Update streak on habit
      const habit = state.habits.items.find((h) => h.id === habitId);
      const newCompletions = [...state.habits.completions, completion];
      const updatedItems = state.habits.items.map((h) => {
        if (h.id !== habitId) return h;
        const newStreak = h.streak + 1;
        return {
          ...h,
          streak: newStreak,
          longestStreak: Math.max(h.longestStreak, newStreak),
          totalCompletions: h.totalCompletions + 1,
        };
      });
      return {
        ...state,
        habits: {
          items: updatedItems,
          completions: newCompletions,
        },
      };
    }

    case "UNCOMPLETE_HABIT": {
      const { habitId, date } = action.payload;
      return {
        ...state,
        habits: {
          ...state.habits,
          completions: state.habits.completions.filter(
            (c) => !(c.habitId === habitId && c.date === date)
          ),
        },
      };
    }

    // Implementation Intentions
    case "ADD_INTENTION":
      return {
        ...state,
        intentions: { items: [...state.intentions.items, action.payload] },
      };

    case "UPDATE_INTENTION":
      return {
        ...state,
        intentions: {
          items: state.intentions.items.map((i) =>
            i.id === action.payload.id ? action.payload : i
          ),
        },
      };

    case "DELETE_INTENTION":
      return {
        ...state,
        intentions: {
          items: state.intentions.items.filter((i) => i.id !== action.payload),
        },
      };

    // Notes
    case "ADD_NOTE":
      return {
        ...state,
        notes: [...state.notes, action.payload],
      };

    case "UPDATE_NOTE":
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.payload.id ? action.payload : n
        ),
      };

    case "DELETE_NOTE":
      return {
        ...state,
        notes: state.notes.filter((n) => n.id !== action.payload),
      };

    // Quick Links
    case "ADD_QUICK_LINK":
      return {
        ...state,
        quickLinks: [...state.quickLinks, action.payload],
      };

    case "UPDATE_QUICK_LINK":
      return {
        ...state,
        quickLinks: state.quickLinks.map((l) =>
          l.id === action.payload.id ? action.payload : l
        ),
      };

    case "DELETE_QUICK_LINK":
      return {
        ...state,
        quickLinks: state.quickLinks.filter((l) => l.id !== action.payload),
      };

    // Checklists
    case "ADD_CHECKLIST":
      return {
        ...state,
        checklists: [...state.checklists, action.payload],
      };

    case "UPDATE_CHECKLIST":
      return {
        ...state,
        checklists: state.checklists.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case "DELETE_CHECKLIST":
      return {
        ...state,
        checklists: state.checklists.filter((c) => c.id !== action.payload),
      };

    // Journal
    case "ADD_JOURNAL_ENTRY":
      return {
        ...state,
        journal: [...state.journal, action.payload],
      };

    case "UPDATE_JOURNAL_ENTRY":
      return {
        ...state,
        journal: state.journal.map((j) =>
          j.id === action.payload.id ? action.payload : j
        ),
      };

    case "DELETE_JOURNAL_ENTRY":
      return {
        ...state,
        journal: state.journal.filter((j) => j.id !== action.payload),
      };

    // Timer Sessions (Pomodoro-style)
    case "ADD_TIMER_SESSION":
      return {
        ...state,
        timerSessions: [...state.timerSessions, action.payload],
      };

    // Task Timer (time tracking)
    case "START_TASK_TIMER": {
      const taskId = action.payload;
      const now = new Date().toISOString();

      // If there's already a timer running, stop it first
      if (state.activeTimer && state.activeTimer.taskId !== taskId) {
        // Save the previous timer's time entry
        const prevTimer = state.activeTimer;
        const prevTask = state.tasks.items.find(t => t.id === prevTimer.taskId);
        if (prevTask) {
          const elapsedSeconds = prevTimer.pausedAt
            ? prevTimer.accumulatedSeconds
            : prevTimer.accumulatedSeconds + Math.floor((Date.now() - new Date(prevTimer.startTime).getTime()) / 1000);
          const durationMinutes = Math.round(elapsedSeconds / 60);

          const timeEntry: TimeEntry = {
            id: `te_${Date.now()}`,
            startTime: prevTimer.startTime,
            endTime: now,
            durationMinutes,
          };

          const updatedPrevTask = {
            ...prevTask,
            timeEntries: [...(prevTask.timeEntries || []), timeEntry],
            actualMinutes: (prevTask.actualMinutes || 0) + durationMinutes,
          };

          return {
            ...state,
            tasks: {
              ...state.tasks,
              items: state.tasks.items.map(t => t.id === prevTask.id ? updatedPrevTask : t),
            },
            activeTimer: {
              taskId,
              startTime: now,
              accumulatedSeconds: 0,
            },
          };
        }
      }

      return {
        ...state,
        activeTimer: {
          taskId,
          startTime: now,
          accumulatedSeconds: 0,
        },
      };
    }

    case "PAUSE_TASK_TIMER": {
      if (!state.activeTimer || state.activeTimer.pausedAt) return state;

      const now = new Date().toISOString();
      const elapsed = Math.floor((Date.now() - new Date(state.activeTimer.startTime).getTime()) / 1000);

      return {
        ...state,
        activeTimer: {
          ...state.activeTimer,
          pausedAt: now,
          accumulatedSeconds: state.activeTimer.accumulatedSeconds + elapsed,
        },
      };
    }

    case "RESUME_TASK_TIMER": {
      if (!state.activeTimer || !state.activeTimer.pausedAt) return state;

      return {
        ...state,
        activeTimer: {
          ...state.activeTimer,
          startTime: new Date().toISOString(),
          pausedAt: undefined,
        },
      };
    }

    case "STOP_TASK_TIMER": {
      if (!state.activeTimer) return state;

      const timer = state.activeTimer;
      const task = state.tasks.items.find(t => t.id === timer.taskId);
      if (!task) {
        return { ...state, activeTimer: null };
      }

      const now = new Date().toISOString();
      const elapsedSeconds = timer.pausedAt
        ? timer.accumulatedSeconds
        : timer.accumulatedSeconds + Math.floor((Date.now() - new Date(timer.startTime).getTime()) / 1000);
      const durationMinutes = Math.round(elapsedSeconds / 60);

      // Only save if at least 1 minute was tracked
      if (durationMinutes < 1) {
        return { ...state, activeTimer: null };
      }

      const timeEntry: TimeEntry = {
        id: `te_${Date.now()}`,
        startTime: timer.startTime,
        endTime: now,
        durationMinutes,
        note: action.payload?.note,
      };

      const updatedTask = {
        ...task,
        timeEntries: [...(task.timeEntries || []), timeEntry],
        actualMinutes: (task.actualMinutes || 0) + durationMinutes,
      };

      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: state.tasks.items.map(t => t.id === task.id ? updatedTask : t),
        },
        activeTimer: null,
      };
    }

    case "CANCEL_TASK_TIMER":
      return { ...state, activeTimer: null };

    // Dashboards
    case "UPDATE_DASHBOARD":
      return {
        ...state,
        dashboards: {
          ...state.dashboards,
          [action.payload.loopId]: action.payload,
        },
      };

    // Challenges
    case "SET_CHALLENGES":
      return {
        ...state,
        challenges: { ...state.challenges, items: action.payload },
      };

    case "ACTIVATE_CHALLENGE":
      return {
        ...state,
        challenges: {
          ...state.challenges,
          activeIds: [...state.challenges.activeIds, action.payload],
        },
      };

    case "DEACTIVATE_CHALLENGE":
      return {
        ...state,
        challenges: {
          ...state.challenges,
          activeIds: state.challenges.activeIds.filter((id) => id !== action.payload),
        },
      };

    // UI
    case "SET_ACTIVE_TAB":
      return {
        ...state,
        ui: { ...state.ui, activeTab: action.payload },
      };

    case "SELECT_LOOP":
      return {
        ...state,
        ui: { ...state.ui, selectedLoop: action.payload },
      };

    case "SET_VIEW_MODE":
      return {
        ...state,
        ui: { ...state.ui, viewMode: action.payload },
      };

    case "OPEN_MODAL":
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: { ...state.ui.modals, [action.payload.modal]: action.payload.value },
        },
      };

    case "CLOSE_MODAL":
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            [action.payload]: action.payload === "challengeDetail" || action.payload === "taskDetail" ? null : false,
          },
        },
      };

    // Babysitter
    case "ADD_CAREGIVER":
      return {
        ...state,
        babysitter: {
          ...state.babysitter,
          caregivers: [...state.babysitter.caregivers, action.payload],
        },
      };

    case "UPDATE_CAREGIVER":
      return {
        ...state,
        babysitter: {
          ...state.babysitter,
          caregivers: state.babysitter.caregivers.map((c) =>
            c.id === action.payload.id ? action.payload : c
          ),
        },
      };

    case "DEACTIVATE_CAREGIVER":
      return {
        ...state,
        babysitter: {
          ...state.babysitter,
          caregivers: state.babysitter.caregivers.map((c) =>
            c.id === action.payload
              ? { ...c, active: false, updatedAt: new Date().toISOString() }
              : c
          ),
        },
      };

    case "ADD_BABYSITTER_SESSION":
      return {
        ...state,
        babysitter: {
          ...state.babysitter,
          sessions: [...state.babysitter.sessions, action.payload],
        },
      };

    case "UPDATE_BABYSITTER_SESSION":
      return {
        ...state,
        babysitter: {
          ...state.babysitter,
          sessions: state.babysitter.sessions.map((s) =>
            s.id === action.payload.id ? action.payload : s
          ),
        },
      };

    case "DELETE_BABYSITTER_SESSION":
      return {
        ...state,
        babysitter: {
          ...state.babysitter,
          sessions: state.babysitter.sessions.filter((s) => s.id !== action.payload),
        },
      };

    // Babysitter Portal
    case "SET_HOUSEHOLD_INFO":
      return {
        ...state,
        householdInfo: action.payload,
      };

    case "UPDATE_HOUSEHOLD_INFO":
      return {
        ...state,
        householdInfo: {
          ...state.householdInfo,
          ...action.payload,
          updatedAt: new Date().toISOString(),
        },
      };

    case "ADD_BABYSITTER_PIN":
      return {
        ...state,
        babysitterPins: [...state.babysitterPins, action.payload],
      };

    case "UPDATE_BABYSITTER_PIN":
      return {
        ...state,
        babysitterPins: state.babysitterPins.map((p) =>
          p.caregiverId === action.payload.caregiverId ? action.payload : p
        ),
      };

    case "DELETE_BABYSITTER_PIN":
      return {
        ...state,
        babysitterPins: state.babysitterPins.filter((p) => p.caregiverId !== action.payload),
      };

    case "ADD_SCHEDULE_ENTRY":
      return {
        ...state,
        babysitterSchedule: [...state.babysitterSchedule, action.payload],
      };

    case "UPDATE_SCHEDULE_ENTRY":
      return {
        ...state,
        babysitterSchedule: state.babysitterSchedule.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };

    case "DELETE_SCHEDULE_ENTRY":
      return {
        ...state,
        babysitterSchedule: state.babysitterSchedule.filter((e) => e.id !== action.payload),
      };

    // Babysitter Payments
    case "ADD_BABYSITTER_PAYMENT":
      return {
        ...state,
        babysitterPayments: [...state.babysitterPayments, action.payload],
      };

    case "UPDATE_BABYSITTER_PAYMENT":
      return {
        ...state,
        babysitterPayments: state.babysitterPayments.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case "DELETE_BABYSITTER_PAYMENT":
      return {
        ...state,
        babysitterPayments: state.babysitterPayments.filter((p) => p.id !== action.payload),
      };

    case "MARK_SESSIONS_PAID":
      // Mark multiple sessions as paid when a payment is matched
      return {
        ...state,
        babysitter: {
          ...state.babysitter,
          sessions: state.babysitter.sessions.map((s) =>
            action.payload.sessionIds.includes(s.id)
              ? { ...s, paymentStatus: "paid" as const, paymentId: action.payload.paymentId }
              : s
          ),
        },
      };

    // Health
    case "SET_HEALTH_SUMMARY":
      return {
        ...state,
        health: {
          ...state.health,
          summary: action.payload,
          lastSynced: new Date().toISOString(),
          isLoading: false,
          error: null,
        },
      };

    case "SET_HEALTH_LOADING":
      return {
        ...state,
        health: {
          ...state.health,
          isLoading: action.payload,
        },
      };

    case "SET_HEALTH_ERROR":
      return {
        ...state,
        health: {
          ...state.health,
          error: action.payload,
          isLoading: false,
        },
      };

    // Calendar
    case "SET_CALENDAR_EVENTS":
      return {
        ...state,
        calendar: {
          ...state.calendar,
          events: action.payload,
          lastFetched: new Date().toISOString(),
          loading: false,
          error: null,
        },
      };

    case "SET_CALENDAR_CALENDARS":
      return {
        ...state,
        calendar: {
          ...state.calendar,
          calendars: action.payload,
        },
      };

    case "SET_CALENDAR_LOADING":
      return {
        ...state,
        calendar: {
          ...state.calendar,
          loading: action.payload,
        },
      };

    case "SET_CALENDAR_ERROR":
      return {
        ...state,
        calendar: {
          ...state.calendar,
          error: action.payload,
          loading: false,
        },
      };

    case "SET_CALENDAR_EMBED_URL":
      return {
        ...state,
        calendar: {
          ...state.calendar,
          embedUrl: action.payload,
        },
      };

    // Media
    case "ADD_MEDIA_ENTRY":
      return {
        ...state,
        media: {
          ...state.media,
          entries: [...state.media.entries, action.payload],
        },
      };

    case "UPDATE_MEDIA_ENTRY":
      return {
        ...state,
        media: {
          ...state.media,
          entries: state.media.entries.map((e) =>
            e.id === action.payload.id ? action.payload : e
          ),
        },
      };

    case "DELETE_MEDIA_ENTRY":
      return {
        ...state,
        media: {
          ...state.media,
          entries: state.media.entries.filter((e) => e.id !== action.payload),
        },
      };

    case "SET_MEDIA_ENTRIES":
      return {
        ...state,
        media: {
          ...state.media,
          entries: action.payload,
        },
      };

    // Directional Document
    case "SET_DIRECTIONAL_DOCUMENT":
      return {
        ...state,
        directionalDocument: action.payload,
      };

    case "UPDATE_CORE_DIRECTIONS": {
      if (!state.directionalDocument) return state;
      return {
        ...state,
        directionalDocument: {
          ...state.directionalDocument,
          core: {
            ...state.directionalDocument.core,
            ...action.payload,
          },
          updatedAt: new Date().toISOString(),
        },
      };
    }

    case "UPDATE_LOOP_DIRECTIONS": {
      if (!state.directionalDocument) return state;
      const { loopId, directions } = action.payload;
      return {
        ...state,
        directionalDocument: {
          ...state.directionalDocument,
          loops: {
            ...state.directionalDocument.loops,
            [loopId]: {
              ...state.directionalDocument.loops[loopId],
              ...directions,
            },
          },
          updatedAt: new Date().toISOString(),
        },
      };
    }

    // Hydration - merge remote state but preserve seed data if remote is empty
    case "HYDRATE": {
      const payload = action.payload;
      // Special handling for mealPrep - don't overwrite seed data with empty arrays from cloud
      let mealPrepMerged = payload.mealPrep;
      if (payload.mealPrep) {
        const hasRemoteRecipes = (payload.mealPrep.recipes?.length ?? 0) > 0;
        const hasRemoteTechniques = (payload.mealPrep.techniqueLibrary?.length ?? 0) > 0;
        mealPrepMerged = {
          ...state.mealPrep,
          ...payload.mealPrep,
          // Keep seed recipes if remote has none
          recipes: hasRemoteRecipes ? payload.mealPrep.recipes! : state.mealPrep.recipes,
          techniqueLibrary: hasRemoteTechniques ? payload.mealPrep.techniqueLibrary! : state.mealPrep.techniqueLibrary,
        };
      }
      // Special handling for finance - ensure all required arrays exist
      let financeMerged = payload.finance;
      if (payload.finance) {
        financeMerged = {
          ...state.finance,
          ...payload.finance,
          // Ensure arrays are never undefined
          connections: payload.finance.connections ?? state.finance.connections ?? [],
          accounts: payload.finance.accounts ?? state.finance.accounts ?? [],
          transactions: payload.finance.transactions ?? state.finance.transactions ?? [],
          categories: (payload.finance.categories?.length ?? 0) > 0
            ? payload.finance.categories!
            : state.finance.categories ?? [],
          rules: (payload.finance.rules?.length ?? 0) > 0
            ? payload.finance.rules!
            : state.finance.rules ?? [],
          expenses: payload.finance.expenses ?? state.finance.expenses ?? [],
          loopBudgets: payload.finance.loopBudgets ?? state.finance.loopBudgets ?? [],
          monthlyIncome: payload.finance.monthlyIncome ?? state.finance.monthlyIncome ?? 0,
        };
      }
      // Special handling for routines - deduplicate by ID
      let routinesMerged = payload.routines;
      if (payload.routines?.items) {
        const seenIds = new Set<string>();
        const deduplicatedItems = payload.routines.items.filter((r: Routine) => {
          if (seenIds.has(r.id)) {
            console.log('[HYDRATE] Removing duplicate routine:', r.id, r.title);
            return false;
          }
          seenIds.add(r.id);
          return true;
        });
        routinesMerged = {
          ...state.routines,
          ...payload.routines,
          items: deduplicatedItems,
        };
      }
      // Special handling for systems - ensure arrays are never undefined
      let systemsMerged = payload.systems;
      if (payload.systems) {
        systemsMerged = {
          ...state.systems,
          ...payload.systems,
          items: payload.systems.items ?? state.systems.items ?? [],
          completions: payload.systems.completions ?? state.systems.completions ?? [],
        };
      }
      // Special handling for habits - ensure arrays are never undefined
      let habitsMerged = payload.habits;
      if (payload.habits) {
        habitsMerged = {
          ...state.habits,
          ...payload.habits,
          items: payload.habits.items ?? state.habits.items ?? [],
          completions: payload.habits.completions ?? state.habits.completions ?? [],
        };
      }
      // Special handling for goals - ensure all timeframes have arrays
      let goalsMerged = payload.goals;
      if (payload.goals) {
        goalsMerged = {
          annual: payload.goals.annual ?? state.goals.annual ?? [],
          quarterly: payload.goals.quarterly ?? state.goals.quarterly ?? [],
          monthly: payload.goals.monthly ?? state.goals.monthly ?? [],
          weekly: payload.goals.weekly ?? state.goals.weekly ?? [],
          daily: payload.goals.daily ?? state.goals.daily ?? [],
        };
      }
      // Special handling for specialDates - ensure arrays are never undefined
      let specialDatesMerged = payload.specialDates;
      if (payload.specialDates) {
        specialDatesMerged = {
          ...state.specialDates,
          ...payload.specialDates,
          people: payload.specialDates.people ?? state.specialDates.people ?? [],
          dates: payload.specialDates.dates ?? state.specialDates.dates ?? [],
        };
      }
      return {
        ...state,
        ...payload,
        mealPrep: mealPrepMerged ?? state.mealPrep,
        finance: financeMerged ?? state.finance,
        routines: routinesMerged ?? state.routines,
        systems: systemsMerged ?? state.systems,
        habits: habitsMerged ?? state.habits,
        goals: goalsMerged ?? state.goals,
        specialDates: specialDatesMerged ?? state.specialDates,
      };
    }

    // Reset state to defaults (for user switching)
    case "RESET_STATE": {
      console.log('[AppContext] Resetting state to defaults');
      return {
        ...defaultState,
        // Preserve UI state
        ui: state.ui,
      };
    }

    // Template actions
    case "CREATE_FROM_TEMPLATE": {
      const { templateId, projectName } = action.payload;
      // Check built-in templates first, then custom templates
      const template = findTemplateById(templateId) ||
        state.customTemplates.find(t => t.id === templateId);
      if (!template) {
        console.warn(`Template not found: ${templateId}`);
        return state;
      }

      // Calculate total estimated time from all subtasks
      const totalEstimate = template.tasks.reduce(
        (sum, t) => sum + (t.estimatedMinutes || 0),
        0
      );

      // Create the parent task from the template (this becomes one "loop dot")
      const parentTask = createTask(projectName || template.name, template.loop, {
        description: template.description,
        estimateMinutes: totalEstimate > 0 ? totalEstimate : undefined,
        status: "todo",
        source: "generated",
      });

      // Create subtasks linked to the parent task
      const subtasks = template.tasks.map((templateTask, index) =>
        createTask(templateTask.title, template.loop, {
          description: templateTask.description,
          estimateMinutes: templateTask.estimatedMinutes,
          parentId: parentTask.id, // Link to parent task
          order: templateTask.order || index,
          status: "todo",
          source: "generated",
        })
      );

      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: [...state.tasks.items, parentTask, ...subtasks],
        },
      };
    }

    case "ADD_CUSTOM_TEMPLATE":
      return {
        ...state,
        customTemplates: [...state.customTemplates, action.payload],
      };

    case "UPDATE_CUSTOM_TEMPLATE":
      return {
        ...state,
        customTemplates: state.customTemplates.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case "DELETE_CUSTOM_TEMPLATE":
      return {
        ...state,
        customTemplates: state.customTemplates.filter(t => t.id !== action.payload),
      };

    // Smart Schedule
    case "SET_SMART_SCHEDULE_ENABLED":
      return {
        ...state,
        smartSchedule: {
          ...state.smartSchedule,
          enabled: action.payload,
        },
      };

    case "MARK_DATE": {
      const existingIndex = state.smartSchedule.markedDates.findIndex(
        m => m.date === action.payload.date
      );
      const newMarkedDates = existingIndex >= 0
        ? state.smartSchedule.markedDates.map((m, i) =>
            i === existingIndex ? action.payload : m
          )
        : [...state.smartSchedule.markedDates, action.payload];
      return {
        ...state,
        smartSchedule: {
          ...state.smartSchedule,
          markedDates: newMarkedDates,
        },
      };
    }

    case "UNMARK_DATE":
      return {
        ...state,
        smartSchedule: {
          ...state.smartSchedule,
          markedDates: state.smartSchedule.markedDates.filter(
            m => m.date !== action.payload
          ),
        },
      };

    case "UPDATE_DAY_TYPE_CONFIG":
      return {
        ...state,
        smartSchedule: {
          ...state.smartSchedule,
          dayTypeConfigs: {
            ...state.smartSchedule.dayTypeConfigs,
            [action.payload.dayType]: action.payload,
          },
        },
      };

    case "BULK_MARK_DATES": {
      // Merge new dates, replacing any existing ones for the same date
      const existingDates = new Map(
        state.smartSchedule.markedDates.map(m => [m.date, m])
      );
      action.payload.forEach(m => existingDates.set(m.date, m));
      return {
        ...state,
        smartSchedule: {
          ...state.smartSchedule,
          markedDates: Array.from(existingDates.values()),
        },
      };
    }

    case "ADD_CUSTOM_DAY_TYPE":
      return {
        ...state,
        smartSchedule: {
          ...state.smartSchedule,
          customDayTypes: [...(state.smartSchedule.customDayTypes || []), action.payload],
          dayTypeConfigs: {
            ...state.smartSchedule.dayTypeConfigs,
            [action.payload.dayType]: action.payload,
          },
        },
      };

    case "UPDATE_CUSTOM_DAY_TYPE":
      return {
        ...state,
        smartSchedule: {
          ...state.smartSchedule,
          customDayTypes: (state.smartSchedule.customDayTypes || []).map(dt =>
            dt.dayType === action.payload.dayType ? action.payload : dt
          ),
          dayTypeConfigs: {
            ...state.smartSchedule.dayTypeConfigs,
            [action.payload.dayType]: action.payload,
          },
        },
      };

    case "DELETE_CUSTOM_DAY_TYPE": {
      const dayTypeId = action.payload;
      return {
        ...state,
        smartSchedule: {
          ...state.smartSchedule,
          customDayTypes: (state.smartSchedule.customDayTypes || []).filter(
            dt => dt.dayType !== dayTypeId
          ),
          // Remove marked dates that use this day type
          markedDates: state.smartSchedule.markedDates.filter(
            m => m.dayType !== dayTypeId
          ),
          // Remove from dayTypeConfigs
          dayTypeConfigs: Object.fromEntries(
            Object.entries(state.smartSchedule.dayTypeConfigs).filter(
              ([key]) => key !== dayTypeId
            )
          ) as typeof state.smartSchedule.dayTypeConfigs,
        },
      };
    }

    // Meal Prep
    case "SET_KITCHEN_PROFILE":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          kitchenProfile: action.payload,
        },
      };

    case "UPDATE_KITCHEN_PROFILE":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          kitchenProfile: state.mealPrep.kitchenProfile
            ? { ...state.mealPrep.kitchenProfile, ...action.payload, updatedAt: new Date().toISOString() }
            : null,
        },
      };

    case "COMPLETE_MEAL_PREP_ONBOARDING":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          onboardingComplete: true,
        },
      };

    case "ADD_RECIPE":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          recipes: [...state.mealPrep.recipes, action.payload],
        },
      };

    case "UPDATE_RECIPE":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          recipes: state.mealPrep.recipes.map(r =>
            r.id === action.payload.id ? { ...action.payload, updatedAt: new Date().toISOString() } : r
          ),
        },
      };

    case "DELETE_RECIPE":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          recipes: state.mealPrep.recipes.filter(r => r.id !== action.payload),
        },
      };

    case "TOGGLE_RECIPE_FAVORITE":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          recipes: state.mealPrep.recipes.map(r =>
            r.id === action.payload ? { ...r, isFavorite: !r.isFavorite, updatedAt: new Date().toISOString() } : r
          ),
        },
      };

    case "LOG_RECIPE_MADE":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          recipes: state.mealPrep.recipes.map(r =>
            r.id === action.payload.recipeId
              ? { ...r, timesMade: r.timesMade + 1, lastMade: action.payload.date, updatedAt: new Date().toISOString() }
              : r
          ),
        },
      };

    case "SET_MEAL_PLAN":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          mealPlans: [...state.mealPrep.mealPlans.filter(mp => mp.weekOf !== action.payload.weekOf), action.payload],
        },
      };

    case "UPDATE_MEAL_PLAN":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          mealPlans: state.mealPrep.mealPlans.map(mp =>
            mp.id === action.payload.id ? { ...action.payload, updatedAt: new Date().toISOString() } : mp
          ),
        },
      };

    case "ADD_TECHNIQUE_ENTRY":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          techniqueLibrary: [...state.mealPrep.techniqueLibrary, action.payload],
        },
      };

    case "UPDATE_TECHNIQUE_ENTRY":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          techniqueLibrary: state.mealPrep.techniqueLibrary.map(te =>
            te.id === action.payload.id ? { ...action.payload, lastUpdated: new Date().toISOString() } : te
          ),
        },
      };

    case "DELETE_TECHNIQUE_ENTRY":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          techniqueLibrary: state.mealPrep.techniqueLibrary.filter(te => te.id !== action.payload),
        },
      };

    case "TOGGLE_TECHNIQUE_FAVORITE":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          techniqueLibrary: state.mealPrep.techniqueLibrary.map(te =>
            te.id === action.payload
              ? { ...te, isFavorite: !te.isFavorite, lastUpdated: new Date().toISOString() }
              : te
          ),
        },
      };

    case "UPDATE_TECHNIQUE_NOTES":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          techniqueLibrary: state.mealPrep.techniqueLibrary.map(te =>
            te.id === action.payload.techniqueId
              ? { ...te, userNotes: action.payload.notes, lastUpdated: new Date().toISOString() }
              : te
          ),
        },
      };

    case "TOGGLE_TIP_HIGHLIGHT":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          techniqueLibrary: state.mealPrep.techniqueLibrary.map(te =>
            te.id === action.payload.techniqueId
              ? {
                  ...te,
                  tips: te.tips.map(tip =>
                    tip.id === action.payload.tipId
                      ? { ...tip, isHighlighted: !tip.isHighlighted }
                      : tip
                  ),
                  lastUpdated: new Date().toISOString(),
                }
              : te
          ),
        },
      };

    // Waste tracking actions
    case "ADD_WASTE_ENTRY":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          wasteLog: [...state.mealPrep.wasteLog, action.payload],
        },
      };

    case "UPDATE_WASTE_ENTRY":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          wasteLog: state.mealPrep.wasteLog.map(w =>
            w.id === action.payload.id ? action.payload : w
          ),
        },
      };

    case "DELETE_WASTE_ENTRY":
      return {
        ...state,
        mealPrep: {
          ...state.mealPrep,
          wasteLog: state.mealPrep.wasteLog.filter(w => w.id !== action.payload),
        },
      };

    // Workout
    case "SET_GYM_PROFILE":
      return {
        ...state,
        workout: {
          ...state.workout,
          gymProfile: action.payload,
        },
      };

    case "UPDATE_GYM_PROFILE":
      return {
        ...state,
        workout: {
          ...state.workout,
          gymProfile: state.workout.gymProfile
            ? { ...state.workout.gymProfile, ...action.payload, updatedAt: new Date().toISOString() }
            : null,
        },
      };

    case "COMPLETE_WORKOUT_ONBOARDING":
      // Load default exercises if exercise library is empty
      const defaultExercises = state.workout.exercises.length === 0
        ? getDefaultExercises()
        : state.workout.exercises;
      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: defaultExercises,
          onboardingComplete: true,
        },
      };

    case "ADD_EXERCISE":
      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: [...state.workout.exercises, action.payload],
        },
      };

    case "UPDATE_EXERCISE":
      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.map(e =>
            e.id === action.payload.id ? { ...action.payload, updatedAt: new Date().toISOString() } : e
          ),
        },
      };

    case "DELETE_EXERCISE":
      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.filter(e => e.id !== action.payload),
        },
      };

    case "TOGGLE_EXERCISE_FAVORITE":
      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.map(e =>
            e.id === action.payload ? { ...e, isFavorite: !e.isFavorite, updatedAt: new Date().toISOString() } : e
          ),
        },
      };

    case "LOG_EXERCISE_PERFORMED":
      return {
        ...state,
        workout: {
          ...state.workout,
          exercises: state.workout.exercises.map(e =>
            e.id === action.payload.exerciseId
              ? { ...e, timesPerformed: e.timesPerformed + 1, lastPerformed: action.payload.date, updatedAt: new Date().toISOString() }
              : e
          ),
        },
      };

    case "ADD_TRAINING_TIP":
      return {
        ...state,
        workout: {
          ...state.workout,
          trainingTips: [...state.workout.trainingTips, action.payload],
        },
      };

    case "UPDATE_TRAINING_TIP":
      return {
        ...state,
        workout: {
          ...state.workout,
          trainingTips: state.workout.trainingTips.map(t =>
            t.id === action.payload.id ? { ...action.payload, lastUpdated: new Date().toISOString() } : t
          ),
        },
      };

    case "DELETE_TRAINING_TIP":
      return {
        ...state,
        workout: {
          ...state.workout,
          trainingTips: state.workout.trainingTips.filter(t => t.id !== action.payload),
        },
      };

    case "TOGGLE_TRAINING_TIP_FAVORITE":
      return {
        ...state,
        workout: {
          ...state.workout,
          trainingTips: state.workout.trainingTips.map(t =>
            t.id === action.payload
              ? { ...t, isFavorite: !t.isFavorite, lastUpdated: new Date().toISOString() }
              : t
          ),
        },
      };

    case "SET_WORKOUT_PLAN":
      return {
        ...state,
        workout: {
          ...state.workout,
          workoutPlans: [...state.workout.workoutPlans.filter(wp => wp.weekOf !== action.payload.weekOf), action.payload],
        },
      };

    case "UPDATE_WORKOUT_PLAN":
      return {
        ...state,
        workout: {
          ...state.workout,
          workoutPlans: state.workout.workoutPlans.map(wp =>
            wp.id === action.payload.id ? { ...action.payload, updatedAt: new Date().toISOString() } : wp
          ),
        },
      };

    case "DELETE_WORKOUT_PLAN":
      return {
        ...state,
        workout: {
          ...state.workout,
          workoutPlans: state.workout.workoutPlans.filter(wp => wp.id !== action.payload),
        },
      };

    case "ADD_WORKOUT_LOG":
      return {
        ...state,
        workout: {
          ...state.workout,
          workoutLogs: [...state.workout.workoutLogs, action.payload],
        },
      };

    case "UPDATE_WORKOUT_LOG":
      return {
        ...state,
        workout: {
          ...state.workout,
          workoutLogs: state.workout.workoutLogs.map(wl =>
            wl.id === action.payload.id ? action.payload : wl
          ),
        },
      };

    case "DELETE_WORKOUT_LOG":
      return {
        ...state,
        workout: {
          ...state.workout,
          workoutLogs: state.workout.workoutLogs.filter(wl => wl.id !== action.payload),
        },
      };

    // Finance - Connections
    // When adding a new connection, replace ALL existing connections
    // This ensures old expired connections don't persist via Firebase sync
    case "SET_FINANCE_CONNECTION": {
      return {
        ...state,
        finance: {
          ...state.finance,
          connections: [action.payload],
          // Clear accounts from old connections
          accounts: [],
          // Clear transactions from old connections
          transactions: [],
        },
      };
    }

    case "UPDATE_FINANCE_CONNECTION":
      return {
        ...state,
        finance: {
          ...state.finance,
          connections: state.finance.connections.map(c =>
            c.id === action.payload.id ? { ...c, ...action.payload, updatedAt: new Date().toISOString() } : c
          ),
        },
      };

    case "DELETE_FINANCE_CONNECTION":
      return {
        ...state,
        finance: {
          ...state.finance,
          connections: state.finance.connections.filter(c => c.id !== action.payload),
          // Also remove related accounts
          accounts: state.finance.accounts.filter(a => a.connectionId !== action.payload),
        },
      };

    // Finance - Accounts
    case "SET_FINANCE_ACCOUNTS":
      return {
        ...state,
        finance: { ...state.finance, accounts: action.payload },
      };

    case "UPDATE_FINANCE_ACCOUNT":
      return {
        ...state,
        finance: {
          ...state.finance,
          accounts: state.finance.accounts.map(a =>
            a.id === action.payload.id ? { ...a, ...action.payload, updatedAt: new Date().toISOString() } : a
          ),
        },
      };

    // Finance - Transactions
    case "SET_FINANCE_TRANSACTIONS":
      return {
        ...state,
        finance: { ...state.finance, transactions: action.payload },
      };

    case "UPSERT_FINANCE_TRANSACTIONS": {
      // Merge new transactions, replacing existing ones with same externalId
      const existingByExternalId = new Map(
        state.finance.transactions.map(t => [t.externalId, t])
      );
      action.payload.forEach(t => existingByExternalId.set(t.externalId, t));
      return {
        ...state,
        finance: {
          ...state.finance,
          transactions: Array.from(existingByExternalId.values()),
        },
      };
    }

    case "UPDATE_FINANCE_TRANSACTION":
      return {
        ...state,
        finance: {
          ...state.finance,
          transactions: state.finance.transactions.map(t =>
            t.id === action.payload.id ? { ...t, ...action.payload, updatedAt: new Date().toISOString() } : t
          ),
        },
      };

    case "DELETE_FINANCE_TRANSACTION":
      return {
        ...state,
        finance: {
          ...state.finance,
          transactions: state.finance.transactions.filter(t => t.id !== action.payload),
        },
      };

    case "BULK_CATEGORIZE_TRANSACTIONS": {
      const { ids, categoryId, loop } = action.payload;
      const idSet = new Set(ids);
      return {
        ...state,
        finance: {
          ...state.finance,
          transactions: state.finance.transactions.map(t =>
            idSet.has(t.id)
              ? { ...t, categoryId, loop, isReviewed: true, updatedAt: new Date().toISOString() }
              : t
          ),
        },
      };
    }

    // Finance - Categories
    case "ADD_FINANCE_CATEGORY":
      return {
        ...state,
        finance: {
          ...state.finance,
          categories: [...state.finance.categories, action.payload],
        },
      };

    case "UPDATE_FINANCE_CATEGORY":
      return {
        ...state,
        finance: {
          ...state.finance,
          categories: state.finance.categories.map(c =>
            c.id === action.payload.id ? { ...c, ...action.payload } : c
          ),
        },
      };

    case "DELETE_FINANCE_CATEGORY":
      return {
        ...state,
        finance: {
          ...state.finance,
          categories: state.finance.categories.filter(c => c.id !== action.payload),
          // Also remove rules that reference this category
          rules: state.finance.rules.filter(r => r.categoryId !== action.payload),
        },
      };

    // Finance - Rules
    case "ADD_CATEGORY_RULE":
      return {
        ...state,
        finance: {
          ...state.finance,
          rules: [...state.finance.rules, action.payload],
        },
      };

    case "UPDATE_CATEGORY_RULE":
      return {
        ...state,
        finance: {
          ...state.finance,
          rules: state.finance.rules.map(r =>
            r.id === action.payload.id ? { ...r, ...action.payload } : r
          ),
        },
      };

    case "DELETE_CATEGORY_RULE":
      return {
        ...state,
        finance: {
          ...state.finance,
          rules: state.finance.rules.filter(r => r.id !== action.payload),
        },
      };

    // Finance - Sync Status & Settings
    case "SET_FINANCE_SYNC_STATUS":
      return {
        ...state,
        finance: {
          ...state.finance,
          syncStatus: { ...state.finance.syncStatus, ...action.payload },
        },
      };

    case "UPDATE_FINANCE_SETTINGS":
      return {
        ...state,
        finance: {
          ...state.finance,
          settings: { ...state.finance.settings, ...action.payload },
        },
      };

    case "RESET_ALL_FINANCE":
      // Nuclear reset - clears ALL finance data in one atomic operation
      // This is harder for Firebase sync to partially override
      return {
        ...state,
        finance: getDefaultFinanceState(),
      };

    // Finance - Budget Expenses (shared with Budget widget)
    case "SET_FINANCE_EXPENSES": {
      // Sync to localStorage for Budget widget
      saveExpensesToLocalStorage(action.payload);
      return {
        ...state,
        finance: { ...state.finance, expenses: action.payload },
      };
    }

    case "ADD_FINANCE_EXPENSE": {
      const newExpenses = [...state.finance.expenses, action.payload];
      saveExpensesToLocalStorage(newExpenses);
      return {
        ...state,
        finance: { ...state.finance, expenses: newExpenses },
      };
    }

    case "UPDATE_FINANCE_EXPENSE": {
      const updatedExpenses = state.finance.expenses.map((e) =>
        e.id === action.payload.id ? action.payload : e
      );
      saveExpensesToLocalStorage(updatedExpenses);
      return {
        ...state,
        finance: { ...state.finance, expenses: updatedExpenses },
      };
    }

    case "DELETE_FINANCE_EXPENSE": {
      const filteredExpenses = state.finance.expenses.filter(
        (e) => e.id !== action.payload
      );
      saveExpensesToLocalStorage(filteredExpenses);
      return {
        ...state,
        finance: { ...state.finance, expenses: filteredExpenses },
      };
    }

    // Finance - Loop Budgets
    case "SET_LOOP_BUDGETS": {
      saveLoopBudgetsToLocalStorage(action.payload);
      return {
        ...state,
        finance: { ...state.finance, loopBudgets: action.payload },
      };
    }

    case "UPDATE_LOOP_BUDGET": {
      const existingIdx = state.finance.loopBudgets.findIndex(
        (b) => b.loop === action.payload.loop
      );
      const newBudgets =
        existingIdx >= 0
          ? state.finance.loopBudgets.map((b, i) =>
              i === existingIdx ? action.payload : b
            )
          : [...state.finance.loopBudgets, action.payload];
      saveLoopBudgetsToLocalStorage(newBudgets);
      return {
        ...state,
        finance: { ...state.finance, loopBudgets: newBudgets },
      };
    }

    // Finance - Monthly Income
    case "SET_MONTHLY_INCOME": {
      saveMonthlyIncomeToLocalStorage(action.payload);
      return {
        ...state,
        finance: { ...state.finance, monthlyIncome: action.payload },
      };
    }

    // Special Dates - People
    case "ADD_PERSON":
      return {
        ...state,
        specialDates: {
          ...state.specialDates,
          people: [...state.specialDates.people, action.payload],
        },
      };

    case "UPDATE_PERSON":
      return {
        ...state,
        specialDates: {
          ...state.specialDates,
          people: state.specialDates.people.map((p) =>
            p.id === action.payload.id ? action.payload : p
          ),
        },
      };

    case "DELETE_PERSON":
      return {
        ...state,
        specialDates: {
          ...state.specialDates,
          people: state.specialDates.people.filter((p) => p.id !== action.payload),
          // Also remove any dates associated with this person
          dates: state.specialDates.dates.filter((d) => d.personId !== action.payload),
        },
      };

    // Special Dates - Dates
    case "ADD_SPECIAL_DATE":
      return {
        ...state,
        specialDates: {
          ...state.specialDates,
          dates: [...state.specialDates.dates, action.payload],
        },
      };

    case "UPDATE_SPECIAL_DATE":
      return {
        ...state,
        specialDates: {
          ...state.specialDates,
          dates: state.specialDates.dates.map((d) =>
            d.id === action.payload.id ? action.payload : d
          ),
        },
      };

    case "DELETE_SPECIAL_DATE":
      return {
        ...state,
        specialDates: {
          ...state.specialDates,
          dates: state.specialDates.dates.filter((d) => d.id !== action.payload),
        },
      };

    // Decision actions
    case "ADD_DECISION":
      return {
        ...state,
        decisions: {
          ...state.decisions,
          decisions: [...state.decisions.decisions, action.payload],
        },
      };

    case "UPDATE_DECISION":
      return {
        ...state,
        decisions: {
          ...state.decisions,
          decisions: state.decisions.decisions.map((d) =>
            d.id === action.payload.id ? action.payload : d
          ),
        },
      };

    case "DELETE_DECISION":
      return {
        ...state,
        decisions: {
          ...state.decisions,
          decisions: state.decisions.decisions.filter((d) => d.id !== action.payload),
        },
      };

    case "ADD_QUICK_DECISION":
      return {
        ...state,
        decisions: {
          ...state.decisions,
          quickDecisions: [...state.decisions.quickDecisions, action.payload],
        },
      };

    case "UPDATE_QUICK_DECISION":
      return {
        ...state,
        decisions: {
          ...state.decisions,
          quickDecisions: state.decisions.quickDecisions.map((d) =>
            d.id === action.payload.id ? action.payload : d
          ),
        },
      };

    case "DELETE_QUICK_DECISION":
      return {
        ...state,
        decisions: {
          ...state.decisions,
          quickDecisions: state.decisions.quickDecisions.filter((d) => d.id !== action.payload),
        },
      };

    default:
      return state;
  }
}

// Context
type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

const AppContext = createContext<AppContextType | null>(null);

// Deep merge helper for state restoration
function deepMergeState(defaultState: AppState, savedState: Partial<AppState>): AppState {
  return {
    user: savedState.user ? {
      profile: savedState.user.profile ?? defaultState.user.profile,
      prototype: savedState.user.prototype ?? defaultState.user.prototype,
      onboardingComplete: savedState.user.onboardingComplete ?? defaultState.user.onboardingComplete,
    } : defaultState.user,
    loops: {
      ...defaultState.loops,
      ...savedState.loops,
      states: savedState.loops?.states
        ? { ...defaultState.loops.states, ...savedState.loops.states }
        : defaultState.loops.states,
    },
    tasks: {
      ...defaultState.tasks,
      ...savedState.tasks,
    },
    projects: savedState.projects ?? defaultState.projects,
    labels: savedState.labels ?? defaultState.labels,
    goals: savedState.goals ?? defaultState.goals,
    routines: {
      ...defaultState.routines,
      ...savedState.routines,
      // Deduplicate routines by ID
      items: (() => {
        const items = savedState.routines?.items ?? defaultState.routines.items;
        const seenIds = new Set<string>();
        return items.filter((r: Routine) => {
          if (seenIds.has(r.id)) return false;
          seenIds.add(r.id);
          return true;
        });
      })(),
    },
    // Systems & Habits (habits deprecated, being migrated to system.components)
    systems: {
      ...defaultState.systems,
      ...savedState.systems,
      // Ensure completions array exists
      completions: savedState.systems?.completions ?? defaultState.systems.completions ?? [],
    },
    // @deprecated - Will be migrated to system.components
    habits: {
      ...defaultState.habits,
      ...savedState.habits,
    },
    intentions: {
      ...defaultState.intentions,
      ...savedState.intentions,
    },
    // Widgets & Dashboard Data
    dashboards: savedState.dashboards
      ? { ...defaultState.dashboards, ...savedState.dashboards }
      : defaultState.dashboards,
    notes: savedState.notes ?? defaultState.notes,
    quickLinks: savedState.quickLinks ?? defaultState.quickLinks,
    checklists: savedState.checklists ?? defaultState.checklists,
    journal: savedState.journal ?? defaultState.journal,
    timerSessions: savedState.timerSessions ?? defaultState.timerSessions,
    // Challenges
    challenges: {
      ...defaultState.challenges,
      ...savedState.challenges,
    },
    // Babysitter - ensure caregivers defaults if empty
    babysitter: {
      ...defaultState.babysitter,
      ...savedState.babysitter,
      caregivers: (savedState.babysitter?.caregivers?.length ?? 0) > 0
        ? savedState.babysitter!.caregivers
        : defaultState.babysitter.caregivers,
    },
    // Babysitter Portal - persists
    householdInfo: savedState.householdInfo
      ? { ...defaultState.householdInfo, ...savedState.householdInfo }
      : defaultState.householdInfo,
    babysitterPins: savedState.babysitterPins ?? defaultState.babysitterPins,
    babysitterSchedule: savedState.babysitterSchedule ?? defaultState.babysitterSchedule,
    babysitterPayments: savedState.babysitterPayments ?? defaultState.babysitterPayments,
    // Health - don't persist, always fetch fresh
    health: defaultState.health,
    // Calendar - don't persist, always fetch fresh
    calendar: defaultState.calendar,
    // Media - persists
    media: {
      ...defaultState.media,
      ...savedState.media,
    },
    // Directional Document - persists
    directionalDocument: savedState.directionalDocument ?? defaultState.directionalDocument,
    // Custom Templates - persists
    customTemplates: savedState.customTemplates ?? defaultState.customTemplates,
    // Smart Schedule - persists
    smartSchedule: savedState.smartSchedule
      ? {
          ...defaultState.smartSchedule,
          ...savedState.smartSchedule,
          customDayTypes: savedState.smartSchedule.customDayTypes ?? [],
        }
      : defaultState.smartSchedule,
    // Meal Prep - persists, but use seed data if saved arrays are empty
    mealPrep: savedState.mealPrep
      ? {
          ...defaultState.mealPrep,
          ...savedState.mealPrep,
          // Use seed recipes if user hasn't added any yet
          recipes: (savedState.mealPrep.recipes?.length ?? 0) > 0
            ? savedState.mealPrep.recipes!
            : defaultState.mealPrep.recipes,
          // Use seed techniques if user hasn't added any yet
          techniqueLibrary: (savedState.mealPrep.techniqueLibrary?.length ?? 0) > 0
            ? savedState.mealPrep.techniqueLibrary!
            : defaultState.mealPrep.techniqueLibrary,
        }
      : defaultState.mealPrep,
    // Workout - persists
    workout: savedState.workout
      ? {
          ...defaultState.workout,
          ...savedState.workout,
        }
      : defaultState.workout,
    // Finance - persists, preserve seed categories/rules if saved is empty
    // Also load expenses/budgets from localStorage to sync with Budget widget
    finance: savedState.finance
      ? {
          ...defaultState.finance,
          ...savedState.finance,
          // Use seed categories if user hasn't customized
          categories: (savedState.finance.categories?.length ?? 0) > 0
            ? savedState.finance.categories!
            : defaultState.finance.categories,
          // Use seed rules if user hasn't customized
          rules: (savedState.finance.rules?.length ?? 0) > 0
            ? savedState.finance.rules!
            : defaultState.finance.rules,
          // Load expenses from localStorage (Budget widget's source)
          expenses: loadExpensesFromLocalStorage(),
          // Load loop budgets from localStorage
          loopBudgets: loadLoopBudgetsFromLocalStorage(),
          // Load monthly income from localStorage
          monthlyIncome: loadMonthlyIncomeFromLocalStorage(),
          // Always reset sync status on load
          syncStatus: defaultState.finance.syncStatus,
        }
      : {
          ...defaultState.finance,
          // Even without saved finance state, load from localStorage
          expenses: loadExpensesFromLocalStorage(),
          loopBudgets: loadLoopBudgetsFromLocalStorage(),
          monthlyIncome: loadMonthlyIncomeFromLocalStorage(),
        },
    // Special Dates - persists
    specialDates: savedState.specialDates
      ? {
          ...defaultState.specialDates,
          ...savedState.specialDates,
          people: savedState.specialDates.people ?? defaultState.specialDates.people,
          dates: savedState.specialDates.dates ?? defaultState.specialDates.dates,
        }
      : defaultState.specialDates,
    // Decisions - persists
    decisions: savedState.decisions
      ? {
          ...defaultState.decisions,
          ...savedState.decisions,
          decisions: savedState.decisions.decisions ?? defaultState.decisions.decisions,
          quickDecisions: savedState.decisions.quickDecisions ?? defaultState.decisions.quickDecisions,
        }
      : defaultState.decisions,
    // Active Timer - persists (allows resuming timer across sessions)
    activeTimer: savedState.activeTimer ?? defaultState.activeTimer,
    ui: defaultState.ui, // Always use fresh UI state
  };
}

// Actions that are NOT user-initiated (system/sync actions)
// These don't count as "user made a change" for sync purposes
const SYSTEM_ACTIONS = new Set([
  'HYDRATE',
  // Health (fetched from API)
  'SET_HEALTH_SUMMARY', 'SET_HEALTH_LOADING', 'SET_HEALTH_ERROR',
  // Calendar (fetched from API)
  'SET_CALENDAR_EVENTS', 'SET_CALENDAR_CALENDARS', 'SET_CALENDAR_LOADING', 'SET_CALENDAR_ERROR',
  // UI state (not persisted to cloud)
  'SET_ACTIVE_TAB', 'SELECT_LOOP', 'SET_VIEW_MODE', 'OPEN_MODAL', 'CLOSE_MODAL',
]);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  // Track if this is the initial mount
  const isInitialMount = React.useRef(true);

  // Initialize state from localStorage synchronously
  const [state, baseDispatch] = useReducer(appReducer, defaultState, (initial) => {
    console.log('[AppContext] Init - defaultState recipes:', initial.mealPrep.recipes.length, 'techniques:', initial.mealPrep.techniqueLibrary.length);
    try {
      const savedStateRaw = localStorage.getItem(STORAGE_KEYS.APP_STATE);
      if (savedStateRaw) {
        const savedState = JSON.parse(savedStateRaw) as Partial<AppState>;
        console.log('[AppContext] Saved state found - mealPrep.recipes:', savedState.mealPrep?.recipes?.length ?? 'N/A');
        const merged = deepMergeState(initial, savedState);
        console.log('[AppContext] After merge - recipes:', merged.mealPrep.recipes.length);
        return merged;
      }
    } catch (error) {
      console.error("Error restoring state from localStorage:", error);
    }
    console.log('[AppContext] No saved state - using default with', initial.mealPrep.recipes.length, 'recipes');
    return initial;
  });

  // Wrap dispatch to mark user changes for non-system actions
  const dispatch = useCallback((action: AppAction) => {
    console.log('[AppContext] Dispatch:', action.type, SYSTEM_ACTIONS.has(action.type) ? '(system)' : '(USER)');
    // If this is a user action (not HYDRATE or system sync), mark it
    if (!SYSTEM_ACTIONS.has(action.type)) {
      markUserChange();
    }
    baseDispatch(action);
  }, []);

  // Persist to localStorage on state change (skip initial mount)
  useEffect(() => {
    // Skip the first render to avoid overwriting saved state
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Don't persist UI state
    const { ui, ...persistableState } = state;
    try {
      localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(persistableState));
    } catch (error) {
      console.error("Error persisting state:", error);
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

// Selector hooks
export function useUser() {
  const { state } = useApp();
  return state.user;
}

export function useLoops() {
  const { state } = useApp();
  return state.loops;
}

export function useTasks() {
  const { state } = useApp();
  return state.tasks;
}

export function useGoals() {
  const { state } = useApp();
  return state.goals;
}

export function useRoutines() {
  const { state } = useApp();
  return state.routines;
}

export function useChallenges() {
  const { state } = useApp();
  return state.challenges;
}

export function useProjects() {
  const { state } = useApp();
  return state.projects;
}

export function useLabels() {
  const { state } = useApp();
  return state.labels;
}

export function useUI() {
  const { state } = useApp();
  return state.ui;
}

export function useSystems() {
  const { state } = useApp();
  return state.systems;
}

export function useHabits() {
  const { state } = useApp();
  return state.habits;
}

// Hook for component completions (new system)
export function useComponentCompletions() {
  const { state } = useApp();
  return state.systems.completions;
}

export function useIntentions() {
  const { state } = useApp();
  return state.intentions;
}

export function useDashboards() {
  const { state } = useApp();
  return state.dashboards;
}

export function useNotes() {
  const { state } = useApp();
  return state.notes;
}

export function useChecklists() {
  const { state } = useApp();
  return state.checklists;
}

export function useJournal() {
  const { state } = useApp();
  return state.journal;
}

export function useBabysitter() {
  const { state } = useApp();
  return state.babysitter;
}

export function useBabysitterPortal() {
  const { state } = useApp();
  return {
    householdInfo: state.householdInfo,
    pins: state.babysitterPins,
    schedule: state.babysitterSchedule,
    payments: state.babysitterPayments,
    caregivers: state.babysitter.caregivers,
    sessions: state.babysitter.sessions,
  };
}

export function useHealth() {
  const { state } = useApp();
  return state.health;
}

export function useCalendar() {
  const { state } = useApp();
  return state.calendar;
}

export function useMedia() {
  const { state } = useApp();
  return state.media;
}

export function useDirectionalDocument() {
  const { state } = useApp();
  return state.directionalDocument;
}

export function useSmartSchedule() {
  const { state } = useApp();
  return state.smartSchedule;
}

export function useMealPrep() {
  const { state } = useApp();
  return state.mealPrep;
}

export function useKitchenProfile() {
  const { state } = useApp();
  return state.mealPrep.kitchenProfile;
}

export function useRecipes() {
  const { state } = useApp();
  return state.mealPrep.recipes;
}

export function useWorkout() {
  const { state } = useApp();
  return state.workout;
}

export function useGymProfile() {
  const { state } = useApp();
  return state.workout.gymProfile;
}

export function useExercises() {
  const { state } = useApp();
  return state.workout.exercises;
}

// Finance hooks
export function useFinance() {
  const { state } = useApp();
  return state.finance;
}

export function useFinanceConnections() {
  const { state } = useApp();
  return state.finance.connections ?? [];
}

export function useFinanceAccounts() {
  const { state } = useApp();
  return state.finance.accounts ?? [];
}

export function useFinanceTransactions() {
  const { state } = useApp();
  return state.finance.transactions ?? [];
}

export function useFinanceCategories() {
  const { state } = useApp();
  return state.finance.categories ?? [];
}

export function useFinanceRules() {
  const { state } = useApp();
  return state.finance.rules ?? [];
}

export function useFinanceExpenses() {
  const { state } = useApp();
  return state.finance.expenses ?? [];
}

export function useLoopBudgets() {
  const { state } = useApp();
  return state.finance.loopBudgets ?? [];
}

export function useMonthlyIncome() {
  const { state } = useApp();
  return state.finance.monthlyIncome ?? 0;
}

// Decision hooks
export function useDecisions() {
  const { state } = useApp();
  return state.decisions;
}

export function useDecisionsList() {
  const { state } = useApp();
  return state.decisions.decisions;
}

export function useQuickDecisions() {
  const { state } = useApp();
  return state.decisions.quickDecisions;
}
