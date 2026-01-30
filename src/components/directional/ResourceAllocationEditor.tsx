// Resource allocation editor with sliders that sum to 100%

import React, { useMemo } from "react";
import { LoopId, ALL_LOOPS, EnergyManagementStyle, FinancialApproach } from "../../types";
import { LOOP_COLORS } from "../../types/core";
import {
  ENERGY_MANAGEMENT_OPTIONS,
  FINANCIAL_APPROACH_OPTIONS,
} from "../../data/directionalOptions";

type ResourceAllocationEditorProps = {
  timeAllocation: Record<LoopId, number>;
  energyManagement: EnergyManagementStyle;
  financialApproach: FinancialApproach;
  onTimeChange: (allocation: Record<LoopId, number>) => void;
  onEnergyChange: (style: EnergyManagementStyle) => void;
  onFinancialChange: (approach: FinancialApproach) => void;
};

export function ResourceAllocationEditor({
  timeAllocation,
  energyManagement,
  financialApproach,
  onTimeChange,
  onEnergyChange,
  onFinancialChange,
}: ResourceAllocationEditorProps) {
  const total = useMemo(
    () => Object.values(timeAllocation).reduce((sum, val) => sum + val, 0),
    [timeAllocation]
  );

  const handleSliderChange = (loopId: LoopId, newValue: number) => {
    const oldValue = timeAllocation[loopId];
    const diff = newValue - oldValue;

    // Adjust other loops proportionally to maintain sum of 100
    const otherLoops = ALL_LOOPS.filter((id) => id !== loopId);
    const otherTotal = otherLoops.reduce(
      (sum, id) => sum + timeAllocation[id],
      0
    );

    if (otherTotal === 0) return;

    const newAllocation = { ...timeAllocation, [loopId]: newValue };

    // Distribute the difference among other loops proportionally
    otherLoops.forEach((id) => {
      const proportion = timeAllocation[id] / otherTotal;
      const adjustment = Math.round(diff * proportion);
      newAllocation[id] = Math.max(0, timeAllocation[id] - adjustment);
    });

    // Ensure total is exactly 100
    const newTotal = Object.values(newAllocation).reduce(
      (sum, val) => sum + val,
      0
    );
    if (newTotal !== 100) {
      // Adjust the largest non-current loop to compensate
      const largestOther = otherLoops.reduce(
        (max, id) => (newAllocation[id] > newAllocation[max] ? id : max),
        otherLoops[0]
      );
      newAllocation[largestOther] += 100 - newTotal;
    }

    onTimeChange(newAllocation);
  };

  return (
    <div className="resource-allocation">
      <div className="resource-allocation__section">
        <h4 className="resource-allocation__section-title">
          Time & Energy Allocation
        </h4>
        <p className="resource-allocation__section-desc">
          How would you ideally distribute your time across life areas?
        </p>

        <div className="resource-allocation__total">
          Total:{" "}
          <span
            className={`resource-allocation__total-value ${total !== 100 ? "resource-allocation__total-value--invalid" : ""}`}
          >
            {total}%
          </span>
        </div>

        <div className="resource-allocation__sliders">
          {ALL_LOOPS.map((loopId) => (
            <div key={loopId} className="resource-allocation__slider">
              <div className="resource-allocation__slider-header">
                <span
                  className="resource-allocation__loop-name"
                  style={{ color: LOOP_COLORS[loopId].border }}
                >
                  {loopId}
                </span>
                <span className="resource-allocation__value">
                  {timeAllocation[loopId]}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={timeAllocation[loopId]}
                onChange={(e) =>
                  handleSliderChange(loopId, parseInt(e.target.value, 10))
                }
                className="resource-allocation__input"
                style={{
                  accentColor: LOOP_COLORS[loopId].border,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="resource-allocation__section">
        <h4 className="resource-allocation__section-title">
          Energy Management Style
        </h4>
        <p className="resource-allocation__section-desc">
          How do you prefer to manage your energy throughout the day/week?
        </p>

        <div className="resource-allocation__options">
          {ENERGY_MANAGEMENT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`resource-option ${energyManagement === option.id ? "resource-option--selected" : ""}`}
              onClick={() => onEnergyChange(option.id)}
            >
              <span className="resource-option__label">{option.label}</span>
              <span className="resource-option__description">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="resource-allocation__section">
        <h4 className="resource-allocation__section-title">
          Financial Approach
        </h4>
        <p className="resource-allocation__section-desc">
          What's your general philosophy around money and resources?
        </p>

        <div className="resource-allocation__options">
          {FINANCIAL_APPROACH_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`resource-option ${financialApproach === option.id ? "resource-option--selected" : ""}`}
              onClick={() => onFinancialChange(option.id)}
            >
              <span className="resource-option__label">{option.label}</span>
              <span className="resource-option__description">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ResourceAllocationEditor;
