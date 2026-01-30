// Scheduling Engine - Derive scheduling preferences from personality traits
// Influences goal timelines, habit frequencies, and milestone spacing

import {
  UserTraits,
  UserPrototype,
  ArchetypeId,
} from "../types/identity";
import {
  SchedulingProfile,
  PacePreference,
  StructureLevel,
  FocusStyle,
  RampUpStyle,
  TraitInsight,
  deriveSchedulingProfile,
  getTraitLeaning,
} from "../types/personalization";
import { Goal, GoalTimeframe } from "../types/goals";
import { HabitFrequency } from "../types/systems";

// ============================================================================
// SCHEDULING PROFILE DERIVATION
// ============================================================================

// Re-export from personalization types for convenience
export { deriveSchedulingProfile } from "../types/personalization";

/**
 * Get scheduling profile from user prototype
 */
export function getSchedulingProfile(prototype: UserPrototype): SchedulingProfile {
  return deriveSchedulingProfile(prototype.traits);
}

// ============================================================================
// TRAIT INSIGHTS FOR SCHEDULING
// ============================================================================

/**
 * Generate insights about how user's traits affect their scheduling preferences
 */
export function getSchedulingInsights(traits: UserTraits): TraitInsight[] {
  const insights: TraitInsight[] = [];

  // Patient ↔ Urgent
  const patienceLeaning = getTraitLeaning(traits.patient_urgent);
  insights.push({
    trait: "patient_urgent",
    value: traits.patient_urgent,
    leaning: patienceLeaning,
    insight: patienceLeaning === "low"
      ? "You prefer steady, long-term progress over quick wins"
      : patienceLeaning === "high"
        ? "You thrive with intense, time-compressed efforts"
        : "You balance short bursts with sustained effort",
    recommendation: patienceLeaning === "low"
      ? "Set longer timelines with smaller daily actions"
      : patienceLeaning === "high"
        ? "Use sprint-based approaches with aggressive deadlines"
        : "Mix sprint phases with maintenance periods",
  });

  // Spontaneous ↔ Structured
  const structureLeaning = getTraitLeaning(traits.spontaneous_structured);
  insights.push({
    trait: "spontaneous_structured",
    value: traits.spontaneous_structured,
    leaning: structureLeaning,
    insight: structureLeaning === "low"
      ? "You prefer flexibility and adapting as you go"
      : structureLeaning === "high"
        ? "You thrive with detailed plans and fixed schedules"
        : "You like structure with room for adaptation",
    recommendation: structureLeaning === "low"
      ? "Use flexible time blocks rather than rigid schedules"
      : structureLeaning === "high"
        ? "Create detailed daily schedules with specific times"
        : "Plan weekly structure but allow daily flexibility",
  });

  // Process ↔ Outcome oriented
  const processLeaning = getTraitLeaning(traits.process_outcome);
  insights.push({
    trait: "process_outcome",
    value: traits.process_outcome,
    leaning: processLeaning,
    insight: processLeaning === "low"
      ? "You find motivation in daily practices and routines"
      : processLeaning === "high"
        ? "You're energized by milestones and measurable outcomes"
        : "You balance process enjoyment with outcome focus",
    recommendation: processLeaning === "low"
      ? "Track daily habit completion, not just goal progress"
      : processLeaning === "high"
        ? "Set clear milestones and celebrate each achievement"
        : "Mix habit streaks with milestone tracking",
  });

  // Conservative ↔ Experimental
  const riskLeaning = getTraitLeaning(traits.conservative_experimental);
  insights.push({
    trait: "conservative_experimental",
    value: traits.conservative_experimental,
    leaning: riskLeaning,
    insight: riskLeaning === "low"
      ? "You prefer proven methods and gradual change"
      : riskLeaning === "high"
        ? "You're comfortable with bold moves and rapid iteration"
        : "You balance tested approaches with experiments",
    recommendation: riskLeaning === "low"
      ? "Start slow and build gradually over weeks"
      : riskLeaning === "high"
        ? "Jump in fast, adjust based on results"
        : "Test new approaches while maintaining proven systems",
  });

  return insights;
}

// ============================================================================
// TIMELINE RECOMMENDATIONS
// ============================================================================

export type TimelineSuggestion = {
  recommendedDuration: number; // in days
  milestoneCount: number;
  milestoneSpacing: "even" | "front-loaded" | "back-loaded";
  checkInFrequency: number; // days between check-ins
  bufferPercent: number; // extra time buffer (0-50%)
  reasoning: string;
};

/**
 * Suggest goal timeline based on scheduling profile
 */
