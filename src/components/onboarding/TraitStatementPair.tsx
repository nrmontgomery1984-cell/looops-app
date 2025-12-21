// TraitStatementPair - Displays two statements (one per pole) with 1-5 rating buttons
// Uses dual-framing to get more accurate trait assessment

import React from "react";
import { TraitKey } from "../../types";
import { StatementResponse, TraitAssessmentInput } from "../../engines/traitScoring";
import { TraitStatement } from "../../data/traitStatements";

type TraitStatementPairProps = {
  statement: TraitStatement;
  value?: TraitAssessmentInput;
  onChange: (traitId: TraitKey, input: TraitAssessmentInput) => void;
};

const RATING_LABELS = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
] as const;

export function TraitStatementPair({
  statement,
  value,
  onChange,
}: TraitStatementPairProps) {
  const handleLeftChange = (rating: StatementResponse) => {
    onChange(statement.traitId, {
      leftPoleResponse: rating,
      rightPoleResponse: value?.rightPoleResponse ?? (0 as StatementResponse),
    });
  };

  const handleRightChange = (rating: StatementResponse) => {
    onChange(statement.traitId, {
      leftPoleResponse: value?.leftPoleResponse ?? (0 as StatementResponse),
      rightPoleResponse: rating,
    });
  };

  return (
    <div className="trait-statement-pair">
      {/* Left pole statement */}
      <div className="trait-statement">
        <p className="trait-statement__text">{statement.leftStatement}</p>
        <div className="trait-statement__ratings">
          {RATING_LABELS.map(({ value: ratingValue, label }) => (
            <button
              key={ratingValue}
              type="button"
              className={`trait-rating-btn ${
                value?.leftPoleResponse === ratingValue ? "trait-rating-btn--selected" : ""
              }`}
              onClick={() => handleLeftChange(ratingValue as StatementResponse)}
              aria-label={label}
              title={label}
            >
              {ratingValue}
            </button>
          ))}
        </div>
        <div className="trait-statement__scale-labels">
          <span>Strongly Disagree</span>
          <span>Strongly Agree</span>
        </div>
      </div>

      {/* Divider */}
      <div className="trait-statement-pair__divider" />

      {/* Right pole statement */}
      <div className="trait-statement">
        <p className="trait-statement__text">{statement.rightStatement}</p>
        <div className="trait-statement__ratings">
          {RATING_LABELS.map(({ value: ratingValue, label }) => (
            <button
              key={ratingValue}
              type="button"
              className={`trait-rating-btn ${
                value?.rightPoleResponse === ratingValue ? "trait-rating-btn--selected" : ""
              }`}
              onClick={() => handleRightChange(ratingValue as StatementResponse)}
              aria-label={label}
              title={label}
            >
              {ratingValue}
            </button>
          ))}
        </div>
        <div className="trait-statement__scale-labels">
          <span>Strongly Disagree</span>
          <span>Strongly Agree</span>
        </div>
      </div>
    </div>
  );
}

export default TraitStatementPair;
