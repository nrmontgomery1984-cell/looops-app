// Gym Profile Onboarding - Fitness Level Step
import React from "react";
import {
  FitnessLevel,
  getFitnessLevelLabel,
  getFitnessLevelDescription,
} from "../../../types/workout";

interface FitnessLevelStepProps {
  value: FitnessLevel;
  onChange: (level: FitnessLevel) => void;
  onNext: () => void;
  onBack: () => void;
}

const FITNESS_LEVELS: FitnessLevel[] = ["beginner", "intermediate", "advanced", "athlete"];

export function FitnessLevelStep({ value, onChange, onNext, onBack }: FitnessLevelStepProps) {
  const handleSelect = (level: FitnessLevel) => {
    onChange(level);
  };

  return (
    <div className="gym-onboarding__step gym-onboarding__fitness">
      <h2 className="gym-onboarding__title">
        What's your fitness level?
      </h2>
      <p className="gym-onboarding__subtitle">
        This helps us suggest appropriate exercises and progressions
      </p>

      <div className="gym-onboarding__options">
        {FITNESS_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={`gym-onboarding__option ${value === level ? "gym-onboarding__option--selected" : ""}`}
            onClick={() => handleSelect(level)}
          >
            <span className="gym-onboarding__option-check">
              {value === level ? "✓" : ""}
            </span>
            <div className="gym-onboarding__option-content">
              <span className="gym-onboarding__option-title">
                {getFitnessLevelLabel(level)}
              </span>
              <span className="gym-onboarding__option-description">
                {getFitnessLevelDescription(level)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="gym-onboarding__actions">
        <button
          className="gym-onboarding__btn gym-onboarding__btn--secondary"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="gym-onboarding__btn gym-onboarding__btn--primary"
          onClick={onNext}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
