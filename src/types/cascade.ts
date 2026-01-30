// Cascade rules for cross-loop state effects

import { LoopId, LoopStateType } from "./core";

// Effect types
export type CascadeEffectType =
  | "set_max_state" // Limit target loop to a maximum state
  | "set_min_state" // Ensure target loop is at minimum state
  | "adjust_capacity" // Adjust capacity by percentage
  | "block_state" // Prevent target from entering a state
  | "recommend_state"; // Suggest (but don't force) a state

// Cascade effect definition
export type CascadeEffect = {
  type: CascadeEffectType;
  targetState?: LoopStateType;
  capacityAdjustment?: number; // Percentage (-50 to +50)
  reason: string;
};

// Cascade rule
export type CascadeRule = {
  id: string;
  name: string;

  // Trigger conditions
  sourceLoop: LoopId;
  sourceState: LoopStateType;
  triggerCondition?: string; // Optional additional condition

  // Effects
  targetLoop: LoopId;
  effects: CascadeEffect[];

  // Configuration
  priority: number; // Higher = processed first
  enabled: boolean;
  userOverrideable: boolean;
};

// Default cascade rules
export const DEFAULT_CASCADE_RULES: CascadeRule[] = [
  // Custody week cascade
  {
    id: "custody_week_health",
    name: "Custody Week - Health",
    sourceLoop: "Family",
    sourceState: "BUILD",
    targetLoop: "Health",
    effects: [
      {
        type: "set_max_state",
        targetState: "MAINTAIN",
        reason: "During custody week, limit intense health activities",
      },
    ],
    priority: 10,
    enabled: true,
    userOverrideable: true,
  },
  {
    id: "custody_week_work",
    name: "Custody Week - Work Evening",
    sourceLoop: "Family",
    sourceState: "BUILD",
    targetLoop: "Work",
    effects: [
      {
        type: "adjust_capacity",
        capacityAdjustment: -30,
        reason: "Reduce work capacity during custody week",
      },
    ],
    priority: 10,
    enabled: true,
    userOverrideable: true,
  },

  // Health recovery cascade
  {
    id: "health_recover_work",
    name: "Health Recovery - Work",
    sourceLoop: "Health",
    sourceState: "RECOVER",
    targetLoop: "Work",
    effects: [
      {
        type: "set_max_state",
        targetState: "MAINTAIN",
        reason: "When recovering health, limit work intensity",
      },
    ],
    priority: 15,
    enabled: true,
    userOverrideable: true,
  },
  {
    id: "health_recover_fun",
    name: "Health Recovery - Fun",
    sourceLoop: "Health",
    sourceState: "RECOVER",
    targetLoop: "Fun",
    effects: [
      {
        type: "set_max_state",
        targetState: "RECOVER",
        reason: "When recovering health, minimize high-energy fun",
      },
    ],
    priority: 15,
    enabled: true,
    userOverrideable: true,
  },

  // Work crunch cascade
  {
    id: "work_build_fun",
    name: "Work Crunch - Fun",
    sourceLoop: "Work",
    sourceState: "BUILD",
    targetLoop: "Fun",
    effects: [
      {
        type: "set_max_state",
        targetState: "MAINTAIN",
        reason: "During work crunch, limit fun activities",
      },
    ],
    priority: 8,
    enabled: true,
    userOverrideable: true,
  },
  {
    id: "work_build_health",
    name: "Work Crunch - Health",
    sourceLoop: "Work",
    sourceState: "BUILD",
    targetLoop: "Health",
    effects: [
      {
        type: "recommend_state",
        targetState: "MAINTAIN",
        reason: "Maintain baseline health during work crunch",
      },
    ],
    priority: 5,
    enabled: true,
    userOverrideable: true,
  },

  // Meaning focus cascade
  {
    id: "meaning_build_work",
    name: "Meaning Focus - Work",
    sourceLoop: "Meaning",
    sourceState: "BUILD",
    targetLoop: "Work",
    effects: [
      {
        type: "set_max_state",
        targetState: "MAINTAIN",
        reason: "During spiritual/reflective focus, reduce work intensity",
      },
    ],
    priority: 7,
    enabled: true,
    userOverrideable: true,
  },
];

// Apply cascade rules to determine effective state
export function applyCascadeRules(
  rules: CascadeRule[],
  loopStates: Record<LoopId, LoopStateType>,
  targetLoop: LoopId
): {
  maxState: LoopStateType;
  minState: LoopStateType;
  capacityAdjustment: number;
  appliedRules: CascadeRule[];
} {
  let maxState: LoopStateType = "BUILD";
  let minState: LoopStateType = "HIBERNATE";
  let capacityAdjustment = 0;
  const appliedRules: CascadeRule[] = [];

  // Sort by priority (highest first)
  const sortedRules = [...rules]
    .filter((r) => r.enabled && r.targetLoop === targetLoop)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    // Check if source condition is met
    if (loopStates[rule.sourceLoop] === rule.sourceState) {
      appliedRules.push(rule);

      for (const effect of rule.effects) {
        switch (effect.type) {
          case "set_max_state":
            if (effect.targetState) {
              // Take the more restrictive max state
              const stateOrder: LoopStateType[] = ["HIBERNATE", "RECOVER", "MAINTAIN", "BUILD"];
              const currentIdx = stateOrder.indexOf(maxState);
              const newIdx = stateOrder.indexOf(effect.targetState);
              if (newIdx < currentIdx) {
                maxState = effect.targetState;
              }
            }
            break;

          case "set_min_state":
            if (effect.targetState) {
              const stateOrder: LoopStateType[] = ["HIBERNATE", "RECOVER", "MAINTAIN", "BUILD"];
              const currentIdx = stateOrder.indexOf(minState);
              const newIdx = stateOrder.indexOf(effect.targetState);
              if (newIdx > currentIdx) {
                minState = effect.targetState;
              }
            }
            break;

          case "adjust_capacity":
            if (effect.capacityAdjustment) {
              capacityAdjustment += effect.capacityAdjustment;
            }
            break;

          // recommend_state and block_state don't force changes
          default:
            break;
        }
      }
    }
  }

  return { maxState, minState, capacityAdjustment, appliedRules };
}
