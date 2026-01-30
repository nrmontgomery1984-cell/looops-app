// Directional Documents - Static Options for Intake Flow

import {
  IdentityStatementOption,
  ValueDimensionDefinition,
  ValueDimension,
  TradeoffScenario,
  LoopOption,
  SeasonOption,
  LoopSeason,
} from "../types/directional";
import { LoopId } from "../types/core";

// ========== Identity Statements ==========
// Users select 5-7 that resonate with who they want to be

export const IDENTITY_STATEMENTS: IdentityStatementOption[] = [
  // Builder/Creator
  {
    id: "builder",
    label: "I want to be a builder",
    description: "Creating things that matter and making tangible impact",
    category: "Creator",
  },
  {
    id: "innovator",
    label: "I want to be an innovator",
    description: "Finding new ways to solve problems and improve things",
    category: "Creator",
  },
  {
    id: "artist",
    label: "I want to be an artist",
    description: "Expressing myself creatively and bringing beauty to the world",
    category: "Creator",
  },

  // Caretaker/Supporter
  {
    id: "caretaker",
    label: "I want to be a caretaker",
    description: "Nurturing and protecting those who depend on me",
    category: "Supporter",
  },
  {
    id: "mentor",
    label: "I want to be a mentor",
    description: "Guiding others and helping them grow",
    category: "Supporter",
  },
  {
    id: "connector",
    label: "I want to be a connector",
    description: "Bringing people together and strengthening communities",
    category: "Supporter",
  },

  // Achiever/Driver
  {
    id: "achiever",
    label: "I want to be an achiever",
    description: "Setting ambitious goals and working relentlessly to reach them",
    category: "Driver",
  },
  {
    id: "leader",
    label: "I want to be a leader",
    description: "Taking charge and guiding others toward shared goals",
    category: "Driver",
  },
  {
    id: "competitor",
    label: "I want to be a competitor",
    description: "Thriving on challenge and pushing beyond limits",
    category: "Driver",
  },

  // Seeker/Explorer
  {
    id: "seeker",
    label: "I want to be a seeker",
    description: "Pursuing knowledge, growth, and deeper understanding",
    category: "Explorer",
  },
  {
    id: "adventurer",
    label: "I want to be an adventurer",
    description: "Seeking new experiences and embracing the unknown",
    category: "Explorer",
  },
  {
    id: "philosopher",
    label: "I want to be a philosopher",
    description: "Contemplating life's big questions and seeking wisdom",
    category: "Explorer",
  },

  // Stabilizer/Anchor
  {
    id: "anchor",
    label: "I want to be an anchor",
    description: "Providing stability and reliability for those around me",
    category: "Stabilizer",
  },
  {
    id: "protector",
    label: "I want to be a protector",
    description: "Keeping my people safe and secure",
    category: "Stabilizer",
  },
  {
    id: "provider",
    label: "I want to be a provider",
    description: "Ensuring my family has what they need to thrive",
    category: "Stabilizer",
  },

  // Optimizer/Systems Thinker
  {
    id: "optimizer",
    label: "I want to be an optimizer",
    description: "Finding ways to make everything work better and more efficiently",
    category: "Systems",
  },
  {
    id: "analyst",
    label: "I want to be an analyst",
    description: "Breaking down complex problems and finding the best solutions",
    category: "Systems",
  },
  {
    id: "strategist",
    label: "I want to be a strategist",
    description: "Thinking long-term and planning for success",
    category: "Systems",
  },
];

// ========== Value Dimensions ==========
// 8 bipolar sliders, each 1-10 with 5 as neutral

