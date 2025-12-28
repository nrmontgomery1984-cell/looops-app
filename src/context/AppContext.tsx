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
  INITIAL_BABYSITTER_STATE,
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

// User profile type
export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  timezone?: string;
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

  // Systems & Habits
  systems: {
    items: System[];
  };

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
  // Systems & Habits
  systems: {
    items: [],
  },
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

  // Habit actions
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

  // Health actions
  | { type: "SET_HEALTH_SUMMARY"; payload: HealthSummary }
  | { type: "SET_HEALTH_LOADING"; payload: boolean }
  | { type: "SET_HEALTH_ERROR"; payload: string | null }

  // Calendar actions
  | { type: "SET_CALENDAR_EVENTS"; payload: CalendarEvent[] }
  | { type: "SET_CALENDAR_CALENDARS"; payload: CalendarInfo[] }
  | { type: "SET_CALENDAR_LOADING"; payload: boolean }
  | { type: "SET_CALENDAR_ERROR"; payload: string | null }

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

  // UI actions
  | { type: "SET_ACTIVE_TAB"; payload: TabId }
  | { type: "SELECT_LOOP"; payload: LoopId | null }
  | { type: "SET_VIEW_MODE"; payload: "visual" | "kanban" }
  | { type: "OPEN_MODAL"; payload: { modal: keyof AppState["ui"]["modals"]; value: string | boolean } }
  | { type: "CLOSE_MODAL"; payload: keyof AppState["ui"]["modals"] }

  // Hydration
  | { type: "HYDRATE"; payload: Partial<AppState> };

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

    case "ADD_ROUTINE":
      return {
        ...state,
        routines: { ...state.routines, items: [...state.routines.items, action.payload] },
      };

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
        systems: { items: [...state.systems.items, action.payload] },
      };

    case "UPDATE_SYSTEM":
      return {
        ...state,
        systems: {
          items: state.systems.items.map((s) =>
            s.id === action.payload.id ? action.payload : s
          ),
        },
      };

    case "DELETE_SYSTEM":
      return {
        ...state,
        systems: {
          items: state.systems.items.filter((s) => s.id !== action.payload),
        },
      };

    // Habits
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

    // Hydration
    case "HYDRATE":
      return { ...state, ...action.payload };

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
    },
    // Systems & Habits
    systems: {
      ...defaultState.systems,
      ...savedState.systems,
    },
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
    try {
      const savedStateRaw = localStorage.getItem(STORAGE_KEYS.APP_STATE);
      if (savedStateRaw) {
        const savedState = JSON.parse(savedStateRaw) as Partial<AppState>;
        return deepMergeState(initial, savedState);
      }
    } catch (error) {
      console.error("Error restoring state from localStorage:", error);
    }
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
