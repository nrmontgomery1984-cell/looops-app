// Kitchen Profile Onboarding - Welcome Step
import React from "react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="kitchen-onboarding__step kitchen-onboarding__welcome">
      <div className="kitchen-onboarding__icon">
        <span role="img" aria-label="cooking">👨‍🍳</span>
      </div>
      <h2 className="kitchen-onboarding__title">Let's set up your kitchen profile</h2>
      <p className="kitchen-onboarding__subtitle">
        This helps us suggest recipes that match your skills and equipment.
      </p>
      <button
        className="kitchen-onboarding__btn kitchen-onboarding__btn--primary"
        onClick={onNext}
      >
        Get Started
      </button>
    </div>
  );
}
