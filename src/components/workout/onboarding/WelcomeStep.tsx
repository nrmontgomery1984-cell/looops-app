// Gym Profile Onboarding - Welcome Step
import React from "react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="gym-onboarding__step gym-onboarding__welcome">
      <div className="gym-onboarding__icon">💪</div>
      <h1 className="gym-onboarding__title">
        Let's Set Up Your Training
      </h1>
      <p className="gym-onboarding__description">
        We'll personalize your workout experience based on your equipment,
        fitness level, and goals. This helps us suggest exercises and
        generate workouts that work for you.
      </p>

      <div className="gym-onboarding__features">
        <div className="gym-onboarding__feature">
          <span className="gym-onboarding__feature-icon">🏋️</span>
          <span>Track your exercise library</span>
        </div>
        <div className="gym-onboarding__feature">
          <span className="gym-onboarding__feature-icon">📅</span>
          <span>Plan weekly workouts</span>
        </div>
        <div className="gym-onboarding__feature">
          <span className="gym-onboarding__feature-icon">🎯</span>
          <span>Generate workouts for your equipment</span>
        </div>
        <div className="gym-onboarding__feature">
          <span className="gym-onboarding__feature-icon">📚</span>
          <span>Build a training tip library</span>
        </div>
      </div>

      <button
        className="gym-onboarding__btn gym-onboarding__btn--primary gym-onboarding__btn--large"
        onClick={onNext}
      >
        Get Started
      </button>
    </div>
  );
}
