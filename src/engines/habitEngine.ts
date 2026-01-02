/**
 * @deprecated Habit Engine - Partially deprecated in favor of System Components
 *
 * This engine provides personalization for habits/components based on archetype.
 * While standalone Habits are deprecated, the personalization logic here is still
 * useful for SystemComponents. Functions like getHabitActionPhrase and
 * getHabitCompletionMessage work with both Habits and SystemComponents.
 *
 * For new code:
 * - Use SystemComponent instead of Habit
 * - Components are embedded within Systems, not standalone
 * - See systemEngine.ts for system-level operations
 */
// Habit Engine - Personalize habits based on archetype and Atomic Habits framework
// Generates personalized cues, cravings, responses, and rewards

import {
  ArchetypeId,
  UserPrototype,
  UserTraits,
} from "../types/identity";
import {
  Habit,
  HabitCue,
  HabitFrequency,
  EnvironmentTweak,
} from "../types/systems";
import { LoopId } from "../types/core";
import {
  PersonalizedHabit,
  CuePreference,
  RewardStyle,
  ObstacleStrategy,
  HabitStackSuggestion,
  SchedulingProfile,
  deriveSchedulingProfile,
} from "../types/personalization";
import {
  ARCHETYPE_VERBS,
  getRandomMotivation,
  phraseAction,
  celebrateCompletion,
  frameObstacle,
} from "./voiceEngine";

// ============================================================================
// CUE PREFERENCES BY ARCHETYPE
// ============================================================================

export const CUE_PREFERENCES: Record<ArchetypeId, CuePreference> = {
  Machine: {
    preferredTypes: ["time", "preceding_action"],
    examples: [
      "Every day at 6:00 AM",
      "After completing morning routine",
      "When the calendar reminder fires",
    ],
    reasoning: "Machines thrive on precise, systematic triggers that can be automated",
  },
  Warrior: {
    preferredTypes: ["emotional_state", "preceding_action"],
    examples: [
      "When you feel resistance",
      "The moment you wake up",
      "When you notice yourself avoiding it",
    ],
    reasoning: "Warriors use resistance and challenge as their trigger to attack",
  },
  Artist: {
    preferredTypes: ["emotional_state", "location"],
    examples: [
      "When inspiration strikes",
      "In your creative space",
      "When you need to decompress",
    ],
    reasoning: "Artists respond to emotional and environmental cues that invite flow",
  },
  Scientist: {
    preferredTypes: ["time", "preceding_action"],
    examples: [
      "After reviewing yesterday's data",
      "At consistent measurement times",
      "Following morning metrics check",
    ],
    reasoning: "Scientists need consistent timing for reliable data and observations",
  },
  Stoic: {
    preferredTypes: ["emotional_state", "time"],
    examples: [
      "When you notice negative emotion",
      "First thing upon waking",
      "During moments of difficulty",
    ],
    reasoning: "Stoics use challenges and set rituals as opportunities for practice",
  },
  Visionary: {
    preferredTypes: ["preceding_action", "location"],
    examples: [
      "After reviewing your goals",
      "When thinking about your future self",
      "In your planning environment",
    ],
    reasoning: "Visionaries connect habits to their larger vision and future state",
  },
};

// ============================================================================
// REWARD STYLES BY ARCHETYPE
// ============================================================================

export const REWARD_STYLES: Record<ArchetypeId, RewardStyle> = {
  Machine: {
    type: "tracking",
    examples: [
      "Check off the completion box",
      "Update the streak counter",
      "Log the data point",
      "See the system working",
    ],
    celebrationStyle: "Completion confirmed. System operational.",
  },
  Warrior: {
    type: "achievement",
    examples: [
      "Earn the daily victory badge",
      "Add to your win streak",
      "Unlock the next challenge level",
      "Record another battle won",
    ],
    celebrationStyle: "Victory achieved. Another conquest complete.",
  },
  Artist: {
    type: "aesthetic",
    examples: [
      "Admire what you've created",
      "Feel the satisfaction of expression",
      "See your progress visually",
      "Appreciate the craft",
    ],
    celebrationStyle: "Beautiful work. Your creation grows.",
  },
  Scientist: {
    type: "data",
    examples: [
      "Watch your progress graph climb",
      "See the correlation strengthen",
      "Add another data point",
      "Review the trend improvement",
    ],
    celebrationStyle: "Data point recorded. Pattern emerging.",
  },
  Stoic: {
    type: "virtue",
    examples: [
      "Acknowledge you did what was right",
      "Feel the strength of consistency",
      "Know you controlled what you could",
      "Embody the virtue you're building",
    ],
    celebrationStyle: "You did what was right. Virtue practiced.",
  },
  Visionary: {
    type: "impact",
    examples: [
      "See progress toward the vision",
      "Feel the future getting closer",
      "Measure the impact created",
      "Visualize the compound effect",
    ],
    celebrationStyle: "Impact made. The future is building.",
  },
};

