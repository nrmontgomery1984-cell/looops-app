// State Engine - Loop state management and transitions

import {
  LoopId,
  LoopStateType,
  LoopState,
  StateHistoryEntry,
  ALL_LOOPS,
  STATE_PRIORITY,
  isValidTransition,
  isStateAtOrBelow,
  isStateAtOrAbove,
} from "../types";

// Transition result
export type TransitionResult = {
  success: boolean;
  newState: LoopStateType;
  reason: string;
  cascadeEffects?: Array<{
    loopId: LoopId;
    suggestedState: LoopStateType;
    reason: string;
  }>;
};

// Validate and execute a state transition
export function transitionLoopState(
  loopState: LoopState,
  targetState: LoopStateType,
  reason: string = "User requested"
): TransitionResult {
  const currentState = loopState.currentState;

  // Check if transition is valid
  if (!isValidTransition(currentState, targetState)) {
    return {
      success: false,
      newState: currentState,
      reason: `Cannot transition directly from ${currentState} to ${targetState}`,
    };
  }

  // Check floor constraint
  if (!isStateAtOrAbove(targetState, loopState.floor)) {
    return {
      success: false,
      newState: currentState,
      reason: `Cannot go below floor state of ${loopState.floor}`,
    };
  }

  // Check ceiling constraint
  if (!isStateAtOrBelow(targetState, loopState.ceiling)) {
    return {
      success: false,
      newState: currentState,
      reason: `Cannot exceed ceiling state of ${loopState.ceiling}`,
    };
  }

  return {
    success: true,
    newState: targetState,
    reason,
  };
}

// Get recommended state based on current conditions
export function getRecommendedState(
  loopId: LoopId,
  currentStates: Record<LoopId, LoopState>,
  externalFactors: {
    sleepScore?: number;
    energyLevel?: number;
    dayOfWeek?: number;
    isCustodyWeek?: boolean;
    isTravel?: boolean;
    isSick?: boolean;
  }
): { state: LoopStateType; reason: string } {
  const loop = currentStates[loopId];
  let recommended: LoopStateType = "MAINTAIN";
  let reason = "Default to maintain";

  // Health-specific logic
  if (loopId === "Health") {
    if (externalFactors.isSick) {
      return { state: "RECOVER", reason: "Illness detected - prioritize recovery" };
    }
    if (externalFactors.sleepScore !== undefined && externalFactors.sleepScore < 60) {
      return { state: "RECOVER", reason: "Poor sleep - focus on recovery" };
    }
    if (externalFactors.energyLevel !== undefined && externalFactors.energyLevel < 30) {
      return { state: "RECOVER", reason: "Low energy - rest needed" };
    }
  }

  // Work-specific logic
  if (loopId === "Work") {
    if (externalFactors.dayOfWeek === 0 || externalFactors.dayOfWeek === 6) {
      return { state: "HIBERNATE", reason: "Weekend - work hibernates" };
    }
    if (externalFactors.isCustodyWeek) {
      return { state: "MAINTAIN", reason: "Custody week - maintain work baseline" };
    }
  }

  // Family-specific logic
  if (loopId === "Family") {
    if (externalFactors.isCustodyWeek) {
      return { state: "BUILD", reason: "Custody week - maximize family time" };
    }
  }

  // Fun-specific logic
  if (loopId === "Fun") {
    if (currentStates["Health"].currentState === "RECOVER") {
      return { state: "RECOVER", reason: "Health in recovery - limit high-energy fun" };
    }
    if (currentStates["Work"].currentState === "BUILD") {
      return { state: "MAINTAIN", reason: "Work in build mode - moderate fun" };
    }
  }

  // Maintenance-specific logic
  if (loopId === "Maintenance") {
    if (externalFactors.isTravel) {
      return { state: "HIBERNATE", reason: "Travel mode - maintenance hibernates" };
    }
    // Weekend boost for maintenance
    if (externalFactors.dayOfWeek === 0 || externalFactors.dayOfWeek === 6) {
      return { state: "BUILD", reason: "Weekend - good time for maintenance tasks" };
    }
  }

  // Meaning-specific logic
  if (loopId === "Meaning") {
    // Morning and evening are good for meaning work
    return { state: "MAINTAIN", reason: "Maintain spiritual/reflective practices" };
  }

  return { state: recommended, reason };
}

