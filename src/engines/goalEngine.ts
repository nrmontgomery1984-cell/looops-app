// Goal Engine - Archetype-driven goal generation and management

import {
  Goal,
  GoalTimeframe,
  GoalHierarchy,
  LoopId,
  ArchetypeId,
  UserPrototype,
  LoopStateType,
  ALL_LOOPS,
  TIMEFRAME_ORDER,
} from "../types";
import { ARCHETYPE_DEFINITIONS } from "../data/archetypes";

// Goal template for suggestions
export type GoalTemplate = {
  id: string;
  title: string;
  description: string;
  loop: LoopId;
  timeframe: GoalTimeframe;
  archetypeAffinity: Partial<Record<ArchetypeId, number>>; // 0-1 score
  suggestedMetrics?: { name: string; unit: string; suggestedTarget: number }[];
  decompositionHints?: string[]; // Hints for breaking down
};

// Annual goal suggestion based on archetype and loop state
export type GoalSuggestion = {
  template: GoalTemplate;
  relevanceScore: number; // 0-100
  reasoning: string;
};

// Goal templates organized by loop
export const GOAL_TEMPLATES: GoalTemplate[] = [
  // ===== HEALTH LOOP =====
  {
    id: "health_fitness_transform",
    title: "Transform my physical fitness",
    description: "Achieve significant improvement in strength, endurance, or body composition",
    loop: "Health",
    timeframe: "annual",
    archetypeAffinity: { Machine: 0.9, Warrior: 0.95, Scientist: 0.6 },
    suggestedMetrics: [
      { name: "Workouts per week", unit: "sessions", suggestedTarget: 4 },
      { name: "Body fat percentage", unit: "%", suggestedTarget: 15 },
    ],
    decompositionHints: [
      "Q1: Build foundation (3x/week habit)",
      "Q2: Increase intensity",
      "Q3: Specialize (strength/cardio/flexibility)",
      "Q4: Maintain and optimize",
    ],
  },
  {
    id: "health_sleep_optimize",
    title: "Optimize my sleep quality",
    description: "Establish consistent, high-quality sleep patterns",
    loop: "Health",
    timeframe: "annual",
    archetypeAffinity: { Scientist: 0.9, Stoic: 0.8, Machine: 0.7 },
    suggestedMetrics: [
      { name: "Hours of sleep", unit: "hours", suggestedTarget: 7.5 },
      { name: "Sleep quality score", unit: "score", suggestedTarget: 85 },
    ],
    decompositionHints: [
      "Month 1: Track baseline",
      "Month 2-3: Optimize environment",
      "Month 4-6: Establish routine",
      "Month 7-12: Maintain consistency",
    ],
  },
  {
    id: "health_nutrition_overhaul",
    title: "Overhaul my nutrition",
    description: "Develop sustainable healthy eating habits",
    loop: "Health",
    timeframe: "annual",
    archetypeAffinity: { Scientist: 0.85, Machine: 0.8, Stoic: 0.7 },
    suggestedMetrics: [
      { name: "Home-cooked meals", unit: "per week", suggestedTarget: 15 },
      { name: "Water intake", unit: "liters/day", suggestedTarget: 3 },
    ],
    decompositionHints: [
      "Q1: Meal planning habit",
      "Q2: Eliminate processed foods",
      "Q3: Optimize macros",
      "Q4: Intuitive eating mastery",
    ],
  },
  {
    id: "health_mental_resilience",
    title: "Build mental resilience",
    description: "Develop practices for mental health and stress management",
    loop: "Health",
    timeframe: "annual",
    archetypeAffinity: { Stoic: 0.95, Warrior: 0.8, Artist: 0.7 },
    suggestedMetrics: [
      { name: "Meditation sessions", unit: "per week", suggestedTarget: 5 },
      { name: "Stress level (1-10)", unit: "avg", suggestedTarget: 4 },
    ],
    decompositionHints: [
      "Q1: Daily meditation habit",
      "Q2: Stress triggers identification",
      "Q3: Coping strategies development",
      "Q4: Sustainable practice integration",
    ],
  },

  // ===== WEALTH LOOP =====
  {
    id: "wealth_emergency_fund",
    title: "Build emergency fund",
    description: "Save 3-6 months of expenses for financial security",
    loop: "Wealth",
    timeframe: "annual",
    archetypeAffinity: { Machine: 0.85, Scientist: 0.8, Stoic: 0.75 },
    suggestedMetrics: [
      { name: "Months of expenses saved", unit: "months", suggestedTarget: 6 },
      { name: "Monthly savings rate", unit: "%", suggestedTarget: 20 },
    ],
    decompositionHints: [
      "Month 1: Calculate target amount",
      "Month 2-4: Save month 1-2",
      "Month 5-8: Save month 3-4",
      "Month 9-12: Save month 5-6",
    ],
  },
  {
    id: "wealth_income_growth",
    title: "Grow my income significantly",
    description: "Increase earning potential through skills, promotion, or side income",
    loop: "Wealth",
    timeframe: "annual",
    archetypeAffinity: { Visionary: 0.9, Warrior: 0.85, Machine: 0.7 },
    suggestedMetrics: [
      { name: "Income increase", unit: "%", suggestedTarget: 20 },
      { name: "New skills acquired", unit: "skills", suggestedTarget: 3 },
    ],
    decompositionHints: [
      "Q1: Skill gap analysis + learning plan",
      "Q2: Skill development",
      "Q3: Apply/negotiate/launch",
      "Q4: Optimize and scale",
    ],
  },
  {
    id: "wealth_debt_freedom",
    title: "Achieve debt freedom",
    description: "Pay off all consumer debt (credit cards, loans)",
    loop: "Wealth",
    timeframe: "annual",
    archetypeAffinity: { Warrior: 0.9, Machine: 0.85, Stoic: 0.8 },
    suggestedMetrics: [
      { name: "Debt remaining", unit: "$", suggestedTarget: 0 },
      { name: "Monthly debt payment", unit: "$", suggestedTarget: 1000 },
    ],
    decompositionHints: [
      "Month 1: List all debts, choose strategy (avalanche/snowball)",
      "Q1-Q2: Attack highest priority debt",
      "Q3: Tackle remaining debts",
      "Q4: Stay debt-free, build savings",
    ],
  },
  {
    id: "wealth_invest_consistently",
    title: "Build investment habit",
    description: "Establish consistent investment practice for long-term wealth",
    loop: "Wealth",
    timeframe: "annual",
    archetypeAffinity: { Scientist: 0.9, Visionary: 0.85, Machine: 0.75 },
    suggestedMetrics: [
      { name: "Monthly investment", unit: "$", suggestedTarget: 500 },
      { name: "Investment knowledge score", unit: "1-10", suggestedTarget: 8 },
    ],
    decompositionHints: [
      "Q1: Education + account setup",
      "Q2: Start small, automate",
      "Q3: Increase contributions",
      "Q4: Diversify and optimize",
    ],
  },

  // ===== FAMILY LOOP =====
  {
    id: "family_quality_time",
    title: "Prioritize quality family time",
    description: "Create consistent, meaningful time with family members",
    loop: "Family",
    timeframe: "annual",
    archetypeAffinity: { Artist: 0.9, Stoic: 0.8, Visionary: 0.7 },
    suggestedMetrics: [
      { name: "Family dinners per week", unit: "dinners", suggestedTarget: 5 },
      { name: "Weekend activities together", unit: "per month", suggestedTarget: 4 },
    ],
    decompositionHints: [
      "Q1: Establish weekly family rituals",
      "Q2: Plan quarterly family adventures",
      "Q3: Deep relationship building",
      "Q4: Holiday traditions + reflection",
    ],
  },
  {
    id: "family_parenting_level_up",
    title: "Level up my parenting",
    description: "Become a more present, effective, and connected parent",
    loop: "Family",
    timeframe: "annual",
    archetypeAffinity: { Stoic: 0.85, Scientist: 0.8, Warrior: 0.7 },
    suggestedMetrics: [
      { name: "1-on-1 time per child", unit: "hours/week", suggestedTarget: 3 },
      { name: "Parenting books read", unit: "books", suggestedTarget: 4 },
    ],
    decompositionHints: [
      "Q1: Assess + set parenting values",
      "Q2: Implement new approaches",
      "Q3: Address challenges",
      "Q4: Celebrate growth",
    ],
  },
  {
    id: "family_relationship_strengthen",
    title: "Strengthen primary relationship",
    description: "Deepen connection with partner through intentional effort",
    loop: "Family",
    timeframe: "annual",
    archetypeAffinity: { Artist: 0.85, Stoic: 0.8, Visionary: 0.75 },
    suggestedMetrics: [
      { name: "Date nights per month", unit: "dates", suggestedTarget: 4 },
      { name: "Relationship satisfaction", unit: "1-10", suggestedTarget: 9 },
    ],
    decompositionHints: [
      "Q1: Establish weekly date night",
      "Q2: Communication improvement focus",
      "Q3: Shared adventure/project",
      "Q4: Future planning together",
    ],
  },

  // ===== WORK LOOP =====
  {
    id: "work_career_advance",
    title: "Advance my career",
    description: "Achieve promotion, new role, or significant career milestone",
    loop: "Work",
    timeframe: "annual",
    archetypeAffinity: { Warrior: 0.9, Machine: 0.85, Visionary: 0.8 },
    suggestedMetrics: [
      { name: "Key projects delivered", unit: "projects", suggestedTarget: 3 },
      { name: "Performance review rating", unit: "1-5", suggestedTarget: 4.5 },
    ],
    decompositionHints: [
      "Q1: Identify target + build plan",
      "Q2: Execute high-visibility projects",
      "Q3: Build relationships + advocate",
      "Q4: Push for promotion/transition",
    ],
  },
  {
    id: "work_skill_mastery",
    title: "Master a critical skill",
    description: "Achieve expertise in a skill that advances your career",
    loop: "Work",
    timeframe: "annual",
    archetypeAffinity: { Scientist: 0.95, Machine: 0.85, Artist: 0.7 },
    suggestedMetrics: [
      { name: "Learning hours", unit: "hours", suggestedTarget: 200 },
      { name: "Skill certifications", unit: "certs", suggestedTarget: 2 },
    ],
    decompositionHints: [
      "Q1: Foundation building (50 hrs)",
      "Q2: Intermediate practice (50 hrs)",
      "Q3: Advanced application (50 hrs)",
      "Q4: Mastery demonstration (50 hrs)",
    ],
  },
  {
    id: "work_side_project",
    title: "Launch a meaningful side project",
    description: "Build and launch something of your own creation",
    loop: "Work",
    timeframe: "annual",
    archetypeAffinity: { Visionary: 0.95, Artist: 0.9, Scientist: 0.75 },
    suggestedMetrics: [
      { name: "Hours invested", unit: "hours", suggestedTarget: 300 },
      { name: "Users/customers", unit: "people", suggestedTarget: 100 },
    ],
    decompositionHints: [
      "Q1: Ideation + validation",
      "Q2: MVP development",
      "Q3: Launch + iterate",
      "Q4: Scale or pivot",
    ],
  },
  {
    id: "work_productivity_system",
    title: "Build an unbreakable productivity system",
    description: "Create sustainable habits and systems for consistent output",
    loop: "Work",
    timeframe: "annual",
    archetypeAffinity: { Machine: 0.95, Scientist: 0.85, Stoic: 0.8 },
    suggestedMetrics: [
      { name: "Deep work hours per week", unit: "hours", suggestedTarget: 20 },
      { name: "Tasks completed per week", unit: "tasks", suggestedTarget: 30 },
    ],
    decompositionHints: [
      "Q1: Audit + design system",
      "Q2: Implement core habits",
      "Q3: Optimize and automate",
      "Q4: Maintain and refine",
    ],
  },

  // ===== FUN LOOP =====
  {
    id: "fun_hobby_mastery",
    title: "Master a fulfilling hobby",
    description: "Develop genuine skill and joy in a personal pursuit",
    loop: "Fun",
    timeframe: "annual",
    archetypeAffinity: { Artist: 0.95, Scientist: 0.8, Visionary: 0.7 },
    suggestedMetrics: [
      { name: "Practice hours per week", unit: "hours", suggestedTarget: 5 },
      { name: "Skill level improvement", unit: "1-10", suggestedTarget: 8 },
    ],
    decompositionHints: [
      "Q1: Choose hobby + beginner phase",
      "Q2: Consistent practice routine",
      "Q3: Push comfort zone",
      "Q4: Share/perform/exhibit",
    ],
  },
  {
    id: "fun_adventure_seeking",
    title: "Have meaningful adventures",
    description: "Create memorable experiences through exploration and novelty",
    loop: "Fun",
    timeframe: "annual",
    archetypeAffinity: { Visionary: 0.9, Warrior: 0.85, Artist: 0.8 },
    suggestedMetrics: [
      { name: "New experiences", unit: "experiences", suggestedTarget: 24 },
      { name: "Major trips", unit: "trips", suggestedTarget: 3 },
    ],
    decompositionHints: [
      "Q1: Monthly new experiences",
      "Q2: Spring adventure trip",
      "Q3: Summer exploration",
      "Q4: Year-end bucket list push",
    ],
  },
  {
    id: "fun_social_connection",
    title: "Deepen friendships",
    description: "Invest in meaningful friendships and social connections",
    loop: "Fun",
    timeframe: "annual",
    archetypeAffinity: { Artist: 0.85, Stoic: 0.75, Visionary: 0.7 },
    suggestedMetrics: [
      { name: "Close friend meetups", unit: "per month", suggestedTarget: 4 },
      { name: "New meaningful connections", unit: "people", suggestedTarget: 6 },
    ],
    decompositionHints: [
      "Q1: Reconnect with old friends",
      "Q2: Regular social rituals",
      "Q3: Deepen key friendships",
      "Q4: Expand network intentionally",
    ],
  },

  // ===== MAINTENANCE LOOP =====
  {
    id: "maintenance_home_optimize",
    title: "Optimize my living space",
    description: "Create an organized, functional, and peaceful home environment",
    loop: "Maintenance",
    timeframe: "annual",
    archetypeAffinity: { Machine: 0.9, Stoic: 0.8, Artist: 0.7 },
    suggestedMetrics: [
      { name: "Rooms decluttered", unit: "rooms", suggestedTarget: 8 },
      { name: "Home satisfaction", unit: "1-10", suggestedTarget: 9 },
    ],
    decompositionHints: [
      "Q1: Deep declutter (1 room/week)",
      "Q2: Organization systems",
      "Q3: Aesthetic improvements",
      "Q4: Maintenance routines",
    ],
  },
  {
    id: "maintenance_systems_automate",
    title: "Automate life admin",
    description: "Reduce friction in recurring tasks through systems and automation",
    loop: "Maintenance",
    timeframe: "annual",
    archetypeAffinity: { Machine: 0.95, Scientist: 0.85, Stoic: 0.7 },
    suggestedMetrics: [
      { name: "Recurring tasks automated", unit: "tasks", suggestedTarget: 10 },
      { name: "Weekly admin time", unit: "hours", suggestedTarget: 2 },
    ],
    decompositionHints: [
      "Q1: Audit all recurring tasks",
      "Q2: Automate finances + bills",
      "Q3: Automate home maintenance",
      "Q4: Optimize and maintain",
    ],
  },

  // ===== MEANING LOOP =====
  {
    id: "meaning_purpose_clarity",
    title: "Clarify my life purpose",
    description: "Develop a clear sense of purpose and direction",
    loop: "Meaning",
    timeframe: "annual",
    archetypeAffinity: { Visionary: 0.95, Stoic: 0.9, Artist: 0.8 },
    suggestedMetrics: [
      { name: "Clarity score", unit: "1-10", suggestedTarget: 9 },
      { name: "Purpose-aligned decisions", unit: "%", suggestedTarget: 80 },
    ],
    decompositionHints: [
      "Q1: Deep reflection + exploration",
      "Q2: Test hypotheses through action",
      "Q3: Refine and commit",
      "Q4: Align life with purpose",
    ],
  },
  {
    id: "meaning_spiritual_practice",
    title: "Deepen spiritual practice",
    description: "Develop consistent practices for inner growth and peace",
    loop: "Meaning",
    timeframe: "annual",
    archetypeAffinity: { Stoic: 0.95, Artist: 0.85, Scientist: 0.7 },
    suggestedMetrics: [
      { name: "Daily practice streak", unit: "days", suggestedTarget: 300 },
      { name: "Inner peace score", unit: "1-10", suggestedTarget: 8 },
    ],
    decompositionHints: [
      "Q1: Explore practices, find fit",
      "Q2: Establish daily ritual",
      "Q3: Deepen through study",
      "Q4: Integration into all life",
    ],
  },
  {
    id: "meaning_legacy_building",
    title: "Start building my legacy",
    description: "Begin work on something that will outlast you",
    loop: "Meaning",
    timeframe: "annual",
    archetypeAffinity: { Visionary: 0.95, Artist: 0.9, Stoic: 0.8 },
    suggestedMetrics: [
      { name: "Legacy project hours", unit: "hours", suggestedTarget: 200 },
      { name: "People impacted", unit: "people", suggestedTarget: 100 },
    ],
    decompositionHints: [
      "Q1: Define legacy vision",
      "Q2: Take first major action",
      "Q3: Build momentum",
      "Q4: Reflect and plan next year",
    ],
  },
  {
    id: "meaning_wisdom_cultivation",
    title: "Cultivate wisdom",
    description: "Study, reflect, and grow in understanding of life",
    loop: "Meaning",
    timeframe: "annual",
    archetypeAffinity: { Scientist: 0.9, Stoic: 0.9, Visionary: 0.8 },
    suggestedMetrics: [
      { name: "Books read", unit: "books", suggestedTarget: 24 },
      { name: "Journal entries", unit: "entries", suggestedTarget: 150 },
    ],
    decompositionHints: [
      "Q1: Reading foundation + journaling habit",
      "Q2: Dialogue with others",
      "Q3: Apply learnings",
      "Q4: Synthesize and teach",
    ],
  },
];

