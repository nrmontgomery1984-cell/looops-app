// Trait Scoring Engine - Converts dual-statement ratings to trait scores
// Handles scoring, validation, and flagging of ambiguous responses

import { TraitKey, UserTraits, DEFAULT_TRAITS } from "../types";

// Response on 1-5 Likert scale (0 means not yet answered)
export type StatementResponse = 0 | 1 | 2 | 3 | 4 | 5;

// Input for a single trait assessment (both poles rated)
export type TraitAssessmentInput = {
  leftPoleResponse: StatementResponse;   // Rating for left pole statement (0 = not answered)
  rightPoleResponse: StatementResponse;  // Rating for right pole statement (0 = not answered)
};

// Assessment state for all traits
export type TraitAssessmentState = Partial<Record<TraitKey, TraitAssessmentInput>>;

// Validation result for a single trait
export type TraitValidation = {
  traitId: TraitKey;
  isValid: boolean;
  needsClarification: boolean;
  score: number;
  confidence: number;
  flag?: "double_agree" | "double_disagree";
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate trait score from dual statement responses.
 *
 * Formula: ((rightResponse - leftResponse + 4) / 8) * 100
 *
 * Examples:
 * - Left=5, Right=1 → 0 (strong left pole)
 * - Left=3, Right=3 → 50 (balanced)
 * - Left=1, Right=5 → 100 (strong right pole)
 */
export function calculateTraitScore(input: TraitAssessmentInput): number {
  const { leftPoleResponse, rightPoleResponse } = input;

  // Convert 1-5 to 0-4 scale
  const leftScore = leftPoleResponse - 1;
  const rightScore = rightPoleResponse - 1;

  // Calculate relative position: difference ranges from -4 to +4
  // Map to 0-100 scale
  const rawScore = ((rightScore - leftScore + 4) / 8) * 100;

  return Math.round(rawScore);
}

/**
 * Calculate confidence score based on response consistency.
 *
 * High confidence: One pole high, other low (clear preference)
 * Low confidence: Both high or both low (ambiguous)
 */
export function calculateConfidence(input: TraitAssessmentInput): number {
  const { leftPoleResponse, rightPoleResponse } = input;

  const sum = leftPoleResponse + rightPoleResponse;
  const diff = Math.abs(leftPoleResponse - rightPoleResponse);

  // Ideal: sum around 6 (one high ~4-5, one low ~1-2) with diff of 3-4
  // Problematic: sum of 8-10 (both high) or sum of 2-4 (both low)

  // Difference bonus: larger difference = clearer preference
  const diffBonus = (diff / 4) * 40; // 0-40 points

  // Sum penalty: extreme sums indicate both-agree or both-disagree
  const idealSum = 6;
  const sumDeviation = Math.abs(sum - idealSum);
  const sumPenalty = (sumDeviation / 4) * 30; // 0-30 points

  const confidence = 50 + diffBonus - sumPenalty;
  return Math.round(Math.max(0, Math.min(100, confidence)));
}

/**
 * Check if a response needs clarification via fallback slider.
 *
 * Conditions:
 * - Both poles rated 4 or 5 (double agree)
 * - Both poles rated 1 or 2 (double disagree)
 */
export function needsClarification(input: TraitAssessmentInput): {
  needs: boolean;
  reason?: "double_agree" | "double_disagree";
} {
  const { leftPoleResponse, rightPoleResponse } = input;

  // Both high (4-5)
  if (leftPoleResponse >= 4 && rightPoleResponse >= 4) {
    return { needs: true, reason: "double_agree" };
  }

  // Both low (1-2)
  if (leftPoleResponse <= 2 && rightPoleResponse <= 2) {
    return { needs: true, reason: "double_disagree" };
  }

  return { needs: false };
}

/**
 * Validate a single trait assessment.
 */
export function validateTraitAssessment(
  traitId: TraitKey,
  input: TraitAssessmentInput
): TraitValidation {
  const score = calculateTraitScore(input);
  const confidence = calculateConfidence(input);
  const clarification = needsClarification(input);

  return {
    traitId,
    isValid: true, // Always valid, just may need clarification
    needsClarification: clarification.needs,
    score,
    confidence,
    flag: clarification.reason,
  };
}

/**
 * Validate all trait assessments and identify which need clarification.
 */
export function validateAllAssessments(
  assessments: TraitAssessmentState
): TraitValidation[] {
  const validations: TraitValidation[] = [];

  for (const [traitId, input] of Object.entries(assessments)) {
    if (input) {
      validations.push(validateTraitAssessment(traitId as TraitKey, input));
    }
  }

  return validations;
}

/**
 * Get traits that need clarification (for showing fallback sliders).
 */
export function getTraitsNeedingClarification(
  assessments: TraitAssessmentState
): TraitKey[] {
  const validations = validateAllAssessments(assessments);
  return validations
    .filter(v => v.needsClarification)
    .map(v => v.traitId);
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert all assessments to UserTraits format (0-100 for each trait).
 * Uses statement-based scores where available, fallback overrides if provided.
 */
export function convertToUserTraits(
  assessments: TraitAssessmentState,
  fallbackOverrides?: Partial<Record<TraitKey, number>>
): UserTraits {
  const traits = { ...DEFAULT_TRAITS };

  // Apply statement-based scores
  for (const [traitId, input] of Object.entries(assessments)) {
    if (input) {
      const key = traitId as TraitKey;
      const clarification = needsClarification(input);

      // If this trait has a fallback override (from clarification slider), use it
      if (fallbackOverrides && fallbackOverrides[key] !== undefined) {
        traits[key] = fallbackOverrides[key]!;
      } else if (!clarification.needs) {
        // Use calculated score only if no clarification needed
        traits[key] = calculateTraitScore(input);
      }
      // If needs clarification and no override, keep default (50)
    }
  }

  return traits;
}

/**
 * Check if all required traits have been assessed.
 */
export function isAssessmentComplete(
  assessments: TraitAssessmentState,
  requiredTraits: TraitKey[]
): boolean {
  return requiredTraits.every(traitId => {
    const input = assessments[traitId];
    return input && input.leftPoleResponse && input.rightPoleResponse;
  });
}

/**
 * Get assessment progress as percentage.
 */
export function getAssessmentProgress(
  assessments: TraitAssessmentState,
  totalTraits: number
): number {
  const completedCount = Object.values(assessments).filter(
    input => input && input.leftPoleResponse && input.rightPoleResponse
  ).length;

  return Math.round((completedCount / totalTraits) * 100);
}

// ============================================================================
// SUMMARY FUNCTIONS
// ============================================================================

/**
 * Get a summary of the assessment for display.
 */
export function getAssessmentSummary(assessments: TraitAssessmentState): {
  completed: number;
  needsClarification: number;
  averageConfidence: number;
} {
  const validations = validateAllAssessments(assessments);

  const completed = validations.length;
  const needsClarification = validations.filter(v => v.needsClarification).length;
  const avgConfidence = validations.length > 0
    ? validations.reduce((sum, v) => sum + v.confidence, 0) / validations.length
    : 0;

  return {
    completed,
    needsClarification,
    averageConfidence: Math.round(avgConfidence),
  };
}