export const VALUE_DIMENSIONS: ValueDimensionDefinition[] = [
  {
    id: "security_adventure",
    leftPole: "Security",
    rightPole: "Adventure",
    leftDescription: "I value stability, predictability, and feeling safe",
    rightDescription: "I value novelty, risk-taking, and new experiences",
  },
  {
    id: "independence_belonging",
    leftPole: "Independence",
    rightPole: "Belonging",
    leftDescription: "I value autonomy, self-reliance, and freedom",
    rightDescription: "I value community, connection, and being part of something",
  },
  {
    id: "achievement_contentment",
    leftPole: "Achievement",
    rightPole: "Contentment",
    leftDescription: "I'm driven to accomplish, succeed, and reach goals",
    rightDescription: "I value peace, gratitude, and appreciating what I have",
  },
  {
    id: "tradition_innovation",
    leftPole: "Tradition",
    rightPole: "Innovation",
    leftDescription: "I value proven methods, heritage, and time-tested wisdom",
    rightDescription: "I value progress, change, and challenging the status quo",
  },
  {
    id: "control_flexibility",
    leftPole: "Control",
    rightPole: "Flexibility",
    leftDescription: "I value structure, planning, and being in charge",
    rightDescription: "I value adaptability, spontaneity, and going with the flow",
  },
  {
    id: "privacy_openness",
    leftPole: "Privacy",
    rightPole: "Openness",
    leftDescription: "I value personal space, discretion, and boundaries",
    rightDescription: "I value transparency, sharing, and vulnerability",
  },
  {
    id: "efficiency_presence",
    leftPole: "Efficiency",
    rightPole: "Presence",
    leftDescription: "I value speed, productivity, and getting things done",
    rightDescription: "I value mindfulness, savoring moments, and being fully here",
  },
  {
    id: "competition_collaboration",
    leftPole: "Competition",
    rightPole: "Collaboration",
    leftDescription: "I'm motivated by winning, standing out, and personal success",
    rightDescription: "I'm motivated by teamwork, shared success, and lifting others",
  },
];

// ========== Tradeoff Scenarios ==========
// 5-7 forced-choice scenarios to understand decision-making

export const TRADEOFF_SCENARIOS: TradeoffScenario[] = [
  {
    id: "career_family",
    title: "Career Opportunity vs Family Time",
    description: "A major career opportunity requires significant time away from family",
    optionA: {
      loopFocus: "Work",
      label: "Take the opportunity",
      description: "Accept the role, knowing family time will be limited for a while",
    },
    optionB: {
      loopFocus: "Family",
      label: "Protect family time",
      description: "Decline or defer, keeping family as the priority",
    },
  },
  {
    id: "health_wealth",
    title: "Health Investment vs Financial Goals",
    description: "Investing in your health (gym, organic food, therapy) impacts savings",
    optionA: {
      loopFocus: "Health",
      label: "Invest in health",
      description: "Spend what it takes to optimize physical and mental health",
    },
    optionB: {
      loopFocus: "Wealth",
      label: "Prioritize savings",
      description: "Find lower-cost alternatives and protect financial goals",
    },
  },
  {
    id: "fun_work",
    title: "Leisure vs Career Advancement",
    description: "Using evenings and weekends for fun vs skill development",
    optionA: {
      loopFocus: "Fun",
      label: "Protect leisure time",
      description: "Keep evenings and weekends for hobbies and socializing",
    },
    optionB: {
      loopFocus: "Work",
      label: "Invest in growth",
      description: "Use free time for learning and career advancement",
    },
  },
  {
    id: "maintenance_meaning",
    title: "Practical Tasks vs Deep Work",
    description: "Weekend time for chores and errands vs reflection and creative projects",
    optionA: {
      loopFocus: "Maintenance",
      label: "Stay on top of life admin",
      description: "Keep the house clean, errands done, and systems maintained",
    },
    optionB: {
      loopFocus: "Meaning",
      label: "Prioritize depth",
      description: "Let some practical stuff slide to focus on what matters most",
    },
  },
  {
    id: "family_health",
    title: "Family Obligations vs Self-Care",
    description: "Family needs your time, but you need time for health routines",
    optionA: {
      loopFocus: "Family",
      label: "Be there for family",
      description: "Show up for family even when it means skipping workouts or rest",
    },
    optionB: {
      loopFocus: "Health",
      label: "Protect self-care",
      description: "Maintain health routines even when family wants your time",
    },
  },
  {
    id: "wealth_fun",
    title: "Savings vs Experiences",
    description: "A dream trip or experience is expensive",
    optionA: {
      loopFocus: "Wealth",
      label: "Save the money",
      description: "Skip the experience and put the money toward long-term goals",
    },
    optionB: {
      loopFocus: "Fun",
      label: "Invest in experiences",
      description: "Life is short - take the trip and make memories",
    },
  },
  {
    id: "work_health",
    title: "Career Push vs Rest",
    description: "A big project requires burning the candle at both ends",
    optionA: {
      loopFocus: "Work",
      label: "Push through",
      description: "Sacrifice sleep and exercise temporarily for the win",
    },
    optionB: {
      loopFocus: "Health",
      label: "Protect wellbeing",
      description: "Accept slower progress to maintain health and sustainability",
    },
  },
];

