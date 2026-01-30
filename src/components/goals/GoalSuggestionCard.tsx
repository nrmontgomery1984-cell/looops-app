// Goal Suggestion Card - Displays a goal suggestion with archetype alignment

import React from "react";
import { GoalSuggestion } from "../../engines/goalEngine";
import { LOOP_COLORS, LOOP_DEFINITIONS } from "../../types";

type GoalSuggestionCardProps = {
  suggestion: GoalSuggestion;
  isSelected: boolean;
  onSelect: () => void;
};

export function GoalSuggestionCard({
  suggestion,
  isSelected,
  onSelect,
}: GoalSuggestionCardProps) {
  const { template, relevanceScore, reasoning } = suggestion;
  const loopColor = LOOP_COLORS[template.loop];
  const loopDef = LOOP_DEFINITIONS[template.loop];

  return (
    <div
      className={`goal-suggestion-card ${isSelected ? "goal-suggestion-card--selected" : ""}`}
      onClick={onSelect}
      style={{
        borderColor: isSelected ? loopColor.border : undefined,
        backgroundColor: isSelected ? loopColor.bg : undefined,
      }}
    >
      <div className="goal-suggestion-card__header">
        <div
          className="goal-suggestion-card__loop-badge"
          style={{ backgroundColor: loopColor.border }}
        >
          {loopDef.icon} {template.loop}
        </div>
        <div className="goal-suggestion-card__score">
          <span className="goal-suggestion-card__score-value">{relevanceScore}</span>
          <span className="goal-suggestion-card__score-label">match</span>
        </div>
      </div>

      <h3 className="goal-suggestion-card__title">{template.title}</h3>
      <p className="goal-suggestion-card__description">{template.description}</p>

      <div className="goal-suggestion-card__reasoning">
        <span className="goal-suggestion-card__reasoning-icon">💡</span>
        {reasoning}
      </div>

      {template.suggestedMetrics && template.suggestedMetrics.length > 0 && (
        <div className="goal-suggestion-card__metrics">
          <span className="goal-suggestion-card__metrics-label">Track:</span>
          {template.suggestedMetrics.map((m, idx) => (
            <span key={idx} className="goal-suggestion-card__metric">
              {m.name}
            </span>
          ))}
        </div>
      )}

      {isSelected && (
        <div className="goal-suggestion-card__selected-indicator">
          ✓ Selected
        </div>
      )}
    </div>
  );
}

export default GoalSuggestionCard;
