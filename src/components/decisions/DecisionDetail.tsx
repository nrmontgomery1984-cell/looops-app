// DecisionDetail - Full view of a decision with all survey responses

import React, { useState } from "react";
import { useApp } from "../../context";
import { OutcomeReviewModal } from "./OutcomeReviewModal";
import {
  Decision,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  getFeelingLabel,
} from "../../types";

interface DecisionDetailProps {
  decision: Decision;
  onBack: () => void;
  onUpdated: (decision: Decision) => void;
}

export function DecisionDetail({
  decision,
  onBack,
  onUpdated,
}: DecisionDetailProps) {
  const { dispatch } = useApp();
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  const loopDef = LOOP_DEFINITIONS[decision.loop];
  const loopColors = LOOP_COLORS[decision.loop];

  // Check if needs review
  const needsReview =
    decision.status === "decided" &&
    !decision.outcome &&
    new Date().getTime() - new Date(decision.createdAt).getTime() >
      30 * 24 * 60 * 60 * 1000;

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Feeling emojis
  const feelingEmojis: Record<number, string> = {
    1: "😰",
    2: "😟",
    3: "😐",
    4: "🤑",
    5: "🤩",
  };

  const handleOutcomeSaved = (updatedDecision: Decision) => {
    dispatch({ type: "UPDATE_DECISION", payload: updatedDecision });
    onUpdated(updatedDecision);
    setShowOutcomeModal(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this decision?")) {
      dispatch({ type: "DELETE_DECISION", payload: decision.id });
      onBack();
    }
  };

  return (
    <div className="decision-detail">
      {/* Header */}
      <div className="decision-detail-header">
        <button className="decision-detail-back" onClick={onBack}>
          ← Back to Register
        </button>
        <div className="decision-detail-actions">
          {(decision.status === "decided" || needsReview) && !decision.outcome && (
            <button
              className="survey-btn survey-btn--primary"
              onClick={() => setShowOutcomeModal(true)}
            >
              Log Outcome
            </button>
          )}
          <button
            className="survey-btn survey-btn--ghost survey-btn--danger"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Needs Review Banner */}
      {needsReview && (
        <div className="decision-detail-review-banner">
          <span className="review-icon">⏰</span>
          <span className="review-text">
            This decision was made over 30 days ago. Time for a retrospective!
          </span>
          <button
            className="survey-btn survey-btn--secondary"
            onClick={() => setShowOutcomeModal(true)}
          >
            Log Outcome
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="decision-detail-content">
        {/* Title Section */}
        <div className="decision-detail-title-section">
          <div className="detail-badges">
            <span
              className="detail-loop-badge"
              style={{
                backgroundColor: loopColors.bg,
                borderColor: loopColors.border,
              }}
            >
              {loopDef.icon} {decision.loop}
            </span>
            <span className={`detail-status-badge detail-status-badge--${decision.status}`}>
              {decision.status}
            </span>
            <span className={`detail-choice-badge detail-choice-badge--${decision.finalChoice}`}>
              {decision.finalChoice === "proceed" && "✓ Proceeded"}
              {decision.finalChoice === "decline" && "✗ Declined"}
              {decision.finalChoice === "defer" && "⏸ Deferred"}
            </span>
          </div>

          <h1 className="decision-detail-title">{decision.title}</h1>

          <div className="decision-detail-meta">
            <span>Created: {formatDate(decision.createdAt)}</span>
            {decision.updatedAt !== decision.createdAt && (
              <span>Updated: {formatDate(decision.updatedAt)}</span>
            )}
          </div>
        </div>

        {/* Survey Responses */}
        <div className="decision-detail-sections">
          {/* Emotional State */}
          <div className="detail-section">
            <h3>Emotional State at Decision</h3>
            <div className="detail-feeling">
              <span className="feeling-emoji">
                {feelingEmojis[decision.survey.feelingScore]}
              </span>
              <span className="feeling-text">
                {getFeelingLabel(decision.survey.feelingScore)}
              </span>
            </div>
          </div>

          {/* The Joust */}
          <div className="detail-section">
            <h3>The Joust</h3>
            <div className="detail-joust">
              <div
                className={`joust-reason ${
                  decision.survey.joustWinner === "for" ? "joust-reason--winner" : ""
                }`}
              >
                <span className="joust-label">FOR</span>
                <p>{decision.survey.oneReason}</p>
                {decision.survey.joustWinner === "for" && (
                  <span className="joust-winner-badge">Winner</span>
                )}
              </div>
              <span className="joust-vs">VS</span>
              <div
                className={`joust-reason ${
                  decision.survey.joustWinner === "against" ? "joust-reason--winner" : ""
                }`}
              >
                <span className="joust-label">AGAINST</span>
                <p>{decision.survey.reasonAgainst}</p>
                {decision.survey.joustWinner === "against" && (
                  <span className="joust-winner-badge">Winner</span>
                )}
              </div>
            </div>
          </div>

          {/* Quality Check */}
          <div className="detail-section">
            <h3>Reason Quality</h3>
            <div className="detail-quality-checks">
              <span className={decision.survey.isHonest ? "check-pass" : "check-fail"}>
                {decision.survey.isHonest ? "✓" : "✗"} Honest
              </span>
              <span className={decision.survey.isConcise ? "check-pass" : "check-fail"}>
                {decision.survey.isConcise ? "✓" : "✗"} Concise
              </span>
              <span className={decision.survey.isTiedToValues ? "check-pass" : "check-fail"}>
                {decision.survey.isTiedToValues ? "✓" : "✗"} Values-tied
              </span>
            </div>
          </div>

          {/* Substitutes */}
          {decision.survey.validSubstitutes && (
            <div className="detail-section">
              <h3>Alternatives Considered</h3>
              <p>{decision.survey.validSubstitutes}</p>
            </div>
          )}

          {/* Would do without secondary benefits */}
          <div className="detail-section">
            <h3>Core Motivation Test</h3>
            <p>
              Would do it without secondary benefits:{" "}
              <strong>
                {decision.survey.withoutSecondaryBenefits ? "Yes" : "No"}
              </strong>
            </p>
          </div>

          {/* Trigger */}
          <div className="detail-section">
            <h3>Trigger</h3>
            <p>{decision.survey.trigger}</p>
          </div>

          {/* Alternatives */}
          {decision.survey.alternativesConsidered.length > 0 && (
            <div className="detail-section">
              <h3>Alternatives Explored</h3>
              <ul className="detail-alternatives">
                {decision.survey.alternativesConsidered.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Stakes */}
          <div className="detail-section">
            <h3>Stakes Assessment</h3>
            <div className="detail-reversibility">
              <span
                className={`reversibility-badge ${
                  decision.survey.isReversible
                    ? "reversibility-badge--yes"
                    : "reversibility-badge--no"
                }`}
              >
                {decision.survey.isReversible ? "Reversible" : "Irreversible"}
              </span>
            </div>
            <div className="detail-asymmetry">
              <div className="asymmetry-item asymmetry-upside">
                <span className="asymmetry-label">Upside</span>
                <p>{decision.survey.upsideIfRight}</p>
              </div>
              <div className="asymmetry-item asymmetry-downside">
                <span className="asymmetry-label">Downside</span>
                <p>{decision.survey.downsideIfWrong}</p>
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="detail-section">
            <h3>Confidence Level</h3>
            <div className="detail-confidence">
              <div className="confidence-bar-large">
                <div
                  className="confidence-fill-large"
                  style={{
                    width: `${decision.confidenceLevel * 10}%`,
                    backgroundColor:
                      decision.confidenceLevel >= 7
                        ? "#73A58C"
                        : decision.confidenceLevel >= 4
                        ? "#F4B942"
                        : "#F27059",
                  }}
                />
              </div>
              <span className="confidence-value-large">
                {decision.confidenceLevel}/10
              </span>
            </div>
          </div>

          {/* Outcome (if reviewed) */}
          {decision.outcome && (
            <div className="detail-section detail-section--outcome">
              <h3>Outcome Review</h3>
              <div className="outcome-details">
                <div className="outcome-result">
                  <span className="outcome-label">Was it correct?</span>
                  <span
                    className={`outcome-value ${
                      decision.outcome.wasCorrect === true
                        ? "outcome-value--correct"
                        : decision.outcome.wasCorrect === false
                        ? "outcome-value--incorrect"
                        : "outcome-value--unknown"
                    }`}
                  >
                    {decision.outcome.wasCorrect === true && "✓ Yes"}
                    {decision.outcome.wasCorrect === false && "✗ No"}
                    {decision.outcome.wasCorrect === null && "? Too early to tell"}
                  </span>
                </div>

                {decision.outcome.hiddenImportance && (
                  <div className="outcome-importance">
                    <span className="outcome-label">Hidden Importance</span>
                    <span className="outcome-value">
                      {decision.outcome.hiddenImportance}
                    </span>
                  </div>
                )}

                {decision.outcome.learnings && (
                  <div className="outcome-learnings">
                    <span className="outcome-label">Learnings</span>
                    <p>{decision.outcome.learnings}</p>
                  </div>
                )}

                <div className="outcome-date">
                  Reviewed: {formatDate(decision.outcome.assessedAt)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Outcome Review Modal */}
      {showOutcomeModal && (
        <OutcomeReviewModal
          decision={decision}
          onSave={handleOutcomeSaved}
          onClose={() => setShowOutcomeModal(false)}
        />
      )}
    </div>
  );
}
