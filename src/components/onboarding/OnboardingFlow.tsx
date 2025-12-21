// 4-step onboarding wizard v2

import React, { useState } from "react";
import {
  UserTraits,
  DEFAULT_TRAITS,
  LoopId,
  LoopStateType,
  ALL_LOOPS,
  LOOP_DEFINITIONS,
} from "../../types";
import { generatePrototype } from "../../engines/identityEngine";
import { getStateDisplayName, getStateColor } from "../../engines/stateEngine";
import TraitAssessmentSection from "./TraitAssessmentSection";
import ValueSelector from "./ValueSelector";
import InspirationPicker from "./InspirationPicker";

type OnboardingFlowProps = {
  onComplete: (data: OnboardingData) => void;
  onClose: () => void;
  onSkip?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
};

export type OnboardingData = {
  name: string;
  lifeSeason: string;
  majorTransition: string;
  transitionDescription?: string; // For "other" transition
  primaryChallenges: string[]; // Now multi-select
  traits: UserTraits;
  selectedValueIds: string[];
  selectedInspirationIds: string[];
  futureSelf: string;
  initialLoopStates: Record<LoopId, LoopStateType>;
};

const LIFE_SEASONS = [
  { id: "single", label: "Single", description: "Independent, focused on self" },
  { id: "partnered", label: "Partnered", description: "In a relationship, sharing life" },
  { id: "divorced", label: "Divorced/Separated", description: "Navigating life after a relationship" },
  { id: "parent", label: "Parent", description: "Raising children" },
  { id: "caregiver", label: "Caregiver", description: "Caring for others" },
];

const MAJOR_TRANSITIONS = [
  { id: "none", label: "None right now", description: "Life is relatively stable" },
  { id: "death", label: "Loss of loved one", description: "Grieving or processing loss" },
  { id: "divorce", label: "Divorce/Separation", description: "Ending a significant relationship" },
  { id: "health", label: "Health concern", description: "Dealing with illness or injury" },
  { id: "job", label: "Job change", description: "New job, layoff, or career shift" },
  { id: "move", label: "Relocation", description: "Moving to a new place" },
  { id: "other", label: "Other", description: "Something else significant" },
];

const PRIMARY_CHALLENGES = [
  { id: "time", label: "Time", description: "Not enough hours in the day" },
  { id: "energy", label: "Energy", description: "Running on empty" },
  { id: "focus", label: "Focus", description: "Too many distractions" },
  { id: "balance", label: "Balance", description: "Life feels lopsided" },
  { id: "direction", label: "Direction", description: "Unsure where to go" },
  { id: "motivation", label: "Motivation", description: "Hard to get started" },
  { id: "consistency", label: "Consistency", description: "Trouble sticking with things" },
  { id: "overwhelm", label: "Overwhelm", description: "Too much on my plate" },
];

