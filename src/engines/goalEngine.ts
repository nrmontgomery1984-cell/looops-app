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
  DirectionalDocument,
} from "../types";

// Goal template for suggestions
export type GoalTemplate = {
  id: string;
  title: string;
  description: string;
  loop: LoopId;
  timeframe: GoalTimeframe;
  archetypeAffinity: Partial<Record<ArchetypeId, number>>; // 0-1 score
  suggestedMetrics?: { name: string; unit: string; suggestedTarget: number }[];
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
  },
];

// Generate goal suggestions based on user prototype, loop states, and directional document
export function generateGoalSuggestions(
  prototype: UserPrototype | null,
  loopStates: Record<LoopId, LoopStateType>,
  existingGoals: GoalHierarchy,
  directionalDocument?: DirectionalDocument | null,
  count: number = 10
): GoalSuggestion[] {
  const archetypeBlend = prototype?.archetypeBlend;
  const hasValidArchetype = archetypeBlend?.primary && archetypeBlend?.secondary;
  const hasDirections = directionalDocument && directionalDocument.status !== "draft";

  const suggestions: GoalSuggestion[] = [];

  // Get existing annual goal loop coverage
  const existingLoops = new Set(existingGoals.annual.map((g) => g.loop));

  // Get loop priority ranking if available
  const loopPriorityRanking = directionalDocument?.core?.tradeoffPriorities?.loopPriorityRanking || [];

  for (const template of GOAL_TEMPLATES) {
    // Calculate base score
    let baseScore = 50; // Start with neutral score when no archetype

    // Reduce priority for loops that already have annual goals
    if (existingLoops.has(template.loop)) {
      baseScore = 20; // Lower priority but still show as option
    }

    if (hasValidArchetype) {
      // Calculate archetype affinity score
      const primaryAffinity = template.archetypeAffinity[archetypeBlend.primary] || 0;
      const secondaryAffinity = template.archetypeAffinity[archetypeBlend.secondary] || 0;
      const tertiaryAffinity = archetypeBlend.tertiary
        ? template.archetypeAffinity[archetypeBlend.tertiary] || 0
        : 0;

      // Weighted by archetype blend scores
      baseScore =
        primaryAffinity * (archetypeBlend.scores[archetypeBlend.primary] / 100) * 0.5 +
        secondaryAffinity * (archetypeBlend.scores[archetypeBlend.secondary] / 100) * 0.35 +
        tertiaryAffinity * (archetypeBlend.tertiary ? archetypeBlend.scores[archetypeBlend.tertiary] / 100 : 0) * 0.15;

      // Scale to 0-100
      baseScore = baseScore * 100;
    }

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

    let relevanceScore = Math.round(baseScore * stateMultiplier);

    // Apply directional document boosts if available
    let directionalReasoning: string[] = [];

    if (hasDirections && directionalDocument) {
      const loopDirections = directionalDocument.loops[template.loop];

      // Loop priority ranking boost: +28 for top loop, -4 per rank
      if (loopPriorityRanking.length > 0) {
        const priorityIndex = loopPriorityRanking.indexOf(template.loop);
        if (priorityIndex !== -1) {
          const priorityBoost = 28 - (priorityIndex * 4);
          relevanceScore += priorityBoost;
          if (priorityIndex === 0) {
            directionalReasoning.push(`${template.loop} is your top priority loop`);
          } else if (priorityIndex <= 2) {
            directionalReasoning.push(`${template.loop} is one of your top 3 priorities`);
          }
        }
      }

      if (loopDirections) {
        // Dissatisfaction gap boost: up to +20 based on (100 - currentSatisfaction)
        const dissatisfactionGap = 100 - loopDirections.currentSatisfaction;
        const dissatisfactionBoost = Math.round((dissatisfactionGap / 100) * 20);
        relevanceScore += dissatisfactionBoost;
        if (dissatisfactionGap >= 50) {
          directionalReasoning.push(`Low satisfaction in ${template.loop} (${loopDirections.currentSatisfaction}%)`);
        }

        // Allocation gap boost: up to +15 based on (desired - current)
        const allocationGap = loopDirections.desiredAllocation - loopDirections.currentAllocation;
        if (allocationGap > 0) {
          const allocationBoost = Math.round((allocationGap / 50) * 15);
          relevanceScore += allocationBoost;
          if (allocationGap >= 20) {
            directionalReasoning.push(`You want more time in ${template.loop} (+${allocationGap}%)`);
          }
        }

        // Season-based adjustment
        switch (loopDirections.currentSeason) {
          case "building":
            relevanceScore += 10;
            directionalReasoning.push(`${template.loop} is in a building season`);
            break;
          case "maintaining":
            // No adjustment
            break;
          case "recovering":
            relevanceScore -= 5;
            break;
          case "hibernating":
            relevanceScore -= 10;
            break;
        }
      }
    }

    // Cap at 100
    relevanceScore = Math.min(100, Math.max(0, relevanceScore));

    // Generate reasoning
    let reasoning = hasValidArchetype
      ? generateReasoning(
          template,
          archetypeBlend.primary,
          archetypeBlend.secondary,
          loopState
        )
      : generateStateBasedReasoning(template, loopState);

    // Append directional reasoning if available
    if (directionalReasoning.length > 0) {
      reasoning = directionalReasoning.join(". ") + ". " + reasoning;
    }

    suggestions.push({
      template,
      relevanceScore,
      reasoning,
    });
  }

  // Sort by relevance and return top N
  return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, count);
}

