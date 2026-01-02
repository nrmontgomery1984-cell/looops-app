// System Engine - Functions for working with Systems
// Includes system template suggestions based on goals
// Enhanced with DirectionalDocument-aware suggestions

import { Goal } from "../types/goals";
import { System, SystemTemplate, SYSTEM_TEMPLATES, SystemComponent, getTemplateSuggestedComponents } from "../types/systems";
import { LoopId } from "../types/core";
import { DirectionalDocument, LoopSeason } from "../types/directional";

// Keywords to match against goal titles/descriptions for better suggestions
// CRITICAL: These must cover ALL templates comprehensively
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  // Health keywords
  weight: ["tpl_weight_loss"],
  lose: ["tpl_weight_loss"],
  exercise: ["tpl_weight_loss", "tpl_morning_routine"],
  workout: ["tpl_weight_loss"],
  fitness: ["tpl_weight_loss"],
  sleep: ["tpl_better_sleep"],
  rest: ["tpl_better_sleep"],
  insomnia: ["tpl_better_sleep"],
  morning: ["tpl_morning_routine"],
  wake: ["tpl_morning_routine"],
  energy: ["tpl_morning_routine"],
  routine: ["tpl_morning_routine", "tpl_weekly_reset"],

  // Wealth keywords
  save: ["tpl_emergency_fund"],
  saving: ["tpl_emergency_fund"],
  emergency: ["tpl_emergency_fund"],
  money: ["tpl_emergency_fund"],
  fund: ["tpl_emergency_fund"],
  financial: ["tpl_emergency_fund"],
  budget: ["tpl_emergency_fund"],

  // Family keywords
  family: ["tpl_quality_time"],
  kids: ["tpl_quality_time"],
  children: ["tpl_quality_time"],
  spouse: ["tpl_quality_time"],
  partner: ["tpl_quality_time"],
  relationship: ["tpl_quality_time"],
  quality: ["tpl_quality_time"],

  // Work keywords
  focus: ["tpl_deep_work"],
  productivity: ["tpl_deep_work"],
  deep: ["tpl_deep_work"],
  concentration: ["tpl_deep_work"],
  distraction: ["tpl_deep_work"],
  career: ["tpl_deep_work"],

  // Fun/Hobby keywords - COMPREHENSIVE coverage
  read: ["tpl_reading_habit"],
  books: ["tpl_reading_habit"],
  reading: ["tpl_reading_habit"],
  hobby: ["tpl_hobby_mastery", "tpl_creative_practice"],
  hobbies: ["tpl_hobby_mastery", "tpl_creative_practice"],
  master: ["tpl_hobby_mastery"],
  mastery: ["tpl_hobby_mastery"],
  skill: ["tpl_hobby_mastery", "tpl_learning_growth"],
  skills: ["tpl_hobby_mastery", "tpl_learning_growth"],
  practice: ["tpl_hobby_mastery", "tpl_creative_practice"],
  craft: ["tpl_hobby_mastery", "tpl_creative_practice"],
  creative: ["tpl_creative_practice"],
  creativity: ["tpl_creative_practice"],
  art: ["tpl_creative_practice"],
  artist: ["tpl_creative_practice"],
  music: ["tpl_creative_practice", "tpl_hobby_mastery"],
  instrument: ["tpl_creative_practice", "tpl_hobby_mastery"],
  paint: ["tpl_creative_practice"],
  painting: ["tpl_creative_practice"],
  draw: ["tpl_creative_practice"],
  drawing: ["tpl_creative_practice"],
  write: ["tpl_creative_practice"],
  writing: ["tpl_creative_practice"],
  photography: ["tpl_creative_practice", "tpl_hobby_mastery"],
  cook: ["tpl_hobby_mastery"],
  cooking: ["tpl_hobby_mastery"],
  garden: ["tpl_hobby_mastery"],
  gardening: ["tpl_hobby_mastery"],
  woodwork: ["tpl_hobby_mastery", "tpl_creative_practice"],
  knit: ["tpl_hobby_mastery", "tpl_creative_practice"],
  sew: ["tpl_hobby_mastery", "tpl_creative_practice"],
  play: ["tpl_play_adventure", "tpl_hobby_mastery"],
  adventure: ["tpl_play_adventure"],
  explore: ["tpl_play_adventure"],
  spontaneous: ["tpl_play_adventure"],
  fun: ["tpl_play_adventure", "tpl_hobby_mastery"],
  joy: ["tpl_play_adventure"],
  fulfilling: ["tpl_hobby_mastery", "tpl_creative_practice"],

  // Maintenance keywords
  organize: ["tpl_weekly_reset"],
  clean: ["tpl_weekly_reset"],
  reset: ["tpl_weekly_reset"],
  review: ["tpl_weekly_reset", "tpl_daily_reflection"],
  admin: ["tpl_weekly_reset"],
  maintenance: ["tpl_weekly_reset"],
  declutter: ["tpl_weekly_reset"],

  // Meaning keywords
  reflect: ["tpl_daily_reflection"],
  reflection: ["tpl_daily_reflection"],
  journal: ["tpl_daily_reflection"],
  journaling: ["tpl_daily_reflection"],
  gratitude: ["tpl_gratitude_practice"],
  grateful: ["tpl_gratitude_practice"],
  thankful: ["tpl_gratitude_practice"],
  meditate: ["tpl_meditation_habit"],
  meditation: ["tpl_meditation_habit"],
  mindful: ["tpl_meditation_habit"],
  mindfulness: ["tpl_meditation_habit"],
  calm: ["tpl_meditation_habit"],
  stress: ["tpl_meditation_habit"],
  purpose: ["tpl_purpose_alignment"],
  values: ["tpl_purpose_alignment"],
  meaning: ["tpl_purpose_alignment", "tpl_daily_reflection"],
  spiritual: ["tpl_purpose_alignment"],
  learn: ["tpl_learning_growth"],
  learning: ["tpl_learning_growth"],
  grow: ["tpl_learning_growth"],
  growth: ["tpl_learning_growth"],
  education: ["tpl_learning_growth"],
  study: ["tpl_learning_growth"],
  course: ["tpl_learning_growth"],
};

