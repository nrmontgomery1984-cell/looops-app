// State indicator component for BUILD/MAINTAIN/RECOVER/HIBERNATE

import React from "react";
import { LoopStateType, STATE_COLORS } from "../../types";
import { getStateDisplayName } from "../../engines/stateEngine";

type StateIndicatorProps = {
  state: LoopStateType;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  onClick?: () => void;
};

export function StateIndicator({
  state,
  size = "medium",
  showLabel = false,
  onClick,
}: StateIndicatorProps) {
  const color = STATE_COLORS[state];
  const label = getStateDisplayName(state);

  const sizeClasses = {
    small: "state-indicator--small",
    medium: "state-indicator--medium",
    large: "state-indicator--large",
  };

  return (
    <div
      className={`state-indicator ${sizeClasses[size]} ${onClick ? "state-indicator--clickable" : ""}`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      title={label}
    >
      {showLabel && <span className="state-indicator__label">{label}</span>}
    </div>
  );
}

type StateSelectorProps = {
  currentState: LoopStateType;
  onStateChange: (state: LoopStateType) => void;
  disabled?: boolean;
};

export function StateSelector({
  currentState,
  onStateChange,
  disabled = false,
}: StateSelectorProps) {
  const states: LoopStateType[] = ["BUILD", "MAINTAIN", "RECOVER", "HIBERNATE"];

  return (
    <div className="state-selector">
      {states.map((state) => (
        <button
          key={state}
          className={`state-selector__btn ${currentState === state ? "state-selector__btn--active" : ""}`}
          style={{
            backgroundColor: currentState === state ? STATE_COLORS[state] : "transparent",
            borderColor: STATE_COLORS[state],
            color: currentState === state ? "white" : STATE_COLORS[state],
          }}
          onClick={() => onStateChange(state)}
          disabled={disabled}
        >
          {getStateDisplayName(state)}
        </button>
      ))}
    </div>
  );
}

export default StateIndicator;