// ============================================================================
// COMMON OBSTACLES BY ARCHETYPE
// ============================================================================

export const ARCHETYPE_OBSTACLES: Record<ArchetypeId, ObstacleStrategy[]> = {
  Machine: [
    {
      obstacle: "System disruption (travel, illness, emergency)",
      strategy: "Have a minimal viable routine (2-minute version) for disrupted days",
      archetypeReasoning: "Machines need fallback protocols when primary systems fail",
    },
    {
      obstacle: "Perfectionism blocking action",
      strategy: "Ship the minimum viable version, then iterate",
      archetypeReasoning: "Done is better than perfect. Optimize after execution.",
    },
    {
      obstacle: "Over-optimization paralysis",
      strategy: "Set a time limit for planning, then execute",
      archetypeReasoning: "Analysis has diminishing returns. Execute and measure.",
    },
  ],
  Warrior: [
    {
      obstacle: "Burnout from constant intensity",
      strategy: "Schedule strategic recovery as part of the battle plan",
      archetypeReasoning: "Even warriors need to sharpen their sword",
    },
    {
      obstacle: "Seeing setbacks as defeat",
      strategy: "Reframe: every setback is training for the next battle",
      archetypeReasoning: "Warriors learn more from losses than easy wins",
    },
    {
      obstacle: "Fighting too many battles at once",
      strategy: "Focus firepower on one front at a time",
      archetypeReasoning: "Concentrated force beats scattered effort",
    },
  ],
  Artist: [
    {
      obstacle: "Waiting for inspiration",
      strategy: "Start anyway; inspiration follows action, not the reverse",
      archetypeReasoning: "The muse visits those who show up consistently",
    },
    {
      obstacle: "Inner critic blocking creation",
      strategy: "Create first, judge later; separate creation from editing",
      archetypeReasoning: "All first drafts are garbage. Create, then refine.",
    },
    {
      obstacle: "Comparing to others' finished work",
      strategy: "Compare your chapter 1 to their chapter 1, not their chapter 20",
      archetypeReasoning: "Every master was once a disaster",
    },
  ],
  Scientist: [
    {
      obstacle: "Analysis paralysis from wanting more data",
      strategy: "Set a threshold: if data is X% confident, act",
      archetypeReasoning: "Waiting for certainty means never acting",
    },
    {
      obstacle: "Getting lost in research rabbit holes",
      strategy: "Time-box research phases; hypothesis → test → iterate",
      archetypeReasoning: "The point of research is action, not more research",
    },
    {
      obstacle: "Dismissing qualitative signals",
      strategy: "Log subjective observations alongside quantitative data",
      archetypeReasoning: "Not everything that matters can be measured precisely",
    },
  ],
  Stoic: [
    {
      obstacle: "Confusing acceptance with passivity",
      strategy: "Accept what is, but act on what you control",
      archetypeReasoning: "Stoicism is about wise action, not resignation",
    },
    {
      obstacle: "Emotional suppression instead of processing",
      strategy: "Acknowledge emotions, then choose your response",
      archetypeReasoning: "Stoics feel deeply; they just don't let feelings rule",
    },
    {
      obstacle: "Using philosophy to avoid discomfort",
      strategy: "Lean into the discomfort; that's where growth lives",
      archetypeReasoning: "The obstacle is the way",
    },
  ],
  Visionary: [
    {
      obstacle: "Vision too big, action too small",
      strategy: "Zoom in: what's the smallest step toward the vision today?",
      archetypeReasoning: "Big visions are built with small consistent actions",
    },
    {
      obstacle: "Shiny object syndrome (new vision before finishing)",
      strategy: "One vision at a time; park new ideas for later",
      archetypeReasoning: "Depth beats breadth. Complete, then expand.",
    },
    {
      obstacle: "Frustration with pace of change",
      strategy: "Measure progress over months, not days",
      archetypeReasoning: "Real change compounds slowly, then suddenly",
    },
  ],
};

