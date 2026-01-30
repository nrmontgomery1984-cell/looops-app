// Goal Breakdown Engine - Intelligent goal decomposition with archetype personalization

import { Goal, GoalTimeframe, LoopId, Task } from "../types";
import { ArchetypeId, UserPrototype } from "../types/identity";
import {
  PersonalizedGoalBreakdown,
  PersonalizedMilestone,
  PersonalizedAction,
} from "../types/personalization";
import {
  BREAKDOWN_STRATEGIES,
  ARCHETYPE_VERBS,
  getRandomMotivation,
  phraseAction,
  applyVoice,
} from "./voiceEngine";
import { suggestGoalTimeline, generateMilestoneDates, getSchedulingProfile } from "./schedulingEngine";

// Breakdown suggestion with context
export type BreakdownSuggestion = {
  id: string;
  title: string;
  description: string;
  actionVerb: string; // "Research", "Complete", "Launch", etc.
  targetDate: string;
  estimatedEffort: "low" | "medium" | "high";
  metrics?: { name: string; target: number; unit: string }[];
  keyActions?: string[]; // Specific actions to accomplish this
};

// Breakdown patterns for different goal types
type BreakdownPattern = {
  keywords: string[]; // Keywords that match this pattern
  quarterlySteps: string[];
  monthlySteps: string[];
  weeklySteps: string[];
};

// Common patterns for goal breakdown
const BREAKDOWN_PATTERNS: Record<string, BreakdownPattern> = {
  // Learning/Skill patterns
  learn: {
    keywords: ["learn", "master", "skill", "expertise", "study", "understand"],
    quarterlySteps: [
      "Complete foundation learning - core concepts and basics",
      "Practice intermediate techniques through projects",
      "Apply advanced concepts and build portfolio",
      "Achieve mastery through teaching or certification",
    ],
    monthlySteps: [
      "Complete introductory course or resources",
      "Build first practice project",
      "Get feedback and iterate",
    ],
    weeklySteps: [
      "Study core concepts (4 hours)",
      "Complete practice exercises",
      "Apply learning to real project",
      "Review and solidify knowledge",
    ],
  },

  // Fitness/Health patterns
  fitness: {
    keywords: ["fitness", "workout", "exercise", "strength", "run", "weight", "body"],
    quarterlySteps: [
      "Build consistent habit - 3x/week minimum",
      "Increase intensity and volume progressively",
      "Specialize and push performance limits",
      "Optimize and maintain peak performance",
    ],
    monthlySteps: [
      "Establish baseline and routine",
      "Progress load or duration by 10%",
      "Test new max and adjust program",
    ],
    weeklySteps: [
      "Complete all scheduled workouts",
      "Track nutrition and recovery",
      "Hit weekly volume target",
      "Rest and assess progress",
    ],
  },

  // Financial patterns
  financial: {
    keywords: ["save", "invest", "money", "income", "debt", "emergency", "fund", "financial"],
    quarterlySteps: [
      "Set up systems and hit 25% of target",
      "Maintain momentum, reach 50% milestone",
      "Push through to 75% completion",
      "Achieve goal and establish maintenance",
    ],
    monthlySteps: [
      "Automate savings/payments",
      "Review and optimize spending",
      "Track progress and adjust targets",
    ],
    weeklySteps: [
      "Review weekly spending",
      "Transfer to savings/investment",
      "Avoid impulse purchases",
      "Update financial tracker",
    ],
  },

  // Relationship patterns
  relationship: {
    keywords: ["family", "relationship", "connect", "friend", "social", "partner", "date"],
    quarterlySteps: [
      "Establish regular quality time rituals",
      "Plan and execute shared experiences",
      "Deepen communication and understanding",
      "Celebrate and plan for next year",
    ],
    monthlySteps: [
      "Schedule dedicated quality time",
      "Have meaningful conversations",
      "Do something new together",
    ],
    weeklySteps: [
      "One quality conversation",
      "One shared activity",
      "Express appreciation",
      "Plan upcoming time together",
    ],
  },

  // Project/Build patterns
  project: {
    keywords: ["build", "create", "launch", "project", "develop", "ship", "product", "start"],
    quarterlySteps: [
      "Research, plan, and validate concept",
      "Build MVP or core functionality",
      "Launch, get feedback, iterate",
      "Scale, optimize, and stabilize",
    ],
    monthlySteps: [
      "Define scope and requirements",
      "Build core features",
      "Test and refine",
    ],
    weeklySteps: [
      "Complete key deliverable",
      "Get user/stakeholder feedback",
      "Fix issues and improve",
      "Plan next sprint",
    ],
  },

  // Habit/Routine patterns
  habit: {
    keywords: ["habit", "routine", "daily", "consistent", "practice", "meditation", "sleep"],
    quarterlySteps: [
      "Never miss twice - build 30-day streak",
      "Increase duration/intensity of habit",
      "Handle disruptions gracefully",
      "Habit is automatic - optimize",
    ],
    monthlySteps: [
      "Track daily for full month",
      "Identify and remove friction",
      "Add accountability partner",
    ],
    weeklySteps: [
      "Complete habit every day",
      "Log results and feelings",
      "Adjust timing if needed",
      "Celebrate weekly streak",
    ],
  },

  // Career/Work patterns
  career: {
    keywords: ["career", "promotion", "advance", "job", "work", "professional", "leadership"],
    quarterlySteps: [
      "Define target and build development plan",
      "Execute high-visibility projects",
      "Build relationships and seek mentorship",
      "Push for advancement opportunity",
    ],
    monthlySteps: [
      "Complete one visible achievement",
      "Have career conversation with manager",
      "Expand professional network",
    ],
    weeklySteps: [
      "Exceed expectations on one task",
      "Help a colleague succeed",
      "Learn something new",
      "Update career progress doc",
    ],
  },

  // Declutter/Organize patterns
  organize: {
    keywords: ["organize", "declutter", "clean", "optimize", "simplify", "home", "space"],
    quarterlySteps: [
      "Deep purge - one major area per week",
      "Install systems and storage solutions",
      "Beautify and personalize spaces",
      "Create maintenance routines",
    ],
    monthlySteps: [
      "Tackle one room completely",
      "Donate/sell removed items",
      "Set up organization system",
    ],
    weeklySteps: [
      "Declutter one drawer/shelf",
      "Process incoming items",
      "10-minute daily tidy",
      "Plan next area to tackle",
    ],
  },
};