export function suggestGoalTimeline(
  goal: Goal,
  profile: SchedulingProfile
): TimelineSuggestion {
  // Base duration by timeframe
  const baseDurations: Record<GoalTimeframe, number> = {
    annual: 365,
    quarterly: 90,
    monthly: 30,
    weekly: 7,
    daily: 1,
  };

  const baseDuration = baseDurations[goal.timeframe];

  // Adjust based on pace preference
  let durationMultiplier = 1;
  switch (profile.pacePreference) {
    case "sprint":
      durationMultiplier = 0.8; // 20% faster
      break;
    case "marathon":
      durationMultiplier = 1.2; // 20% more time
      break;
    case "steady":
      durationMultiplier = 1;
      break;
  }

  // Milestone count based on focus style
  let milestoneCount: number;
  switch (profile.focusStyle) {
    case "daily-habits":
      milestoneCount = Math.max(2, Math.floor(baseDuration / 30)); // Monthly milestones
      break;
    case "milestone-driven":
      milestoneCount = Math.max(4, Math.floor(baseDuration / 14)); // Bi-weekly milestones
      break;
    case "weekly-goals":
      milestoneCount = Math.floor(baseDuration / 7);
      break;
  }

  // Check-in frequency based on structure level
  let checkInFrequency: number;
  switch (profile.structureLevel) {
    case "rigid":
      checkInFrequency = 1; // Daily
      break;
    case "flexible":
      checkInFrequency = 7; // Weekly
      break;
    case "adaptive":
      checkInFrequency = 3; // Every few days
      break;
  }

  // Buffer based on ramp-up style
  let bufferPercent: number;
  switch (profile.rampUpStyle) {
    case "aggressive":
      bufferPercent = 10;
      break;
    case "gradual":
      bufferPercent = 30;
      break;
    case "test-and-adjust":
      bufferPercent = 20;
      break;
  }

  const recommendedDuration = Math.round(baseDuration * durationMultiplier);

  // Determine milestone spacing
  let milestoneSpacing: TimelineSuggestion["milestoneSpacing"];
  if (profile.pacePreference === "sprint") {
    milestoneSpacing = "front-loaded"; // More milestones early
  } else if (profile.pacePreference === "marathon") {
    milestoneSpacing = "back-loaded"; // Ramp up over time
  } else {
    milestoneSpacing = "even";
  }

  // Generate reasoning
  const reasoning = `Based on your ${profile.pacePreference} pace preference and ${profile.structureLevel} structure needs, ` +
    `we recommend ${recommendedDuration} days with ${milestoneCount} milestones. ` +
    `Check in every ${checkInFrequency === 1 ? "day" : `${checkInFrequency} days`} ` +
    `with ${bufferPercent}% buffer for flexibility.`;

  return {
    recommendedDuration,
    milestoneCount,
    milestoneSpacing,
    checkInFrequency,
    bufferPercent,
    reasoning,
  };
}

// ============================================================================
// HABIT FREQUENCY RECOMMENDATIONS
// ============================================================================

export type FrequencySuggestion = {
  recommended: HabitFrequency;
  alternatives: HabitFrequency[];
  reasoning: string;
};

/**
 * Suggest habit frequency based on scheduling profile
 */
export function suggestHabitFrequency(
  profile: SchedulingProfile,
  habitType: "building" | "maintaining" | "breaking" = "building"
): FrequencySuggestion {
  let recommended: HabitFrequency;
  let alternatives: HabitFrequency[];
  let reasoning: string;

  if (profile.pacePreference === "sprint") {
    // Sprinters do better with intense, focused periods
    recommended = "daily";
    alternatives = ["weekdays", "custom"];
    reasoning = "Your sprint preference means daily consistency during active periods works best";

  } else if (profile.pacePreference === "marathon") {
    // Marathoners need sustainable, long-term habits
    recommended = "daily";
    alternatives = ["weekdays", "weekly"];
    reasoning = "Your marathon approach benefits from gentle daily consistency";

  } else {
    // Steady pace - depends on habit type
    if (habitType === "building") {
      recommended = "daily";
      alternatives = ["weekdays"];
      reasoning = "Building new habits benefits from daily practice";
    } else if (habitType === "maintaining") {
      recommended = "weekdays";
      alternatives = ["daily", "weekly"];
      reasoning = "Maintenance habits can be weekday-focused";
    } else {
      recommended = "daily";
      alternatives = ["weekdays"];
      reasoning = "Breaking habits requires consistent vigilance";
    }
  }

  // Adjust based on structure level
  if (profile.structureLevel === "flexible") {
    reasoning += ". Your flexibility preference means missing occasional days is fine.";
  } else if (profile.structureLevel === "rigid") {
    reasoning += ". Your structured approach means sticking to the schedule is important.";
  }

  return {
    recommended,
    alternatives,
    reasoning,
  };
}

// ============================================================================
// MILESTONE DATE GENERATION
// ============================================================================

/**
 * Generate milestone dates based on timeline suggestion
 */
export function generateMilestoneDates(
  startDate: Date,
  timeline: TimelineSuggestion
): Date[] {
  const dates: Date[] = [];
  const totalDays = timeline.recommendedDuration;
  const count = timeline.milestoneCount;

  if (count === 0) return dates;

  for (let i = 1; i <= count; i++) {
    let dayOffset: number;

    switch (timeline.milestoneSpacing) {
      case "front-loaded":
        // More milestones earlier (exponential curve)
        dayOffset = Math.round(totalDays * Math.pow(i / count, 1.5));
        break;

      case "back-loaded":
        // More milestones later (log curve)
        dayOffset = Math.round(totalDays * Math.pow(i / count, 0.7));
        break;

      case "even":
      default:
        // Equal spacing
        dayOffset = Math.round((totalDays / count) * i);
        break;
    }

    const milestoneDate = new Date(startDate);
    milestoneDate.setDate(milestoneDate.getDate() + dayOffset);
    dates.push(milestoneDate);
  }

  return dates;
}