// ============================================================================
// HABIT PERSONALIZATION
// ============================================================================

export function personalizeHabit(
  habit: Habit,
  prototype: UserPrototype
): PersonalizedHabit {
  const archetype = prototype.archetypeBlend.primary;
  const traits = prototype.traits;
  const voice = prototype.voiceProfile;

  return {
    baseHabit: habit,
    personalizedCue: generatePersonalizedCue(habit, archetype, traits),
    personalizedCraving: generatePersonalizedCraving(habit, archetype, prototype),
    personalizedResponse: generatePersonalizedResponse(habit, archetype),
    personalizedReward: generatePersonalizedReward(habit, archetype),
    motivationalPrompt: getRandomMotivation(archetype),
    obstacleStrategies: getRelevantObstacles(habit, archetype),
    stackingSuggestions: suggestHabitStacks(habit, archetype),
  };
}

function generatePersonalizedCue(
  habit: Habit,
  archetype: ArchetypeId,
  traits: UserTraits
): PersonalizedHabit["personalizedCue"] {
  const prefs = CUE_PREFERENCES[archetype];
  const existingCue = habit.cue;

  // Use existing cue as primary if it matches preferences
  const existingMatchesPreference = prefs.preferredTypes.includes(existingCue.type);

  // Generate alternatives based on archetype preference
  const alternatives: HabitCue[] = prefs.preferredTypes
    .filter(type => type !== existingCue.type)
    .map(type => ({
      type,
      value: generateCueValue(type, habit, archetype),
    }));

  return {
    suggested: existingMatchesPreference
      ? existingCue
      : { type: prefs.preferredTypes[0], value: generateCueValue(prefs.preferredTypes[0], habit, archetype) },
    alternatives,
    reasoning: prefs.reasoning,
  };
}

function generateCueValue(
  type: HabitCue["type"],
  habit: Habit,
  archetype: ArchetypeId
): string {
  // Generate contextual cue values based on type and habit
  switch (type) {
    case "time":
      // Suggest based on habit type
      if (habit.title.toLowerCase().includes("morning") || habit.title.toLowerCase().includes("wake")) {
        return "6:00 AM";
      }
      if (habit.title.toLowerCase().includes("evening") || habit.title.toLowerCase().includes("night")) {
        return "8:00 PM";
      }
      return "Same time every day";

    case "location":
      if (habit.loop === "Health") return "Gym / workout space";
      if (habit.loop === "Work") return "Desk / workspace";
      if (habit.loop === "Meaning") return "Quiet reflection space";
      return "Designated habit location";

    case "preceding_action":
      if (habit.title.toLowerCase().includes("morning")) return "After waking up";
      if (habit.title.toLowerCase().includes("meal") || habit.loop === "Health") return "After eating";
      return "After completing previous routine";

    case "emotional_state":
      if (archetype === "Warrior") return "When you feel resistance or want to avoid it";
      if (archetype === "Stoic") return "When you notice negative emotion arising";
      if (archetype === "Artist") return "When you feel the creative urge";
      return "When you notice the need for this habit";

    default:
      return CUE_PREFERENCES[archetype].examples[0];
  }
}

function generatePersonalizedCraving(
  habit: Habit,
  archetype: ArchetypeId,
  prototype: UserPrototype
): PersonalizedHabit["personalizedCraving"] {
  // Generate "Make it Attractive" framing based on archetype
  const cravingFrames: Record<ArchetypeId, (h: Habit) => string> = {
    Machine: (h) => `When you ${h.title.toLowerCase()}, you're building an unstoppable system`,
    Warrior: (h) => `This is your daily battle. Winners show up. Are you a winner?`,
    Artist: (h) => `${h.title} is your craft. Each rep makes you more of who you are.`,
    Scientist: (h) => `Every completion is a data point proving you can change.`,
    Stoic: (h) => `This practice builds the character you want to embody.`,
    Visionary: (h) => `Each time you do this, you're building the future you envision.`,
  };

  const identityFrames: Record<ArchetypeId, (h: Habit) => string> = {
    Machine: (h) => `I am someone who ${h.title.toLowerCase()} systematically`,
    Warrior: (h) => `I am a warrior who never misses ${h.title.toLowerCase()}`,
    Artist: (h) => `I am a creator who practices ${h.title.toLowerCase()}`,
    Scientist: (h) => `I am someone who consistently ${h.title.toLowerCase()}`,
    Stoic: (h) => `I am someone who does ${h.title.toLowerCase()} regardless of feeling`,
    Visionary: (h) => `I am building a future where ${h.title.toLowerCase()} is natural`,
  };

  return {
    statement: cravingFrames[archetype](habit),
    identityConnection: identityFrames[archetype](habit),
  };
}

