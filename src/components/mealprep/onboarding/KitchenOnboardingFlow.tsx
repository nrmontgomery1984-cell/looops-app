// Kitchen Profile Onboarding Flow - Main Component
import React, { useState } from "react";
import { useApp } from "../../../context";
import {
  ExperienceLevel,
  KitchenEquipment,
  KitchenProfile,
  DEFAULT_EQUIPMENT,
  createDefaultKitchenProfile,
} from "../../../types/mealPrep";
import { WelcomeStep } from "./WelcomeStep";
import { SkillLevelStep } from "./SkillLevelStep";
import { EquipmentStep } from "./EquipmentStep";
import { DietaryStep } from "./DietaryStep";
import { ConfirmationStep } from "./ConfirmationStep";

type OnboardingStep = "welcome" | "skill" | "equipment" | "dietary" | "confirmation";

interface KitchenOnboardingFlowProps {
  userId: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export function KitchenOnboardingFlow({ userId, onComplete, onCancel }: KitchenOnboardingFlowProps) {
  const { dispatch } = useApp();

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("comfortable");
  const [equipment, setEquipment] = useState<KitchenEquipment[]>(
    DEFAULT_EQUIPMENT.map((eq) => ({
      ...eq,
      owned: eq.category === "essential",
    }))
  );
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  const steps: OnboardingStep[] = ["welcome", "skill", "equipment", "dietary", "confirmation"];
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

  const skipDietary = () => {
    setDietaryRestrictions([]);
    setAllergies([]);
    setStep("confirmation");
  };

  const handleComplete = () => {
    const now = new Date().toISOString();
    const profile: KitchenProfile = {
      id: `kitchen_${Date.now()}`,
      userId,
      experienceLevel,
      equipment,
      dietaryRestrictions,
      allergies,
      preferMetric: false,
      defaultServings: 4,
      createdAt: now,
      updatedAt: now,
    };

    dispatch({ type: "SET_KITCHEN_PROFILE", payload: profile });
    dispatch({ type: "COMPLETE_MEAL_PREP_ONBOARDING" });
    onComplete();
  };

  const profilePreview = {
    experienceLevel,
    equipment,
    dietaryRestrictions,
    allergies,
    preferMetric: false,
    defaultServings: 4,
  };

  return (
    <div className="kitchen-onboarding">
      {/* Progress Bar */}
      {step !== "welcome" && (
        <div className="kitchen-onboarding__progress">
          <div
            className="kitchen-onboarding__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Close Button */}
      {onCancel && (
        <button
          className="kitchen-onboarding__close"
          onClick={onCancel}
          aria-label="Close"
        >
          ×
        </button>
      )}

      {/* Steps */}
      <div className="kitchen-onboarding__content">
        {step === "welcome" && (
          <WelcomeStep onNext={goNext} />
        )}

        {step === "skill" && (
          <SkillLevelStep
            value={experienceLevel}
            onChange={setExperienceLevel}
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

        {step === "dietary" && (
          <DietaryStep
            restrictions={dietaryRestrictions}
            allergies={allergies}
            onChangeRestrictions={setDietaryRestrictions}
            onChangeAllergies={setAllergies}
            onNext={goNext}
            onBack={goBack}
            onSkip={skipDietary}
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