// Loop-based default templates (used as fallback when no semantic match)
const LOOP_DEFAULT_TEMPLATES: Record<LoopId, string[]> = {
  Health: ["tpl_weight_loss", "tpl_morning_routine", "tpl_better_sleep"],
  Wealth: ["tpl_emergency_fund"],
  Family: ["tpl_quality_time"],
  Work: ["tpl_deep_work"],
  Fun: ["tpl_hobby_mastery", "tpl_creative_practice", "tpl_play_adventure", "tpl_reading_habit"],
  Maintenance: ["tpl_weekly_reset"],
  Meaning: ["tpl_daily_reflection", "tpl_gratitude_practice", "tpl_meditation_habit", "tpl_learning_growth", "tpl_purpose_alignment"],
};

/**
 * Suggest system templates based on a goal
 * Uses both loop matching and keyword analysis
 */
export function suggestSystemTemplatesForGoal(goal: Goal): SystemTemplate[] {
  const suggestions = new Set<string>();
  const text = `${goal.title} ${goal.description || ""}`.toLowerCase();

  // First, check for keyword matches
  for (const [keyword, templateIds] of Object.entries(KEYWORD_MAPPINGS)) {
    if (text.includes(keyword)) {
      templateIds.forEach((id) => suggestions.add(id));
    }
  }

  // If no keyword matches, add loop-based defaults
  if (suggestions.size === 0) {
    const loopDefaults = LOOP_DEFAULT_TEMPLATES[goal.loop] || [];
    loopDefaults.forEach((id) => suggestions.add(id));
  }

  // Also add any templates that match the loop (lower priority)
  const loopTemplates = SYSTEM_TEMPLATES.filter((t) => t.loop === goal.loop);
  loopTemplates.forEach((t) => suggestions.add(t.id));

  // Convert to template objects, sorted by relevance
  const result: SystemTemplate[] = [];
  const suggestionIds = Array.from(suggestions);

  for (const id of suggestionIds) {
    const template = SYSTEM_TEMPLATES.find((t) => t.id === id);
    if (template) {
      result.push(template);
    }
  }

  // Limit to top 3 suggestions
  return result.slice(0, 3);
}

/**
 * Get all templates for a specific loop
 */
export function getTemplatesForLoop(loop: LoopId): SystemTemplate[] {
  return SYSTEM_TEMPLATES.filter((t) => t.loop === loop);
}

/**
 * Score how well a template matches a goal (0-100)
 */
export function scoreTemplateMatch(goal: Goal, template: SystemTemplate): number {
  let score = 0;

  // Base score for loop match
  if (template.loop === goal.loop) {
    score += 30;
  }

  // Keyword matching
  const text = `${goal.title} ${goal.description || ""}`.toLowerCase();
  const templateText = `${template.title} ${template.description}`.toLowerCase();

  // Check for common words
  const goalWords = text.split(/\s+/);
  const templateWords = templateText.split(/\s+/);

  for (const word of goalWords) {
    if (word.length > 3 && templateWords.some((tw) => tw.includes(word))) {
      score += 15;
    }
  }

  // Tag matching
  if (template.tags) {
    for (const tag of template.tags) {
      if (text.includes(tag.toLowerCase())) {
        score += 10;
      }
    }
  }

  return Math.min(score, 100);
}