// Default pattern when no specific match
const DEFAULT_PATTERN: BreakdownPattern = {
  keywords: [],
  quarterlySteps: [
    "Foundation - research and initial setup",
    "Building - consistent execution",
    "Pushing - overcome challenges",
    "Completing - finish and optimize",
  ],
  monthlySteps: [
    "Set clear milestone targets",
    "Execute and track progress",
    "Review and adjust approach",
  ],
  weeklySteps: [
    "Define week's key result",
    "Take daily action",
    "Measure progress",
    "Plan next week",
  ],
};

// Find matching pattern for a goal
function findMatchingPattern(goalTitle: string, goalDescription?: string): BreakdownPattern {
  const searchText = `${goalTitle} ${goalDescription || ""}`.toLowerCase();

  for (const [key, pattern] of Object.entries(BREAKDOWN_PATTERNS)) {
    if (pattern.keywords.some(keyword => searchText.includes(keyword))) {
      return pattern;
    }
  }

  return DEFAULT_PATTERN;
}

// Generate action verb based on step content
function getActionVerb(step: string): string {
  const verbMap: Record<string, string[]> = {
    "Complete": ["complete", "finish", "do", "execute"],
    "Build": ["build", "create", "develop", "make"],
    "Research": ["research", "learn", "study", "understand"],
    "Launch": ["launch", "ship", "release", "deploy"],
    "Track": ["track", "measure", "monitor", "log"],
    "Review": ["review", "assess", "evaluate", "check"],
    "Establish": ["establish", "set up", "install", "create"],
    "Increase": ["increase", "grow", "expand", "scale"],
    "Practice": ["practice", "train", "exercise", "work"],
    "Plan": ["plan", "define", "scope", "prepare"],
  };

  const stepLower = step.toLowerCase();
  for (const [verb, keywords] of Object.entries(verbMap)) {
    if (keywords.some(k => stepLower.includes(k))) {
      return verb;
    }
  }
  return "Complete";
}

// Estimate effort based on timeframe and step position
function estimateEffort(timeframe: GoalTimeframe, position: number, total: number): "low" | "medium" | "high" {
  // Middle steps tend to be harder
  const relativePosition = position / total;
  if (relativePosition < 0.3) return "medium"; // Getting started
  if (relativePosition > 0.7) return "medium"; // Finishing up
  return "high"; // Middle is hardest
}

