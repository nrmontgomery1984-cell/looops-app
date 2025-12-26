// Directional Documents - Types for personal direction and decision-making framework

import { LoopId } from "./core";

// ========== Core Direction Types ==========

// Season type for current loop phase
export type LoopSeason =
  | "building"      // Active expansion and growth
  | "maintaining"   // Steady state, protecting gains
  | "recovering"    // Healing from setback or overextension
  | "hibernating";  // Intentionally minimal engagement

// Value slider dimensions (8 bipolar scales)
export type ValueDimension =
  | "security_adventure"      // Safety vs Risk-taking
  | "independence_belonging"  // Autonomy vs Community
  | "achievement_contentment" // Goals vs Being
  | "tradition_innovation"    // Stability vs Change
  | "control_flexibility"     // Structure vs Spontaneity
  | "privacy_openness"        // Reserved vs Expressive
  | "efficiency_presence"     // Speed vs Mindfulness
  | "competition_collaboration"; // Individual vs Team

// Energy management style
export type EnergyManagementStyle =
  | "sprint_rest"   // High intensity bursts with recovery
  | "steady_pace"   // Consistent moderate output
  | "adaptive";     // Varies based on circumstances

// Financial approach
export type FinancialApproach =
  | "aggressive_saver"    // Maximize savings/investments
  | "balanced"            // Mix of saving and spending
  | "experience_focused"  // Prioritize experiences over accumulation
  | "investment_focused"; // Focus on building assets

// ========== Tradeoff Types ==========

// A forced-choice tradeoff scenario
export interface TradeoffScenario {
  id: string;
  title: string;
  description: string;
  optionA: {
    loopFocus: LoopId;
    label: string;
    description: string;
  };
  optionB: {
    loopFocus: LoopId;
    label: string;
    description: string;
  };
}

// User's resolution of a tradeoff scenario
export interface ConflictResolution {
  scenarioId: string;
  chosenOption: "A" | "B";
  chosenLoop: LoopId;
  timestamp: string;
}

// ========== Core Directions ==========

export interface CoreDirections {
  // Identity foundation - who am I statements (IDs from IDENTITY_STATEMENTS)
  identityStatements: string[];

  // Value sliders - 8 dimensions, each 1-10 (5 is neutral)
  valueSliders: Record<ValueDimension, number>;

  // Tradeoff priorities
  tradeoffPriorities: {
    // Ordered from highest to lowest priority
    loopPriorityRanking: LoopId[];
    // Resolved tradeoff scenarios
    conflictResolutions: ConflictResolution[];
  };

  // Resource philosophy
  resourcePhilosophy: {
    // Target time allocation per loop (percentages, should sum to 100)
    timeAllocation: Record<LoopId, number>;
    // Energy management approach
    energyManagement: EnergyManagementStyle;
    // Financial approach
    financialApproach: FinancialApproach;
  };
}

// ========== Loop-Specific Directions ==========

export interface LoopDirections {
  loopId: LoopId;

  // Vision of thriving - what does success look like (IDs from LOOP_THRIVING_OPTIONS)
  thrivingDescription: string[];

  // Non-negotiables - absolute minimums to protect (IDs from LOOP_NONNEGOTIABLES)
  nonNegotiables: string[];

  // Minimum standards - acceptable baseline when not thriving (IDs from LOOP_MINIMUM_STANDARDS)
  minimumStandards: string[];

  // Current state assessment (0-100 scales)
  currentAllocation: number;    // How much time/energy this loop currently gets
  desiredAllocation: number;    // How much it should ideally get
  currentSatisfaction: number;  // How satisfied with this area

  // Loop dependencies
  feedsLoops: LoopId[];         // This loop enables/supports these other loops
  drawsFromLoops: LoopId[];     // This loop depends on/requires these other loops

  // Current season
  currentSeason: LoopSeason;
}

// ========== Generated Document ==========

export interface GeneratedDocument {
  // AI-generated summary of the user's direction
  summary: string;
  // Key themes identified across all directions
  keyThemes: string[];
  // Potential conflicts between stated priorities
  potentialConflicts: string[];
  // Recommendations based on the analysis
  recommendations: string[];
  // When this was generated
  generatedAt: string;
}

// ========== Complete Directional Document ==========

export interface DirectionalDocument {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  version: number;

  // Completion status
  status: "draft" | "complete" | "needs_update";
  completionProgress: number; // 0-100