// ========== Loop-Specific Options ==========

// Health Loop
export const HEALTH_THRIVING_OPTIONS: LoopOption[] = [
  { id: "energy_abundant", label: "I have abundant energy throughout the day" },
  { id: "sleep_quality", label: "I sleep deeply and wake refreshed" },
  { id: "fitness_capable", label: "My body is capable and strong" },
  { id: "rarely_sick", label: "I rarely get sick and recover quickly when I do" },
  { id: "mental_stable", label: "My mental health feels stable and manageable" },
  { id: "nutrition_intuitive", label: "I eat well without constant struggle or restriction" },
  { id: "stress_managed", label: "I handle stress without it overwhelming me" },
  { id: "routine_sustainable", label: "I have sustainable health routines I actually enjoy" },
];

export const HEALTH_NONNEGOTIABLES: LoopOption[] = [
  { id: "sleep_schedule", label: "Regular sleep schedule" },
  { id: "daily_movement", label: "Some form of movement every day" },
  { id: "regular_meals", label: "Regular meals - not skipping food" },
  { id: "mental_health_practice", label: "Mental health practices (therapy, meditation, etc.)" },
  { id: "preventive_care", label: "Annual checkups and preventive care" },
  { id: "substance_limits", label: "Limits on alcohol and other substances" },
  { id: "outdoor_time", label: "Regular time outdoors" },
  { id: "recovery_days", label: "Recovery and rest days" },
];

export const HEALTH_MINIMUM_STANDARDS: LoopOption[] = [
  { id: "enough_sleep", label: "Getting enough sleep most nights" },
  { id: "some_exercise", label: "Moving my body a few times per week" },
  { id: "reasonable_eating", label: "Eating reasonably well most days" },
  { id: "basic_hygiene", label: "Basic hygiene and self-care" },
  { id: "medications", label: "Taking medications and supplements as needed" },
  { id: "warning_signs", label: "Not ignoring warning signs" },
];

// Wealth Loop
export const WEALTH_THRIVING_OPTIONS: LoopOption[] = [
  { id: "financial_security", label: "I have financial security and don't worry about basics" },
  { id: "building_goals", label: "I'm actively building toward long-term goals" },
  { id: "freedom_choices", label: "I have freedom to make choices without money being the constraint" },
  { id: "understand_finances", label: "I understand where my money goes and feel in control" },
  { id: "fair_compensation", label: "I'm compensated fairly for my work" },
  { id: "margin_unexpected", label: "I have margin for unexpected expenses" },
  { id: "building_assets", label: "I'm building assets and equity, not just income" },
  { id: "generous", label: "I can be generous with others" },
];

export const WEALTH_NONNEGOTIABLES: LoopOption[] = [
  { id: "bills_on_time", label: "Bills paid on time" },
  { id: "emergency_fund", label: "Emergency fund maintained" },
  { id: "retirement_contributions", label: "Retirement contributions happening" },
  { id: "no_bad_debt", label: "No high-interest consumer debt" },
  { id: "insurance", label: "Adequate insurance coverage" },
  { id: "income_exceeds", label: "Income exceeds expenses" },
  { id: "financial_review", label: "Regular financial review" },
  { id: "separate_accounts", label: "Separate business and personal finances (if applicable)" },
];

export const WEALTH_MINIMUM_STANDARDS: LoopOption[] = [
  { id: "basics_covered", label: "Basics covered (housing, food, utilities)" },
  { id: "not_accumulating_debt", label: "Not accumulating bad debt" },
  { id: "some_savings", label: "Some savings happening" },
  { id: "aware_position", label: "Aware of my financial position" },
  { id: "taxes_met", label: "Tax obligations met" },
];

