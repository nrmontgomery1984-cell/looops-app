// Enhanced Task types for Personal Operating System

import { LoopId, LoopStateType, Priority, TaskStatus, Duration } from "./core";
import { ArchetypeId } from "./identity";

// Recurrence types
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type RecurrencePattern = {
  frequency: RecurrenceFrequency;
  interval: number; // Every X days/weeks/months/years
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc. (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  endDate?: string; // Optional end date for the recurrence
  count?: number; // Optional number of occurrences
};

// Preset recurrence options for UI
export const RECURRENCE_PRESETS: { id: string; label: string; pattern: RecurrencePattern }[] = [
  { id: "daily", label: "Daily", pattern: { frequency: "daily", interval: 1 } },
  { id: "weekdays", label: "Weekdays", pattern: { frequency: "weekly", interval: 1, daysOfWeek: [1, 2, 3, 4, 5] } },
  { id: "weekly", label: "Weekly", pattern: { frequency: "weekly", interval: 1 } },
  { id: "biweekly", label: "Every 2 weeks", pattern: { frequency: "weekly", interval: 2 } },
  { id: "monthly", label: "Monthly", pattern: { frequency: "monthly", interval: 1 } },
  { id: "quarterly", label: "Every 3 months", pattern: { frequency: "monthly", interval: 3 } },
  { id: "yearly", label: "Yearly", pattern: { frequency: "yearly", interval: 1 } },
];

// Task constraints for filtering
export type NoiseLevel = "silent" | "quiet" | "moderate" | "any";
export type LocationType = "home" | "office" | "gym" | "outdoors" | "anywhere";
export type EnergyLevel = "low" | "medium" | "high";
export type FocusLevel = "shallow" | "medium" | "deep";

export type TaskConstraints = {
  minTimeMinutes?: number;
  maxTimeMinutes?: number;
  noiseLevel?: NoiseLevel;
  location?: LocationType;
  equipment?: string[];
  energyLevel?: EnergyLevel;
  focusLevel?: FocusLevel;
};

// Task framing by archetype
export type TaskFraming = {
  archetypeId: ArchetypeId;
  framedTitle: string;
  framedDescription?: string;
  motivationalNote?: string;
};

// Task source
export type TaskSource = "manual" | "challenge" | "import" | "generated" | "recurring" | "todoist" | "local";

// Enhanced Task type
export type Task = {
  id: string;
  title: string;
  description?: string;

  // Organization
  loop: LoopId;
  subLoop?: string;
  projectId?: string;
  sectionId?: string;

  // Hierarchy (for subtasks)
  parentId?: string; // Parent task ID for subtasks
  order: number; // Sort order within project/section

  // Priority and status
  priority: Priority;
  status: TaskStatus;

  // Timing
  dueDate?: string; // YYYY-MM-DD
  startDate?: string;
  recurrence?: RecurrencePattern; // Recurring task pattern

  // Time tracking
  estimateMinutes?: number;
  actualMinutes?: number;

  // Metadata
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
  labels?: string[]; // Label IDs
  tags?: string[];
  dependencies?: string[];

  // Source tracking
  source?: TaskSource;
  sourceChallengeId?: string;
  externalId?: string; // ID in external system (e.g., Todoist)
  externalUrl?: string; // URL to task in external system

  // NEW: Personal OS fields
  requiredState?: LoopStateType; // Which state this task is appropriate for
  constraints?: TaskConstraints; // Time, noise, location, equipment
  framing?: TaskFraming; // Archetype-based presentation
  goalId?: string; // Link to goal hierarchy
};

// Create a new task with defaults
export function createTask(
  title: string,
  loop: LoopId,
  options?: Partial<Omit<Task, "id" | "title" | "loop" | "createdAt">>
): Task {
  const now = new Date().toISOString();
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    loop,
    priority: 4,
    status: "inbox",
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...options,
  };
}

// Challenge type (preserved from original)
export type Challenge = {
  id: string;
  loop: LoopId;
  difficulty: number; // 1-5
  duration: Duration;
  title: string;
  description: string;
  tags: string[];
  inspired_by?: string[];
  related_archetypes?: Partial<Record<ArchetypeId, number>>;
};

// Task template for seed tasks
export type TaskTemplate = {
  id: string;
  title: string;
  description?: string;
  loop: LoopId;
  subLoop?: string;
  requiredState: LoopStateType;
  constraints: TaskConstraints;
  priority: Priority;
  estimateMinutes: number;
  tags?: string[];

  // Archetype-specific framing
  archetypeFraming: Record<ArchetypeId, {
    title: string;
    description: string;
  }>;
};