// Generate smart key actions for a step
function generateKeyActions(step: string, goalTitle: string, timeframe: GoalTimeframe): string[] {
  const stepLower = step.toLowerCase();

  // Default actions based on common patterns
  if (stepLower.includes("research") || stepLower.includes("learn")) {
    return [
      "Find 3-5 quality resources",
      "Block time for focused study",
      "Take notes and summarize learnings",
      "Apply one concept immediately",
    ];
  }

  if (stepLower.includes("habit") || stepLower.includes("consistent")) {
    return [
      "Set specific time for habit",
      "Remove obstacles and friction",
      "Track completion daily",
      "Never miss twice rule",
    ];
  }

  if (stepLower.includes("build") || stepLower.includes("create")) {
    return [
      "Define minimum viable scope",
      "Work in focused sprints",
      "Get early feedback",
      "Iterate based on results",
    ];
  }

  if (stepLower.includes("track") || stepLower.includes("measure")) {
    return [
      "Choose key metrics",
      "Set up tracking system",
      "Review weekly",
      "Adjust approach based on data",
    ];
  }

  // Generic actions based on timeframe
  if (timeframe === "weekly") {
    return [
      "Set clear daily targets",
      "Work on this first each day",
      "Review progress mid-week",
    ];
  }

  return [
    "Define success criteria",
    "Schedule focused work time",
    "Track progress regularly",
  ];
}

// Main breakdown function
export function generateSmartBreakdown(
  goal: Goal,
  targetTimeframe: GoalTimeframe
): BreakdownSuggestion[] {
  const pattern = findMatchingPattern(goal.title, goal.description);
  const now = new Date();
  const parentEnd = new Date(goal.targetDate);
  const suggestions: BreakdownSuggestion[] = [];

  let steps: string[] = [];
  let dates: Date[] = [];

  switch (targetTimeframe) {
    case "quarterly":
      steps = pattern.quarterlySteps;
      // Generate quarter end dates
      for (let q = 0; q < 4; q++) {
        const quarterEnd = new Date(now.getFullYear(), (q + 1) * 3, 0);
        if (quarterEnd <= parentEnd && quarterEnd >= now) {
          dates.push(quarterEnd);
        }
      }
      break;

    case "monthly":
      steps = pattern.monthlySteps;
      // Generate month end dates (up to 6 months)
      for (let m = 0; m < 6; m++) {
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + m + 1, 0);
        if (monthEnd <= parentEnd) {
          dates.push(monthEnd);
        }
      }
      break;

    case "weekly":
      steps = pattern.weeklySteps;
      // Generate week end dates (up to 4 weeks)
      for (let w = 0; w < 4; w++) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + (7 * (w + 1)) - weekEnd.getDay());
        if (weekEnd <= parentEnd) {
          dates.push(weekEnd);
        }
      }
      break;

    case "daily":
      // Generate next 7 days
      for (let d = 0; d < 7; d++) {
        const day = new Date(now);
        day.setDate(day.getDate() + d);
        if (day <= parentEnd) {
          dates.push(day);
          steps.push(`Daily action: Focus on ${goal.title}`);
        }
      }
      break;
  }

  // Match steps to dates
  const stepCount = Math.min(steps.length, dates.length);
  for (let i = 0; i < stepCount; i++) {
    const step = steps[i];
    const date = dates[i];

    suggestions.push({
      id: `breakdown_${i}_${Date.now()}`,
      title: step,
      description: `Milestone ${i + 1} for: ${goal.title}`,
      actionVerb: getActionVerb(step),
      targetDate: date.toISOString().split("T")[0],
      estimatedEffort: estimateEffort(targetTimeframe, i, stepCount),
      keyActions: generateKeyActions(step, goal.title, targetTimeframe),
    });
  }

  // If we have more dates than steps, generate additional suggestions
  for (let i = stepCount; i < dates.length; i++) {
    const date = dates[i];
    const dateLabel = targetTimeframe === "weekly"
      ? `Week ${i + 1}`
      : date.toLocaleDateString("en-US", { month: "short" });

    suggestions.push({
      id: `breakdown_extra_${i}_${Date.now()}`,
      title: `${dateLabel}: Continue progress on ${goal.title}`,
      description: `Additional milestone for: ${goal.title}`,
      actionVerb: "Progress",
      targetDate: date.toISOString().split("T")[0],
      estimatedEffort: "medium",
      keyActions: ["Review previous milestone", "Push toward goal", "Adjust as needed"],
    });
  }

  return suggestions;
}

