// Gym Profile Onboarding Flow - Main Component
import React, { useState } from "react";
import { useApp } from "../../../context";
import {
  FitnessLevel,
  GymEquipment,
  GymProfile,
  DEFAULT_EQUIPMENT,
} from "../../../types/workout";
import { WelcomeStep } from "./WelcomeStep";
import { FitnessLevelStep } from "./FitnessLevelStep";
import { EquipmentStep } from "./EquipmentStep";
import { GoalsStep } from "./GoalsStep";
import { ConfirmationStep } from "./ConfirmationStep";

type OnboardingStep = "welcome" | "fitness" | "equipment" | "goals" | "confirmation";

interface GymOnboardingFlowProps {
  userId: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export function GymOnboardingFlow({ userId, onComplete, onCancel }: GymOnboardingFlowProps) {
  const { dispatch } = useApp();

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>("intermediate");
  const [equipment, setEquipment] = useState<GymEquipment[]>(
    DEFAULT_EQUIPMENT.map((eq) => ({
      ...eq,
      owned: eq.category === "bodyweight",
    }))
  );
  const [goals, setGoals] = useState<string[]>([]);
  const [limitations, setLimitations] = useState<string[]>([]);
  const [preferredDuration, setPreferredDuration] = useState(45);
  const [daysPerWeek, setDaysPerWeek] = useState(3);

  const steps: OnboardingStep[] = ["welcome", "fitness", "equipment", "goals", "confirmation"];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex) / (steps.length - 1)) * 100;

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleComplete = () => {
    const now = new Date().toISOString();
    const profile: GymProfile = {
      id: `gym_${Date.now()}`,
      userId,
      fitnessLevel,
      equipment,
      goals,
      limitations,
      preferredDuration,
      daysPerWeek,
      createdAt: now,
      updatedAt: now,
    };

    dispatch({ type: "SET_GYM_PROFILE", payload: profile });
    dispatch({ type: "COMPLETE_WORKOUT_ONBOARDING" });
    onComplete();
  };

  const profilePreview = {
    fitnessLevel,
    equipment,
    goals,
    limitations,
    preferredDuration,
    daysPerWeek,
  };

  return (
    <div className="gym-onboarding">
      {/* Progress Bar */}
      {step !== "welcome" && (
        <div className="gym-onboarding__progress">
          <div
            className="gym-onboarding__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Close Button */}
      {onCancel && (
        <button
          className="gym-onboarding__close"
          onClick={onCancel}
          aria-label="Close"
        >
          ×
        </button>
      )}

      {/* Steps */}
      <div className="gym-onboarding__content">
        {step === "welcome" && (
          <WelcomeStep onNext={goNext} />
        )}

        {step === "fitness" && (
          <FitnessLevelStep
            value={fitnessLevel}
            onChange={setFitnessLevel}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {step === "equipment" && (
          <EquipmentStep
            equipment={equipment}
            onChange={setEquipment}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {step === "goals" && (
          <GoalsStep
            goals={goals}
            limitations={limitations}
            preferredDuration={preferredDuration}
            daysPerWeek={daysPerWeek}
            onChangeGoals={setGoals}
            onChangeLimitations={setLimitations}
            onChangeDuration={setPreferredDuration}
            onChangeDays={setDaysPerWeek}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {step === "confirmation" && (
          <ConfirmationStep
            profile={profilePreview}
            onComplete={handleComplete}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
