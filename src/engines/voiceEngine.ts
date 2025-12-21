// Voice Engine - Transform text and generate messaging based on archetype and voice profile
// This is the foundation for all personalized user-facing text

import {
  ArchetypeId,
  VoiceProfile,
  UserPrototype,
} from "../types/identity";
import {
  MotivationStyle,
  Tone,
  ActionVerbSet,
  BreakdownStrategy,
  BreakdownApproach,
} from "../types/personalization";

// ============================================================================
// ACTION VERBS BY ARCHETYPE
// ============================================================================

export const ARCHETYPE_VERBS: Record<ArchetypeId, ActionVerbSet> = {
  Machine: {
    primary: ["Execute", "Systematize", "Automate", "Implement", "Process"],
    secondary: ["Track", "Optimize", "Configure", "Deploy", "Install"],
    celebration: ["Completed", "Processed", "Executed", "Systematized", "Optimized"],
  },
  Warrior: {
    primary: ["Attack", "Conquer", "Dominate", "Crush", "Overcome"],
    secondary: ["Push", "Fight", "Battle", "Charge", "Strike"],
    celebration: ["Conquered", "Dominated", "Crushed", "Defeated", "Won"],
  },
  Artist: {
    primary: ["Create", "Explore", "Express", "Craft", "Design"],
    secondary: ["Flow", "Discover", "Shape", "Compose", "Envision"],
    celebration: ["Created", "Expressed", "Crafted", "Discovered", "Manifested"],
  },
  Scientist: {
    primary: ["Test", "Measure", "Analyze", "Experiment", "Research"],
    secondary: ["Observe", "Hypothesis", "Iterate", "Document", "Validate"],
    celebration: ["Validated", "Proven", "Measured", "Discovered", "Confirmed"],
  },
  Stoic: {
    primary: ["Accept", "Endure", "Focus", "Persist", "Embrace"],
    secondary: ["Control", "Release", "Observe", "Practice", "Maintain"],
    celebration: ["Accepted", "Endured", "Maintained", "Persisted", "Mastered"],
  },
  Visionary: {
    primary: ["Envision", "Build", "Transform", "Launch", "Scale"],
    secondary: ["Imagine", "Pioneer", "Revolutionize", "Inspire", "Lead"],
    celebration: ["Launched", "Transformed", "Built", "Pioneered", "Achieved"],
  },
};

// ============================================================================
// BREAKDOWN STRATEGIES BY ARCHETYPE
// ============================================================================