// ============================================================================
// ARCHETYPE-SPECIFIC SCHEDULING TENDENCIES
// ============================================================================

export type ArchetypeSchedulingTendency = {
  naturalPace: PacePreference;
  naturalStructure: StructureLevel;
  tips: string[];
  warnings: string[];
};

export const ARCHETYPE_SCHEDULING: Record<ArchetypeId, ArchetypeSchedulingTendency> = {
  Machine: {
    naturalPace: "steady",
    naturalStructure: "rigid",
    tips: [
      "Leverage your love of systems with detailed schedules",
      "Use automation for habit triggers (calendar reminders, apps)",
      "Track everything - you'll find patterns others miss",
    ],
    warnings: [
      "Don't over-optimize before you start executing",
      "Flexibility is sometimes needed - build in contingencies",
      "Remember: done is better than perfectly planned",
    ],
  },
  Warrior: {
    naturalPace: "sprint",
    naturalStructure: "adaptive",
    tips: [
      "Use aggressive timelines to stay motivated",
      "Frame milestones as battles to win",
      "Competition and challenges fuel your consistency",
    ],
    warnings: [
      "Build in recovery periods to avoid burnout",
      "Not everything is a battle - some things need patience",
      "Intensity isn't sustainable forever",
    ],
  },
  Artist: {
    naturalPace: "steady",
    naturalStructure: "flexible",
    tips: [
      "Create space for creative emergence in your schedule",
      "Use loose time blocks rather than rigid appointments",
      "Follow energy and inspiration when possible",
    ],
    warnings: [
      "Some structure prevents total chaos",
      "Waiting for inspiration can become procrastination",
      "Deadlines can actually help creativity",
    ],
  },
  Scientist: {
    naturalPace: "steady",
    naturalStructure: "adaptive",
    tips: [
      "Build experiments with clear hypothesis and measurement",
      "Schedule regular data review and analysis time",
      "Use iteration cycles rather than fixed plans",
    ],
    warnings: [
      "Don't wait for perfect data to act",
      "Over-analysis is a form of procrastination",
      "Sometimes you need to trust intuition, not just data",
    ],
  },
  Stoic: {
    naturalPace: "marathon",
    naturalStructure: "adaptive",
    tips: [
      "Focus on consistent daily practice over intensity",
      "Use morning and evening rituals as anchors",
      "Accept that some days will be harder - persist anyway",
    ],
    warnings: [
      "Don't confuse acceptance with passivity",
      "Sometimes you need to push harder, not just accept",
      "Emotion can be useful information - don't ignore it",
    ],
  },
  Visionary: {
    naturalPace: "sprint",
    naturalStructure: "flexible",
    tips: [
      "Connect every task to the bigger vision",
      "Use backward planning from the end state",
      "Flexibility allows pivoting when you see better paths",
    ],
    warnings: [
      "Vision without execution is just dreaming",
      "Don't abandon current progress for shiny new visions",
      "Details matter - the vision lives in the execution",
    ],
  },
};

/**
 * Get scheduling advice based on archetype
 */
export function getArchetypeSchedulingAdvice(archetype: ArchetypeId): ArchetypeSchedulingTendency {
  return ARCHETYPE_SCHEDULING[archetype];
}

// ============================================================================
// COMBINED SCHEDULING RECOMMENDATION
// ============================================================================

export type SchedulingRecommendation = {
  profile: SchedulingProfile;
  insights: TraitInsight[];
  archetypeTendency: ArchetypeSchedulingTendency;
  summary: string;
};

/**
 * Get complete scheduling recommendation for a user
 */
export function getSchedulingRecommendation(
  prototype: UserPrototype
): SchedulingRecommendation {
  const profile = deriveSchedulingProfile(prototype.traits);
  const insights = getSchedulingInsights(prototype.traits);
  const archetypeTendency = ARCHETYPE_SCHEDULING[prototype.archetypeBlend.primary];

  // Generate summary
  const summaryParts: string[] = [];

  summaryParts.push(`As a ${prototype.archetypeBlend.primary}, you naturally tend toward ${archetypeTendency.naturalPace} pacing.`);

  if (profile.pacePreference !== archetypeTendency.naturalPace) {
    summaryParts.push(`However, your traits suggest you might work better with a ${profile.pacePreference} approach.`);
  }

  summaryParts.push(`Your ${profile.structureLevel} structure preference means ${
    profile.structureLevel === "rigid" ? "detailed schedules work well for you" :
      profile.structureLevel === "flexible" ? "you need room to adapt" :
        "you benefit from structure with flexibility"
  }.`);

  return {
    profile,
    insights,
    archetypeTendency,
    summary: summaryParts.join(" "),
  };
}
