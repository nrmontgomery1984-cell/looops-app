// Identity statement selector - multi-select chips for "I am a..." statements

import React from "react";
import { IdentityStatementOption } from "../../types";

type IdentitySelectorProps = {
  options: IdentityStatementOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  minSelections?: number;
  maxSelections?: number;
};

export function IdentitySelector({
  options,
  selectedIds,
  onChange,
  minSelections = 3,
  maxSelections = 7,
}: IdentitySelectorProps) {
  const handleToggle = (optionId: string) => {
    const isSelected = selectedIds.includes(optionId);

    if (isSelected) {
      // Deselect
      onChange(selectedIds.filter((id) => id !== optionId));
    } else {
      // Select (if under max)
      if (selectedIds.length < maxSelections) {
        onChange([...selectedIds, optionId]);
      }
    }
  };

  // Group options by category
  const groupedOptions = options.reduce(
    (acc, option) => {
      const category = option.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(option);
      return acc;
    },
    {} as Record<string, IdentityStatementOption[]>
  );

  return (
    <div className="identity-selector">
      <div className="identity-selector__counter">
        {selectedIds.length} of {minSelections}-{maxSelections} selected
      </div>

      {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
        <div key={category} className="identity-selector__category">
          <h4 className="identity-selector__category-title">{category}</h4>
          <div className="identity-selector__chips">
            {categoryOptions.map((option) => {
              const isSelected = selectedIds.includes(option.id);
              const isDisabled =
                !isSelected && selectedIds.length >= maxSelections;

              return (
                <button
                  key={option.id}
                  type="button"
                  className={`identity-chip ${isSelected ? "identity-chip--selected" : ""} ${isDisabled ? "identity-chip--disabled" : ""}`}
                  onClick={() => handleToggle(option.id)}
                  disabled={isDisabled}
                  title={option.description}
                >
                  <span className="identity-chip__label">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default IdentitySelector;
