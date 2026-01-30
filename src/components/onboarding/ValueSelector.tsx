// Value selector component - pick 5 from 40 core values

import React from "react";
import { CoreValue, ValueCategory } from "../../types";
import { CORE_VALUES, VALUE_CATEGORIES } from "../../data/values";

type ValueSelectorProps = {
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  maxSelections?: number;
};

export function ValueSelector({
  selectedIds,
  onChange,
  maxSelections = 5,
}: ValueSelectorProps) {
  const handleToggle = (valueId: string) => {
    if (selectedIds.includes(valueId)) {
      onChange(selectedIds.filter((id) => id !== valueId));
    } else if (selectedIds.length < maxSelections) {
      onChange([...selectedIds, valueId]);
    }
  };

  const getValuesByCategory = (category: ValueCategory): CoreValue[] => {
    return CORE_VALUES.filter((v) => v.category === category);
  };

  return (
    <div className="value-selector">
      <div className="value-selector__header">
        <span className="value-selector__count">
          {selectedIds.length} of {maxSelections} selected
        </span>
      </div>

      <div className="value-selector__categories">
        {VALUE_CATEGORIES.map((category) => (
          <div key={category.id} className="value-category">
            <h4 className="value-category__title">{category.name}</h4>
            <div className="value-category__grid">
              {getValuesByCategory(category.id).map((value) => {
                const isSelected = selectedIds.includes(value.id);
                const isDisabled = !isSelected && selectedIds.length >= maxSelections;

                return (
                  <button
                    key={value.id}
                    className={`value-chip ${isSelected ? "value-chip--selected" : ""} ${isDisabled ? "value-chip--disabled" : ""}`}
                    onClick={() => handleToggle(value.id)}
                    disabled={isDisabled}
                    title={value.description}
                  >
                    {value.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ValueSelector;