// Family Loop
export const FAMILY_THRIVING_OPTIONS: LoopOption[] = [
  { id: "connected_healthy", label: "My key relationships feel connected and healthy" },
  { id: "present_engaged", label: "I'm present and engaged when with family" },
  { id: "quality_time", label: "We have regular quality time together" },
  { id: "open_communication", label: "Communication is open and honest" },
  { id: "responsibilities_met", label: "I'm fulfilling my responsibilities to dependents" },
  { id: "extended_maintained", label: "Extended family relationships are maintained" },
  { id: "shared_memories", label: "We have shared experiences and memories" },
  { id: "conflicts_resolved", label: "Conflicts get resolved, not avoided" },
];

export const FAMILY_NONNEGOTIABLES: LoopOption[] = [
  { id: "protected_time", label: "Protected time with kids/partner" },
  { id: "being_present", label: "Being present (not distracted) during family time" },
  { id: "important_events", label: "Showing up for important events" },
  { id: "regular_communication", label: "Regular communication with key people" },
  { id: "dependent_commitments", label: "Meeting commitments to dependents" },
  { id: "healthy_boundaries", label: "Maintaining boundaries with difficult relationships" },
  { id: "date_nights", label: "Date nights / partner connection time" },
  { id: "family_meals", label: "Family meals together" },
];

export const FAMILY_MINIMUM_STANDARDS: LoopOption[] = [
  { id: "kids_needs", label: "Kids' basic needs met" },
  { id: "partner_not_neglected", label: "Partner not feeling neglected" },
  { id: "responding_communication", label: "Responding to family communication" },
  { id: "big_moments", label: "Showing up for the big moments" },
  { id: "conflicts_addressed", label: "Not letting conflicts fester too long" },
];

// Work Loop
export const WORK_THRIVING_OPTIONS: LoopOption[] = [
  { id: "meaningful_work", label: "I'm doing meaningful work that uses my strengths" },
  { id: "growing_professionally", label: "I'm growing professionally and learning" },
  { id: "good_relationships", label: "I have good relationships with colleagues/clients" },
  { id: "compensated_well", label: "I'm compensated appropriately" },
  { id: "autonomy_agency", label: "I have autonomy and agency in my work" },
  { id: "work_stays_contained", label: "Work stays in its lane (doesn't consume everything)" },
  { id: "building_toward", label: "I'm building toward something (career, business, reputation)" },
  { id: "effective_productive", label: "I'm effective and productive" },
];

export const WORK_NONNEGOTIABLES: LoopOption[] = [
  { id: "clear_boundaries", label: "Clear boundaries on work hours" },
  { id: "delivering_commitments", label: "Delivering on commitments" },
  { id: "professional_relationships", label: "Maintaining professional relationships" },
  { id: "continuous_learning", label: "Continuous learning and skill development" },
  { id: "ethics_intact", label: "Not compromising ethics/values for work" },
  { id: "fair_pay", label: "Getting paid what I'm worth" },
  { id: "taking_breaks", label: "Taking vacation and breaks" },
  { id: "focused_time", label: "Protecting focused work time" },
];

export const WORK_MINIMUM_STANDARDS: LoopOption[] = [
  { id: "core_responsibilities", label: "Meeting core job responsibilities" },
  { id: "not_burning_bridges", label: "Not burning bridges" },
  { id: "staying_employable", label: "Staying employable" },
  { id: "not_destroying_other", label: "Work not destroying other loops" },
  { id: "basic_reputation", label: "Basic professional reputation maintained" },
];

// Fun Loop
export const FUN_THRIVING_OPTIONS: LoopOption[] = [
  { id: "regular_enjoyment", label: "I regularly do things purely for enjoyment" },
  { id: "engaging_hobbies", label: "I have hobbies that engage and energize me" },
  { id: "play_spontaneity", label: "I make time for play and spontaneity" },
  { id: "social_outside", label: "I have social connections outside family/work" },
  { id: "new_experiences", label: "I experience new things and adventures" },
  { id: "creative_outlets", label: "I have creative outlets" },
  { id: "guilt_free_rest", label: "I can relax and enjoy downtime guilt-free" },
  { id: "life_has_joy", label: "Life has joy, not just productivity" },
];