export const BREAKDOWN_STRATEGIES: Record<ArchetypeId, BreakdownStrategy> = {
  Machine: {
    archetypeId: "Machine",
    approach: "systematic",
    approachName: "Systematic Execution",
    description: "Break down into precise, measurable steps with clear processes",
    milestoneStyle: "Phase-based with metrics",
    verbSet: ARCHETYPE_VERBS.Machine,
    motivationPhrases: [
      "The system works. Trust the process.",
      "Execute. No excuses.",
      "One process at a time. Stack the wins.",
      "Efficiency is the goal. Optimize everything.",
      "Build the machine. Let it run.",
    ],
    phaseFraming: {
      start: "Install the foundation",
      middle: "Optimize the system",
      end: "Automate and scale",
    },
  },
  Warrior: {
    archetypeId: "Warrior",
    approach: "challenge",
    approachName: "Progressive Conquest",
    description: "Frame as battles to win, with increasing difficulty",
    milestoneStyle: "Challenge-based progression",
    verbSet: ARCHETYPE_VERBS.Warrior,
    motivationPhrases: [
      "This is your moment. Attack.",
      "No retreat. No surrender.",
      "Pain is temporary. Victory is forever.",
      "The battle is won in the mind first.",
      "Warriors don't make excuses. They make progress.",
    ],
    phaseFraming: {
      start: "Basic training",
      middle: "Advanced combat",
      end: "Total domination",
    },
  },
  Artist: {
    archetypeId: "Artist",
    approach: "flow",
    approachName: "Creative Discovery",
    description: "Explore and discover through creative expression",
    milestoneStyle: "Discovery-based journey",
    verbSet: ARCHETYPE_VERBS.Artist,
    motivationPhrases: [
      "Let the work flow through you.",
      "Find the beauty in the process.",
      "Create something only you can create.",
      "Trust your intuition. It knows the way.",
      "The masterpiece emerges one brushstroke at a time.",
    ],
    phaseFraming: {
      start: "Explore the possibilities",
      middle: "Deepen the practice",
      end: "Express your mastery",
    },
  },
  Scientist: {
    archetypeId: "Scientist",
    approach: "experimental",
    approachName: "Iterative Experimentation",
    description: "Test hypotheses, measure results, iterate based on data",
    milestoneStyle: "Experiment-based cycles",
    verbSet: ARCHETYPE_VERBS.Scientist,
    motivationPhrases: [
      "Let's examine the data.",
      "Test, measure, iterate.",
      "Every failure is data. Every success is validated.",
      "The truth is in the numbers.",
      "Curiosity drives discovery.",
    ],
    phaseFraming: {
      start: "Establish baseline and hypothesis",
      middle: "Test and measure",
      end: "Validate and document",
    },
  },
  Stoic: {
    archetypeId: "Stoic",
    approach: "acceptance",
    approachName: "Virtuous Progress",
    description: "Focus on what you control, accept what you cannot",
    milestoneStyle: "Virtue-based growth",
    verbSet: ARCHETYPE_VERBS.Stoic,
    motivationPhrases: [
      "Focus on what you can control.",
      "This too shall pass. Keep moving.",
      "The obstacle is the way.",
      "Do what is right, not what is easy.",
      "Amor fati. Love your fate.",
    ],
    phaseFraming: {
      start: "Accept the challenge",
      middle: "Persist through difficulty",
      end: "Embody the virtue",
    },
  },
  Visionary: {
    archetypeId: "Visionary",
    approach: "impact",
    approachName: "Vision-Driven Impact",
    description: "Work backward from the grand vision to today's action",
    milestoneStyle: "Impact-focused milestones",
    verbSet: ARCHETYPE_VERBS.Visionary,
    motivationPhrases: [
      "Think bigger. Go further.",
      "Build the future you want to see.",
      "Today's action, tomorrow's legacy.",
      "Dream it. Build it. Ship it.",
      "The world needs what only you can create.",
    ],
    phaseFraming: {
      start: "Envision the outcome",
      middle: "Build the foundation",
      end: "Scale the impact",
    },
  },
};

// ============================================================================
// MOTIVATION BY STYLE
// ============================================================================

export function getMotivation(
  style: MotivationStyle,
  context: string,
  intensity: "gentle" | "moderate" | "intense" = "moderate"
): string {
  const motivations: Record<MotivationStyle, Record<typeof intensity, string>> = {
    challenge: {
      gentle: `You can handle ${context}. Rise to it.`,
      moderate: `This is your moment. Attack ${context}.`,
      intense: `${context} won't conquer itself. Dominate it. Now.`,
    },
    support: {
      gentle: `Take your time with ${context}. You've got this.`,
      moderate: `You're ready for ${context}. One step at a time.`,
      intense: `I believe in you completely. Crush ${context}.`,
    },
    logic: {
      gentle: `${context} is achievable based on your track record.`,
      moderate: `The data shows ${context} is within reach. Here's the path.`,
      intense: `Statistically, you're positioned to excel at ${context}. Execute the plan.`,
    },
    inspiration: {
      gentle: `Imagine completing ${context}. How does that feel?`,
      moderate: `Picture yourself after ${context}. That person is waiting for you.`,
      intense: `${context} is your destiny. The universe conspires to help you achieve it.`,
    },
    discipline: {
      gentle: `${context}. Small consistent steps.`,
      moderate: `${context}. Execute. No excuses.`,
      intense: `${context}. Do it now. Discipline equals freedom.`,
    },
  };

  return motivations[style][intensity];
}

// ============================================================================
// TEXT TRANSFORMATION
// ============================================================================

/**
 * Apply voice profile to transform generic text into personalized messaging
 */