function generatePersonalizedResponse(
  habit: Habit,
  archetype: ArchetypeId
): PersonalizedHabit["personalizedResponse"] {
  const verbs = ARCHETYPE_VERBS[archetype];
  const actionVerb = verbs.primary[0];

  // Generate 2-minute version
  const twoMinuteVersions: Record<string, string> = {
    exercise: "Put on workout clothes and do 5 pushups",
    meditat: "Sit in position and take 5 deep breaths",
    read: "Open the book and read one page",
    journal: "Write one sentence about today",
    learn: "Review one flashcard or concept",
    practice: "Do the simplest version for 2 minutes",
    clean: "Put away one item",
    call: "Send a quick thinking-of-you message",
  };

  let twoMinuteVersion = habit.response;

  // Find matching 2-minute version
  for (const [keyword, version] of Object.entries(twoMinuteVersions)) {
    if (habit.title.toLowerCase().includes(keyword) || habit.response.toLowerCase().includes(keyword)) {
      twoMinuteVersion = version;
      break;
    }
  }

  // If response is already short, use it; otherwise suggest simplified version
  if (!twoMinuteVersion || twoMinuteVersion === habit.response) {
    twoMinuteVersion = `Just start: ${habit.response.split(".")[0].toLowerCase()}`;
  }

  return {
    twoMinuteVersion: `${actionVerb}: ${twoMinuteVersion}`,
    fullVersion: `${actionVerb}: ${habit.response}`,
    actionVerb,
  };
}

function generatePersonalizedReward(
  habit: Habit,
  archetype: ArchetypeId
): PersonalizedHabit["personalizedReward"] {
  const style = REWARD_STYLES[archetype];

  return {
    immediate: style.examples[0],
    celebration: celebrateCompletion(archetype, habit.title),
    visualization: style.examples[style.examples.length - 1],
  };
}

function getRelevantObstacles(
  habit: Habit,
  archetype: ArchetypeId
): ObstacleStrategy[] {
  // Return archetype-specific obstacles
  // Could be enhanced to filter based on habit type
  return ARCHETYPE_OBSTACLES[archetype];
}

function suggestHabitStacks(
  habit: Habit,
  archetype: ArchetypeId
): HabitStackSuggestion[] {
  const suggestions: HabitStackSuggestion[] = [];

  // Suggest stacking based on habit type and archetype
  const stackPatterns: Record<ArchetypeId, { before: string[]; after: string[] }> = {
    Machine: {
      before: ["After completing system startup routine", "After checking today's schedule"],
      after: ["Before moving to next scheduled task", "Before system checkpoint"],
    },
    Warrior: {
      before: ["After morning battle cry / affirmation", "When resistance peaks"],
      after: ["Before next conquest", "As victory celebration"],
    },
    Artist: {
      before: ["After entering creative space", "When in flow state"],
      after: ["Before transitioning to other work", "As creative warm-down"],
    },
    Scientist: {
      before: ["After morning data review", "Following measurement routine"],
      after: ["Before documenting results", "Prior to analysis phase"],
    },
    Stoic: {
      before: ["After morning reflection", "Following meditation"],
      after: ["Before evening review", "As part of virtue practice"],
    },
    Visionary: {
      before: ["After reviewing the vision board", "Following goal check-in"],
      after: ["Before planning tomorrow", "As progress toward vision"],
    },
  };

  const pattern = stackPatterns[archetype];

  suggestions.push({
    position: "after",
    anchorHabit: pattern.before[0],
    reasoning: `${archetype}s work best when habits flow from ${pattern.before[0].toLowerCase()}`,
  });

  suggestions.push({
    position: "before",
    anchorHabit: pattern.after[0],
    reasoning: `Stack this before ${pattern.after[0].toLowerCase()} for natural transition`,
  });

  return suggestions;
}