  // Content
  core: CoreDirections;
  loops: Record<LoopId, LoopDirections>;

  // AI-generated summary (optional, generated after completion)
  generatedDocument?: GeneratedDocument;
}

// ========== Intake Flow Progress ==========

export type IntakePhase = "core" | "loops";

export type CoreIntakeStep =
  | "identity"      // Identity statements selection
  | "values"        // Value sliders
  | "tradeoffs"     // Tradeoff scenarios
  | "priorities"    // Loop priority ranking
  | "resources";    // Resource philosophy

export type LoopIntakeStep =
  | "thriving"      // Vision of thriving
  | "nonnegotiables" // Non-negotiables
  | "standards"     // Minimum standards
  | "assessment"    // Current state sliders
  | "dependencies"  // Loop dependencies
  | "season";       // Current season

export interface DirectionalIntakeProgress {
  // Which phase (core directions vs loop-specific)
  currentPhase: IntakePhase;

  // Current step within the phase
  coreStep?: CoreIntakeStep;
  loopStep?: LoopIntakeStep;

  // For loop phase, which loop we're on
  currentLoop?: LoopId;

  // Completed loops
  completedLoops: LoopId[];

  // Overall progress
  totalSteps: number;
  completedSteps: number;
}

// ========== Option Types for UI ==========

// Identity statement option
export interface IdentityStatementOption {
  id: string;
  label: string;
  description: string;
  category?: string;
}

// Value dimension definition
export interface ValueDimensionDefinition {
  id: ValueDimension;
  leftPole: string;
  rightPole: string;
  leftDescription: string;
  rightDescription: string;
}

// Loop-specific option (for thriving, non-negotiables, standards)
export interface LoopOption {
  id: string;
  label: string;
  description?: string;
}

// Season option
export interface SeasonOption {
  id: LoopSeason;
  label: string;
  description: string;
  icon: string;
}

// ========== Factory Functions ==========

// Create empty core directions with defaults
export function createEmptyCoreDirections(): CoreDirections {
  return {
    identityStatements: [],
    valueSliders: {
      security_adventure: 5,
      independence_belonging: 5,
      achievement_contentment: 5,
      tradition_innovation: 5,
      control_flexibility: 5,
      privacy_openness: 5,
      efficiency_presence: 5,
      competition_collaboration: 5,
    },
    tradeoffPriorities: {
      loopPriorityRanking: [],
      conflictResolutions: [],
    },
    resourcePhilosophy: {
      timeAllocation: {
        Health: 15,
        Wealth: 15,
        Family: 15,
        Work: 20,
        Fun: 10,
        Maintenance: 10,
        Meaning: 15,
      },
      energyManagement: "adaptive",
      financialApproach: "balanced",
    },
  };
}

// Create empty loop directions with defaults
export function createEmptyLoopDirections(loopId: LoopId): LoopDirections {
  return {
    loopId,
    thrivingDescription: [],
    nonNegotiables: [],
    minimumStandards: [],
    currentAllocation: 50,
    desiredAllocation: 50,
    currentSatisfaction: 50,
    feedsLoops: [],
    drawsFromLoops: [],
    currentSeason: "maintaining",
  };
}

// Create a new directional document
export function createDirectionalDocument(userId: string): DirectionalDocument {
  const now = new Date().toISOString();

  return {
    id: `dir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    createdAt: now,
    updatedAt: now,
    version: 1,
    status: "draft",
    completionProgress: 0,
    core: createEmptyCoreDirections(),
    loops: {
      Health: createEmptyLoopDirections("Health"),
      Wealth: createEmptyLoopDirections("Wealth"),
      Family: createEmptyLoopDirections("Family"),
      Work: createEmptyLoopDirections("Work"),
      Fun: createEmptyLoopDirections("Fun"),
      Maintenance: createEmptyLoopDirections("Maintenance"),
      Meaning: createEmptyLoopDirections("Meaning"),
    },
  };
}

// Create initial intake progress
export function createIntakeProgress(): DirectionalIntakeProgress {
  return {
    currentPhase: "core",
    coreStep: "identity",
    completedLoops: [],
    totalSteps: 47, // 5 core steps + 6 steps × 7 loops
    completedSteps: 0,
  };
}

// Calculate completion progress
export function calculateCompletionProgress(
  progress: DirectionalIntakeProgress
): number {
  return Math.round((progress.completedSteps / progress.totalSteps) * 100);
}