// Calculate capacity based on state
export function calculateCapacity(state: LoopStateType): {
  minTasks: number;
  maxTasks: number;
  energyAllocation: number;
} {
  switch (state) {
    case "BUILD":
      return { minTasks: 3, maxTasks: 8, energyAllocation: 0.3 };
    case "MAINTAIN":
      return { minTasks: 1, maxTasks: 4, energyAllocation: 0.15 };
    case "RECOVER":
      return { minTasks: 0, maxTasks: 2, energyAllocation: 0.05 };
    case "HIBERNATE":
      return { minTasks: 0, maxTasks: 0, energyAllocation: 0 };
  }
}

// Get state color
export function getStateColor(state: LoopStateType): string {
  switch (state) {
    case "BUILD":
      return "#22c55e"; // Green - healthy/growing
    case "MAINTAIN":
      return "#eab308"; // Yellow - stable/maintaining
    case "RECOVER":
      return "#ef4444"; // Red - needs attention
    case "HIBERNATE":
      return "#ef4444"; // Red - needs attention
  }
}

// Get state display name
export function getStateDisplayName(state: LoopStateType): string {
  switch (state) {
    case "BUILD":
      return "Build";
    case "MAINTAIN":
      return "Maintain";
    case "RECOVER":
      return "Recover";
    case "HIBERNATE":
      return "Hibernate";
  }
}

// Get state description
export function getStateDescription(state: LoopStateType): string {
  switch (state) {
    case "BUILD":
      return "Growth mode - high volume, high complexity tasks";
    case "MAINTAIN":
      return "Steady state - minimum effective dose, hold the line";
    case "RECOVER":
      return "Restoration - minimal output, focus on healing";
    case "HIBERNATE":
      return "Dormant - no tasks generated, loop is paused";
  }
}

// Create state history entry
export function createStateHistoryEntry(
  fromState: LoopStateType,
  toState: LoopStateType,
  reason: string,
  triggeredBy: "user" | "cascade" | "manual"
): StateHistoryEntry {
  return {
    fromState,
    toState,
    timestamp: new Date().toISOString(),
    reason,
    triggeredBy,
  };
}

// Get all states summary
export function getStatesSummary(states: Record<LoopId, LoopState>): {
  building: LoopId[];
  maintaining: LoopId[];
  recovering: LoopId[];
  hibernating: LoopId[];
} {
  const summary = {
    building: [] as LoopId[],
    maintaining: [] as LoopId[],
    recovering: [] as LoopId[],
    hibernating: [] as LoopId[],
  };

  for (const loopId of ALL_LOOPS) {
    const state = states[loopId].currentState;
    switch (state) {
      case "BUILD":
        summary.building.push(loopId);
        break;
      case "MAINTAIN":
        summary.maintaining.push(loopId);
        break;
      case "RECOVER":
        summary.recovering.push(loopId);
        break;
      case "HIBERNATE":
        summary.hibernating.push(loopId);
        break;
    }
  }

  return summary;
}

// Calculate overall energy budget
export function calculateEnergyBudget(states: Record<LoopId, LoopState>): {
  totalAllocated: number;
  remaining: number;
  byLoop: Record<LoopId, number>;
} {
  const byLoop: Partial<Record<LoopId, number>> = {};
  let totalAllocated = 0;

  for (const loopId of ALL_LOOPS) {
    const capacity = calculateCapacity(states[loopId].currentState);
    byLoop[loopId] = capacity.energyAllocation;
    totalAllocated += capacity.energyAllocation;
  }

  return {
    totalAllocated,
    remaining: Math.max(0, 1 - totalAllocated),
    byLoop: byLoop as Record<LoopId, number>,
  };
}