// Icons for theme toggle
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export function OnboardingFlow({ onComplete, onClose, onSkip, theme, onToggleTheme }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Basics
  const [name, setName] = useState("");
  const [lifeSeason, setLifeSeason] = useState("");
  const [majorTransition, setMajorTransition] = useState("");
  const [transitionDescription, setTransitionDescription] = useState("");
  const [primaryChallenges, setPrimaryChallenges] = useState<string[]>([]);

  // Step 2: Prototype (Traits + Values + Inspirations)
  const [traits, setTraits] = useState<UserTraits>(DEFAULT_TRAITS);
  const [traitsCompleted, setTraitsCompleted] = useState(false);
  const [selectedValueIds, setSelectedValueIds] = useState<string[]>([]);
  const [selectedInspirationIds, setSelectedInspirationIds] = useState<string[]>([]);
  const [futureSelf, setFutureSelf] = useState("");

  // Step 3: Initial Loop States
  const [initialLoopStates, setInitialLoopStates] = useState<Record<LoopId, LoopStateType>>(
    () => {
      const states: Partial<Record<LoopId, LoopStateType>> = {};
      for (const loopId of ALL_LOOPS) {
        states[loopId] = "MAINTAIN";
      }
      return states as Record<LoopId, LoopStateType>;
    }
  );

  // Step 4: Results (generated)
  const [generatedPrototype, setGeneratedPrototype] = useState<ReturnType<typeof generatePrototype> | null>(null);

  const handleTraitsComplete = (completedTraits: UserTraits) => {
    setTraits(completedTraits);
    setTraitsCompleted(true);
  };

  const handleLoopStateChange = (loopId: LoopId, state: LoopStateType) => {
    setInitialLoopStates((prev) => ({ ...prev, [loopId]: state }));
  };

  const handleChallengeToggle = (challengeId: string) => {
    setPrimaryChallenges(prev => {
      if (prev.includes(challengeId)) {
        return prev.filter(id => id !== challengeId);
      }
      // Max 3 challenges
      if (prev.length >= 3) return prev;
      return [...prev, challengeId];
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        const transitionValid = majorTransition !== "other" || transitionDescription.trim().length > 0;
        return name.trim().length > 0 && lifeSeason && majorTransition && transitionValid && primaryChallenges.length > 0;
      case 2:
        return traitsCompleted && selectedValueIds.length === 5 && selectedInspirationIds.length >= 5;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step === 3) {
      // Generate prototype before showing results
      const prototype = generatePrototype(
        `user_${Date.now()}`,
        traits,
        selectedValueIds,
        selectedInspirationIds,
        futureSelf
      );
      setGeneratedPrototype(prototype);
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleComplete = () => {
    onComplete({
      name,
      lifeSeason,
      majorTransition,
      transitionDescription: majorTransition === "other" ? transitionDescription : undefined,
      primaryChallenges,
      traits,
      selectedValueIds,
      selectedInspirationIds,
      futureSelf,
      initialLoopStates,
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="onboarding-step">
            <h2 className="onboarding-title">Welcome to Looops</h2>
            <p className="onboarding-description">
              Let's set up your Personal Operating System. This will take about 10 minutes.
            </p>

            <div className="onboarding-field">
              <label className="onboarding-label">What should we call you?</label>
              <input
                type="text"
                className="onboarding-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="onboarding-field">
              <label className="onboarding-label">What's your current life season?</label>
              <div className="onboarding-radio-group">
                {LIFE_SEASONS.map((season) => (
                  <label key={season.id} className="onboarding-radio">
                    <input
                      type="radio"
                      name="lifeSeason"
                      value={season.id}
                      checked={lifeSeason === season.id}
                      onChange={(e) => setLifeSeason(e.target.value)}
                    />
                    <div className="onboarding-radio-content">
                      <strong>{season.label}</strong>
                      <span>{season.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="onboarding-field">
              <label className="onboarding-label">Are you going through a major life transition?</label>
              <div className="onboarding-radio-group">
                {MAJOR_TRANSITIONS.map((transition) => (
                  <label key={transition.id} className="onboarding-radio">
                    <input
                      type="radio"
                      name="majorTransition"
                      value={transition.id}
                      checked={majorTransition === transition.id}
                      onChange={(e) => setMajorTransition(e.target.value)}
                    />
                    <div className="onboarding-radio-content">
                      <strong>{transition.label}</strong>
                      <span>{transition.description}</span>
                    </div>
                  </label>
                ))}
              </div>
              {majorTransition === "other" && (
                <input
                  type="text"
                  className="onboarding-input onboarding-input--nested"
                  value={transitionDescription}
                  onChange={(e) => setTransitionDescription(e.target.value)}
                  placeholder="Describe your transition..."
                />
              )}
            </div>

            <div className="onboarding-field">
              <label className="onboarding-label">
                What are your biggest challenges right now?
                <span className="onboarding-label-hint">(Select up to 3)</span>
              </label>
              <div className="onboarding-checkbox-group">
                {PRIMARY_CHALLENGES.map((challenge) => (
                  <label
                    key={challenge.id}
                    className={`onboarding-checkbox ${primaryChallenges.includes(challenge.id) ? "onboarding-checkbox--selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      value={challenge.id}
                      checked={primaryChallenges.includes(challenge.id)}
                      onChange={() => handleChallengeToggle(challenge.id)}
                      disabled={!primaryChallenges.includes(challenge.id) && primaryChallenges.length >= 3}
                    />
                    <div className="onboarding-checkbox-content">
                      <strong>{challenge.label}</strong>
                      <span>{challenge.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="onboarding-step">
            <h2 className="onboarding-title">Build Your Prototype</h2>
            <p className="onboarding-description">
              Your Prototype is your identity blueprint. It drives how Looops understands you.
            </p>

            {/* Trait Assessment - multi-screen flow */}
            {!traitsCompleted ? (
              <div className="onboarding-section onboarding-section--traits">
                <h3 className="onboarding-section-title">Your Traits</h3>
                <p className="onboarding-section-desc">
                  Rate how much you agree with each statement. Be honest about who you are today.
                </p>
                <TraitAssessmentSection
                  initialTraits={traits}
                  onComplete={handleTraitsComplete}
                />
              </div>
            ) : (
              <>
                {/* Traits completed - show values and inspirations */}
                <div className="onboarding-section onboarding-section--completed">
                  <div className="traits-completed-banner">
                    <span className="traits-completed-icon">✓</span>
                    <span>Traits assessed</span>
                    <button
                      type="button"
                      className="traits-edit-btn"
                      onClick={() => setTraitsCompleted(false)}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="onboarding-section">
                  <h3 className="onboarding-section-title">Your Core Values</h3>
                  <p className="onboarding-section-desc">
                    Select exactly 5 values that matter most to you.
                  </p>
                  <ValueSelector
                    selectedIds={selectedValueIds}
                    onChange={setSelectedValueIds}
                    maxSelections={5}
                  />
                </div>

                <div className="onboarding-section">
                  <h3 className="onboarding-section-title">Your Inspirations</h3>
                  <p className="onboarding-section-desc">
                    Select 5-10 people you admire and want to emulate.
                  </p>
                  <InspirationPicker
                    selectedIds={selectedInspirationIds}
                    onChange={setSelectedInspirationIds}
                    minSelections={5}
                    maxSelections={10}
                  />
                </div>

                <div className="onboarding-field">
                  <label className="onboarding-label">
                    In 5 years, who do you want to be? (Optional)
                  </label>
                  <textarea
                    className="onboarding-textarea"
                    value={futureSelf}
                    onChange={(e) => setFutureSelf(e.target.value)}
                    placeholder="Describe your future self..."
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="onboarding-step">
            <h2 className="onboarding-title">Set Your Loop States</h2>
            <p className="onboarding-description">
              Each of your 7 life loops can be in one of 4 states. Set your current reality.
            </p>

            <div className="loop-states-setup">
              {ALL_LOOPS.map((loopId) => {
                const loop = LOOP_DEFINITIONS[loopId];
                const currentState = initialLoopStates[loopId];

                return (
                  <div key={loopId} className="loop-state-row">
                    <div className="loop-state-info">
                      <span className="loop-state-icon">{loop.icon}</span>
                      <div className="loop-state-text">
                        <strong>{loop.name}</strong>
                        <span>{loop.description}</span>
                      </div>
                    </div>
                    <div className="loop-state-selector">
                      {(["BUILD", "MAINTAIN", "RECOVER", "HIBERNATE"] as LoopStateType[]).map((state) => (
                        <button
                          key={state}
                          className={`state-btn ${currentState === state ? "state-btn--active" : ""}`}
                          style={{
                            backgroundColor: currentState === state ? getStateColor(state) : "transparent",
                            borderColor: getStateColor(state),
                            color: currentState === state ? "white" : getStateColor(state),
                          }}
                          onClick={() => handleLoopStateChange(loopId, state)}
                        >
                          {getStateDisplayName(state)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="onboarding-step">
            <h2 className="onboarding-title">Your Prototype</h2>
            <p className="onboarding-description">
              Based on your inputs, here's your identity blueprint.
            </p>

            {generatedPrototype && (
              <div className="prototype-result">
                <div className="archetype-reveal">
                  <span className="archetype-label">You are</span>
                  <h1 className="archetype-name">{generatedPrototype.archetypeBlend.name}</h1>
                </div>

                <div className="archetype-blend">
                  <h4>Your Archetype Blend</h4>
                  <div className="blend-bars">
                    {Object.entries(generatedPrototype.archetypeBlend.scores)
                      .sort(([, a], [, b]) => b - a)
                      .map(([archetype, score]) => (
                        <div key={archetype} className="blend-bar">
                          <span className="blend-bar__label">{archetype}</span>
                          <div className="blend-bar__track">
                            <div
                              className="blend-bar__fill"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="blend-bar__value">{Math.round(score)}%</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="voice-profile">
                  <h4>Your Voice</h4>
                  <p>
                    <strong>Tone:</strong> {generatedPrototype.voiceProfile.tone}
                  </p>
                  <p>
                    <strong>Motivation Style:</strong> {generatedPrototype.voiceProfile.motivationStyle}
                  </p>
                  <div className="voice-examples">
                    <strong>How we'll talk to you:</strong>
                    <ul>
                      {generatedPrototype.voiceProfile.examplePhrases.map((phrase, i) => (
                        <li key={i}>"{phrase}"</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-onboarding">
        <div className="modal__header">
          <h2>Setup Your Looops</h2>
          <div className="modal__header-actions">
            {onToggleTheme && (
              <button
                className="theme-toggle-btn"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </button>
            )}
            <button className="modal__close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="modal__body">
          <div className="onboarding-progress">
            <div className="onboarding-progress-bar">
              <div
                className="onboarding-progress-fill"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
            <span className="onboarding-progress-text">
              Step {step} of {totalSteps}
            </span>
          </div>

          {renderStep()}
        </div>

        <div className="modal__footer">
          {step === 1 && onSkip && (
            <button className="button button--text" onClick={onSkip}>
              Skip for now
            </button>
          )}
          {step > 1 && (
            <button className="button" onClick={handleBack}>
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button
              className="button button--primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Continue
            </button>
          ) : (
            <button
              className="button button--primary"
              onClick={handleComplete}
            >
              Start Using Looops
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingFlow;
