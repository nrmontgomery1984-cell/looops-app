// Smart Scheduler - Day Type System
// Automatically adjusts routines, tasks, and loop capacities based on day type

import { LoopId } from "./core";

// Built-in day types
export type BuiltInDayType =
  | "regular"      // Normal workday
  | "weekend"      // Saturday/Sunday (auto-detected)
  | "custody"      // Daughter's custody days
  | "non_custody"  // Solo days during custody weeks
  | "holiday"      // Manually marked holidays
  | "travel";      // Travel days

// Day types can be built-in or custom (custom IDs start with "custom_")
export type DayType = BuiltInDayType | string;

// A marked date in the calendar
export interface MarkedDate {
  date: string;           // YYYY-MM-DD format
  dayType: DayType;
  label?: string;         // Optional label for the day
  repeatsYearly?: boolean; // For recurring holidays
}

// Configuration for a day type - how it affects the system
export interface DayTypeConfig {
  dayType: DayType;
  label: string;
  color: string;
  icon?: string;

  // Routine adjustments
  disabledRoutines?: string[];     // Routine IDs to skip on this day type
  enabledRoutines?: string[];      // Only these routines active (if specified)

  // Loop capacity adjustments (multipliers: 0.5 = half, 1.0 = normal, 2.0 = double)
  loopCapacityMultipliers?: Partial<Record<LoopId, number>>;
}

// Main smart schedule state
export interface SmartScheduleState {
  enabled: boolean;
  markedDates: MarkedDate[];
  dayTypeConfigs: Record<DayType, DayTypeConfig>;
  customDayTypes: DayTypeConfig[]; // User-created custom day types
}

// Helper to check if a day type is custom
export function isCustomDayType(dayType: DayType): boolean {
  return dayType.startsWith("custom_");
}

// Helper to generate a custom day type ID
export function generateCustomDayTypeId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default day type configurations
export const DEFAULT_DAY_TYPE_CONFIGS: Record<DayType, DayTypeConfig> = {
  regular: {
    dayType: "regular",
    label: "Workday",
    color: "#4A90A4",
    icon: "💼",
    loopCapacityMultipliers: {
      Health: 1.0,
      Wealth: 1.0,
      Family: 1.0,
      Work: 1.0,
      Fun: 1.0,
      Maintenance: 1.0,
      Meaning: 1.0,
    },
  },
  weekend: {
    dayType: "weekend",
    label: "Weekend",
    color: "#7C3AED",
    icon: "🌴",
    loopCapacityMultipliers: {
      Health: 1.0,
      Wealth: 0.5,
      Family: 1.3,
      Work: 0.3,
      Fun: 1.5,
      Maintenance: 1.2,
      Meaning: 1.2,
    },
  },
  custody: {
    dayType: "custody",
    label: "Daughter's Day",
    color: "#EC4899",
    icon: "👨‍👧",
    loopCapacityMultipliers: {
      Health: 1.0,
      Wealth: 0.5,
      Family: 2.0,
      Work: 0.5,
      Fun: 1.5,
      Maintenance: 0.7,
      Meaning: 1.0,
    },
  },
  non_custody: {
    dayType: "non_custody",
    label: "Solo Day",
    color: "#10B981",
    icon: "🧘",
    loopCapacityMultipliers: {
      Health: 1.2,
      Wealth: 1.0,
      Family: 0.5,
      Work: 1.2,
      Fun: 1.0,
      Maintenance: 1.2,
      Meaning: 1.3,
    },
  },
  holiday: {
    dayType: "holiday",
    label: "Holiday",
    color: "#F59E0B",
    icon: "🎉",
    loopCapacityMultipliers: {
      Health: 1.0,
      Wealth: 0.0,
      Family: 1.5,
      Work: 0.0,
      Fun: 2.0,
      Maintenance: 0.5,
      Meaning: 1.0,
    },
  },
  travel: {
    dayType: "travel",
    label: "Travel Day",
    color: "#6366F1",
    icon: "✈️",
    loopCapacityMultipliers: {
      Health: 0.5,
      Wealth: 0.3,
      Family: 0.5,
      Work: 0.3,
      Fun: 1.0,
      Maintenance: 0.3,
      Meaning: 0.5,
    },
  },
};

// Built-in day types for iteration
export const BUILT_IN_DAY_TYPES: BuiltInDayType[] = [
  "regular",
  "weekend",
  "custody",
  "non_custody",
  "holiday",
  "travel",
];

// Legacy export for backward compatibility
export const ALL_DAY_TYPES = BUILT_IN_DAY_TYPES;

// Create default smart schedule state
export function createDefaultSmartScheduleState(): SmartScheduleState {
  return {
    enabled: true,
    markedDates: [],
    dayTypeConfigs: { ...DEFAULT_DAY_TYPE_CONFIGS },
    customDayTypes: [],
  };
}

// Create a new custom day type config
export function createCustomDayType(name: string, icon: string, color: string): DayTypeConfig {
  const id = generateCustomDayTypeId();
  return {
    dayType: id,
    label: name,
    color,
    icon,
    loopCapacityMultipliers: {
      Health: 1.0,
      Wealth: 1.0,
      Family: 1.0,
      Work: 1.0,
      Fun: 1.0,
      Maintenance: 1.0,
      Meaning: 1.0,
    },
  };
}
