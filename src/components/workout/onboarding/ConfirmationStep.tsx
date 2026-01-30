// Gym Profile Onboarding - Confirmation Step
import React from "react";
import {
  GymEquipment,
  FitnessLevel,
  getFitnessLevelLabel,
  GOAL_OPTIONS,
  LIMITATION_OPTIONS,
} from "../../../types/workout";

interface ProfilePreview {
  fitnessLevel: FitnessLevel;
  equipment: GymEquipment[];
  goals: string[];
  limitations: string[];
  preferredDuration: number;
  daysPerWeek: number;
}

interface ConfirmationStepProps {
  profile: ProfilePreview;
  onComplete: () => void;
  onBack: () => void;
}

export function ConfirmationStep({ profile, onComplete, onBack }: ConfirmationStepProps) {
  const ownedEquipment = profile.equipment.filter((eq) => eq.owned);
  const goalLabels = profile.goals
    .map((id) => GOAL_OPTIONS.find((g) => g.id === id)?.label)
    .filter(Boolean);
  const limitationLabels = profile.limitations
    .map((id) => LIMITATION_OPTIONS.find((l) => l.id === id)?.label)
    .filter(Boolean);

  return (
    <div className="gym-onboarding__step gym-onboarding__confirmation">
      <div className="gym-onboarding__icon">✓</div>
      <h2 className="gym-onboarding__title">
        You're All Set!
      </h2>
      <p className="gym-onboarding__subtitle">
        Here's your training profile
      </p>

      <div className="gym-onboarding__summary">
        <div className="gym-onboarding__summary-section">
          <h4>Fitness Level</h4>
          <p>{getFitnessLevelLabel(profile.fitnessLevel)}</p>
        </div>

        <div className="gym-onboarding__summary-section">
          <h4>Schedule</h4>
          <p>
            {profile.daysPerWeek} days/week × {profile.preferredDuration} min
          </p>
        </div>

        <div className="gym-onboarding__summary-section">
          <h4>Equipment ({ownedEquipment.length})</h4>
          <div className="gym-onboarding__summary-tags">
            {ownedEquipment.slice(0, 8).map((eq) => (
              <span key={eq.id} className="gym-onboarding__summary-tag">
                {eq.name}
              </span>
            ))}
            {ownedEquipment.length > 8 && (
              <span className="gym-onboarding__summary-tag gym-onboarding__summary-tag--more">
                +{ownedEquipment.length - 8} more
              </span>
            )}
          </div>
        </div>

        {goalLabels.length > 0 && (
          <div className="gym-onboarding__summary-section">
            <h4>Goals</h4>
            <div className="gym-onboarding__summary-tags">
              {goalLabels.map((label) => (
                <span key={label} className="gym-onboarding__summary-tag">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {limitationLabels.length > 0 && (
          <div className="gym-onboarding__summary-section">
            <h4>Limitations</h4>
            <div className="gym-onboarding__summary-tags">
              {limitationLabels.map((label) => (
                <span key={label} className="gym-onboarding__summary-tag gym-onboarding__summary-tag--limitation">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="gym-onboarding__note">
        You can update your profile anytime in settings.
      </p>

      <div className="gym-onboarding__actions">
        <button
          className="gym-onboarding__btn gym-onboarding__btn--secondary"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="gym-onboarding__btn gym-onboarding__btn--primary gym-onboarding__btn--large"
          onClick={onComplete}
        >
          Start Training
        </button>
      </div>
    </div>
  );
}