/**
 * Create a system from a template, linked to a goal
 * Now includes embedded components instead of habitIds
 */
export function createSystemFromTemplate(
  template: SystemTemplate,
  goal: Goal,
  customGoalStatement?: string
): Omit<System, "id"> {
  const now = new Date().toISOString();

  // Convert template habits/components to SystemComponent objects
  const suggestedComponents = getTemplateSuggestedComponents(template);
  const components: SystemComponent[] = suggestedComponents.map((comp, i) => ({
    id: `comp_${Date.now()}_${i}`,
    title: comp.title,
    description: comp.description,
    type: comp.frequency === "daily" ? "daily" : comp.frequency === "weekly" ? "weekly" : "custom",
    cue: comp.cue,
    craving: undefined,
    response: comp.response,
    reward: comp.reward,
    frequency: comp.frequency,
    customDays: undefined,
    timeOfDay: comp.timeOfDay,
    dayTypes: undefined,
    dayTypeOverrides: undefined,
    stackedAfter: undefined,
    stackedBefore: undefined,
    streak: 0,
    longestStreak: 0,
    totalCompletions: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
  }));

  return {
    title: template.title,
    description: template.description,
    loop: template.loop,
    goalStatement: customGoalStatement || goal.title,
    linkedGoalId: goal.id,
    identity: {
      id: `identity_${Date.now()}`,
      statement: template.identityTemplate,
      loop: template.loop,
      createdAt: now,
      updatedAt: now,
    },
    components, // Embedded components (new)
    milestones: [], // Start with empty milestones
    habitIds: [], // @deprecated - keeping for backward compatibility
    environmentTweaks: template.suggestedEnvironmentTweaks.map((tweak, i) => ({
      id: `tweak_${Date.now()}_${i}`,
      description: tweak.description,
      type: tweak.type,
      completed: false,
    })),
    metrics: template.suggestedMetrics.map((metric, i) => ({
      id: `metric_${Date.now()}_${i}`,
      name: metric.name,
      unit: metric.unit,
      entries: [],
    })),
    obstaclePlaybook: template.commonObstacles,
    status: "active",
    startedAt: now,
    targetDate: goal.targetDate,
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// DIRECTIONAL DOCUMENT ENHANCED SUGGESTIONS
// =============================================================================

/**
 * Season-based scoring adjustments
 * When a loop is "building", suggest more active systems
 * When "recovering" or "hibernating", suggest gentler or minimal systems
 */
const SEASON_SCORES: Record<LoopSeason, number> = {
  building: 15,     // Active expansion - great time for new systems
  maintaining: 10,  // Steady state - can handle new systems
  recovering: -5,   // Healing - be careful adding load
  hibernating: -10, // Minimal - probably not the time for new systems
};

/**
 * Template complexity/intensity ratings (higher = more demanding)
 * Used to match against season appropriateness
 */
const TEMPLATE_INTENSITY: Record<string, number> = {
  // Low intensity (good for any season)
  tpl_daily_reflection: 1,
  tpl_gratitude_practice: 1,
  tpl_reading_habit: 2,
  tpl_play_adventure: 2,

  // Medium intensity
  tpl_morning_routine: 3,
  tpl_better_sleep: 3,
  tpl_weekly_reset: 3,
  tpl_quality_time: 3,
  tpl_meditation_habit: 2,
  tpl_creative_practice: 3,
  tpl_hobby_mastery: 3,

  // Higher intensity (best for building season)
  tpl_weight_loss: 4,
  tpl_deep_work: 4,
  tpl_emergency_fund: 3,
  tpl_learning_growth: 4,
  tpl_purpose_alignment: 3,
};

/**
 * Enhanced system template suggestion - SEMANTIC MATCH FIRST
 *
 * CRITICAL: This searches ALL templates and scores by actual relevance to the goal,
 * not just by loop membership. A "Master a hobby" goal should find hobby templates
 * regardless of which loop it's in.
 *
 * Scoring (in priority order):
 * 1. Keyword match: +25 per keyword match (highest priority - semantic relevance)
 * 2. Tag match: +15 per tag that appears in goal text
 * 3. Loop match: +15 bonus (nice to have, not required)
 * 4. DirectionalDocument adjustments: season, satisfaction, priority
 * 5. Existing system penalty: -50 if similar exists
 *
 * Returns ONLY templates with score >= 25 (at least one keyword/tag match)
 */
export function suggestSystemsForGoal(
  goal: Goal,
  directionalDoc: DirectionalDocument | null,
  existingSystems: System[]
): Array<{ template: SystemTemplate; score: number; reasons: string[] }> {
  const results: Array<{ template: SystemTemplate; score: number; reasons: string[] }> = [];
  const systems = existingSystems || []; // Guard against undefined
  const goalText = `${goal.title} ${goal.description || ""}`.toLowerCase();

  // Search ALL templates, not just loop-filtered ones
  for (const template of SYSTEM_TEMPLATES) {
    let score = 0;
    const reasons: string[] = [];
    let hasSemanticMatch = false;

    // 1. KEYWORD MATCHING - Primary relevance signal
    for (const [keyword, templateIds] of Object.entries(KEYWORD_MAPPINGS)) {
      if (goalText.includes(keyword) && templateIds.includes(template.id)) {
        score += 25;
        reasons.push(`Matches "${keyword}"`);
        hasSemanticMatch = true;
      }
    }

    // 2. TAG MATCHING - Secondary relevance signal
    if (template.tags) {
      for (const tag of template.tags) {
        if (goalText.includes(tag.toLowerCase())) {
          score += 15;
          reasons.push(`Tag: ${tag}`);
          hasSemanticMatch = true;
        }
      }
    }

    // 3. Direct word overlap between goal and template title/description
    const templateText = `${template.title} ${template.description}`.toLowerCase();
    const goalWords = goalText.split(/\s+/).filter(w => w.length > 4);
    for (const word of goalWords) {
      if (templateText.includes(word)) {
        score += 10;
        if (!hasSemanticMatch) {
          reasons.push(`Matches "${word}"`);
          hasSemanticMatch = true;
        }
      }
    }

    // 4. Loop match bonus (nice to have, not required)
    if (template.loop === goal.loop) {
      score += 15;
      reasons.push("Same loop");
    }

    // 5. Check for existing similar system
    const existingSimilar = systems.find(
      (s) => s.title.toLowerCase().includes(template.title.toLowerCase()) ||
             template.title.toLowerCase().includes(s.title.toLowerCase())
    );
    if (existingSimilar) {
      score -= 50;
      reasons.push("Similar system exists");
    }

    // 6. DirectionalDocument-based adjustments (minor influence)
    if (directionalDoc) {
      const loopDirections = directionalDoc.loops[template.loop];

      if (loopDirections) {
        const season = loopDirections.currentSeason;
        const seasonScore = SEASON_SCORES[season];
        const templateIntensity = TEMPLATE_INTENSITY[template.id] || 2;

        if (season === "recovering" || season === "hibernating") {
          const intensityPenalty = templateIntensity * 2;
          score += seasonScore - intensityPenalty;
        } else {
          score += seasonScore;
        }

        // Satisfaction gap bonus
        const satisfactionGap = 100 - loopDirections.currentSatisfaction;
        score += Math.floor(satisfactionGap * 0.1);
      }
    }

    // Only include templates that have SOME semantic relevance
    // Score >= 25 means at least one keyword match OR loop match + tag match
    if (score >= 25 && hasSemanticMatch) {
      results.push({ template, score, reasons });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Return top 5 with meaningful scores
  return results.slice(0, 5);
}

/**
 * Get a quick recommendation for whether now is a good time
 * to add a new system for a given loop
 */
export function getSystemRecommendation(
  loop: LoopId,
  directionalDoc: DirectionalDocument | null,
  existingSystemsCount: number
): { recommend: boolean; reason: string } {
  if (!directionalDoc) {
    return { recommend: true, reason: "No directional document - consider adding one via intake" };
  }

  const loopDirections = directionalDoc.loops[loop];
  if (!loopDirections) {
    return { recommend: true, reason: "No loop-specific directions set" };
  }

  const season = loopDirections.currentSeason;

  if (season === "hibernating") {
    return {
      recommend: false,
      reason: `${loop} is in hibernating season - focus on essentials only`
    };
  }

  if (season === "recovering" && existingSystemsCount >= 2) {
    return {
      recommend: false,
      reason: `${loop} is recovering - avoid adding more systems until stable`
    };
  }

  if (existingSystemsCount >= 3) {
    return {
      recommend: false,
      reason: "You have 3+ active systems in this loop - master existing ones first"
    };
  }

  if (season === "building") {
    return {
      recommend: true,
      reason: `${loop} is in building season - great time for new systems!`
    };
  }

  return {
    recommend: true,
    reason: "Good time to add a new system"
  };
}
