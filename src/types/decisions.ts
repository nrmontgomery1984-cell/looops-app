// Decision Module Types
// Based on MFM Decision Survey Framework and Behavioral Economics principles

import { LoopId } from "./core";

// Decision status workflow
export type DecisionStatus = "pending" | "decided" | "reviewed";

// Final choice outcome
export type DecisionChoice = "proceed" | "decline" | "defer";

// Fear-Greed spectrum (1=extreme fear, 3=neutral, 5=extreme greed)
export type FeelingScore = 1 | 2 | 3 | 4 | 5;

// Joust winner (which reason won the arm wrestle)
export type JoustWinner = "for" | "against";

// Hidden importance level for retrospective
export type HiddenImportance = "low" | "medium" | "high";

/**
 * MFM Decision Survey Responses
 * Based on the 12-question framework from My First Million Episode 781
 */
export interface DecisionSurvey {
  // Q2: What am I feeling right now? (Fear ↔ Greed spectrum)
  feelingScore: FeelingScore;

  // Q3: What is the ONE decisive reason to do this?
  oneReason: string;

  // Q4: What is the strongest reason AGAINST?
  reasonAgainst: string;

  // Q5: Which reason wins the arm wrestle?
  joustWinner: JoustWinner;

  // Q6: Is my reason Honest, Concise, and Tied to Values?
  isHonest: boolean;
  isConcise: boolean;
  isTiedToValues: boolean;

  // Q7: Are there valid substitutes? (Alternative paths with lower cost)
  validSubstitutes: string | null;

  // Q8: Would I still do it without secondary benefits?
  withoutSecondaryBenefits: boolean;

  // Q9: What triggered this decision? (FOMO, comparison, external pressure)
  trigger: string;

  // Q10: What alternatives did I consider?
  alternativesConsidered: string[];

  // Q11: Is it reversible?
  isReversible: boolean;

  // Q12: Upside if right? Downside if wrong?
  upsideIfRight: string;
  downsideIfWrong: string;
}

/**
 * Decision Outcome - Retrospective assessment
 * For the Decision Register retroactive learning
 */
export interface DecisionOutcome {
  // When the outcome was assessed
  assessedAt: string; // ISO date string

  // Was the decision correct? (null = too early to tell)
  wasCorrect: boolean | null;

  // Did this decision turn out to be more important than expected?
  hiddenImportance: HiddenImportance | null;

  // What did we learn from this decision?
  learnings: string;
}

/**
 * Full Decision
 * Complete decision record with MFM survey responses
 */
export interface Decision {
  id: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string

  // Core decision info
  // Q1: What is the decision? (Tweet-length, max 280 chars)
  title: string;

  // Which life loop does this decision belong to?
  loop: LoopId;

  // Current status in the decision workflow
  status: DecisionStatus;

  // Full MFM Decision Survey responses
  survey: DecisionSurvey;

  // Confidence level at time of decision (1-10 scale)
  confidenceLevel: number;

  // Final choice made
  finalChoice: DecisionChoice;

  // Optional notes or context
  notes?: string;

  // Retrospective outcome (filled in later during review)
  outcome?: DecisionOutcome;

  // Optional link to related task
  linkedTaskId?: string;

  // Optional link to related goal
  linkedGoalId?: string;

  // Tags for categorization
  tags?: string[];
}

/**
 * Quick Decision
 * Lightweight version for faster decision capture
 * Uses abbreviated 4-question survey
 */
export interface QuickDecision {
  id: string;
  createdAt: string; // ISO date string

  // If triggered from a task
  parentTaskId?: string;

  // Core info
  title: string;
  loop: LoopId;

  // Abbreviated survey (4 key questions)
  feelingScore: FeelingScore;
  oneReason: string;
  isReversible: boolean;
  // Combined upside/downside asymmetry
  asymmetry: string;

  // Outcome
  finalChoice: DecisionChoice;

  // If user promoted to full decision survey
  promotedToFullId?: string;
}

/**
 * Decisions State
 * State slice for the decisions module
 */
export interface DecisionsState {
  decisions: Decision[];
  quickDecisions: QuickDecision[];
}

/**
 * Initial/default state for decisions
 */
export const INITIAL_DECISIONS_STATE: DecisionsState = {
  decisions: [],
  quickDecisions: [],
};