export const FUN_NONNEGOTIABLES: LoopOption[] = [
  { id: "weekly_enjoyment", label: "Weekly time for pure enjoyment" },
  { id: "maintaining_friendships", label: "Maintaining friendships" },
  { id: "hobbies_for_me", label: "Hobbies that are just for me" },
  { id: "occasional_adventures", label: "Occasional adventures and new experiences" },
  { id: "not_all_work", label: "Not sacrificing all fun for productivity" },
  { id: "social_time", label: "Social time with friends" },
  { id: "creative_playful", label: "Creative or playful outlets" },
  { id: "guilt_free", label: "Guilt-free rest" },
];

export const FUN_MINIMUM_STANDARDS: LoopOption[] = [
  { id: "some_enjoyment", label: "Some enjoyment weekly" },
  { id: "not_isolated", label: "Not complete social isolation" },
  { id: "one_hobby", label: "At least one hobby maintained" },
  { id: "occasional_fun", label: "Occasional fun, even if brief" },
  { id: "some_play", label: "Not all work and no play" },
];

// Maintenance Loop
export const MAINTENANCE_THRIVING_OPTIONS: LoopOption[] = [
  { id: "organized_functional", label: "My environment is organized and functional" },
  { id: "admin_current", label: "Administrative tasks don't pile up" },
  { id: "systems_reduce_friction", label: "Systems are in place that reduce friction" },
  { id: "home_maintained", label: "Home and possessions are well-maintained" },
  { id: "paperwork_current", label: "I stay on top of paperwork and obligations" },
  { id: "tech_works", label: "Technology works and is organized" },
  { id: "routines_handle", label: "I have routines that handle recurring needs" },
  { id: "no_crisis", label: "Maintenance doesn't become crisis management" },
];

export const MAINTENANCE_NONNEGOTIABLES: LoopOption[] = [
  { id: "clean_environment", label: "Clean living environment" },
  { id: "bills_paperwork", label: "Bills and paperwork handled timely" },
  { id: "vehicle_home", label: "Vehicle and home maintenance current" },
  { id: "regular_declutter", label: "Regular decluttering" },
  { id: "digital_organized", label: "Digital organization" },
  { id: "meal_system", label: "Meal planning and grocery system" },
  { id: "calendar_managed", label: "Calendar and schedule management" },
  { id: "systems_review", label: "Regular review of systems" },
];

export const MAINTENANCE_MINIMUM_STANDARDS: LoopOption[] = [
  { id: "nothing_critical", label: "Nothing critical falling through cracks" },
  { id: "environment_functional", label: "Environment functional if not perfect" },
  { id: "obligations_met", label: "Obligations met even if last minute" },
  { id: "no_major_debt", label: "No major maintenance debt accumulating" },
  { id: "basic_systems", label: "Basic systems functioning" },
];

// Meaning Loop
export const MEANING_THRIVING_OPTIONS: LoopOption[] = [
  { id: "clear_purpose", label: "I have a clear sense of purpose" },
  { id: "contributing_larger", label: "I'm contributing to something larger than myself" },
  { id: "living_values", label: "I'm living according to my values" },
  { id: "spiritual_practices", label: "I have practices that connect me to meaning" },
  { id: "community_impact", label: "I'm making an impact in my community" },
  { id: "creating_legacy", label: "I'm creating a legacy" },
  { id: "aligned_beliefs", label: "I feel aligned between beliefs and actions" },
  { id: "life_significant", label: "Life feels significant, not just busy" },
];

export const MEANING_NONNEGOTIABLES: LoopOption[] = [
  { id: "time_reflection", label: "Time for reflection and contemplation" },
  { id: "aligned_values", label: "Living aligned with stated values" },
  { id: "connection_community", label: "Connection to community or cause" },
  { id: "grounding_practices", label: "Practices that ground me (spiritual, meditation, nature)" },
  { id: "not_drifting", label: "Not just drifting through life" },
  { id: "giving_back", label: "Giving back in some way" },
  { id: "big_questions", label: "Examining the big questions" },
  { id: "life_review", label: "Periodic life review and assessment" },
];

