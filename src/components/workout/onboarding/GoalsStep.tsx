// Gym Profile Onboarding - Goals & Limitations Step
import React from "react";
import { GOAL_OPTIONS, LIMITATION_OPTIONS } from "../../../types/workout";

interface GoalsStepProps {
  goals: string[];
  limitations: string[];
  preferredDuration: number;
  daysPerWeek: number;
  onChangeGoals: (goals: string[]) => void;
  onChangeLimitations: (limitations: string[]) => void;
  onChangeDuration: (duration: number) => void;
  onChangeDays: (days: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const DURATION_OPTIONS = [20, 30, 45, 60, 75, 90];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];

export function GoalsStep({
  goals,
  limitations,
  preferredDuration,
  daysPerWeek,
  onChangeGoals,
  onChangeLimitations,
  onChangeDuration,
  onChangeDays,
  onNext,
  onBack,
}: GoalsStepProps) {
  const toggleGoal = (goalId: string) => {
    if (goals.includes(goalId)) {
      onChangeGoals(goals.filter((g) => g !== goalId));
    } else {
      onChangeGoals([...goals, goalId]);
    }
  };

  const toggleLimitation = (limitId: string) => {
    if (limitations.includes(limitId)) {
      onChangeLimitations(limitations.filter((l) => l !== limitId));
    } else {
      onChangeLimitations([...limitations, limitId]);
    }
  };

  return (
    <div className="gym-onboarding__step gym-onboarding__goals">
      <h2 className="gym-onboarding__title">
        What are your training goals?
      </h2>

      {/* Goals Section */}
      <div className="gym-onboarding__section">
        <h3 className="gym-onboarding__section-title">Goals</h3>
        <p className="gym-onboarding__section-hint">Select all that apply</p>
        <div className="gym-onboarding__checkbox-grid">
          {GOAL_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`gym-onboarding__checkbox-item ${goals.includes(option.id) ? "gym-onboarding__checkbox-item--selected" : ""}`}
              onClick={() => toggleGoal(option.id)}
            >
              <span className="gym-onboarding__checkbox-check">
                {goals.includes(option.id) ? "✓" : ""}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Section */}
      <div className="gym-onboarding__section">
        <h3 className="gym-onboarding__section-title">Preferred Schedule</h3>

        <div className="gym-onboarding__schedule-row">
          <label className="gym-onboarding__schedule-label">
            Workout duration:
          </label>
          <div className="gym-onboarding__schedule-options">
            {DURATION_OPTIONS.map((mins) => (
              <button
                key={mins}
                className={`gym-onboarding__schedule-btn ${preferredDuration === mins ? "gym-onboarding__schedule-btn--selected" : ""}`}
                onClick={() => onChangeDuration(mins)}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        <div className="gym-onboarding__schedule-row">
          <label className="gym-onboarding__schedule-label">
            Days per week:
          </label>
          <div className="gym-onboarding__schedule-options">
            {DAYS_OPTIONS.map((days) => (
              <button
                key={days}
                className={`gym-onboarding__schedule-btn ${daysPerWeek === days ? "gym-onboarding__schedule-btn--selected" : ""}`}
                onClick={() => onChangeDays(days)}
              >
                {days}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Limitations Section */}
      <div className="gym-onboarding__section">
        <h3 className="gym-onboarding__section-title">Limitations</h3>
        <p className="gym-onboarding__section-hint">Optional - helps filter exercises</p>
        <div className="gym-onboarding__checkbox-grid">
          {LIMITATION_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`gym-onboarding__checkbox-item ${limitations.includes(option.id) ? "gym-onboarding__checkbox-item--selected" : ""}`}
              onClick={() => toggleLimitation(option.id)}
            >
              <span className="gym-onboarding__checkbox-check">
                {limitations.includes(option.id) ? "✓" : ""}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
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
