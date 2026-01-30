// Trait slider component for bipolar personality dimensions

import React from "react";
import { TraitDimension, TraitKey } from "../../types";

type TraitSliderProps = {
  trait: TraitDimension;
  value: number;
  onChange: (key: TraitKey, value: number) => void;
};

export function TraitSlider({ trait, value, onChange }: TraitSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(trait.id, parseInt(e.target.value, 10));
  };

  // Calculate gradient position for visual feedback
  const gradientPosition = value;

  return (
    <div className="trait-slider">
      <div className="trait-slider__header">
        <span className="trait-slider__pole trait-slider__pole--left">
          {trait.leftPole}
        </span>
        <span className="trait-slider__pole trait-slider__pole--right">
          {trait.rightPole}
        </span>
      </div>

      <div className="trait-slider__track-container">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleChange}
          className="trait-slider__input"
          style={{
            background: `linear-gradient(to right,
              #F27059 0%,
              #F4B942 50%,
              #73A58C 100%)`,
          }}
        />
        <div
          className="trait-slider__thumb-indicator"
          style={{ left: `${gradientPosition}%` }}
        />
      </div>

      <div className="trait-slider__descriptions">
        <span className="trait-slider__desc trait-slider__desc--left">
          {trait.leftDescription}
        </span>
        <span className="trait-slider__desc trait-slider__desc--right">
          {trait.rightDescription}
        </span>
      </div>
    </div>
  );
}

export default TraitSlider;
