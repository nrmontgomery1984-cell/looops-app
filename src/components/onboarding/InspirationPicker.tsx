// Inspiration picker component - select 5-10 inspiring figures

import React, { useState } from "react";
import { Inspiration, InspirationCategory } from "../../types";
import { INSPIRATIONS, INSPIRATION_CATEGORIES } from "../../data/inspirations";

type InspirationPickerProps = {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  minSelections?: number;
  maxSelections?: number;
};

export function InspirationPicker({
  selectedIds,
  onChange,
  minSelections = 5,
  maxSelections = 10,
}: InspirationPickerProps) {
  const [activeCategory, setActiveCategory] = useState<InspirationCategory | "all">("all");

  const handleToggle = (inspirationId: string) => {
    if (selectedIds.includes(inspirationId)) {
      onChange(selectedIds.filter((id) => id !== inspirationId));
    } else if (selectedIds.length < maxSelections) {
      onChange([...selectedIds, inspirationId]);
    }
  };

  const filteredInspirations =
    activeCategory === "all"
      ? INSPIRATIONS
      : INSPIRATIONS.filter((i) => i.category === activeCategory);

  return (
    <div className="inspiration-picker">
      <div className="inspiration-picker__header">
        <span className="inspiration-picker__count">
          {selectedIds.length} of {minSelections}-{maxSelections} selected
          {selectedIds.length < minSelections && (
            <span className="inspiration-picker__warning">
              {" "}(select at least {minSelections})
            </span>
          )}
        </span>
      </div>

      <div className="inspiration-picker__filters">
        <button
          className={`filter-chip ${activeCategory === "all" ? "filter-chip--active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          All
        </button>
        {INSPIRATION_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`filter-chip ${activeCategory === cat.id ? "filter-chip--active" : ""}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="inspiration-picker__grid">
        {filteredInspirations.map((inspiration) => {
          const isSelected = selectedIds.includes(inspiration.id);
          const isDisabled = !isSelected && selectedIds.length >= maxSelections;

          return (
            <div
              key={inspiration.id}
              className={`inspiration-card ${isSelected ? "inspiration-card--selected" : ""} ${isDisabled ? "inspiration-card--disabled" : ""}`}
              onClick={() => !isDisabled && handleToggle(inspiration.id)}
            >
              <div className="inspiration-card__avatar">
                {inspiration.name.charAt(0)}
              </div>
              <div className="inspiration-card__content">
                <h4 className="inspiration-card__name">{inspiration.name}</h4>
                <p className="inspiration-card__tagline">{inspiration.tagline}</p>
              </div>
              {isSelected && (
                <div className="inspiration-card__check">✓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InspirationPicker;
