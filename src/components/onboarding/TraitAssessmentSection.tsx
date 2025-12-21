// TraitAssessmentSection - Multi-screen trait assessment with category navigation
// Groups traits by category and handles fallback sliders for ambiguous responses

import React, { useState, useMemo } from "react";
import { TraitKey, UserTraits, TraitDimension } from "../../types";
import { TRAIT_DEFINITIONS } from "../../data/traits";
import {
  TRAIT_STATEMENTS,
  TRAIT_STATEMENT_GROUPS,
  getStatementByTraitId,
} from "../../data/traitStatements";
import {
  TraitAssessmentState,
  TraitAssessmentInput,
  getTraitsNeedingClarification,
  convertToUserTraits,
  getAssessmentProgress,
  isAssessmentComplete,
} from "../../engines/traitScoring";
import { TraitStatementPair } from "./TraitStatementPair";
import TraitSlider from "./TraitSlider";

type TraitAssessmentSectionProps = {
  initialTraits?: UserTraits;
  onComplete: (traits: UserTraits) => void;
};

export function TraitAssessmentSection({
  initialTraits,
  onComplete,
}: TraitAssessmentSectionProps) {
  // Current category index (0-3 for the 4 screens)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  // Statement-based assessment state
  const [assessments, setAssessments] = useState<TraitAssessmentState>({});

  // Fallback slider overrides for ambiguous responses
  const [fallbackOverrides, setFallbackOverrides] = useState<Partial<Record<TraitKey, number>>>({});

  // Whether we're in clarification phase
  const [showClarification, setShowClarification] = useState(false);

  const currentGroup = TRAIT_STATEMENT_GROUPS[currentGroupIndex];
  const isLastGroup = currentGroupIndex === TRAIT_STATEMENT_GROUPS.length - 1;

  // Get statements for current group
  const currentStatements = useMemo(() => {
    return currentGroup.traitIds
      .map(traitId => getStatementByTraitId(traitId))
      .filter(Boolean);
  }, [currentGroup]);

  // Check if current group is complete
  const isCurrentGroupComplete = useMemo(() => {
    return currentGroup.traitIds.every(traitId => {
      const input = assessments[traitId];
      return input && input.leftPoleResponse > 0 && input.rightPoleResponse > 0;
    });
  }, [currentGroup, assessments]);

  // All trait IDs for progress calculation
  const allTraitIds = useMemo(() => {
    return TRAIT_STATEMENT_GROUPS.flatMap(g => g.traitIds);
  }, []);

  // Progress percentage
  const progress = getAssessmentProgress(assessments, allTraitIds.length);

  // Traits needing clarification
  const traitsNeedingClarification = useMemo(() => {
    return getTraitsNeedingClarification(assessments);
  }, [assessments]);

  const handleAssessmentChange = (traitId: TraitKey, input: TraitAssessmentInput) => {
    setAssessments(prev => ({
      ...prev,
      [traitId]: input,
    }));
  };

  const handleFallbackChange = (traitId: TraitKey, value: number) => {
    setFallbackOverrides(prev => ({
      ...prev,
      [traitId]: value,
    }));
  };

  const handleNext = () => {
    if (isLastGroup) {
      // Check if any traits need clarification
      if (traitsNeedingClarification.length > 0 && !showClarification) {
        setShowClarification(true);
      } else {
        // All done, convert and submit
        const finalTraits = convertToUserTraits(assessments, fallbackOverrides);
        onComplete(finalTraits);
      }
    } else {
      setCurrentGroupIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (showClarification) {
      setShowClarification(false);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
    }
  };

  // Clarification phase - show sliders for ambiguous traits
  if (showClarification && traitsNeedingClarification.length > 0) {
    return (
      <div className="trait-assessment-section">
        <div className="trait-assessment-section__header">
          <h3>A Few Clarifications</h3>
          <p className="trait-assessment-section__subtitle">
            You rated both statements similarly for these traits.
            Use the sliders to indicate where you fall on each spectrum.
          </p>
        </div>

        <div className="trait-assessment-section__clarifications">
          {traitsNeedingClarification.map(traitId => {
            const trait = TRAIT_DEFINITIONS.find((t: TraitDimension) => t.id === traitId);
            if (!trait) return null;

            return (
              <TraitSlider
                key={traitId}
                trait={trait}
                value={fallbackOverrides[traitId] ?? 50}
                onChange={(id, value) => handleFallbackChange(id, value)}
              />
            );
          })}
        </div>

        <div className="trait-assessment-section__nav">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleBack}
          >
            Back
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleNext}
          >
            Complete Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trait-assessment-section">
      {/* Progress indicator */}
      <div className="trait-assessment-section__progress">
        <div className="trait-assessment-section__progress-bar">
          <div
            className="trait-assessment-section__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="trait-assessment-section__progress-text">
          {progress}% complete
        </span>
      </div>

      {/* Temporal framing reminder */}
      <div className="trait-assessment-section__framing">
        Respond based on who you are <strong>RIGHT NOW</strong>, not who you want to become.
      </div>

      {/* Category header */}
      <div className="trait-assessment-section__header">
        <h3>{currentGroup.title}</h3>
        <p className="trait-assessment-section__subtitle">
          {currentGroup.description}
        </p>
      </div>

      {/* Category navigation dots */}
      <div className="trait-assessment-section__dots">
        {TRAIT_STATEMENT_GROUPS.map((group, index) => (
          <button
            key={group.id}
            type="button"
            className={`trait-assessment-section__dot ${
              index === currentGroupIndex ? "trait-assessment-section__dot--active" : ""
            } ${index < currentGroupIndex ? "trait-assessment-section__dot--completed" : ""}`}
            onClick={() => index <= currentGroupIndex && setCurrentGroupIndex(index)}
            disabled={index > currentGroupIndex}
            aria-label={`Go to ${group.title}`}
          />
        ))}
      </div>

      {/* Statement pairs for current category */}
      <div className="trait-assessment-section__statements">
        {currentStatements.map(statement => (
          <TraitStatementPair
            key={statement!.traitId}
            statement={statement!}
            value={assessments[statement!.traitId]}
            onChange={handleAssessmentChange}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="trait-assessment-section__nav">
        {currentGroupIndex > 0 && (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleBack}
          >
            Back
          </button>
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleNext}
          disabled={!isCurrentGroupComplete}
        >
          {isLastGroup ? "Review" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default TraitAssessmentSection;
