// Personalization Types - Connecting personality to goals, habits, and systems

import { ArchetypeId, VoiceProfile, UserTraits, MotivationStyle } from "./identity";
import { LoopId } from "./core";
import { Habit, HabitCue, EnvironmentTweak } from "./systems";

// Re-export MotivationStyle for convenience (already defined in identity.ts)
export type { MotivationStyle } from "./identity";

// ============================================================================
// VOICE & MESSAGING
// ============================================================================

export type Tone = "direct" | "warm" | "philosophical" | "energetic" | "analytical";

// Action verbs grouped by archetype
export type ActionVerbSet = {
  primary: string[];    // Main action verbs
  secondary: string[];  // Supporting verbs
  celebration: string[]; // Completion/success verbs
};

// ============================================================================
// BREAKDOWN STRATEGIES
// ============================================================================

export type BreakdownApproach =
  | "systematic"      // Machine: Process-focused, measurable steps
  | "challenge"       // Warrior: Conquest-focused, progressive difficulty
  | "flow"           // Artist: Discovery-focused, expressive milestones
  | "experimental"   // Scientist: Hypothesis-focused, iterative
  | "acceptance"     // Stoic: Virtue-focused, sustainable progress
  | "impact";        // Visionary: Vision-focused, ambitious leaps

export type BreakdownStrategy = {
  archetypeId: ArchetypeId;
  approach: BreakdownApproach;
  approachName: string;
  description: string;
  milestoneStyle: string;
  verbSet: ActionVerbSet;
  motivationPhrases: string[];
  // How this archetype frames different goal phases
  phaseFraming: {
    start: string;      // How they begin ("Install the system" vs "Begin the journey")
    middle: string;     // How they progress ("Optimize" vs "Deepen")
    end: string;        // How they complete ("Systematize" vs "Master")
  };
};

// ============================================================================
// SCHEDULING PROFILES
// ============================================================================

export type PacePreference = "sprint" | "steady" | "marathon";
export type StructureLevel = "rigid" | "flexible" | "adaptive";
export type FocusStyle = "daily-habits" | "weekly-goals" | "milestone-driven";
export type RampUpStyle = "aggressive" | "gradual" | "test-and-adjust";

export type SchedulingProfile = {
  pacePreference: PacePreference;
  structureLevel: StructureLevel;
  focusStyle: FocusStyle;
  rampUpStyle: RampUpStyle;
  // Derived recommendations
  checkInFrequency: "daily" | "weekly" | "milestone-based";
  milestoneSpacing: "compressed" | "even" | "back-loaded";
  bufferPreference: "minimal" | "moderate" | "generous";
};

// ============================================================================
// PERSONALIZED HABITS
// ============================================================================

export type CuePreference = {
  preferredTypes: HabitCue["type"][];
  examples: string[];
  reasoning: string;
};

export type RewardStyle = {
  type: "tracking" | "achievement" | "aesthetic" | "data" | "virtue" | "impact";
  examples: string[];
  celebrationStyle: string;
};

export type PersonalizedHabit = {
  baseHabit: Habit;
  // Personalized Atomic Habits components
  personalizedCue: {
    suggested: HabitCue;
    alternatives: HabitCue[];
    reasoning: string;
  };
  personalizedCraving: {
    statement: string;        // "Make it attractive" framing
    identityConnection: string; // How this connects to who they want to be
  };
  personalizedResponse: {
    twoMinuteVersion: string; // Archetype-phrased 2-minute version
    fullVersion: string;      // Full habit description
    actionVerb: string;       // "Execute", "Attack", "Create", etc.
  };
  personalizedReward: {
    immediate: string;        // Right after completing
    celebration: string;      // Streak milestones
    visualization: string;    // How to visualize progress
  };
  // Archetype-specific support
  motivationalPrompt: string;
  obstacleStrategies: ObstacleStrategy[];
  stackingSuggestions: HabitStackSuggestion[];
};

export type ObstacleStrategy = {
  obstacle: string;           // What might get in the way
  strategy: string;           // "If [obstacle], then [solution]"
  archetypeReasoning: string; // Why this works for this archetype
};

export type HabitStackSuggestion = {
  position: "before" | "after";
  anchorHabit: string;        // "After I [anchor habit]..."
  reasoning: string;
};

// ============================================================================
// SYSTEM TEMPLATE VARIATIONS
// ============================================================================

