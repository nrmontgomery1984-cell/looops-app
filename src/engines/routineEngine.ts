// Routine Engine - Manages routine scheduling, task generation, and streak tracking
// Updated for multi-step routines spanning multiple loops

import {
  Routine,
  RoutineCompletion,
  RoutineSchedule,
  RoutineStreak,
  RoutineStep,
  DayOfWeek,
  TimeOfDay,
  getRoutinesDueToday,
  getRoutineDuration,
  getRoutineLoops,
  sortRoutinesByTimeOfDay,
  ROUTINE_TEMPLATES,
  createRoutineFromTemplate,
} from "../types/routines";
import { Task, createTask } from "../types/tasks";
import { LoopId } from "../types/core";

// Generate tasks from a routine's steps
// Each step becomes its own task, tagged with the routine ID
export function generateTasksFromRoutine(routine: Routine, dueDate: string): Task[] {
  return routine.steps.map((step, index) =>
    createTask(step.title, step.loop, {
      description: `Step ${index + 1} of ${routine.title}`,
      subLoop: step.subLoop,
      priority: step.optional ? 4 : 2, // 4 = low priority, 2 = medium priority
      status: "todo",
      dueDate,
      estimateMinutes: step.estimateMinutes,
      tags: ["routine", `routine:${routine.id}`, routine.schedule.timeOfDay],
      source: "recurring",
    })
  );
}

// Generate tasks for all routines due today
export function generateRoutineTasks(
  routines: Routine[],
  existingTasks: Task[],
  date: Date = new Date()
): Task[] {
  const dateStr = date.toISOString().split("T")[0];
  const dueRoutines = getRoutinesDueToday(routines, date);

  const newTasks: Task[] = [];

  for (const routine of dueRoutines) {
    // Check if tasks for this routine already exist for today
    const existingRoutineTasks = existingTasks.filter(
      (t) =>
        t.dueDate === dateStr &&
        t.tags?.includes(`routine:${routine.id}`)
    );

    // If we don't have all the steps generated, generate them
    if (existingRoutineTasks.length < routine.steps.length) {
      const existingTitles = new Set(existingRoutineTasks.map((t) => t.title));
      const missingSteps = routine.steps.filter(
        (step) => !existingTitles.has(step.title)
      );

      for (const step of missingSteps) {
        newTasks.push(
          createTask(step.title, step.loop, {
            description: `Part of ${routine.title}`,
            subLoop: step.subLoop,
            priority: step.optional ? 4 : 2, // 4 = low priority, 2 = medium priority
            status: "todo",
            dueDate: dateStr,
            estimateMinutes: step.estimateMinutes,
            tags: ["routine", `routine:${routine.id}`, routine.schedule.timeOfDay],
            source: "recurring",
          })
        );
      }
    }
  }

  return newTasks;
}

// Create a completion record for a routine
export function createRoutineCompletion(
  routine: Routine,
  completedSteps: string[],
  skippedSteps: string[],
  notes?: string
): RoutineCompletion {
  const requiredSteps = routine.steps.filter((s) => !s.optional);
  const requiredCompleted = requiredSteps.every(
    (s) => completedSteps.includes(s.id) || skippedSteps.includes(s.id)
  );

  return {
    id: `completion_${routine.id}_${Date.now()}`,
    routineId: routine.id,
    completedAt: new Date().toISOString(),
    completedSteps,
    skippedSteps,
    notes,
    fullyCompleted: requiredCompleted && skippedSteps.length === 0,
  };
}