export function applyVoice(
  text: string,
  profile: VoiceProfile,
  archetype?: ArchetypeId
): string {
  let result = text;

  // Apply tone transformations
  switch (profile.tone) {
    case "direct":
      result = makeDirectTone(result);
      break;
    case "warm":
      result = makeWarmTone(result);
      break;
    case "philosophical":
      result = makePhilosophicalTone(result);
      break;
    case "energetic":
      result = makeEnergeticTone(result);
      break;
    case "analytical":
      result = makeAnalyticalTone(result);
      break;
  }

  // Apply archetype-specific verb substitution if provided
  if (archetype) {
    result = substituteVerbs(result, archetype);
  }

  return result;
}

function makeDirectTone(text: string): string {
  // Remove softening language
  return text
    .replace(/maybe you could/gi, "do")
    .replace(/you might want to/gi, "")
    .replace(/consider/gi, "do")
    .replace(/perhaps/gi, "")
    .replace(/try to/gi, "")
    .trim();
}

function makeWarmTone(text: string): string {
  // Add supportive language where appropriate
  return text
    .replace(/^Do /i, "Take time to ")
    .replace(/^Complete /i, "Enjoy completing ")
    .replace(/^Finish /i, "Wrap up ");
}

function makePhilosophicalTone(text: string): string {
  // Frame as deeper meaning
  return text
    .replace(/^Do /i, "Embrace the practice of ")
    .replace(/^Complete /i, "Fulfill ")
    .replace(/^Start /i, "Begin the journey of ");
}

function makeEnergeticTone(text: string): string {
  // Add energy and excitement
  return text
    .replace(/^Do /i, "Let's ")
    .replace(/^Complete /i, "Crush ")
    .replace(/^Start /i, "Launch into ");
}

function makeAnalyticalTone(text: string): string {
  // Frame as logical steps
  return text
    .replace(/^Do /i, "Execute step: ")
    .replace(/^Complete /i, "Finalize: ")
    .replace(/^Start /i, "Initialize: ");
}

function substituteVerbs(text: string, archetype: ArchetypeId): string {
  const verbs = ARCHETYPE_VERBS[archetype];

  // Common verb substitutions based on archetype
  const substitutions: Record<string, Record<ArchetypeId, string>> = {
    "do": {
      Machine: "execute",
      Warrior: "attack",
      Artist: "create",
      Scientist: "test",
      Stoic: "practice",
      Visionary: "build",
    },
    "complete": {
      Machine: "process",
      Warrior: "conquer",
      Artist: "craft",
      Scientist: "validate",
      Stoic: "fulfill",
      Visionary: "launch",
    },
    "start": {
      Machine: "initialize",
      Warrior: "charge into",
      Artist: "explore",
      Scientist: "hypothesize",
      Stoic: "begin",
      Visionary: "envision",
    },
    "work on": {
      Machine: "process",
      Warrior: "battle",
      Artist: "shape",
      Scientist: "experiment with",
      Stoic: "persist at",
      Visionary: "build",
    },
    "finish": {
      Machine: "finalize",
      Warrior: "dominate",
      Artist: "complete",
      Scientist: "conclude",
      Stoic: "accomplish",
      Visionary: "ship",
    },
  };

  let result = text;
  for (const [generic, archetypeMap] of Object.entries(substitutions)) {
    const regex = new RegExp(`\\b${generic}\\b`, "gi");
    result = result.replace(regex, archetypeMap[archetype]);
  }

  return result;
}

// ============================================================================
// CELEBRATION MESSAGES
// ============================================================================

export function celebrateCompletion(
  archetype: ArchetypeId,
  context: string,
  streak?: number
): string {
  const celebrations: Record<ArchetypeId, string[]> = {
    Machine: [
      `${context} processed. System functioning optimally.`,
      `Execution complete. ${streak ? `${streak}-day streak maintained.` : "Moving to next task."}`,
      "Another process completed. The machine keeps running.",
    ],
    Warrior: [
      `${context} conquered. Another battle won.`,
      `Victory! ${streak ? `${streak} days undefeated.` : "The war continues."}`,
      "You crushed it. Rest briefly, then attack again.",
    ],
    Artist: [
      `${context} created. Beautiful work.`,
      `You expressed yourself through ${context}. ${streak ? `${streak} days of creative flow.` : ""}`,
      "Another piece of your masterpiece complete.",
    ],
    Scientist: [
      `${context} validated. Data recorded.`,
      `Experiment successful. ${streak ? `${streak} consecutive data points.` : "Continuing observation."}`,
      "Results confirmed. Hypothesis strengthened.",
    ],
    Stoic: [
      `${context} accomplished. You did what was right.`,
      `The task is done. ${streak ? `${streak} days of virtuous action.` : "Focus on the next."}`,
      "You controlled what you could. The rest is fate.",
    ],
    Visionary: [
      `${context} launched. The vision advances.`,
      `Impact made. ${streak ? `${streak} days of building the future.` : "Keep creating."}`,
      "One step closer to the world you're building.",
    ],
  };

  const messages = celebrations[archetype];
  return messages[Math.floor(Math.random() * messages.length)];
}

