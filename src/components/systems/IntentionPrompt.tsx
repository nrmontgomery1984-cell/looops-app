// Implementation Intention Prompt
// Contextual prompts when creating tasks to make them concrete and actionable

import React, { useState } from "react";
import { ImplementationIntention } from "../../types";

type IntentionMode = "off" | "light" | "deep";

interface IntentionPromptProps {
  taskTitle: string;
  onSave: (intention: Omit<ImplementationIntention, "id" | "createdAt" | "updatedAt" | "timesUsed" | "timesSucceeded">) => void;
  onSkip: () => void;
  mode?: IntentionMode;
}

export function IntentionPrompt({ taskTitle, onSave, onSkip, mode = "light" }: IntentionPromptProps) {
  const [whenType, setWhenType] = useState<"specific_time" | "time_of_day" | "after_action" | "before_action">("time_of_day");
  const [whenValue, setWhenValue] = useState("");
  const [where, setWhere] = useState("");
  const [obstacles, setObstacles] = useState<Array<{ obstacle: string; alternative: string }>>([]);
  const [showObstacles, setShowObstacles] = useState(false);

  const handleSave = () => {
    onSave({
      behavior: taskTitle,
      when: { type: whenType, value: whenValue },
      where,
      obstacles: obstacles.filter(o => o.obstacle.trim() && o.alternative.trim()),
    });
  };

  const addObstacle = () => {
    setObstacles([...obstacles, { obstacle: "", alternative: "" }]);
    setShowObstacles(true);
  };

  const getWhenPlaceholder = () => {
    switch (whenType) {
      case "specific_time": return "e.g., 7:00 AM";
      case "time_of_day": return "e.g., morning, after lunch";
      case "after_action": return "e.g., after my morning coffee";
      case "before_action": return "e.g., before checking email";
    }
  };

  const quickTimeOptions = [
    { label: "Morning", value: "in the morning" },
    { label: "Afternoon", value: "in the afternoon" },
    { label: "Evening", value: "in the evening" },
    { label: "After work", value: "after work" },
  ];

  return (
    <div className="intention-prompt">
      <div className="intention-header">
        <span className="intention-icon">🎯</span>
        <span className="intention-title">When will you do this?</span>
        <button className="intention-skip" onClick={onSkip}>Skip</button>
      </div>

      <div className="intention-preview">
        <span className="intention-preview-text">
          I will <strong>{taskTitle}</strong>...
        </span>
      </div>

      <div className="intention-form">
        {/* When */}
        <div className="intention-field">
          <label>When</label>
          <div className="intention-when-type">
            <select
              value={whenType}
              onChange={(e) => setWhenType(e.target.value as typeof whenType)}
            >
              <option value="time_of_day">Time of day</option>
              <option value="specific_time">Specific time</option>
              <option value="after_action">After action</option>
              <option value="before_action">Before action</option>
            </select>
          </div>

          {whenType === "time_of_day" && (
            <div className="quick-options">
              {quickTimeOptions.map(opt => (
                <button
                  key={opt.value}
                  className={`quick-option ${whenValue === opt.value ? "selected" : ""}`}
                  onClick={() => setWhenValue(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <input
            type="text"
            value={whenValue}
            onChange={(e) => setWhenValue(e.target.value)}
            placeholder={getWhenPlaceholder()}
          />
        </div>

        {/* Where */}
        <div className="intention-field">
          <label>Where</label>
          <input
            type="text"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="e.g., at home, at the office, at the gym"
          />
        </div>

        {/* Deep mode: Obstacles */}
        {mode === "deep" && (
          <>
            {!showObstacles && obstacles.length === 0 ? (
              <button className="add-obstacle-link" onClick={addObstacle}>
                + Plan for obstacles (optional)
              </button>
            ) : (
              <div className="intention-obstacles">
                <label>If something gets in the way...</label>
                {obstacles.map((obs, index) => (
                  <div key={index} className="obstacle-row">
                    <div className="obstacle-if">
                      <span>If</span>
                      <input
                        type="text"
                        value={obs.obstacle}
                        onChange={(e) => {
                          const updated = [...obstacles];
                          updated[index].obstacle = e.target.value;
                          setObstacles(updated);
                        }}
                        placeholder="I'm too tired..."
                      />
                    </div>
                    <div className="obstacle-then">
                      <span>Then</span>
                      <input
                        type="text"
                        value={obs.alternative}
                        onChange={(e) => {
                          const updated = [...obstacles];
                          updated[index].alternative = e.target.value;
                          setObstacles(updated);
                        }}
                        placeholder="I'll do a 2-minute version"
                      />
                    </div>
                    <button
                      className="remove-obstacle-btn"
                      onClick={() => setObstacles(obstacles.filter((_, i) => i !== index))}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button className="add-another-obstacle" onClick={addObstacle}>
                  + Add another
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="intention-footer">
        <div className="intention-result">
          {whenValue && where && (
            <p className="intention-statement">
              I will <strong>{taskTitle}</strong> {whenValue} {where}
              {obstacles.length > 0 && obstacles[0].obstacle && obstacles[0].alternative && (
                <span className="intention-obstacle-preview">
                  . If {obstacles[0].obstacle}, then {obstacles[0].alternative}
                </span>
              )}
            </p>
          )}
        </div>
        <button
          className="intention-save-btn"
          onClick={handleSave}
          disabled={!whenValue.trim()}
        >
          Save Intention
        </button>
      </div>
    </div>
  );
}

// Compact inline version for task creation
interface IntentionInlineProps {
  onSet: (when: string, where: string) => void;
  onSkip: () => void;
}

export function IntentionInline({ onSet, onSkip }: IntentionInlineProps) {
  const [when, setWhen] = useState("");
  const [where, setWhere] = useState("");
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button className="intention-inline-trigger" onClick={() => setExpanded(true)}>
        🎯 Add when/where intention
      </button>
    );
  }

  return (
    <div className="intention-inline">
      <div className="intention-inline-fields">
        <input
          type="text"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          placeholder="When? (e.g., tomorrow morning)"
          autoFocus
        />
        <input
          type="text"
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="Where? (e.g., at home)"
        />
      </div>
      <div className="intention-inline-actions">
        <button
          className="intention-inline-save"
          onClick={() => onSet(when, where)}
          disabled={!when.trim()}
        >
          Set
        </button>
        <button className="intention-inline-skip" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}

export default IntentionPrompt;
