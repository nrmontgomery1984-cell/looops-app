// Loop state types for the State Engine

import { LoopId, LoopStateType } from "./core";

// Re-export core types used in this module
export type { LoopId, LoopStateType };

// State transition trigger types
export type TriggerType = "threshold" | "time" | "manual" | "cascade" | "biometric";

// State transition trigger
export type StateTransitionTrigger = {
  id: string;
  type: TriggerType;
  condition: string;
  targetState: LoopStateType;
  enabled: boolean;
};

// State history entry
export type StateHistoryEntry = {
  fromState: LoopStateType;
  toState: LoopStateType;
  timestamp: string;
  reason: string;
  triggeredBy: TriggerType | "user";
};

// Loop state configuration
export type LoopState = {
  loopId: LoopId;
  currentState: LoopStateType;

  // Capacity controls
  floor: LoopStateType; // Minimum state allowed (never drops below)
  ceiling: LoopStateType; // Maximum state allowed

  // Task capacity
  minTasks: number; // Minimum tasks per day for this loop
  maxTasks: number; // Maximum tasks per day for this loop
  currentLoad: number; // Current active tasks

  // State triggers
  triggers: StateTransitionTrigger[];

  // Task organization by state
  buildTasks: string[]; // Task IDs appropriate for BUILD
  maintainTasks: string[]; // Task IDs appropriate for MAINTAIN
  recoverTasks: string[]; // Task IDs appropriate for RECOVER

  // Tracking
  lastStateChange: string;
  stateHistory: StateHistoryEntry[];
  weeklyStates: Record<string, LoopStateType>; // Date -> State for weekly planning
};

// Default loop state factory
export function createDefaultLoopState(loopId: LoopId): LoopState {
  return {
    loopId,
    currentState: "MAINTAIN",
    floor: "RECOVER",
    ceiling: "BUILD",
    minTasks: 1,
    maxTasks: 5,
    currentLoad: 0,
    triggers: [],
    buildTasks: [],
    maintainTasks: [],
    recoverTasks: [],
    lastStateChange: new Date().toISOString(),
    stateHistory: [],
    weeklyStates: {},
  };
}

// All loop states combined
export type AllLoopStates = Record<LoopId, LoopState>;

// State priority (higher number = more capacity)
export const STATE_PRIORITY: Record<LoopStateType, number> = {
  HIBERNATE: 0,
  RECOVER: 1,
  MAINTAIN: 2,
  BUILD: 3,
};

// State can transition to
export const VALID_TRANSITIONS: Record<LoopStateType, LoopStateType[]> = {
  HIBERNATE: ["RECOVER", "MAINTAIN"],
  RECOVER: ["HIBERNATE", "MAINTAIN"],
  MAINTAIN: ["RECOVER", "BUILD", "HIBERNATE"],
  BUILD: ["MAINTAIN", "RECOVER"],
};

// Check if a transition is valid
export function isValidTransition(from: LoopStateType, to: LoopStateType): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

// Compare states (returns -1, 0, or 1)
export function compareStates(a: LoopStateType, b: LoopStateType): number {
  return STATE_PRIORITY[a] - STATE_PRIORITY[b];
}

// Check if state A is at or below state B
export function isStateAtOrBelow(state: LoopStateType, ceiling: LoopStateType): boolean {
  return STATE_PRIORITY[state] <= STATE_PRIORITY[ceiling];
}

// Check if state A is at or above state B
export function isStateAtOrAbove(state: LoopStateType, floor: LoopStateType): boolean {
  return STATE_PRIORITY[state] >= STATE_PRIORITY[floor];
}