export const MEANING_MINIMUM_STANDARDS: LoopOption[] = [
  { id: "some_connection", label: "Some connection to purpose" },
  { id: "values_not_compromised", label: "Values not completely compromised" },
  { id: "occasional_reflection", label: "Occasional reflection on meaning" },
  { id: "not_adrift", label: "Not feeling completely adrift" },
  { id: "some_contribution", label: "Some contribution to others" },
];

// ========== Aggregated Loop Options ==========

export const LOOP_THRIVING_OPTIONS: Record<LoopId, LoopOption[]> = {
  Health: HEALTH_THRIVING_OPTIONS,
  Wealth: WEALTH_THRIVING_OPTIONS,
  Family: FAMILY_THRIVING_OPTIONS,
  Work: WORK_THRIVING_OPTIONS,
  Fun: FUN_THRIVING_OPTIONS,
  Maintenance: MAINTENANCE_THRIVING_OPTIONS,
  Meaning: MEANING_THRIVING_OPTIONS,
};

export const LOOP_NONNEGOTIABLES: Record<LoopId, LoopOption[]> = {
  Health: HEALTH_NONNEGOTIABLES,
  Wealth: WEALTH_NONNEGOTIABLES,
  Family: FAMILY_NONNEGOTIABLES,
  Work: WORK_NONNEGOTIABLES,
  Fun: FUN_NONNEGOTIABLES,
  Maintenance: MAINTENANCE_NONNEGOTIABLES,
  Meaning: MEANING_NONNEGOTIABLES,
};

export const LOOP_MINIMUM_STANDARDS: Record<LoopId, LoopOption[]> = {
  Health: HEALTH_MINIMUM_STANDARDS,
  Wealth: WEALTH_MINIMUM_STANDARDS,
  Family: FAMILY_MINIMUM_STANDARDS,
  Work: WORK_MINIMUM_STANDARDS,
  Fun: FUN_MINIMUM_STANDARDS,
  Maintenance: MAINTENANCE_MINIMUM_STANDARDS,
  Meaning: MEANING_MINIMUM_STANDARDS,
};

// ========== Season Options ==========

export const SEASON_OPTIONS: SeasonOption[] = [
  {
    id: "building",
    label: "Building",
    description: "Actively investing and growing in this area",
    icon: "🚀",
  },
  {
    id: "maintaining",
    label: "Maintaining",
    description: "Keeping steady, not pushing for growth",
    icon: "⚖️",
  },
  {
    id: "recovering",
    label: "Recovering",
    description: "Rebuilding from a setback or period of neglect",
    icon: "🌱",
  },
  {
    id: "hibernating",
    label: "Hibernating",
    description: "Intentionally deprioritized for now",
    icon: "💤",
  },
];

// ========== Energy Management Options ==========

export const ENERGY_MANAGEMENT_OPTIONS = [
  {
    id: "sprint_rest" as const,
    label: "Sprint & Rest",
    description: "I work in intense bursts followed by recovery periods",
  },
  {
    id: "steady_pace" as const,
    label: "Steady Pace",
    description: "I prefer consistent, moderate output over time",
  },
  {
    id: "adaptive" as const,
    label: "Adaptive",
    description: "My approach varies based on circumstances and energy levels",
  },
];

// ========== Financial Approach Options ==========

export const FINANCIAL_APPROACH_OPTIONS = [
  {
    id: "aggressive_saver" as const,
    label: "Aggressive Saver",
    description: "Maximize savings and investments for future security",
  },
  {
    id: "balanced" as const,
    label: "Balanced",
    description: "Mix of saving for the future and enjoying the present",
  },
  {
    id: "experience_focused" as const,
    label: "Experience Focused",
    description: "Prioritize experiences and quality of life over accumulation",
  },
  {
    id: "investment_focused" as const,
    label: "Investment Focused",
    description: "Focus on building assets and growing wealth",
  },
];