// Filter tasks by constraints
export function filterTasksByConstraints(
  tasks: Task[],
  availableTime?: number,
  noiseLevel?: NoiseLevel,
  location?: LocationType,
  equipment?: string[]
): Task[] {
  return tasks.filter((task) => {
    const c = task.constraints;
    if (!c) return true;

    // Time filter
    if (availableTime !== undefined) {
      if (c.minTimeMinutes && availableTime < c.minTimeMinutes) return false;
      if (c.maxTimeMinutes && availableTime < c.maxTimeMinutes) return true;
    }

    // Noise filter
    if (noiseLevel && c.noiseLevel) {
      const noiseLevels: NoiseLevel[] = ["silent", "quiet", "moderate", "any"];
      const requiredIdx = noiseLevels.indexOf(c.noiseLevel);
      const availableIdx = noiseLevels.indexOf(noiseLevel);
      if (requiredIdx > availableIdx) return false;
    }

    // Location filter
    if (location && c.location && c.location !== "anywhere") {
      if (c.location !== location) return false;
    }

    // Equipment filter
    if (equipment && c.equipment && c.equipment.length > 0) {
      const hasEquipment = c.equipment.every((eq) => equipment.includes(eq));
      if (!hasEquipment) return false;
    }

    return true;
  });
}

// Filter tasks by loop state
export function filterTasksByState(
  tasks: Task[],
  loopStates: Record<LoopId, LoopStateType>
): Task[] {
  return tasks.filter((task) => {
    if (!task.requiredState) return true;

    const currentState = loopStates[task.loop];
    const stateOrder: LoopStateType[] = ["HIBERNATE", "RECOVER", "MAINTAIN", "BUILD"];
    const currentIdx = stateOrder.indexOf(currentState);
    const requiredIdx = stateOrder.indexOf(task.requiredState);

    // Task is valid if current state is at or above required state
    return currentIdx >= requiredIdx;
  });
}

// Sort tasks by priority
export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Priority 0 (Someday) goes last
    if (a.priority === 0 && b.priority !== 0) return 1;
    if (b.priority === 0 && a.priority !== 0) return -1;
    if (a.priority === 0 && b.priority === 0) return 0;

    // Otherwise sort by priority number (1 is highest)
    return a.priority - b.priority;
  });
}

// Calculate the next due date based on recurrence pattern
export function calculateNextDueDate(
  currentDueDate: string | undefined,
  recurrence: RecurrencePattern
): string {
  const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
  const nextDate = new Date(baseDate);

  switch (recurrence.frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + recurrence.interval);
      break;

    case "weekly":
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        // Find the next day of week in the list
        const currentDay = nextDate.getDay();
        const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);

        // Find the next day after current
        let nextDay = sortedDays.find((d) => d > currentDay);

        if (nextDay !== undefined) {
          // Same week, advance to that day
          nextDate.setDate(nextDate.getDate() + (nextDay - currentDay));
        } else {
          // Next week, go to first day in list
          const daysUntilNextWeek = 7 - currentDay + sortedDays[0];
          nextDate.setDate(nextDate.getDate() + daysUntilNextWeek + (recurrence.interval - 1) * 7);
        }
      } else {
        // Simple weekly - add interval weeks
        nextDate.setDate(nextDate.getDate() + recurrence.interval * 7);
      }
      break;

    case "monthly":
      if (recurrence.dayOfMonth) {
        // Set to specific day of month
        nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
        nextDate.setDate(Math.min(recurrence.dayOfMonth, getDaysInMonth(nextDate)));
      } else {
        // Same day of month
        nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
      }
      break;

    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + recurrence.interval);
      break;

    case "custom":
      // For custom, just add interval days
      nextDate.setDate(nextDate.getDate() + recurrence.interval);
      break;
  }

  return nextDate.toISOString().split("T")[0];
}

// Helper to get days in a month
function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Get human-readable recurrence description
export function getRecurrenceLabel(recurrence: RecurrencePattern): string {
  const { frequency, interval, daysOfWeek } = recurrence;

  if (frequency === "daily") {
    return interval === 1 ? "Daily" : `Every ${interval} days`;
  }

  if (frequency === "weekly") {
    if (daysOfWeek && daysOfWeek.length > 0) {
      if (daysOfWeek.length === 5 && daysOfWeek.every((d) => d >= 1 && d <= 5)) {
        return "Weekdays";
      }
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const days = daysOfWeek.map((d) => dayNames[d]).join(", ");
      return interval === 1 ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`;
    }
    return interval === 1 ? "Weekly" : `Every ${interval} weeks`;
  }

  if (frequency === "monthly") {
    return interval === 1 ? "Monthly" : `Every ${interval} months`;
  }

  if (frequency === "yearly") {
    return interval === 1 ? "Yearly" : `Every ${interval} years`;
  }

  return `Every ${interval} days`;
}

// Create next occurrence of a recurring task
export function createNextRecurrence(task: Task): Task | null {
  if (!task.recurrence) return null;

  // Check if we've hit the end date
  if (task.recurrence.endDate) {
    const endDate = new Date(task.recurrence.endDate);
    const today = new Date();
    if (today > endDate) return null;
  }

  const nextDueDate = calculateNextDueDate(task.dueDate, task.recurrence);

  // Check if next date is past end date
  if (task.recurrence.endDate && nextDueDate > task.recurrence.endDate) {
    return null;
  }

  return createTask(task.title, task.loop, {
    description: task.description,
    subLoop: task.subLoop,
    projectId: task.projectId,
    priority: task.priority,
    status: "todo",
    dueDate: nextDueDate,
    recurrence: task.recurrence,
    estimateMinutes: task.estimateMinutes,
    labels: task.labels,
    tags: task.tags,
    requiredState: task.requiredState,
    constraints: task.constraints,
    goalId: task.goalId,
    source: "recurring",
  });
}
