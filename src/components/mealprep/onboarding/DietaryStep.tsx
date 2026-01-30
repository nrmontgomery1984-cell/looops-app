// Kitchen Profile Onboarding - Dietary Preferences Step
import React, { useState } from "react";
import { DIETARY_OPTIONS } from "../../../types/mealPrep";

interface DietaryStepProps {
  restrictions: string[];
  allergies: string[];
  onChangeRestrictions: (restrictions: string[]) => void;
  onChangeAllergies: (allergies: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function DietaryStep({
  restrictions,
  allergies,
  onChangeRestrictions,
  onChangeAllergies,
  onNext,
  onBack,
  onSkip,
}: DietaryStepProps) {
  const [customRestriction, setCustomRestriction] = useState("");

  const toggleOption = (id: string, isAllergy: boolean) => {
    if (isAllergy) {
      if (allergies.includes(id)) {
        onChangeAllergies(allergies.filter((a) => a !== id));
      } else {
        onChangeAllergies([...allergies, id]);
      }
    } else {
      if (restrictions.includes(id)) {
        onChangeRestrictions(restrictions.filter((r) => r !== id));
      } else {
        onChangeRestrictions([...restrictions, id]);
      }
    }
  };

  const addCustomRestriction = () => {
    if (customRestriction.trim() && !restrictions.includes(customRestriction.trim())) {
      onChangeRestrictions([...restrictions, customRestriction.trim()]);
      setCustomRestriction("");
    }
  };

  const removeCustomRestriction = (value: string) => {
    onChangeRestrictions(restrictions.filter((r) => r !== value));
  };

  // Check if a restriction is custom (not in DIETARY_OPTIONS)
  const isCustomRestriction = (value: string) => {
    return !DIETARY_OPTIONS.some((opt) => opt.id === value);
  };

  const customRestrictions = restrictions.filter(isCustomRestriction);

  return (
    <div className="kitchen-onboarding__step kitchen-onboarding__dietary">
      <h2 className="kitchen-onboarding__title">
        Any dietary considerations?
      </h2>
      <p className="kitchen-onboarding__subtitle">
        Select all that apply (optional)
      </p>

      <div className="kitchen-onboarding__dietary-list">
        {DIETARY_OPTIONS.map((option) => {
          const isSelected = option.isAllergy
            ? allergies.includes(option.id)
            : restrictions.includes(option.id);

          return (
            <label
              key={option.id}
              className={`kitchen-onboarding__dietary-item ${isSelected ? "kitchen-onboarding__dietary-item--selected" : ""} ${option.isAllergy ? "kitchen-onboarding__dietary-item--allergy" : ""}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleOption(option.id, option.isAllergy || false)}
              />
              <span className="kitchen-onboarding__dietary-check">
                {isSelected ? "✓" : ""}
              </span>
              <span className="kitchen-onboarding__dietary-label">
                {option.label}
              </span>
              {option.isAllergy && (
                <span className="kitchen-onboarding__dietary-badge">Allergy</span>
              )}
            </label>
          );
        })}

        {/* Custom restrictions */}
        {customRestrictions.map((value) => (
          <label
            key={value}
            className="kitchen-onboarding__dietary-item kitchen-onboarding__dietary-item--selected kitchen-onboarding__dietary-item--custom"
          >
            <input
              type="checkbox"
              checked={true}
              onChange={() => removeCustomRestriction(value)}
            />
            <span className="kitchen-onboarding__dietary-check">✓</span>
            <span className="kitchen-onboarding__dietary-label">{value}</span>
            <button
              className="kitchen-onboarding__dietary-remove"
              onClick={(e) => {
                e.preventDefault();
                removeCustomRestriction(value);
              }}
              title="Remove"
            >
              ×
            </button>
          </label>
        ))}
      </div>

      <div className="kitchen-onboarding__add-custom">
        <input
          type="text"
          value={customRestriction}
          onChange={(e) => setCustomRestriction(e.target.value)}
          placeholder="Other dietary restriction..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomRestriction();
            }
          }}
        />
        <button
          className="kitchen-onboarding__add-btn"
          onClick={addCustomRestriction}
          disabled={!customRestriction.trim()}
        >
          + Add
        </button>
      </div>

      <div className="kitchen-onboarding__actions">
        <button
          className="kitchen-onboarding__btn kitchen-onboarding__btn--secondary"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="kitchen-onboarding__btn kitchen-onboarding__btn--ghost"
          onClick={onSkip}
        >
          Skip
        </button>
        <button
          className="kitchen-onboarding__btn kitchen-onboarding__btn--primary"
          onClick={onNext}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