// ============================================================================
// MILESTONE PHRASING
// ============================================================================

export function phraseMilestone(
  genericTitle: string,
  archetype: ArchetypeId,
  phase: "start" | "middle" | "end",
  quarterNumber?: number
): string {
  const strategy = BREAKDOWN_STRATEGIES[archetype];
  const phaseLabel = strategy.phaseFraming[phase];
  const verb = strategy.verbSet.primary[0];

  // Clean up the generic title
  const cleanTitle = genericTitle
    .replace(/^Q\d+:\s*/i, "")
    .replace(/^Phase \d+:\s*/i, "")
    .toLowerCase();

  const prefix = quarterNumber ? `Q${quarterNumber}:` : "";

  return `${prefix} ${phaseLabel} — ${verb} ${cleanTitle}`.trim();
}

// ============================================================================
// ACTION PHRASING
// ============================================================================

export function phraseAction(
  action: string,
  archetype: ArchetypeId
): string {
  const verbs = ARCHETYPE_VERBS[archetype];
  const verb = verbs.primary[Math.floor(Math.random() * verbs.primary.length)];

  // If action already starts with a verb, replace it
  const actionWords = action.split(" ");
  const firstWord = actionWords[0].toLowerCase();

  const genericVerbs = ["do", "make", "complete", "finish", "start", "work", "get"];

  if (genericVerbs.includes(firstWord)) {
    actionWords[0] = verb;
    return actionWords.join(" ");
  }

  return `${verb}: ${action}`;
}

// ============================================================================
// GREETING HELPERS
// ============================================================================