// ============================================================================
// HABIT FREQUENCY SUGGESTIONS
// ============================================================================

export function suggestHabitFrequency(
  habit: Habit,
  schedulingProfile: SchedulingProfile
): HabitFrequency {
  // Sprinters prefer intense bursts, marathoners prefer sustainable daily
  if (schedulingProfile.pacePreference === "sprint") {
    // More intense, less frequent
    return "weekdays"; // Weekdays only, weekends off
  }

  if (schedulingProfile.pacePreference === "marathon") {
    // Gentle, daily consistency
    return "daily";
  }

  // Steady pace - balance based on habit type
  if (habit.loop === "Health" || habit.loop === "Meaning") {
    return "daily"; // These benefit from daily practice
  }

  return "weekdays";
}

// ============================================================================
// ENVIRONMENT RECOMMENDATIONS
// ============================================================================

export function suggestEnvironmentTweaks(
  habit: Habit,
  archetype: ArchetypeId
): EnvironmentTweak[] {
  const tweaks: EnvironmentTweak[] = [];

  // Archetype-specific environment philosophy
  const envPhilosophy: Record<ArchetypeId, { add: string; remove: string; modify: string }> = {
    Machine: {
      add: "Add visual cue for habit (checklist visible, equipment ready)",
      remove: "Remove decision points (pre-decide everything)",
      modify: "Optimize space for efficiency (everything in its place)",
    },
    Warrior: {
      add: "Add motivational triggers (quotes, trophy wall, battle station)",
      remove: "Remove escape routes (no easy distractions visible)",
      modify: "Make the space feel like a training ground",
    },
    Artist: {
      add: "Add inspiring elements (art, music ready, beautiful tools)",
      remove: "Remove harsh/sterile elements that kill creativity",
      modify: "Make the space feel inviting and alive",
    },
    Scientist: {
      add: "Add tracking tools (visible metrics, progress charts)",
      remove: "Remove variables that confound results",
      modify: "Control the environment for consistent conditions",
    },
    Stoic: {
      add: "Add reminders of why (values visible, memento mori)",
      remove: "Remove unnecessary comforts that breed weakness",
      modify: "Simplify space to essentials only",
    },
    Visionary: {
      add: "Add vision board or future-state imagery",
      remove: "Remove things that represent the old you",
      modify: "Design space as if future-you already lives here",
    },
  };

  const env = envPhilosophy[archetype];

  tweaks.push({
    id: `env_add_${habit.id}`,
    type: "add",
    description: `${env.add} (Primary habit location)`,
    completed: false,
  });

  tweaks.push({
    id: `env_remove_${habit.id}`,
    type: "remove",
    description: `${env.remove} (Primary habit location)`,
    completed: false,
  });

  tweaks.push({
    id: `env_modify_${habit.id}`,
    type: "modify",
    description: `${env.modify} (Primary habit location)`,
    completed: false,
  });

  return tweaks;
}

// ============================================================================
// BATCH PERSONALIZATION
// ============================================================================

export function personalizeAllHabits(
  habits: Habit[],
  prototype: UserPrototype
): PersonalizedHabit[] {
  return habits.map(habit => personalizeHabit(habit, prototype));
}

// ============================================================================
// HABIT DISPLAY HELPERS
// ============================================================================

export function getHabitActionPhrase(habit: Habit, archetype: ArchetypeId): string {
  const verb = ARCHETYPE_VERBS[archetype].primary[0];
  return `${verb}: ${habit.title}`;
}

export function getHabitCompletionMessage(
  habit: Habit,
  archetype: ArchetypeId,
  streak: number
): string {
  return celebrateCompletion(archetype, habit.title, streak);
}

export function getHabitObstaclePrompt(
  habit: Habit,
  obstacle: string,
  archetype: ArchetypeId
): string {
  const strategies = ARCHETYPE_OBSTACLES[archetype];
  const relevant = strategies.find(s =>
    s.obstacle.toLowerCase().includes(obstacle.toLowerCase())
  );

  if (relevant) {
    return frameObstacle(relevant.obstacle, relevant.strategy, archetype);
  }

  // Generic fallback
  return frameObstacle(obstacle, "Adjust and continue", archetype);
}
