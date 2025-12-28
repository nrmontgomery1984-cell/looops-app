// Smart Scheduler Engine - Determines day type and adjusts system behavior
// Automatically adjusts routines, tasks, and loop capacities based on day type

import { LoopId } from "../types/core";
import { Routine } from "../types/routines";
import { Task } from "../types/tasks";
import {
  DayType,
  DayTypeConfig,
  MarkedDate,
  SmartScheduleState,
  DEFAULT_DAY_TYPE_CONFIGS,
} from "../types/dayTypes";

// Format date as YYYY-MM-DD for consistent key usage
export function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Get the day type for a specific date
export function getDayType(date: Date, state: SmartScheduleState): DayType {
  if (!state.enabled) {
    return "regular";
  }

  const dateStr = formatDateKey(date);

  // 1. Check explicitly marked dates first (highest priority)
  const marked = state.markedDates.find((m) => m.date === dateStr);
  if (marked) {
    return marked.dayType;
  }

  // 2. Check yearly repeating dates (for holidays)
  const monthDay = dateStr.slice(5); // MM-DD
  const yearlyMatch = state.markedDates.find(
    (m) => m.repeatsYearly && m.date.slice(5) === monthDay
  );
  if (yearlyMatch) {
    return yearlyMatch.dayType;
  }

  // 3. Auto-detect weekends
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return "weekend";
  }

  // 4. Default to regular weekday
  return "regular";
}

// Get the configuration for a day type
export function getDayTypeConfig(
  dayType: DayType,
  state: SmartScheduleState
): DayTypeConfig {
  return state.dayTypeConfigs[dayType] || DEFAULT_DAY_TYPE_CONFIGS[dayType];
}

// Get marked date info for a specific date
export function getMarkedDate(
  date: Date,
  state: SmartScheduleState
): MarkedDate | undefined {
  const dateStr = formatDateKey(date);
  return state.markedDates.find((m) => m.date === dateStr);
}

// Filter routines based on day type configuration
export function getActiveRoutines(
  routines: Routine[],
  config: DayTypeConfig
): Routine[] {
  return routines.filter((routine) => {
    // Check if explicitly disabled for this day type
    if (config.disabledRoutines?.includes(routine.id)) {
      return false;
    }

    // If there's an explicit enable list, only those are active
    if (config.enabledRoutines && config.enabledRoutines.length > 0) {
      return config.enabledRoutines.includes(routine.id);
    }

    // Otherwise, routine is active
    return true;
  });
}

// Filter tasks based on day type (for future task tagging feature)
export function filterTasksForDayType(
  tasks: Task[],
  dayType: DayType,
  config: DayTypeConfig
): Task[] {
  // For now, return all tasks - can be extended to filter by tags
  // when we add day type tags to tasks
  return tasks;
}

// Get adjusted loop capacity based on day type multipliers
export function getAdjustedCapacity(
  baseCapacity: number,
  loopId: LoopId,
  config: DayTypeConfig
): number {
  const multiplier = config.loopCapacityMultipliers?.[loopId] ?? 1.0;
  return Math.round(baseCapacity * multiplier);
}

// Get all loop capacity multipliers for a day type
export function getLoopCapacityMultipliers(
  config: DayTypeConfig
): Partial<Record<LoopId, number>> {
  return config.loopCapacityMultipliers || {};
}

// Get display info for a day type (for UI)
export function getDayTypeDisplayInfo(dayType: DayType, config: DayTypeConfig): {
  label: string;
  color: string;
  icon: string;
} {
  return {
    label: config.label,
    color: config.color,
    icon: config.icon || "📅",
  };
}

// Check if a date is marked
export function isDateMarked(date: Date, state: SmartScheduleState): boolean {
  const dateStr = formatDateKey(date);
  return state.markedDates.some((m) => m.date === dateStr);
}

// Get all marked dates for a month (for calendar display)
export function getMarkedDatesForMonth(
  year: number,
  month: number, // 0-indexed
  state: SmartScheduleState
): MarkedDate[] {
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-31`;

  return state.markedDates.filter((m) => {
    // Include explicitly marked dates in this month
    if (m.date >= startDate && m.date <= endDate) {
      return true;
    }
    // Include yearly repeating dates (check month only)
    if (m.repeatsYearly) {
      const monthPart = m.date.slice(5, 7);
      return monthPart === String(month + 1).padStart(2, "0");
    }
    return false;
  });
}

// Mark a date with a day type
export function markDate(
  date: string,
  dayType: DayType,
  options?: { label?: string; repeatsYearly?: boolean }
): MarkedDate {
  return {
    date,
    dayType,
    label: options?.label,
    repeatsYearly: options?.repeatsYearly,
  };
}

// Generate bulk marked dates for custody pattern (every other weekend, etc.)
export function generateCustodyPattern(
  startDate: Date,
  pattern: "every_other_weekend" | "weekly" | "biweekly",
  dayType: DayType,
  months: number = 6 // How many months ahead to generate
): MarkedDate[] {
  const dates: MarkedDate[] = [];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  const current = new Date(startDate);

  switch (pattern) {
    case "every_other_weekend":
      // Find the next Saturday from start date
      while (current.getDay() !== 6) {
        current.setDate(current.getDate() + 1);
      }

      while (current < endDate) {
        // Mark Saturday
        dates.push({
          date: formatDateKey(current),
          dayType,
        });

        // Mark Sunday
        const sunday = new Date(current);
        sunday.setDate(sunday.getDate() + 1);
        dates.push({
          date: formatDateKey(sunday),
          dayType,
        });

        // Skip to next-next weekend (14 days from Saturday)
        current.setDate(current.getDate() + 14);
      }
      break;

    case "weekly":
      // Mark every week starting from start date
      while (current < endDate) {
        dates.push({
          date: formatDateKey(current),
          dayType,
        });
        current.setDate(current.getDate() + 7);
      }
      break;

    case "biweekly":
      // Mark every two weeks starting from start date
      while (current < endDate) {
        dates.push({
          date: formatDateKey(current),
          dayType,
        });
        current.setDate(current.getDate() + 14);
      }
      break;
  }

  return dates;
}

// Get today's schedule summary
export function getTodayScheduleSummary(
  routines: Routine[],
  state: SmartScheduleState,
  date: Date = new Date()
): {
  dayType: DayType;
  config: DayTypeConfig;
  activeRoutineCount: number;
  disabledRoutineCount: number;
  label: string;
  icon: string;
} {
  const dayType = getDayType(date, state);
  const config = getDayTypeConfig(dayType, state);
  const activeRoutines = getActiveRoutines(routines, config);
  const disabledCount = routines.length - activeRoutines.length;

  return {
    dayType,
    config,
    activeRoutineCount: activeRoutines.length,
    disabledRoutineCount: disabledCount,
    label: config.label,
    icon: config.icon || "📅",
  };
}