export function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function getPersonalizedGreeting(
  prototype: UserPrototype,
  userName: string
): string {
  const timeOfDay = getTimeOfDay();
  const archetype = prototype.archetypeBlend.primary;

  const greetings: Record<ArchetypeId, Record<typeof timeOfDay, string[]>> = {
    Machine: {
      morning: [`Systems online, ${userName}. Execute today's protocol.`, `Morning, ${userName}. Time to run the daily process.`],
      afternoon: [`Afternoon, ${userName}. Optimization in progress.`, `${userName}, mid-day checkpoint. Status: operational.`],
      evening: [`Evening, ${userName}. Processing daily review.`, `${userName}, end-of-day diagnostics ready.`],
    },
    Warrior: {
      morning: [`Rise, ${userName}. The battle begins.`, `Morning, warrior. Today's conquest awaits.`],
      afternoon: [`${userName}, the fight continues. Push harder.`, `Afternoon, ${userName}. No retreat.`],
      evening: [`Evening, ${userName}. Review your victories.`, `${userName}, the day's battle ends. Rest and prepare.`],
    },
    Artist: {
      morning: [`Good morning, ${userName}. What will you create today?`, `${userName}, a fresh canvas awaits.`],
      afternoon: [`Afternoon, ${userName}. The creative flow continues.`, `${userName}, your masterpiece is in progress.`],
      evening: [`Evening, ${userName}. Reflect on what you've crafted.`, `${userName}, another day of creation complete.`],
    },
    Scientist: {
      morning: [`Morning, ${userName}. Today's experiments await.`, `${userName}, new data to collect today.`],
      afternoon: [`Afternoon, ${userName}. Analysis in progress.`, `${userName}, preliminary results look promising.`],
      evening: [`Evening, ${userName}. Time to review the data.`, `${userName}, document today's observations.`],
    },
    Stoic: {
      morning: [`Morning, ${userName}. Focus on what you control.`, `${userName}, another day to practice virtue.`],
      afternoon: [`Afternoon, ${userName}. The obstacle is the way.`, `${userName}, persist. This too shall pass.`],
      evening: [`Evening, ${userName}. Reflect on your actions.`, `${userName}, did you do what was right today?`],
    },
    Visionary: {
      morning: [`Morning, ${userName}. The future is yours to build.`, `${userName}, today shapes tomorrow.`],
      afternoon: [`Afternoon, ${userName}. The vision is coming to life.`, `${userName}, keep building. Impact awaits.`],
      evening: [`Evening, ${userName}. Another day of progress.`, `${userName}, you're one day closer to the dream.`],
    },
  };

  const options = greetings[archetype][timeOfDay];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================================================
// OBSTACLE FRAMING
// ============================================================================

export function frameObstacle(
  obstacle: string,
  solution: string,
  archetype: ArchetypeId
): string {
  const frames: Record<ArchetypeId, (o: string, s: string) => string> = {
    Machine: (o, s) => `System interrupt: ${o} → Protocol: ${s}`,
    Warrior: (o, s) => `If ${o} attacks, counter with: ${s}`,
    Artist: (o, s) => `When ${o} blocks the flow, redirect: ${s}`,
    Scientist: (o, s) => `Hypothesis: If ${o} occurs, then ${s}`,
    Stoic: (o, s) => `When facing ${o}, remember: ${s}`,
    Visionary: (o, s) => `Obstacle: ${o} → Pivot: ${s}`,
  };

  return frames[archetype](obstacle, solution);
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export function getBreakdownStrategy(archetype: ArchetypeId): BreakdownStrategy {
  return BREAKDOWN_STRATEGIES[archetype];
}

export function getActionVerbs(archetype: ArchetypeId): ActionVerbSet {
  return ARCHETYPE_VERBS[archetype];
}

export function getRandomMotivation(archetype: ArchetypeId): string {
  const phrases = BREAKDOWN_STRATEGIES[archetype].motivationPhrases;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

export function getMotivationByStyle(
  prototype: UserPrototype,
  context: string
): string {
  return getMotivation(prototype.voiceProfile.motivationStyle, context);
}

// Identity statement templates by archetype
// Used in SystemBuilder to suggest identity statements
export const ARCHETYPE_IDENTITY_TEMPLATES: Record<ArchetypeId, {
  prefix: string;
  examples: string[];
  style: string;
}> = {
  Machine: {
    prefix: "I am someone who",
    examples: [
      "executes systems without exception",
      "treats consistency as non-negotiable",
      "optimizes processes relentlessly",
      "shows up regardless of feelings",
      "builds habits that run on autopilot",
    ],
    style: "Focus on systems and processes, not motivation",
  },
  Warrior: {
    prefix: "I am someone who",
    examples: [
      "attacks challenges with full force",
      "never backs down from hard work",
      "pushes through when others quit",
      "treats every day as a battle to win",
      "embraces the grind as the path to victory",
    ],
    style: "Frame identity as a battle to be won",
  },
  Artist: {
    prefix: "I am someone who",
    examples: [
      "creates beauty through daily practice",
      "flows with intuition and inspiration",
      "expresses myself through consistent action",
      "crafts my life as my greatest work",
      "finds joy in the process of becoming",
    ],
    style: "Emphasize creativity and self-expression",
  },
  Scientist: {
    prefix: "I am someone who",
    examples: [
      "experiments and iterates constantly",
      "measures what matters and adjusts",
      "tests hypotheses about what works",
      "learns from every outcome, good or bad",
      "uses data to drive decisions",
    ],
    style: "Frame identity around experimentation and learning",
  },
  Stoic: {
    prefix: "I am someone who",
    examples: [
      "does what is right, not what is easy",
      "controls what I can, accepts what I cannot",
      "finds peace in discipline",
      "values virtue over comfort",
      "practices equanimity in all circumstances",
    ],
    style: "Focus on virtue and inner peace",
  },
  Visionary: {
    prefix: "I am someone who",
    examples: [
      "builds toward a meaningful future",
      "aligns daily actions with big-picture goals",
      "sees habits as investments in tomorrow",
      "creates lasting impact through small steps",
      "lives with purpose and intention",
    ],
    style: "Connect identity to long-term vision and impact",
  },
};