/**
 * Helper to create a new Decision with defaults
 */
export function createDecision(
  partial: Partial<Decision> & Pick<Decision, "title" | "loop">
): Decision {
  const now = new Date().toISOString();
  return {
    id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    survey: {
      feelingScore: 3, // Neutral default
      oneReason: "",
      reasonAgainst: "",
      joustWinner: "for",
      isHonest: false,
      isConcise: false,
      isTiedToValues: false,
      validSubstitutes: null,
      withoutSecondaryBenefits: false,
      trigger: "",
      alternativesConsidered: [],
      isReversible: true,
      upsideIfRight: "",
      downsideIfWrong: "",
    },
    confidenceLevel: 5,
    finalChoice: "defer",
    ...partial,
  };
}

/**
 * Helper to create a new QuickDecision with defaults
 */
export function createQuickDecision(
  partial: Partial<QuickDecision> & Pick<QuickDecision, "title" | "loop">
): QuickDecision {
  return {
    id: `quick_decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    feelingScore: 3,
    oneReason: "",
    isReversible: true,
    asymmetry: "",
    finalChoice: "defer",
    ...partial,
  };
}

/**
 * Helper to promote a QuickDecision to a full Decision
 */
export function promoteQuickDecision(
  quick: QuickDecision
): { decision: Decision; updatedQuick: QuickDecision } {
  const decision = createDecision({
    title: quick.title,
    loop: quick.loop,
    survey: {
      feelingScore: quick.feelingScore,
      oneReason: quick.oneReason,
      reasonAgainst: "",
      joustWinner: "for",
      isHonest: false,
      isConcise: false,
      isTiedToValues: false,
      validSubstitutes: null,
      withoutSecondaryBenefits: false,
      trigger: "",
      alternativesConsidered: [],
      isReversible: quick.isReversible,
      upsideIfRight: quick.asymmetry.includes("Upside:")
        ? quick.asymmetry.split("Downside:")[0].replace("Upside:", "").trim()
        : "",
      downsideIfWrong: quick.asymmetry.includes("Downside:")
        ? quick.asymmetry.split("Downside:")[1]?.trim() || ""
        : "",
    },
    linkedTaskId: quick.parentTaskId,
  });

  const updatedQuick: QuickDecision = {
    ...quick,
    promotedToFullId: decision.id,
  };

  return { decision, updatedQuick };
}

/**
 * Get feeling score label
 */
export function getFeelingLabel(score: FeelingScore): string {
  const labels: Record<FeelingScore, string> = {
    1: "Extreme Fear",
    2: "Some Fear",
    3: "Neutral",
    4: "Some Greed",
    5: "Extreme Greed",
  };
  return labels[score];
}

/**
 * Check if feeling score is in the safe decision zone
 */
export function isSafeToDecide(score: FeelingScore): boolean {
  // Only neutral (3) is safe; 2 and 4 are warning zones; 1 and 5 are danger zones
  return score === 3;
}

/**
 * Get decision quality advice based on feeling score
 */
export function getFeelingAdvice(score: FeelingScore): string {
  const advice: Record<FeelingScore, string> = {
    1: "Don't decide now. You're in extreme fear mode - like shopping hungry. Wait until you calm down.",
    2: "Proceed with caution. Some fear is influencing your judgment. Consider waiting.",
    3: "Good zone to decide. You're emotionally balanced.",
    4: "Proceed with caution. Some greed is influencing your judgment. Consider waiting.",
    5: "Don't decide now. You're in extreme greed mode. Wait until the excitement fades.",
  };
  return advice[score];
}

/**
 * Get decisions that need review (decided but no outcome yet)
 */
export function getDecisionsForReview(decisions: Decision[]): Decision[] {
  return decisions.filter(
    (d) => d.status === "decided" && !d.outcome
  );
}

/**
 * Get decisions by loop
 */
export function getDecisionsByLoop(
  decisions: Decision[],
  loop: LoopId
): Decision[] {
  return decisions.filter((d) => d.loop === loop);
}

/**
 * Get quick decisions by loop
 */
export function getQuickDecisionsByLoop(
  quickDecisions: QuickDecision[],
  loop: LoopId
): QuickDecision[] {
  return quickDecisions.filter((d) => d.loop === loop);
}
