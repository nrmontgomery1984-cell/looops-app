// Kitchen Profile Onboarding - Confirmation Step
import React from "react";
import {
  KitchenProfile,
  getExperienceLevelLabel,
  DIETARY_OPTIONS,
} from "../../../types/mealPrep";

interface ConfirmationStepProps {
  profile: Omit<KitchenProfile, "id" | "userId" | "createdAt" | "updatedAt">;
  onComplete: () => void;
  onBack: () => void;
}

export function ConfirmationStep({ profile, onComplete, onBack }: ConfirmationStepProps) {
  const ownedEquipment = profile.equipment.filter((eq) => eq.owned);

  const getDietaryLabel = (id: string): string => {
    const option = DIETARY_OPTIONS.find((opt) => opt.id === id);
    return option?.label || id;
  };

  const hasRestrictions = profile.dietaryRestrictions.length > 0 || profile.allergies.length > 0;

  return (
    <div className="kitchen-onboarding__step kitchen-onboarding__confirmation">
      <div className="kitchen-onboarding__icon kitchen-onboarding__icon--success">
        <span role="img" aria-label="checkmark">✓</span>
      </div>
      <h2 className="kitchen-onboarding__title">You're all set!</h2>

      <div className="kitchen-onboarding__summary">
        <h3 className="kitchen-onboarding__summary-title">Your profile:</h3>

        <div className="kitchen-onboarding__summary-item">
          <span className="kitchen-onboarding__summary-icon">👨‍🍳</span>
          <span className="kitchen-onboarding__summary-text">
            {getExperienceLevelLabel(profile.experienceLevel)} home cook
          </span>
        </div>

        <div className="kitchen-onboarding__summary-item">
          <span className="kitchen-onboarding__summary-icon">🍳</span>
          <span className="kitchen-onboarding__summary-text">
            {ownedEquipment.length} tool{ownedEquipment.length !== 1 ? "s" : ""} available
          </span>
        </div>

        <div className="kitchen-onboarding__summary-item">
          <span className="kitchen-onboarding__summary-icon">🥗</span>
          <span className="kitchen-onboarding__summary-text">
            {hasRestrictions ? (
              <>
                {[...profile.dietaryRestrictions, ...profile.allergies]
                  .map(getDietaryLabel)
                  .join(", ")}
              </>
            ) : (
              "No dietary restrictions"
            )}
          </span>
        </div>
      </div>

      <p className="kitchen-onboarding__hint">
        You can update this anytime in Settings
      </p>

      <div className="kitchen-onboarding__actions">
        <button
          className="kitchen-onboarding__btn kitchen-onboarding__btn--secondary"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="kitchen-onboarding__btn kitchen-onboarding__btn--primary kitchen-onboarding__btn--large"
          onClick={onComplete}
        >
          Start Cooking
        </button>
      </div>
    </div>
  );
}