// Generate goal suggestions based on user prototype and loop states
export function generateGoalSuggestions(
  prototype: UserPrototype,
  loopStates: Record<LoopId, LoopStateType>,
  existingGoals: GoalHierarchy,
  count: number = 10
): GoalSuggestion[] {
  const { archetypeBlend } = prototype;
  const suggestions: GoalSuggestion[] = [];

  // Get existing annual goal loop coverage
  const existingLoops = new Set(existingGoals.annual.map((g) => g.loop));

  for (const template of GOAL_TEMPLATES) {
    // Skip if loop already has annual goal
    if (existingLoops.has(template.loop)) continue;

    // Calculate archetype affinity score
    let archetypeScore = 0;
    const primaryAffinity = template.archetypeAffinity[archetypeBlend.primary] || 0;
    const secondaryAffinity = template.archetypeAffinity[archetypeBlend.secondary] || 0;
    const tertiaryAffinity = archetypeBlend.tertiary
      ? template.archetypeAffinity[archetypeBlend.tertiary] || 0
      : 0;

    // Weighted by archetype blend scores
    archetypeScore =
      primaryAffinity * (archetypeBlend.scores[archetypeBlend.primary] / 100) * 0.5 +
      secondaryAffinity * (archetypeBlend.scores[archetypeBlend.secondary] / 100) * 0.35 +
      tertiaryAffinity * (archetypeBlend.tertiary ? archetypeBlend.scores[archetypeBlend.tertiary] / 100 : 0) * 0.15;

    // Boost score based on loop state (BUILD loops get priority)
    const loopState = loopStates[template.loop];
    let stateMultiplier = 1;
    switch (loopState) {
      case "BUILD":
        stateMultiplier = 1.3;
        break;
      case "MAINTAIN":
        stateMultiplier = 1.1;
        break;
      case "RECOVER":
        stateMultiplier = 0.9;
        break;
      case "HIBERNATE":
        stateMultiplier = 0.7;
        break;
    }

    const relevanceScore = Math.round(archetypeScore * stateMultiplier * 100);

    // Generate reasoning
    const reasoning = generateReasoning(
      template,
      archetypeBlend.primary,
      archetypeBlend.secondary,
      loopState
    );

    suggestions.push({
      template,
      relevanceScore,
      reasoning,
    });
  }

  // Sort by relevance and return top N
  return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, count);
}

