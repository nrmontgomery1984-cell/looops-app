// DecisionCard - Card component for displaying a decision in the register

import React from "react";
import {
  Decision,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  getFeelingLabel,
} from "../../types";

interface DecisionCardProps {
  decision: Decision;
  onClick: () => void;
}

export function DecisionCard({ decision, onClick }: DecisionCardProps) {
  const loopDef = LOOP_DEFINITIONS[decision.loop];
  const loopColors = LOOP_COLORS[decision.loop];

  // Check if needs review (decided > 30 days ago, no outcome)
  const needsReview =
    decision.status === "decided" &&
    !decision.outcome &&
    new Date().getTime() - new Date(decision.createdAt).getTime() >
      30 * 24 * 60 * 60 * 1000;

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  // Status colors
  const statusColors = {
    pending: { bg: "rgba(244, 185, 66, 0.15)", border: "#F4B942", text: "#F4B942" },
    decided: { bg: "rgba(115, 165, 140, 0.15)", border: "#73A58C", text: "#73A58C" },
    reviewed: { bg: "rgba(90, 127, 184, 0.15)", border: "#5a7fb8", text: "#5a7fb8" },
  };

  // Choice colors
  const choiceColors = {
    proceed: { icon: "✓", color: "#73A58C" },
    decline: { icon: "✗", color: "#F27059" },
    defer: { icon: "⏸", color: "#F4B942" },
  };

  return (
    <div
      className="decision-card"
      onClick={onClick}
      style={{
        borderColor: needsReview ? "#F4B942" : loopColors.border,
      }}
    >
      {needsReview && (
        <div className="decision-card-review-badge">
          <span>Needs Review</span>
        </div>
      )}

      <div className="decision-card-header">
        <span
          className="decision-card-loop"
          style={{
            backgroundColor: loopColors.bg,
            borderColor: loopColors.border,
          }}
        >
          {loopDef.icon} {decision.loop}
        </span>
        <span
          className="decision-card-status"
          style={{
            backgroundColor: statusColors[decision.status].bg,
            borderColor: statusColors[decision.status].border,
            color: statusColors[decision.status].text,
          }}
        >
          {decision.status}
        </span>
      </div>

      <h3 className="decision-card-title">
        {decision.title.length > 80
          ? `${decision.title.slice(0, 80)}...`
          : decision.title}
      </h3>

      <div className="decision-card-meta">
        <span className="decision-card-date">{formatDate(decision.createdAt)}</span>
        <span
          className="decision-card-choice"
          style={{ color: choiceColors[decision.finalChoice].color }}
        >
          {choiceColors[decision.finalChoice].icon}{" "}
          {decision.finalChoice.charAt(0).toUpperCase() +
            decision.finalChoice.slice(1)}
        </span>
      </div>

      <div className="decision-card-footer">
        <div className="decision-card-confidence">
          <span className="confidence-label">Confidence</span>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
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
          <span className="confidence-value">{decision.confidenceLevel}/10</span>
        </div>

        {decision.outcome && (
          <div className="decision-card-outcome">
            {decision.outcome.wasCorrect === true && (
              <span className="outcome-correct">✓ Correct</span>
            )}
            {decision.outcome.wasCorrect === false && (
              <span className="outcome-incorrect">✗ Incorrect</span>
            )}
            {decision.outcome.wasCorrect === null && (
              <span className="outcome-unknown">? Too early</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
