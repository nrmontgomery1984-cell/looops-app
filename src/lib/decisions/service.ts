// Decision Service - CRUD operations and utility functions for decisions
// Uses dispatch actions from AppContext for state management

import {
  Decision,
  QuickDecision,
  DecisionOutcome,
  DecisionStatus,
  DecisionChoice,
  LoopId,
  createDecision,
  createQuickDecision,
  promoteQuickDecision,
  getDecisionsForReview,
  getDecisionsByLoop,
  getQuickDecisionsByLoop,
} from "../../types";

// Action types for dispatch
type DecisionAction =
  | { type: "ADD_DECISION"; payload: Decision }
  | { type: "UPDATE_DECISION"; payload: Decision }
  | { type: "DELETE_DECISION"; payload: string }
  | { type: "ADD_QUICK_DECISION"; payload: QuickDecision }
  | { type: "UPDATE_QUICK_DECISION"; payload: QuickDecision }
  | { type: "DELETE_QUICK_DECISION"; payload: string };

type Dispatch = (action: DecisionAction) => void;

// ============================================
// Full Decision CRUD Operations
// ============================================

/**
 * Create a new decision
 */
export function addDecision(
  dispatch: Dispatch,
  partial: Partial<Decision> & Pick<Decision, "title" | "loop">
): Decision {
  const decision = createDecision(partial);
  dispatch({ type: "ADD_DECISION", payload: decision });
  return decision;
}

/**
 * Update an existing decision
 */
export function updateDecision(
  dispatch: Dispatch,
  decision: Decision
): Decision {
  const updated = {
    ...decision,
    updatedAt: new Date().toISOString(),
  };
  dispatch({ type: "UPDATE_DECISION", payload: updated });
  return updated;
}

/**
 * Delete a decision by ID
 */
export function deleteDecision(dispatch: Dispatch, id: string): void {
  dispatch({ type: "DELETE_DECISION", payload: id });
}

/**
 * Get a decision by ID from the list
 */
export function getDecision(
  decisions: Decision[],
  id: string
): Decision | undefined {
  return decisions.find((d) => d.id === id);
}

/**
 * Mark a decision as decided (completed survey)
 */
export function markDecisionAsDecided(
  dispatch: Dispatch,
  decision: Decision,
  finalChoice: DecisionChoice,
  confidenceLevel: number
): Decision {
  return updateDecision(dispatch, {
    ...decision,
    status: "decided",
    finalChoice,
    confidenceLevel,
  });
}

/**
 * Add outcome to a decided decision (retrospective review)
 */
export function addDecisionOutcome(
  dispatch: Dispatch,
  decision: Decision,
  outcome: Omit<DecisionOutcome, "assessedAt">
): Decision {
  return updateDecision(dispatch, {
    ...decision,
    status: "reviewed",
    outcome: {
      ...outcome,
      assessedAt: new Date().toISOString(),
    },
  });
}

// ============================================
// Quick Decision CRUD Operations
// ============================================

/**
 * Create a new quick decision
 */
export function addQuickDecision(
  dispatch: Dispatch,
  partial: Partial<QuickDecision> & Pick<QuickDecision, "title" | "loop">
): QuickDecision {
  const quickDecision = createQuickDecision(partial);
  dispatch({ type: "ADD_QUICK_DECISION", payload: quickDecision });
  return quickDecision;
}

/**
 * Update an existing quick decision
 */
export function updateQuickDecisionItem(
  dispatch: Dispatch,
  quickDecision: QuickDecision
): QuickDecision {
  dispatch({ type: "UPDATE_QUICK_DECISION", payload: quickDecision });
  return quickDecision;
}

/**
 * Delete a quick decision by ID
 */
export function deleteQuickDecision(dispatch: Dispatch, id: string): void {
  dispatch({ type: "DELETE_QUICK_DECISION", payload: id });
}

/**
 * Get a quick decision by ID from the list
 */
export function getQuickDecision(
  quickDecisions: QuickDecision[],
  id: string
): QuickDecision | undefined {
  return quickDecisions.find((d) => d.id === id);
}

/**
 * Promote a quick decision to a full decision
 * Creates the full decision and updates the quick decision with the link
 */
export function promoteToFullDecision(
  dispatch: Dispatch,
  quickDecision: QuickDecision
): { decision: Decision; updatedQuick: QuickDecision } {
  const { decision, updatedQuick } = promoteQuickDecision(quickDecision);

  dispatch({ type: "ADD_DECISION", payload: decision });
  dispatch({ type: "UPDATE_QUICK_DECISION", payload: updatedQuick });

  return { decision, updatedQuick };
}

// ============================================
// Query Functions
// ============================================

/**
 * Get all decisions that need review
 * (status = 'decided' but no outcome yet)
 */
export function getPendingReviewDecisions(decisions: Decision[]): Decision[] {
  return getDecisionsForReview(decisions);
}

/**
 * Get decisions by loop
 */
export function getDecisionsInLoop(
  decisions: Decision[],
  loop: LoopId
): Decision[] {
  return getDecisionsByLoop(decisions, loop);
}

/**
 * Get quick decisions by loop
 */
export function getQuickDecisionsInLoop(
  quickDecisions: QuickDecision[],
  loop: LoopId
): QuickDecision[] {
  return getQuickDecisionsByLoop(quickDecisions, loop);
}