// Generate human-readable reasoning for a suggestion
function generateReasoning(
  template: GoalTemplate,
  primaryArchetype: ArchetypeId,
  secondaryArchetype: ArchetypeId,
  loopState: LoopStateType
): string {
  const primaryDef = ARCHETYPE_DEFINITIONS.find((a) => a.id === primaryArchetype);
  const primaryAffinity = template.archetypeAffinity[primaryArchetype] || 0;
  const secondaryAffinity = template.archetypeAffinity[secondaryArchetype] || 0;

  const parts: string[] = [];

  // Archetype fit
  if (primaryAffinity >= 0.8) {
    parts.push(`Highly aligned with your ${primaryArchetype} nature`);
  } else if (secondaryAffinity >= 0.8) {
    parts.push(`Resonates with your ${secondaryArchetype} side`);
  }

  // Loop state fit
  if (loopState === "BUILD") {
    parts.push(`Your ${template.loop} loop is in BUILD mode - great time to pursue ambitious goals`);
  } else if (loopState === "RECOVER") {
    parts.push(`Consider as your ${template.loop} loop recovers`);
  }

  return parts.join(". ") || `A solid goal for your ${template.loop} loop`;
}

// Create a goal from a template
export function createGoalFromTemplate(
  template: GoalTemplate,
  userId: string,
  customTitle?: string,
  customDescription?: string
): Goal {
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  return {
    id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: customTitle || template.title,
    description: customDescription || template.description,
    loop: template.loop,
    timeframe: template.timeframe,
    childGoalIds: [],
    status: "active",
    progress: 0,
    startDate: now.toISOString(),
    targetDate: endOfYear.toISOString(),
    metrics: template.suggestedMetrics?.map((m) => ({
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: m.name,
      unit: m.unit,
      target: m.suggestedTarget,
      current: 0,
    })),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

// Decompose an annual goal into quarterly goals
export function decomposeAnnualToQuarterly(
  annualGoal: Goal,
  template?: GoalTemplate
): Goal[] {
  const quarterlyGoals: Goal[] = [];
  const now = new Date();
  const year = now.getFullYear();

  const quarters = [
    { name: "Q1", start: new Date(year, 0, 1), end: new Date(year, 2, 31) },
    { name: "Q2", start: new Date(year, 3, 1), end: new Date(year, 5, 30) },
    { name: "Q3", start: new Date(year, 6, 1), end: new Date(year, 8, 30) },
    { name: "Q4", start: new Date(year, 9, 1), end: new Date(year, 11, 31) },
  ];

  const hints = template?.decompositionHints || [
    "Foundation and planning",
    "Building momentum",
    "Pushing through challenges",
    "Finishing strong",
  ];

  quarters.forEach((quarter, index) => {
    const hint = hints[index] || `${quarter.name} milestone`;

    quarterlyGoals.push({
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_q${index + 1}`,
      title: `${quarter.name}: ${hint}`,
      description: `${quarter.name} milestone for: ${annualGoal.title}`,
      loop: annualGoal.loop,
      timeframe: "quarterly",
      parentGoalId: annualGoal.id,
      childGoalIds: [],
      status: "active",
      progress: 0,
      startDate: quarter.start.toISOString(),
      targetDate: quarter.end.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  return quarterlyGoals;
}

// Decompose a quarterly goal into monthly goals
export function decomposeQuarterlyToMonthly(quarterlyGoal: Goal): Goal[] {
  const monthlyGoals: Goal[] = [];
  const now = new Date();

  const startDate = new Date(quarterlyGoal.startDate);
  const endDate = new Date(quarterlyGoal.targetDate);

  // Get months in this quarter
  const months: { name: string; start: Date; end: Date }[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    months.push({
      name: current.toLocaleDateString("en-US", { month: "long" }),
      start: new Date(current),
      end: monthEnd > endDate ? endDate : monthEnd,
    });
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
  }

  months.forEach((month, index) => {
    monthlyGoals.push({
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_m${index + 1}`,
      title: `${month.name}: Progress on ${quarterlyGoal.title}`,
      description: `Monthly milestone for: ${quarterlyGoal.title}`,
      loop: quarterlyGoal.loop,
      timeframe: "monthly",
      parentGoalId: quarterlyGoal.id,
      childGoalIds: [],
      status: "active",
      progress: 0,
      startDate: month.start.toISOString(),
      targetDate: month.end.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  return monthlyGoals;
}

// Get suggested goals for a specific loop based on archetype
export function getLoopGoalSuggestions(
  loop: LoopId,
  prototype: UserPrototype
): GoalSuggestion[] {
  const loopTemplates = GOAL_TEMPLATES.filter((t) => t.loop === loop);
  const { archetypeBlend } = prototype;

  return loopTemplates
    .map((template) => {
      const primaryAffinity = template.archetypeAffinity[archetypeBlend.primary] || 0;
      const secondaryAffinity = template.archetypeAffinity[archetypeBlend.secondary] || 0;

      const relevanceScore = Math.round(
        (primaryAffinity * 0.6 + secondaryAffinity * 0.4) * 100
      );

      return {
        template,
        relevanceScore,
        reasoning: `Aligned with your ${archetypeBlend.primary} archetype`,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Calculate overall goal balance across loops
export function calculateGoalBalance(
  goals: GoalHierarchy
): Record<LoopId, number> {
  const balance: Record<LoopId, number> = {} as Record<LoopId, number>;

  for (const loop of ALL_LOOPS) {
    const loopGoals = goals.annual.filter((g) => g.loop === loop);
    balance[loop] = loopGoals.length;
  }

  return balance;
}

// Get loops that need goals
export function getLoopsNeedingGoals(goals: GoalHierarchy): LoopId[] {
  const balance = calculateGoalBalance(goals);
  return ALL_LOOPS.filter((loop) => balance[loop] === 0);
}