// Update streak when completing a routine
export function updateStreakOnCompletion(
  routine: Routine,
  completionDate: string,
  fullyCompleted: boolean = true
): RoutineStreak {
  const { streak } = routine;
  const today = new Date(completionDate);
  const lastCompleted = streak.lastCompletedDate
    ? new Date(streak.lastCompletedDate)
    : null;

  let newCurrentStreak = streak.currentStreak;

  if (lastCompleted) {
    // Calculate days since last completion
    const daysDiff = Math.floor(
      (today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if streak continues based on routine frequency
    const continuesStreak = checkStreakContinuity(routine.schedule, daysDiff, today, lastCompleted);

    if (continuesStreak && fullyCompleted) {
      newCurrentStreak += 1;
    } else if (!continuesStreak) {
      // Streak broken, start new streak
      newCurrentStreak = fullyCompleted ? 1 : 0;
    }
    // If continues but not fully completed, keep current streak (partial credit)
  } else {
    // First completion
    newCurrentStreak = fullyCompleted ? 1 : 0;
  }

  const totalCompletions = streak.totalCompletions + 1;

  return {
    currentStreak: newCurrentStreak,
    longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
    lastCompletedDate: completionDate,
    totalCompletions,
    completionRate: calculateCompletionRate(routine, totalCompletions),
  };
}

// Check if streak continues based on schedule
function checkStreakContinuity(
  schedule: RoutineSchedule,
  daysDiff: number,
  today: Date,
  lastCompleted: Date
): boolean {
  switch (schedule.frequency) {
    case "daily":
      // Streak continues if completed yesterday or today
      return daysDiff <= 1;

    case "weekdays":
      // Streak continues if last completion was yesterday (weekday)
      // or if last was Friday and today is Monday
      if (daysDiff === 1) return true;
      if (daysDiff === 3) {
        const lastDay = lastCompleted.getDay();
        const todayDay = today.getDay();
        return lastDay === 5 && todayDay === 1; // Friday to Monday
      }
      return false;

    case "weekends":
      // Saturday/Sunday
      if (daysDiff === 1) return true;
      if (daysDiff === 5 || daysDiff === 6) {
        // Last weekend to this weekend
        const lastDay = lastCompleted.getDay();
        const todayDay = today.getDay();
        return (lastDay === 0 && todayDay === 6) || (lastDay === 6 && todayDay === 0);
      }
      return false;

    case "weekly":
    case "biweekly":
      // Weekly: within 7-9 days (allow some flexibility)
      const maxDays = schedule.frequency === "biweekly" ? 16 : 9;
      return daysDiff <= maxDays;

    case "monthly":
      // Monthly: within 32-35 days
      return daysDiff <= 35;

    case "custom":
      // For custom, check if within double the expected interval
      if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        const interval = 7 / schedule.daysOfWeek.length;
        return daysDiff <= interval * 2;
      }
      return daysDiff <= 7;

    default:
      return daysDiff <= 1;
  }
}

// Calculate completion rate based on routine age and completions
function calculateCompletionRate(routine: Routine, totalCompletions: number): number {
  const createdAt = new Date(routine.createdAt);
  const now = new Date();
  const daysSinceCreation = Math.max(
    1,
    Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Estimate expected completions based on frequency
  let expectedCompletions: number;
  switch (routine.schedule.frequency) {
    case "daily":
      expectedCompletions = daysSinceCreation;
      break;
    case "weekdays":
      expectedCompletions = Math.floor(daysSinceCreation * (5 / 7));
      break;
    case "weekends":
      expectedCompletions = Math.floor(daysSinceCreation * (2 / 7));
      break;
    case "weekly":
      expectedCompletions = Math.floor(daysSinceCreation / 7);
      break;
    case "biweekly":
      expectedCompletions = Math.floor(daysSinceCreation / 14);
      break;
    case "monthly":
      expectedCompletions = Math.floor(daysSinceCreation / 30);
      break;
    case "custom":
      if (routine.schedule.daysOfWeek) {
        expectedCompletions = Math.floor(
          daysSinceCreation * (routine.schedule.daysOfWeek.length / 7)
        );
      } else {
        expectedCompletions = daysSinceCreation;
      }
      break;
    default:
      expectedCompletions = daysSinceCreation;
  }

  expectedCompletions = Math.max(1, expectedCompletions);
  return Math.min(100, Math.round((totalCompletions / expectedCompletions) * 100));
}

// Update streak when skipping a routine
export function updateStreakOnSkip(routine: Routine): RoutineStreak {
  return {
    ...routine.streak,
    currentStreak: 0, // Reset streak on skip
  };
}

// Get routine statistics
export type RoutineStats = {
  totalRoutines: number;
  activeRoutines: number;
  completedToday: number;
  dueToday: number;
  overallCompletionRate: number;
  longestCurrentStreak: number;
  topStreakRoutine?: Routine;
  loopCoverage: LoopId[]; // Which loops are covered by routines
  totalEstimatedMinutes: number;
};

export function calculateRoutineStats(
  routines: Routine[],
  completionsToday: RoutineCompletion[]
): RoutineStats {
  const activeRoutines = routines.filter((r) => r.status === "active");
  const dueToday = getRoutinesDueToday(activeRoutines);
  const completedToday = completionsToday.filter((c) => c.fullyCompleted).length;

  const totalCompletionRate =
    activeRoutines.length > 0
      ? activeRoutines.reduce((sum, r) => sum + r.streak.completionRate, 0) /
        activeRoutines.length
      : 0;

  const sortedByStreak = [...activeRoutines].sort(
    (a, b) => b.streak.currentStreak - a.streak.currentStreak
  );

  // Calculate loop coverage (unique loops covered by all routines)
  const allLoops = new Set<LoopId>();
  activeRoutines.forEach((r) => {
    getRoutineLoops(r).forEach((loop) => allLoops.add(loop));
  });

  // Calculate total estimated time for today's routines
  const totalEstimatedMinutes = dueToday.reduce(
    (sum, r) => sum + getRoutineDuration(r),
    0
  );

  return {
    totalRoutines: routines.length,
    activeRoutines: activeRoutines.length,
    completedToday,
    dueToday: dueToday.length,
    overallCompletionRate: Math.round(totalCompletionRate),
    longestCurrentStreak: sortedByStreak[0]?.streak.currentStreak || 0,
    topStreakRoutine: sortedByStreak[0],
    loopCoverage: Array.from(allLoops),
    totalEstimatedMinutes,
  };
}

// Group routines by primary loop (the loop with most steps)
export function groupRoutinesByPrimaryLoop(routines: Routine[]): Record<LoopId, Routine[]> {
  const grouped: Partial<Record<LoopId, Routine[]>> = {};

  for (const routine of routines) {
    // Find the primary loop (most steps)
    const loopCounts: Record<string, number> = {};
    routine.steps.forEach((step) => {
      loopCounts[step.loop] = (loopCounts[step.loop] || 0) + 1;
    });

    const primaryLoop = Object.entries(loopCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] as LoopId;

    if (primaryLoop) {
      if (!grouped[primaryLoop]) {
        grouped[primaryLoop] = [];
      }
      grouped[primaryLoop]!.push(routine);
    }
  }

  return grouped as Record<LoopId, Routine[]>;
}

// Group routines by time of day
export function groupRoutinesByTimeOfDay(routines: Routine[]): Record<TimeOfDay, Routine[]> {
  const grouped: Record<TimeOfDay, Routine[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
    anytime: [],
  };

  for (const routine of routines) {
    grouped[routine.schedule.timeOfDay].push(routine);
  }

  return grouped;
}

// Get suggested routines for a user based on existing patterns
export function getSuggestedRoutines(
  existingRoutines: Routine[],
  loopBalances: Record<LoopId, number>
): { routine: Routine; reason: string }[] {
  const suggestions: { routine: Routine; reason: string }[] = [];

  // Find loops that need more routines
  const existingLoops = new Set<LoopId>();
  existingRoutines.forEach((r) => {
    getRoutineLoops(r).forEach((loop) => existingLoops.add(loop));
  });
  const existingTitles = new Set(existingRoutines.map((r) => r.title.toLowerCase()));

  for (const template of ROUTINE_TEMPLATES) {
    // Skip if already have this routine
    if (existingTitles.has(template.title.toLowerCase())) continue;

    // Get loops this template covers
    const templateLoops = [...new Set(template.steps.map((s) => s.loop))];

    // Check if this template helps with underserved loops
    const helpsUnderservedLoop = templateLoops.some(
      (loop) => !existingLoops.has(loop) || (loopBalances[loop] || 0) < 30
    );

    if (!helpsUnderservedLoop) continue;

    // Find the most underserved loop this template helps with
    const underservedLoop = templateLoops.find(
      (loop) => !existingLoops.has(loop) || (loopBalances[loop] || 0) < 30
    );

    let reason = "";
    if (underservedLoop && !existingLoops.has(underservedLoop)) {
      reason = `Add structure to your ${underservedLoop} loop`;
    } else if (underservedLoop) {
      reason = `Boost your ${underservedLoop} consistency`;
    } else {
      reason = "Build better habits";
    }

    suggestions.push({
      routine: createRoutineFromTemplate(template),
      reason,
    });
  }

  // Return top 5 suggestions
  return suggestions.slice(0, 5);
}

// Check if a task is from a routine
export function isRoutineTask(task: Task): boolean {
  return task.tags?.includes("routine") || task.source === "recurring";
}

// Get routine ID from task tags
export function getRoutineIdFromTask(task: Task): string | null {
  const routineTag = task.tags?.find((tag) => tag.startsWith("routine:"));
  return routineTag ? routineTag.replace("routine:", "") : null;
}

// Filter tasks to exclude/include routine tasks
export function filterTasksByRoutine(
  tasks: Task[],
  includeRoutines: boolean
): Task[] {
  if (includeRoutines) {
    return tasks;
  }
  return tasks.filter((task) => !isRoutineTask(task));
}

// Get tasks belonging to a specific routine
export function getTasksForRoutine(tasks: Task[], routineId: string): Task[] {
  return tasks.filter((task) => task.tags?.includes(`routine:${routineId}`));
}

// Calculate step completion from tasks
export function calculateStepCompletionFromTasks(
  routine: Routine,
  tasks: Task[]
): { completedSteps: string[]; skippedSteps: string[] } {
  const routineTasks = getTasksForRoutine(tasks, routine.id);
  const completedSteps: string[] = [];
  const skippedSteps: string[] = [];

  for (const step of routine.steps) {
    const matchingTask = routineTasks.find((t) => t.title === step.title);
    if (matchingTask) {
      if (matchingTask.status === "done") {
        completedSteps.push(step.id);
      } else if (matchingTask.status === "dropped") {
        skippedSteps.push(step.id);
      }
    }
  }

  return { completedSteps, skippedSteps };
}