/**
 * Get decisions by status
 */
export function getDecisionsByStatus(
  decisions: Decision[],
  status: DecisionStatus
): Decision[] {
  return decisions.filter((d) => d.status === status);
}

/**
 * Get decisions by final choice
 */
export function getDecisionsByChoice(
  decisions: Decision[],
  choice: DecisionChoice
): Decision[] {
  return decisions.filter((d) => d.finalChoice === choice);
}

/**
 * Get decisions linked to a specific task
 */
export function getDecisionsForTask(
  decisions: Decision[],
  taskId: string
): Decision[] {
  return decisions.filter((d) => d.linkedTaskId === taskId);
}

/**
 * Get decisions linked to a specific goal
 */
export function getDecisionsForGoal(
  decisions: Decision[],
  goalId: string
): Decision[] {
  return decisions.filter((d) => d.linkedGoalId === goalId);
}

/**
 * Get recent decisions (sorted by createdAt, most recent first)
 */
export function getRecentDecisions(
  decisions: Decision[],
  limit: number = 10
): Decision[] {
  return [...decisions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

/**
 * Get decisions created within a date range
 */
export function getDecisionsInDateRange(
  decisions: Decision[],
  startDate: string,
  endDate: string
): Decision[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return decisions.filter((d) => {
    const created = new Date(d.createdAt).getTime();
    return created >= start && created <= end;
  });
}

// ============================================
// Analytics Functions
// ============================================

/**
 * Calculate decision accuracy rate
 * (correct decisions / reviewed decisions with known outcome)
 */
export function getDecisionAccuracyRate(decisions: Decision[]): number | null {
  const reviewedWithOutcome = decisions.filter(
    (d) => d.status === "reviewed" && d.outcome?.wasCorrect !== null
  );

  if (reviewedWithOutcome.length === 0) return null;

  const correctCount = reviewedWithOutcome.filter(
    (d) => d.outcome?.wasCorrect === true
  ).length;

  return correctCount / reviewedWithOutcome.length;
}

/**
 * Get decision stats by loop
 */
export function getDecisionStatsByLoop(decisions: Decision[]): Record<
  LoopId,
  {
    total: number;
    pending: number;
    decided: number;
    reviewed: number;
    proceeded: number;
    declined: number;
    deferred: number;
  }
> {
  const loops: LoopId[] = [
    "Health",
    "Wealth",
    "Family",
    "Work",
    "Fun",
    "Maintenance",
    "Meaning",
  ];

  const stats: Record<string, any> = {};

  for (const loop of loops) {
    const loopDecisions = getDecisionsByLoop(decisions, loop);
    stats[loop] = {
      total: loopDecisions.length,
      pending: loopDecisions.filter((d) => d.status === "pending").length,
      decided: loopDecisions.filter((d) => d.status === "decided").length,
      reviewed: loopDecisions.filter((d) => d.status === "reviewed").length,
      proceeded: loopDecisions.filter((d) => d.finalChoice === "proceed").length,
      declined: loopDecisions.filter((d) => d.finalChoice === "decline").length,
      deferred: loopDecisions.filter((d) => d.finalChoice === "defer").length,
    };
  }

  return stats as Record<LoopId, any>;
}

/**
 * Get average confidence level for decisions
 */
export function getAverageConfidence(decisions: Decision[]): number | null {
  const decidedOrReviewed = decisions.filter(
    (d) => d.status === "decided" || d.status === "reviewed"
  );

  if (decidedOrReviewed.length === 0) return null;

  const sum = decidedOrReviewed.reduce((acc, d) => acc + d.confidenceLevel, 0);
  return sum / decidedOrReviewed.length;
}

/**
 * Identify decisions with hidden importance
 * (decisions that seemed small but turned out to be significant)
 */
export function getHighImpactDecisions(decisions: Decision[]): Decision[] {
  return decisions.filter(
    (d) =>
      d.outcome?.hiddenImportance === "high" ||
      d.outcome?.hiddenImportance === "medium"
  );
}

/**
 * Get decisions that were made in unsafe emotional states
 * (feeling score of 1 or 5)
 */
export function getEmotionalDecisions(decisions: Decision[]): Decision[] {
  return decisions.filter(
    (d) => d.survey.feelingScore === 1 || d.survey.feelingScore === 5
  );
}

/**
 * Get reversibility stats
 */
export function getReversibilityStats(decisions: Decision[]): {
  reversible: number;
  irreversible: number;
  reversibleAccuracy: number | null;
  irreversibleAccuracy: number | null;
} {
  const reversible = decisions.filter((d) => d.survey.isReversible);
  const irreversible = decisions.filter((d) => !d.survey.isReversible);

  const getAccuracy = (subset: Decision[]): number | null => {
    const reviewed = subset.filter(
      (d) => d.status === "reviewed" && d.outcome?.wasCorrect !== null
    );
    if (reviewed.length === 0) return null;
    const correct = reviewed.filter((d) => d.outcome?.wasCorrect === true).length;
    return correct / reviewed.length;
  };

  return {
    reversible: reversible.length,
    irreversible: irreversible.length,
    reversibleAccuracy: getAccuracy(reversible),
    irreversibleAccuracy: getAccuracy(irreversible),
  };
}