export type ArchetypeTemplateVariation = {
  archetypeId: ArchetypeId;
  // Identity framing
  identityStatement: string;  // "I am a person who..."
  identityReinforcement: string; // Reminder of who they're becoming
  // Habit variations
  habitVariations: Record<string, {
    titlePrefix?: string;     // "Execute:" or "Attack:" before habit
    cueOverride?: Partial<HabitCue>;
    responseOverride?: string;
    rewardOverride?: string;
  }>;
  // Environment
  environmentTweaks: EnvironmentTweak[];
  environmentPhilosophy: string; // How this archetype thinks about environment
  // Obstacles
  obstacleStrategies: ObstacleStrategy[];
  commonWeaknesses: string[]; // What this archetype typically struggles with
  // Motivation
  motivationalPhrases: string[];
  dailyReminder: string;      // Daily prompt in their voice
};

// ============================================================================
// GOAL PERSONALIZATION
// ============================================================================

export type PersonalizedGoalBreakdown = {
  goalId: string;
  archetypeId: ArchetypeId;
  strategy: BreakdownStrategy;
  // Personalized milestones
  milestones: PersonalizedMilestone[];
  // Overall framing
  journeyNarrative: string;   // "This is a systematic conquest..."
  successVision: string;      // What completion looks like for this archetype
  keyMetrics: string[];       // What this archetype should track
};

export type PersonalizedMilestone = {
  title: string;              // Archetype-phrased title
  description: string;
  actionVerb: string;
  keyActions: PersonalizedAction[];
  effort: "low" | "medium" | "high";
  motivationalNote: string;
  targetDate?: string;
};

export type PersonalizedAction = {
  action: string;
  verb: string;               // The action verb used
  isArchetypeStrength: boolean; // Is this something this archetype is naturally good at?
};

// ============================================================================
// TRAIT-BASED INSIGHTS
// ============================================================================

// Which traits influence which behaviors
export type TraitInfluence = {
  traitKey: keyof UserTraits;
  lowBehavior: string;        // Behavior when trait < 40
  highBehavior: string;       // Behavior when trait > 60
  balancedBehavior: string;   // Behavior when 40-60
  relevantFor: ("scheduling" | "cues" | "rewards" | "obstacles" | "motivation")[];
};

// Insight about how user's traits affect their approach
export type TraitInsight = {
  trait: keyof UserTraits;
  value: number;
  leaning: "low" | "balanced" | "high";
  insight: string;
  recommendation: string;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Derive scheduling profile from traits
export function deriveSchedulingProfile(traits: UserTraits): SchedulingProfile {
  const pacePreference: PacePreference =
    traits.patient_urgent < 40 ? "marathon" :
    traits.patient_urgent > 60 ? "sprint" : "steady";

  const structureLevel: StructureLevel =
    traits.spontaneous_structured < 40 ? "flexible" :
    traits.spontaneous_structured > 60 ? "rigid" : "adaptive";

  const focusStyle: FocusStyle =
    traits.process_outcome < 40 ? "daily-habits" :
    traits.process_outcome > 60 ? "milestone-driven" : "weekly-goals";

  const rampUpStyle: RampUpStyle =
    traits.conservative_experimental < 40 ? "gradual" :
    traits.conservative_experimental > 60 ? "aggressive" : "test-and-adjust";

  // Derive check-in frequency from structure level
  const checkInFrequency =
    structureLevel === "rigid" ? "daily" as const :
    structureLevel === "flexible" ? "milestone-based" as const : "weekly" as const;

  // Derive milestone spacing from pace preference
  const milestoneSpacing =
    pacePreference === "sprint" ? "compressed" as const :
    pacePreference === "marathon" ? "back-loaded" as const : "even" as const;

  // Derive buffer preference from risk tolerance
  const bufferPreference =
    traits.risk_averse_seeking < 40 ? "generous" as const :
    traits.risk_averse_seeking > 60 ? "minimal" as const : "moderate" as const;

  return {
    pacePreference,
    structureLevel,
    focusStyle,
    rampUpStyle,
    checkInFrequency,
    milestoneSpacing,
    bufferPreference,
  };
}

// Get trait leaning
export function getTraitLeaning(value: number): "low" | "balanced" | "high" {
  if (value < 40) return "low";
  if (value > 60) return "high";
  return "balanced";
}