// Create goals from breakdown suggestions
export function createGoalsFromBreakdown(
  parentGoal: Goal,
  suggestions: BreakdownSuggestion[],
  targetTimeframe: GoalTimeframe
): Goal[] {
  const now = new Date().toISOString();

  return suggestions.map((s, idx) => ({
    id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: s.title,
    description: s.description,
    loop: parentGoal.loop,
    timeframe: targetTimeframe,
    parentGoalId: parentGoal.id,
    childGoalIds: [],
    status: "active" as const,
    progress: 0,
    startDate: idx === 0 ? now : suggestions[idx - 1].targetDate,
    targetDate: s.targetDate,
    createdAt: now,
    updatedAt: now,
  }));
}

// Create tasks from breakdown suggestions
export function createTasksFromBreakdown(
  parentGoal: Goal,
  suggestions: BreakdownSuggestion[],
  goalIds: string[]
): Task[] {
  const now = new Date().toISOString();

  return suggestions.map((s, idx) => ({
    id: `task_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
    title: s.title,
    description: s.keyActions?.join("\n• ") || s.description,
    loop: parentGoal.loop,
    priority: s.estimatedEffort === "high" ? 1 : s.estimatedEffort === "medium" ? 2 : 3,
    status: "todo" as const,
    order: idx,
    dueDate: s.targetDate,
    createdAt: now,
    goalId: goalIds[idx],
  }));
}

// Get breakdown hints for a goal (used in UI)
export function getBreakdownHints(goal: Goal): string[] {
  const pattern = findMatchingPattern(goal.title, goal.description);

  return [
    `Consider breaking into ${pattern.quarterlySteps.length} quarters`,
    `Each quarter has specific focus: ${pattern.quarterlySteps.map((s, i) => `Q${i+1}: ${s.split(" - ")[0]}`).join(", ")}`,
    "Create tasks for immediate actions",
  ];
}

// ============================================================================
// ARCHETYPE-AWARE BREAKDOWN
// ============================================================================

/**
 * Archetype-specific step transformations
 * Maps generic steps to archetype-flavored versions
 */
const ARCHETYPE_STEP_TRANSFORMS: Record<ArchetypeId, Record<string, string>> = {
  Machine: {
    "foundation": "Install the foundation system",
    "build": "Systematize the core process",
    "practice": "Execute the routine",
    "complete": "Finalize and automate",
    "research": "Analyze and document",
    "consistent": "Maintain systematic execution",
    "increase": "Optimize and scale",
    "establish": "Configure the system",
  },
  Warrior: {
    "foundation": "Basic training complete",
    "build": "Battle-ready development",
    "practice": "Combat training",
    "complete": "Victory achieved",
    "research": "Study the enemy",
    "consistent": "Maintain the assault",
    "increase": "Intensify the attack",
    "establish": "Fortify your position",
  },
  Artist: {
    "foundation": "Explore the canvas",
    "build": "Craft your expression",
    "practice": "Flow with the work",
    "complete": "The masterpiece emerges",
    "research": "Discover inspiration",
    "consistent": "Honor the practice",
    "increase": "Deepen the craft",
    "establish": "Create your space",
  },
  Scientist: {
    "foundation": "Establish baseline hypothesis",
    "build": "Test and iterate",
    "practice": "Run the experiment",
    "complete": "Validate results",
    "research": "Gather data",
    "consistent": "Maintain observation protocol",
    "increase": "Scale the experiment",
    "establish": "Set up the lab",
  },
  Stoic: {
    "foundation": "Accept the beginning",
    "build": "Persist through difficulty",
    "practice": "Practice the virtue",
    "complete": "Embody the lesson",
    "research": "Contemplate wisely",
    "consistent": "Maintain equanimity",
    "increase": "Embrace greater challenge",
    "establish": "Root in principle",
  },
  Visionary: {
    "foundation": "Envision the destination",
    "build": "Build toward the future",
    "practice": "Live as your future self",
    "complete": "The vision manifests",
    "research": "See what others can't",
    "consistent": "Stay true to the vision",
    "increase": "Scale the impact",
    "establish": "Plant the seed of change",
  },
};

/**
 * Transform a generic step into archetype-specific language
 */
function transformStepForArchetype(step: string, archetype: ArchetypeId): string {
  const transforms = ARCHETYPE_STEP_TRANSFORMS[archetype];
  const stepLower = step.toLowerCase();

  // Find matching transform
  for (const [keyword, replacement] of Object.entries(transforms)) {
    if (stepLower.includes(keyword)) {
      // Replace the first sentence/clause containing the keyword
      const parts = step.split(" - ");
      if (parts.length > 1) {
        return `${replacement} - ${parts.slice(1).join(" - ")}`;
      }
      return replacement;
    }
  }

  // If no match, prefix with archetype verb
  const verbs = ARCHETYPE_VERBS[archetype];
  return `${verbs.primary[0]}: ${step}`;
}

/**
 * Generate archetype-specific key actions for a step
 */
function generateArchetypeKeyActions(
  step: string,
  goalTitle: string,
  archetype: ArchetypeId,
  timeframe: GoalTimeframe
): PersonalizedAction[] {
  const verbs = ARCHETYPE_VERBS[archetype];
  const baseActions = generateKeyActions(step, goalTitle, timeframe);

  return baseActions.map((action, idx) => {
    const verb = verbs.primary[idx % verbs.primary.length];
    return {
      action: `${verb}: ${action.replace(/^[A-Z][a-z]+:\s*/, "")}`,
      verb,
      isArchetypeStrength: idx < 2, // First two actions are typically strengths
    };
  });
}

/**
 * Generate a fully personalized goal breakdown based on archetype
 */
export function generatePersonalizedBreakdown(
  goal: Goal,
  prototype: UserPrototype,
  targetTimeframe: GoalTimeframe
): PersonalizedGoalBreakdown {
  const archetype = prototype.archetypeBlend.primary;
  const strategy = BREAKDOWN_STRATEGIES[archetype];
  const schedulingProfile = getSchedulingProfile(prototype);

  // Get base breakdown suggestions
  const baseSuggestions = generateSmartBreakdown(goal, targetTimeframe);

  // Get timeline recommendation
  const timeline = suggestGoalTimeline(goal, schedulingProfile);

  // Transform each suggestion into a personalized milestone
  const milestones: PersonalizedMilestone[] = baseSuggestions.map((suggestion, idx) => {
    const phase = idx === 0 ? "start" : idx === baseSuggestions.length - 1 ? "end" : "middle";
    const transformedTitle = transformStepForArchetype(suggestion.title, archetype);

    return {
      title: transformedTitle,
      description: applyVoice(suggestion.description, prototype.voiceProfile, archetype),
      actionVerb: ARCHETYPE_VERBS[archetype].primary[idx % ARCHETYPE_VERBS[archetype].primary.length],
      keyActions: generateArchetypeKeyActions(suggestion.title, goal.title, archetype, targetTimeframe),
      effort: suggestion.estimatedEffort,
      motivationalNote: getRandomMotivation(archetype),
      targetDate: suggestion.targetDate,
    };
  });

  // Generate journey narrative
  const journeyNarrative = generateJourneyNarrative(goal, archetype, milestones.length);

  // Generate success vision
  const successVision = generateSuccessVision(goal, archetype);

  // Suggest key metrics based on archetype tracking style
  const keyMetrics = generateArchetypeMetrics(goal, archetype);

  return {
    goalId: goal.id,
    archetypeId: archetype,
    strategy,
    milestones,
    journeyNarrative,
    successVision,
    keyMetrics,
  };
}

/**
 * Generate a narrative for the goal journey based on archetype
 */
function generateJourneyNarrative(goal: Goal, archetype: ArchetypeId, milestoneCount: number): string {
  const narratives: Record<ArchetypeId, (g: Goal, n: number) => string> = {
    Machine: (g, n) =>
      `This is a ${n}-phase systematic process to ${g.title.toLowerCase()}. Each phase builds on the last, creating an optimized system for success.`,
    Warrior: (g, n) =>
      `This is a ${n}-battle campaign to ${g.title.toLowerCase()}. Each victory strengthens you for the next. No retreat, no surrender.`,
    Artist: (g, n) =>
      `This is a ${n}-chapter creative journey to ${g.title.toLowerCase()}. Let each phase flow naturally into the next as your masterpiece emerges.`,
    Scientist: (g, n) =>
      `This is a ${n}-experiment process to ${g.title.toLowerCase()}. Each phase tests a hypothesis, and the data guides the next iteration.`,
    Stoic: (g, n) =>
      `This is a ${n}-phase practice in ${g.title.toLowerCase()}. Each step builds character and resilience. Focus on what you control.`,
    Visionary: (g, n) =>
      `This is a ${n}-stage transformation toward ${g.title.toLowerCase()}. Each phase brings you closer to the future you're building.`,
  };

  return narratives[archetype](goal, milestoneCount);
}

/**
 * Generate success vision based on archetype
 */
function generateSuccessVision(goal: Goal, archetype: ArchetypeId): string {
  const visions: Record<ArchetypeId, (g: Goal) => string> = {
    Machine: (g) =>
      `When complete, you'll have a fully optimized system for ${g.title.toLowerCase()} that runs automatically and efficiently.`,
    Warrior: (g) =>
      `Victory looks like total domination of ${g.title.toLowerCase()}. You'll stand as proof that determination conquers all.`,
    Artist: (g) =>
      `The masterpiece is ${g.title.toLowerCase()} expressed through your unique vision. Others will see your art in the result.`,
    Scientist: (g) =>
      `Success is validated data proving ${g.title.toLowerCase()} is achieved. The evidence will be undeniable.`,
    Stoic: (g) =>
      `Completion means embodying ${g.title.toLowerCase()} as part of who you are. It becomes natural, not forced.`,
    Visionary: (g) =>
      `The future you're building includes ${g.title.toLowerCase()} as a foundation for even greater impact.`,
  };

  return visions[archetype](goal);
}

/**
 * Suggest metrics based on archetype tracking preferences
 */
function generateArchetypeMetrics(goal: Goal, archetype: ArchetypeId): string[] {
  const metricStyles: Record<ArchetypeId, string[]> = {
    Machine: [
      "Completion percentage (0-100%)",
      "Daily/weekly execution rate",
      "Process efficiency score",
      "Streak days maintained",
    ],
    Warrior: [
      "Battles won (milestones completed)",
      "Personal records broken",
      "Consecutive victory days",
      "Challenge difficulty level",
    ],
    Artist: [
      "Quality satisfaction (1-10)",
      "Flow state frequency",
      "Creative output volume",
      "Inspiration moments captured",
    ],
    Scientist: [
      "Data points collected",
      "Experiments completed",
      "Correlation strength",
      "Variance from baseline",
    ],
    Stoic: [
      "Virtue practice days",
      "Challenges accepted",
      "Equanimity maintained (Y/N)",
      "Progress regardless of feeling",
    ],
    Visionary: [
      "Impact created",
      "% toward vision",
      "People influenced",
      "Future-state alignment score",
    ],
  };

  return metricStyles[archetype];
}

/**
 * Get archetype-specific breakdown hints for UI
 */
export function getArchetypeBreakdownHints(goal: Goal, archetype: ArchetypeId): string[] {
  const strategy = BREAKDOWN_STRATEGIES[archetype];
  const pattern = findMatchingPattern(goal.title, goal.description);

  return [
    `As a ${archetype}, your approach: "${strategy.approachName}"`,
    `Phase style: ${strategy.phaseFraming.start} → ${strategy.phaseFraming.middle} → ${strategy.phaseFraming.end}`,
    `Motivation: ${strategy.motivationPhrases[0]}`,
    `Pattern detected: ${pattern.quarterlySteps.length} natural phases`,
  ];
}

/**
 * Convert personalized breakdown to standard breakdown suggestions
 * (for compatibility with existing goal creation functions)
 */
export function personalizedToStandardBreakdown(
  personalized: PersonalizedGoalBreakdown
): BreakdownSuggestion[] {
  return personalized.milestones.map((milestone, idx) => ({
    id: `breakdown_${idx}_${Date.now()}`,
    title: milestone.title,
    description: milestone.description,
    actionVerb: milestone.actionVerb,
    targetDate: milestone.targetDate || new Date().toISOString().split("T")[0],
    estimatedEffort: milestone.effort,
    keyActions: milestone.keyActions.map(a => a.action),
  }));
}

/**
 * Generate a complete archetype-aware breakdown with both personalized
 * and standard formats
 */
export function generateCompleteBreakdown(
  goal: Goal,
  prototype: UserPrototype,
  targetTimeframe: GoalTimeframe
): {
  personalized: PersonalizedGoalBreakdown;
  standard: BreakdownSuggestion[];
} {
  const personalized = generatePersonalizedBreakdown(goal, prototype, targetTimeframe);
  const standard = personalizedToStandardBreakdown(personalized);

  return { personalized, standard };
}
