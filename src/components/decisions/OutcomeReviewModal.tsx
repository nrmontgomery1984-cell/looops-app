// OutcomeReviewModal - Modal for logging decision outcomes retrospectively

import React, { useState } from "react";
import { Decision, DecisionOutcome, HiddenImportance } from "../../types";

interface OutcomeReviewModalProps {
  decision: Decision;
  onSave: (updatedDecision: Decision) => void;
  onClose: () => void;
}

export function OutcomeReviewModal({
  decision,
  onSave,
  onClose,
}: OutcomeReviewModalProps) {
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(
    decision.outcome?.wasCorrect ?? null
  );
  const [hiddenImportance, setHiddenImportance] = useState<HiddenImportance | null>(
    decision.outcome?.hiddenImportance ?? null
  );
  const [learnings, setLearnings] = useState(decision.outcome?.learnings || "");

  const handleSave = () => {
    const outcome: DecisionOutcome = {
      assessedAt: new Date().toISOString(),
      wasCorrect,
      hiddenImportance,
      learnings,
    };

    const updatedDecision: Decision = {
      ...decision,
      status: "reviewed",
      outcome,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedDecision);
  };

  const canSave = wasCorrect !== undefined; // At least answer the main question

  return (
    <div className="outcome-modal-overlay" onClick={onClose}>
      <div className="outcome-modal" onClick={(e) => e.stopPropagation()}>
        <div className="outcome-modal-header">
          <h2>Log Outcome</h2>
          <button className="outcome-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="outcome-modal-content">
          <div className="outcome-modal-decision">
            <span className="decision-label">Decision:</span>
            <p className="decision-title">{decision.title}</p>
          </div>

          {/* Was it correct? */}
          <div className="outcome-field">
            <label>Looking back, was this the right decision?</label>
            <div className="outcome-buttons">
              <button
                className={`outcome-btn ${
                  wasCorrect === true ? "outcome-btn--selected outcome-btn--yes" : ""
                }`}
                onClick={() => setWasCorrect(true)}
              >
                <span className="outcome-btn-icon">✓</span>
                <span className="outcome-btn-label">Yes</span>
                <span className="outcome-btn-desc">It worked out well</span>
              </button>

              <button
                className={`outcome-btn ${
                  wasCorrect === false ? "outcome-btn--selected outcome-btn--no" : ""
                }`}
                onClick={() => setWasCorrect(false)}
              >
                <span className="outcome-btn-icon">✗</span>
                <span className="outcome-btn-label">No</span>
                <span className="outcome-btn-desc">I'd decide differently</span>
              </button>

              <button
                className={`outcome-btn ${
                  wasCorrect === null ? "outcome-btn--selected outcome-btn--unknown" : ""
                }`}
                onClick={() => setWasCorrect(null)}
              >
                <span className="outcome-btn-icon">?</span>
                <span className="outcome-btn-label">Too Early</span>
                <span className="outcome-btn-desc">Not enough info yet</span>
              </button>
            </div>
          </div>

          {/* Hidden Importance */}
          <div className="outcome-field">
            <label>
              Did this decision turn out to be more important than you expected?
            </label>
            <p className="outcome-helper">
              Sometimes small-seeming decisions have big consequences.
            </p>
            <div className="outcome-importance-buttons">
              <button
                className={`importance-btn ${
                  hiddenImportance === "low" ? "importance-btn--selected" : ""
                }`}
                onClick={() => setHiddenImportance("low")}
              >
                Low
              </button>
              <button
                className={`importance-btn ${
                  hiddenImportance === "medium" ? "importance-btn--selected" : ""
                }`}
                onClick={() => setHiddenImportance("medium")}
              >
                Medium
              </button>
              <button
                className={`importance-btn ${
                  hiddenImportance === "high" ? "importance-btn--selected" : ""
                }`}
                onClick={() => setHiddenImportance("high")}
              >
                High
              </button>
            </div>
          </div>

          {/* Learnings */}
          <div className="outcome-field">
            <label>What did you learn?</label>
            <p className="outcome-helper">
              This is for future you. What would help you make similar decisions
              better?
            </p>
            <textarea
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              placeholder="The key insight from this decision is..."
              rows={4}
              className="outcome-textarea"
            />
          </div>
        </div>

        <div className="outcome-modal-footer">
          <button className="survey-btn survey-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="survey-btn survey-btn--primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            Save Outcome
          </button>
        </div>
      </div>
    </div>
  );
}
