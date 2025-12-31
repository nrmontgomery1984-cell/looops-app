// System Engine - Functions for working with Systems
// Includes system template suggestions based on goals

import { Goal } from "../types/goals";
import { System, SystemTemplate, SYSTEM_TEMPLATES } from "../types/systems";
import { LoopId } from "../types/core";

// Keywords to match against goal titles/descriptions for better suggestions
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  // Health keywords
  weight: ["tpl_weight_loss"],
  lose: ["tpl_weight_loss"],
  exercise: ["tpl_weight_loss", "tpl_morning_routine"],
  workout: ["tpl_weight_loss"],
  fitness: ["tpl_weight_loss"],
  sleep: ["tpl_better_sleep"],
  rest: ["tpl_better_sleep"],
  morning: ["tpl_morning_routine"],
  wake: ["tpl_morning_routine"],
  energy: ["tpl_morning_routine"],

  // Wealth keywords
  save: ["tpl_emergency_fund"],
  saving: ["tpl_emergency_fund"],
  emergency: ["tpl_emergency_fund"],
  money: ["tpl_emergency_fund"],
  fund: ["tpl_emergency_fund"],
  financial: ["tpl_emergency_fund"],

  // Family keywords
  family: ["tpl_quality_time"],
  kids: ["tpl_quality_time"],
  children: ["tpl_quality_time"],
  spouse: ["tpl_quality_time"],
  partner: ["tpl_quality_time"],
  relationship: ["tpl_quality_time"],
  time: ["tpl_quality_time"],

  // Work keywords
  focus: ["tpl_deep_work"],
  productivity: ["tpl_deep_work"],
  work: ["tpl_deep_work"],
  deep: ["tpl_deep_work"],
  concentration: ["tpl_deep_work"],

  // Fun keywords
  read: ["tpl_reading_habit"],
  books: ["tpl_reading_habit"],
  reading: ["tpl_reading_habit"],

  // Maintenance keywords
  organize: ["tpl_weekly_reset"],
  clean: ["tpl_weekly_reset"],
  reset: ["tpl_weekly_reset"],
  review: ["tpl_weekly_reset"],

  // Meaning keywords
  reflect: ["tpl_daily_reflection"],
  journal: ["tpl_daily_reflection"],
  gratitude: ["tpl_gratitude_practice"],
  grateful: ["tpl_gratitude_practice"],
  meditate: ["tpl_meditation_habit"],
  meditation: ["tpl_meditation_habit"],
  mindful: ["tpl_meditation_habit"],
  purpose: ["tpl_purpose_alignment"],
  values: ["tpl_purpose_alignment"],
  learn: ["tpl_learning_growth"],
  learning: ["tpl_learning_growth"],
  grow: ["tpl_learning_growth"],
  growth: ["tpl_learning_growth"],
};

// Loop-based default templates
const LOOP_DEFAULT_TEMPLATES: Record<LoopId, string[]> = {
  Health: ["tpl_weight_loss", "tpl_morning_routine", "tpl_better_sleep"],
  Wealth: ["tpl_emergency_fund"],
  Family: ["tpl_quality_time"],
  Work: ["tpl_deep_work"],
  Fun: ["tpl_reading_habit"],
  Maintenance: ["tpl_weekly_reset"],
  Meaning: ["tpl_daily_reflection", "tpl_gratitude_practice", "tpl_meditation_habit"],
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
 */
export function createSystemFromTemplate(
  template: SystemTemplate,
  goal: Goal,
  customGoalStatement?: string
): Omit<System, "id"> {
  const now = new Date().toISOString();

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
    habitIds: [], // Habits will be created separately
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
