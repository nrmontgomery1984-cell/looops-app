// Goal hierarchy types for goal decomposition

import { LoopId } from "./core";

// Goal timeframe levels
export type GoalTimeframe = "annual" | "quarterly" | "monthly" | "weekly" | "daily";

// Goal status
export type GoalStatus = "active" | "completed" | "abandoned" | "paused";

// Goal metric for tracking progress
export type GoalMetric = {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
};

// Individual goal
export type Goal = {
  id: string;
  title: string;
  description?: string;

  // Organization
  loop: LoopId;
  timeframe: GoalTimeframe;

  // Hierarchy
  parentGoalId?: string; // Links to parent in hierarchy
  childGoalIds: string[]; // Links to children

  // System linkage
  linkedSystemIds?: string[]; // Systems that support this goal

  // Status tracking
  status: GoalStatus;
  progress: number; // 0-100

  // Timing
  startDate: string;
  targetDate: string;
  completedAt?: string;

  // Metrics
  metrics?: GoalMetric[];

  // Metadata
  createdAt: string;
  updatedAt: string;
};

// Goal hierarchy container
export type GoalHierarchy = {
  annual: Goal[];
  quarterly: Goal[];
  monthly: Goal[];
  weekly: Goal[];
  daily: Goal[];
};

// Create empty goal hierarchy
export function createEmptyGoalHierarchy(): GoalHierarchy {
  return {
    annual: [],
    quarterly: [],
    monthly: [],
    weekly: [],
    daily: [],
  };
}

// Get goals by timeframe
export function getGoalsByTimeframe(
  hierarchy: GoalHierarchy,
  timeframe: GoalTimeframe
): Goal[] {
  return hierarchy[timeframe];
}

// Get child goals
export function getChildGoals(hierarchy: GoalHierarchy, parentId: string): Goal[] {
  const allGoals = [
    ...hierarchy.annual,
    ...hierarchy.quarterly,
    ...hierarchy.monthly,
    ...hierarchy.weekly,
    ...hierarchy.daily,
  ];
  return allGoals.filter((g) => g.parentGoalId === parentId);
}

// Calculate goal progress from children
export function calculateGoalProgress(hierarchy: GoalHierarchy, goalId: string): number {
  const children = getChildGoals(hierarchy, goalId);
  if (children.length === 0) return 0;

  const totalProgress = children.reduce((sum, child) => sum + child.progress, 0);
  return Math.round(totalProgress / children.length);
}

// Timeframe order for decomposition
export const TIMEFRAME_ORDER: GoalTimeframe[] = [
  "annual",
  "quarterly",
  "monthly",
  "weekly",
  "daily",
];

// Get next timeframe level
export function getNextTimeframe(timeframe: GoalTimeframe): GoalTimeframe | null {
  const idx = TIMEFRAME_ORDER.indexOf(timeframe);
  if (idx === -1 || idx === TIMEFRAME_ORDER.length - 1) return null;
  return TIMEFRAME_ORDER[idx + 1];
}

// Get previous timeframe level
export function getPreviousTimeframe(timeframe: GoalTimeframe): GoalTimeframe | null {
  const idx = TIMEFRAME_ORDER.indexOf(timeframe);
  if (idx <= 0) return null;
  return TIMEFRAME_ORDER[idx - 1];
}