// Generate reasoning based on loop state only (fallback when no archetype)
function generateStateBasedReasoning(
  template: GoalTemplate,
  loopState: LoopStateType
): string {
  const parts: string[] = [];

  switch (loopState) {
    case "BUILD":
      parts.push(`Your ${template.loop} loop is in BUILD mode - perfect time for ambitious goals`);
      break;
    case "MAINTAIN":
      parts.push(`A steady goal for your ${template.loop} loop while maintaining`);
      break;
    case "RECOVER":
      parts.push(`A gentle option as your ${template.loop} loop recovers`);
      break;
    case "HIBERNATE":
      parts.push(`Consider when your ${template.loop} loop is ready to grow`);
      break;
  }

  parts.push("Complete the identity questionnaire for personalized recommendations");

  return parts.join(". ");
}

// Generate human-readable reasoning for a suggestion
function generateReasoning(
  template: GoalTemplate,
  primaryArchetype: ArchetypeId,
  secondaryArchetype: ArchetypeId,
  loopState: LoopStateType
): string {
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
  _userId: string,
  customTitle?: string,
  customDescription?: string
): Goal {
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  return {
    id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
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
      id: `metric_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
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
// Creates empty quarterly milestones for the user to customize
export function decomposeAnnualToQuarterly(annualGoal: Goal): Goal[] {
  const quarterlyGoals: Goal[] = [];
  const now = new Date();
  const year = now.getFullYear();

  const quarters = [
    { name: "Q1", start: new Date(year, 0, 1), end: new Date(year, 2, 31) },
    { name: "Q2", start: new Date(year, 3, 1), end: new Date(year, 5, 30) },
    { name: "Q3", start: new Date(year, 6, 1), end: new Date(year, 8, 30) },
    { name: "Q4", start: new Date(year, 9, 1), end: new Date(year, 11, 31) },
  ];

  quarters.forEach((quarter, index) => {
    quarterlyGoals.push({
      id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 11)}_q${index + 1}`,
      title: `${quarter.name} milestone`,
      description: `Define your ${quarter.name} milestone for: ${annualGoal.title}`,
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
// Creates empty monthly milestones for the user to customize
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
      id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 11)}_m${index + 1}`,
      title: `${month.name} milestone`,
      description: `Define your ${month.name} milestone for: ${quarterlyGoal.title}`,
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
