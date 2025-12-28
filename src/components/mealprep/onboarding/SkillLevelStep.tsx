// Kitchen Profile Onboarding - Skill Level Step
import React from "react";
import {
  ExperienceLevel,
  getExperienceLevelLabel,
  getExperienceLevelDescription,
} from "../../../types/mealPrep";

interface SkillLevelStepProps {
  value: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
  onNext: () => void;
  onBack: () => void;
}

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "beginner",
  "comfortable",
  "experienced",
  "advanced",
];

export function SkillLevelStep({ value, onChange, onNext, onBack }: SkillLevelStepProps) {
  return (
    <div className="kitchen-onboarding__step kitchen-onboarding__skill">
      <h2 className="kitchen-onboarding__title">
        How would you describe your cooking experience?
      </h2>

      <div className="kitchen-onboarding__options">
        {EXPERIENCE_LEVELS.map((level) => (
          <button
            key={level}
            className={`kitchen-onboarding__option ${value === level ? "kitchen-onboarding__option--selected" : ""}`}
            onClick={() => onChange(level)}
          >
            <div className="kitchen-onboarding__option-header">
              <span className="kitchen-onboarding__option-radio">
                {value === level ? "●" : "○"}
              </span>
              <span className="kitchen-onboarding__option-label">
                {getExperienceLevelLabel(level)}
              </span>
            </div>
            <p className="kitchen-onboarding__option-desc">
              {getExperienceLevelDescription(level)}
            </p>
          </button>
        ))}
      </div>

      <div className="kitchen-onboarding__actions">
        <button
          className="kitchen-onboarding__btn kitchen-onboarding__btn--secondary"
          onClick={onBack}
        >
          Back
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
