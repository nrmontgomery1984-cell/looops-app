// Trait Statement Pairs for Dual-Framing Assessment
// Each trait has two statements (one per pole) for more accurate personality measurement

import { TraitKey } from "../types";

export type TraitStatement = {
  traitId: TraitKey;
  leftStatement: string;  // Statement for left pole (lower score)
  rightStatement: string; // Statement for right pole (higher score)
  category: "energy" | "decision" | "work" | "social" | "approach";
};

// Organized by category for hybrid display (2-3 traits per screen)
export const TRAIT_STATEMENTS: TraitStatement[] = [
  // ============================================================================
  // ENERGY (1 trait)
  // ============================================================================
  {
    traitId: "introvert_extrovert",
    leftStatement: "I feel recharged after spending time alone. Quiet reflection and solitary activities restore my energy.",
    rightStatement: "I feel energized after being around people. Social interactions and group activities give me a boost.",
    category: "energy",
  },

  // ============================================================================
  // DECISION (2 traits)
  // ============================================================================
  {
    traitId: "intuitive_analytical",
    leftStatement: "I often make decisions based on gut feelings and instinct. I trust my intuition to guide me.",
    rightStatement: "I prefer to analyze data and facts before making decisions. I want evidence to support my choices.",
    category: "decision",
  },
  {
    traitId: "pragmatic_idealistic",
    leftStatement: "I focus on what works in practice, even if it's not perfect. Results matter more than ideals.",
    rightStatement: "I'm guided by principles and values, even when it's harder. Doing what's right matters most.",
    category: "decision",
  },

  // ============================================================================
  // WORK (3 traits)
  // ============================================================================
  {
    traitId: "spontaneous_structured",
    leftStatement: "I thrive on flexibility and adapt easily to changing situations. I prefer going with the flow.",
    rightStatement: "I work best with clear plans and schedules. Structure and routines help me stay productive.",
    category: "work",
  },
  {
    traitId: "specialist_generalist",
    leftStatement: "I prefer to develop deep expertise in specific areas. I'd rather know a lot about a few things.",
    rightStatement: "I enjoy learning broadly across many domains. I'd rather know something about many things.",
    category: "work",
  },
  {
    traitId: "process_outcome",
    leftStatement: "I find satisfaction in the work itself. How I do something matters as much as the result.",
    rightStatement: "I'm most focused on achieving results. The end goal is what drives me, not the journey.",
    category: "work",
  },

  // ============================================================================
  // SOCIAL (4 traits)
  // ============================================================================
  {
    traitId: "independent_collaborative",
    leftStatement: "I do my best work alone. I'm self-reliant and prefer to figure things out by myself.",
    rightStatement: "I thrive when working with others. Collaboration brings out my best ideas and efforts.",
    category: "social",
  },
  {
    traitId: "private_public",
    leftStatement: "I'm selective about what I share. I prefer to keep my thoughts and personal life private.",
    rightStatement: "I'm comfortable sharing openly. I don't mind being visible and putting myself out there.",
    category: "social",
  },
  {
    traitId: "harmonious_confrontational",
    leftStatement: "I naturally seek harmony and avoid conflict. I prefer diplomatic solutions over direct confrontation.",
    rightStatement: "I address issues head-on, even if uncomfortable. Direct confrontation is sometimes necessary.",
    category: "social",
  },
  {
    traitId: "humble_confident",
    leftStatement: "I tend to downplay my abilities and stay understated. I'm always open to being wrong.",
    rightStatement: "I'm self-assured and comfortable asserting my views. I project confidence in what I know.",
    category: "social",
  },

  // ============================================================================
  // APPROACH (5 traits)
  // ============================================================================
  {
    traitId: "risk_averse_seeking",
    leftStatement: "I prefer security and carefully evaluate risks before acting. I avoid unnecessary uncertainty.",
    rightStatement: "I'm drawn to challenges with uncertain outcomes. High stakes and bold moves excite me.",
    category: "approach",
  },
  {
    traitId: "patient_urgent",
    leftStatement: "I'm comfortable with slow, steady progress. I can delay gratification for long-term gains.",
    rightStatement: "I prefer quick action and fast results. I have a sense of urgency about getting things done.",
    category: "approach",
  },
  {
    traitId: "minimalist_maximalist",
    leftStatement: "I believe less is more. I prefer simplicity and eliminating the unnecessary.",
    rightStatement: "I embrace abundance and variety. More options and possibilities energize me.",
    category: "approach",
  },
  {
    traitId: "conservative_experimental",
    leftStatement: "I trust proven methods and established approaches. Stability and tradition are valuable.",
    rightStatement: "I'm drawn to new approaches and experimentation. Innovation and change energize me.",
    category: "approach",
  },
  {
    traitId: "reactive_proactive",
    leftStatement: "I respond well to situations as they arise. I'm adaptable and flexible to circumstances.",
    rightStatement: "I prefer to anticipate and shape outcomes. I take initiative rather than wait for things.",
    category: "approach",
  },
];

// Group statements by category for hybrid display
export const TRAIT_STATEMENT_GROUPS = [
  {
    id: "energy_decision",
    title: "Energy & Decision Making",
    description: "How you recharge and make choices",
    traitIds: ["introvert_extrovert", "intuitive_analytical", "pragmatic_idealistic"] as TraitKey[],
  },
  {
    id: "work",
    title: "Work Style",
    description: "How you approach tasks and learning",
    traitIds: ["spontaneous_structured", "specialist_generalist", "process_outcome"] as TraitKey[],
  },
  {
    id: "social",
    title: "Social Style",
    description: "How you interact with others",
    traitIds: ["independent_collaborative", "private_public", "harmonious_confrontational", "humble_confident"] as TraitKey[],
  },
  {
    id: "approach",
    title: "Approach to Life",
    description: "How you handle risk, pace, and change",
    traitIds: ["risk_averse_seeking", "patient_urgent", "minimalist_maximalist", "conservative_experimental", "reactive_proactive"] as TraitKey[],
  },
];

// Helper to get statement by trait ID
export function getStatementByTraitId(traitId: TraitKey): TraitStatement | undefined {
  return TRAIT_STATEMENTS.find(s => s.traitId === traitId);
}

// Helper to get all statements for a category
export function getStatementsByCategory(category: TraitStatement["category"]): TraitStatement[] {
  return TRAIT_STATEMENTS.filter(s => s.category === category);
}
