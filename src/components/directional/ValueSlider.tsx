// Value slider component for bipolar value dimensions (1-10 scale)

import React from "react";
import { ValueDimension, ValueDimensionDefinition } from "../../types";

type ValueSliderProps = {
  dimension: ValueDimensionDefinition;
  value: number; // 1-10 scale
  onChange: (dimensionId: ValueDimension, value: number) => void;
};

export function ValueSlider({ dimension, value, onChange }: ValueSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(dimension.id, parseInt(e.target.value, 10));
  };

  // Calculate position for visual feedback (convert 1-10 to 0-100)
  const gradientPosition = ((value - 1) / 9) * 100;

  return (
    <div className="value-slider">
      <div className="value-slider__header">
        <span className="value-slider__pole value-slider__pole--left">
          {dimension.leftPole}
        </span>
        <span className="value-slider__value">{value}</span>
        <span className="value-slider__pole value-slider__pole--right">
          {dimension.rightPole}
        </span>
      </div>

      <div className="value-slider__track-container">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={handleChange}
          className="value-slider__input"
          style={{
            background: `linear-gradient(to right,
              var(--looops-coral) 0%,
              var(--looops-gold) 50%,
              var(--looops-sage) 100%)`,
          }}
        />
        <div
          className="value-slider__thumb-indicator"
          style={{ left: `${gradientPosition}%` }}
        />
      </div>

      <div className="value-slider__descriptions">
        <span className="value-slider__desc value-slider__desc--left">
          {dimension.leftDescription}
        </span>
        <span className="value-slider__desc value-slider__desc--right">
          {dimension.rightDescription}
        </span>
      </div>
    </div>
  );
}

export default ValueSlider;
