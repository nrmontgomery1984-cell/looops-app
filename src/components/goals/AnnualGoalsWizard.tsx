// Annual Goals Wizard - Multi-step wizard for setting annual goals based on archetype

import React, { useState, useMemo } from "react";
import {
  Goal,
  GoalHierarchy,
  LoopId,
  UserPrototype,
  LoopStateType,
  ALL_LOOPS,
  LOOP_COLORS,
  LOOP_DEFINITIONS,
} from "../../types";
import {
  generateGoalSuggestions,
  createGoalFromTemplate,
  decomposeAnnualToQuarterly,
  GoalSuggestion,
  GoalTemplate,
  GOAL_TEMPLATES,
} from "../../engines/goalEngine";
import { GoalSuggestionCard } from "./GoalSuggestionCard";

type WizardStep = "intro" | "suggestions" | "customize" | "decompose" | "review";

type AnnualGoalsWizardProps = {
  prototype: UserPrototype;
  loopStates: Record<LoopId, LoopStateType>;
  existingGoals: GoalHierarchy;
  onComplete: (goals: Goal[]) => void;
  onCancel: () => void;
};

export function AnnualGoalsWizard({
  prototype,
  loopStates,
  existingGoals,
  onComplete,
  onCancel,
}: AnnualGoalsWizardProps) {
  const [step, setStep] = useState<WizardStep>("intro");
  const [selectedSuggestions, setSelectedSuggestions] = useState<GoalSuggestion[]>([]);
  const [customGoals, setCustomGoals] = useState<Goal[]>([]);
  const [activeLoop, setActiveLoop] = useState<LoopId | null>(null);
  const [showDecomposition, setShowDecomposition] = useState<Record<string, boolean>>({});

  // Generate suggestions based on prototype
  const suggestions = useMemo(() => {
    return generateGoalSuggestions(prototype, loopStates, existingGoals, 20);
  }, [prototype, loopStates, existingGoals]);

  // Group suggestions by loop
  const suggestionsByLoop = useMemo(() => {
    const grouped: Record<LoopId, GoalSuggestion[]> = {} as Record<LoopId, GoalSuggestion[]>;
    for (const loop of ALL_LOOPS) {
      grouped[loop] = suggestions.filter((s) => s.template.loop === loop);
    }
    return grouped;
  }, [suggestions]);

  // Handle suggestion selection
  const toggleSuggestion = (suggestion: GoalSuggestion) => {
    setSelectedSuggestions((prev) => {
      const exists = prev.find((s) => s.template.id === suggestion.template.id);
      if (exists) {
        return prev.filter((s) => s.template.id !== suggestion.template.id);
      }
      // Only allow one goal per loop
      const filtered = prev.filter((s) => s.template.loop !== suggestion.template.loop);
      return [...filtered, suggestion];
    });
  };

  // Check if a loop has a selected goal
  const isLoopSelected = (loop: LoopId) => {
    return selectedSuggestions.some((s) => s.template.loop === loop);
  };

  // Get selected goal for a loop
  const getSelectedForLoop = (loop: LoopId) => {
    return selectedSuggestions.find((s) => s.template.loop === loop);
  };

  // Create goals from selections
  const createGoals = () => {
    const goals: Goal[] = selectedSuggestions.map((suggestion) => {
      const existing = customGoals.find(
        (g) => g.title === suggestion.template.title
      );
      if (existing) return existing;
      return createGoalFromTemplate(suggestion.template, prototype.userId);
    });
    setCustomGoals(goals);
    return goals;
  };

  // Handle customization of a goal
  const updateCustomGoal = (goalId: string, updates: Partial<Goal>) => {
    setCustomGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g))
    );
  };

  // Handle step navigation
  const nextStep = () => {
    switch (step) {
      case "intro":
        setStep("suggestions");
        break;
      case "suggestions":
        createGoals();
        setStep("customize");
        break;
      case "customize":
        setStep("decompose");
        break;
      case "decompose":
        setStep("review");
        break;
      case "review":
        // Create quarterly goals for each annual goal
        const allGoals: Goal[] = [];
        customGoals.forEach((goal) => {
          allGoals.push(goal);
          if (showDecomposition[goal.id]) {
            const template = GOAL_TEMPLATES.find(
              (t) => t.title === goal.title
            );
            const quarterlyGoals = decomposeAnnualToQuarterly(goal, template);
            // Update parent with child IDs
            goal.childGoalIds = quarterlyGoals.map((q) => q.id);
            allGoals.push(...quarterlyGoals);
          }
        });
        onComplete(allGoals);
        break;
    }
  };

  const prevStep = () => {
    switch (step) {
      case "suggestions":
        setStep("intro");
        break;
      case "customize":
        setStep("suggestions");
        break;
      case "decompose":
        setStep("customize");
        break;
      case "review":
        setStep("decompose");
        break;
    }
  };

  // Render intro step
  const renderIntro = () => (
    <div className="wizard-step wizard-step--intro">
      <div className="wizard-step__icon">🎯</div>
      <h2 className="wizard-step__title">Set Your Annual Goals</h2>
      <p className="wizard-step__description">
        Based on your <strong>{prototype.archetypeBlend.name}</strong> archetype,
        we'll suggest goals that align with your natural strengths and values.
      </p>

      <div className="wizard-intro__archetype">
        <div className="wizard-intro__archetype-blend">
          <div className="wizard-intro__archetype-primary">
            {prototype.archetypeBlend.primary}
            <span className="wizard-intro__archetype-score">
              {prototype.archetypeBlend.scores[prototype.archetypeBlend.primary]}%
            </span>
          </div>
          <span className="wizard-intro__archetype-separator">+</span>
          <div className="wizard-intro__archetype-secondary">
            {prototype.archetypeBlend.secondary}
            <span className="wizard-intro__archetype-score">
              {prototype.archetypeBlend.scores[prototype.archetypeBlend.secondary]}%
            </span>
          </div>
        </div>
      </div>

      <div className="wizard-intro__loops">
        <h3>Your Loop States</h3>
        <div className="wizard-intro__loop-grid">
          {ALL_LOOPS.map((loop) => {
            const state = loopStates[loop];
            const def = LOOP_DEFINITIONS[loop];
            const color = LOOP_COLORS[loop];
            return (
              <div
                key={loop}
                className="wizard-intro__loop-item"
                style={{ borderColor: color.border }}
              >
                <span className="wizard-intro__loop-icon">{def.icon}</span>
                <span className="wizard-intro__loop-name">{loop}</span>
                <span
                  className={`wizard-intro__loop-state wizard-intro__loop-state--${state.toLowerCase()}`}
                >
                  {state}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="wizard-intro__note">
        Goals in <strong>BUILD</strong> loops will be prioritized. We recommend
        selecting 3-5 annual goals to maintain focus.
      </p>
    </div>
  );

  // Render suggestions step
  const renderSuggestions = () => (
    <div className="wizard-step wizard-step--suggestions">
      <h2 className="wizard-step__title">Choose Your Goals</h2>
      <p className="wizard-step__description">
        Select one goal per loop. Goals are ranked by how well they match your archetype.
        <span className="wizard-step__count">
          {selectedSuggestions.length} of 7 loops selected
        </span>
      </p>

      <div className="wizard-suggestions__tabs">
        {ALL_LOOPS.map((loop) => {
          const def = LOOP_DEFINITIONS[loop];
          const color = LOOP_COLORS[loop];
          const selected = isLoopSelected(loop);
          return (
            <button
              key={loop}
              className={`wizard-suggestions__tab ${
                activeLoop === loop ? "wizard-suggestions__tab--active" : ""
              } ${selected ? "wizard-suggestions__tab--selected" : ""}`}
              onClick={() => setActiveLoop(activeLoop === loop ? null : loop)}
              style={{
                borderColor: activeLoop === loop ? color.border : undefined,
                backgroundColor: selected ? color.bg : undefined,
              }}
            >
              <span className="wizard-suggestions__tab-icon">{def.icon}</span>
              <span className="wizard-suggestions__tab-name">{loop}</span>
              {selected && <span className="wizard-suggestions__tab-check">✓</span>}
            </button>
          );
        })}
      </div>

      {activeLoop && (
        <div className="wizard-suggestions__list">
          <h3 className="wizard-suggestions__loop-title">
            {LOOP_DEFINITIONS[activeLoop].icon} {activeLoop} Goals
          </h3>
          <div className="wizard-suggestions__grid">
            {suggestionsByLoop[activeLoop].map((suggestion) => (
              <GoalSuggestionCard
                key={suggestion.template.id}
                suggestion={suggestion}
                isSelected={selectedSuggestions.some(
                  (s) => s.template.id === suggestion.template.id
                )}
                onSelect={() => toggleSuggestion(suggestion)}
              />
            ))}
          </div>
        </div>
      )}

      {!activeLoop && (
        <div className="wizard-suggestions__prompt">
          <p>Click a loop above to see goal suggestions</p>
        </div>
      )}

      {selectedSuggestions.length > 0 && (
        <div className="wizard-suggestions__summary">
          <h4>Selected Goals:</h4>
          <div className="wizard-suggestions__selected-list">
            {selectedSuggestions.map((s) => (
              <div
                key={s.template.id}
                className="wizard-suggestions__selected-item"
                style={{ borderColor: LOOP_COLORS[s.template.loop].border }}
              >
                <span>{LOOP_DEFINITIONS[s.template.loop].icon}</span>
                <span>{s.template.title}</span>
                <button
                  className="wizard-suggestions__remove"
                  onClick={() => toggleSuggestion(s)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render customize step
  const renderCustomize = () => (
    <div className="wizard-step wizard-step--customize">
      <h2 className="wizard-step__title">Customize Your Goals</h2>
      <p className="wizard-step__description">
        Fine-tune each goal to make it personally meaningful.
      </p>

      <div className="wizard-customize__list">
        {customGoals.map((goal) => {
          const color = LOOP_COLORS[goal.loop];
          const def = LOOP_DEFINITIONS[goal.loop];
          return (
            <div
              key={goal.id}
              className="wizard-customize__goal"
              style={{ borderColor: color.border }}
            >
              <div className="wizard-customize__goal-header">
                <span
                  className="wizard-customize__goal-badge"
                  style={{ backgroundColor: color.border }}
                >
                  {def.icon} {goal.loop}
                </span>
              </div>

              <div className="wizard-customize__field">
                <label>Goal Title</label>
                <input
                  type="text"
                  value={goal.title}
                  onChange={(e) =>
                    updateCustomGoal(goal.id, { title: e.target.value })
                  }
                />
              </div>

              <div className="wizard-customize__field">
                <label>Description</label>
                <textarea
                  value={goal.description || ""}
                  onChange={(e) =>
                    updateCustomGoal(goal.id, { description: e.target.value })
                  }
                  rows={2}
                />
              </div>

              {goal.metrics && goal.metrics.length > 0 && (
                <div className="wizard-customize__metrics">
                  <label>Success Metrics</label>
                  {goal.metrics.map((metric, idx) => (
                    <div key={metric.id} className="wizard-customize__metric">
                      <span className="wizard-customize__metric-name">
                        {metric.name}
                      </span>
                      <input
                        type="number"
                        value={metric.target}
                        onChange={(e) => {
                          const newMetrics = [...goal.metrics!];
                          newMetrics[idx] = {
                            ...metric,
                            target: Number(e.target.value),
                          };
                          updateCustomGoal(goal.id, { metrics: newMetrics });
                        }}
                      />
                      <span className="wizard-customize__metric-unit">
                        {metric.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render decompose step
  const renderDecompose = () => (
    <div className="wizard-step wizard-step--decompose">
      <h2 className="wizard-step__title">Break Down Your Goals</h2>
      <p className="wizard-step__description">
        Choose which goals to decompose into quarterly milestones.
      </p>

      <div className="wizard-decompose__list">
        {customGoals.map((goal) => {
          const color = LOOP_COLORS[goal.loop];
          const def = LOOP_DEFINITIONS[goal.loop];
          const template = GOAL_TEMPLATES.find((t) => t.title === goal.title);
          const quarterlyGoals = decomposeAnnualToQuarterly(goal, template);
          const isExpanded = showDecomposition[goal.id];

          return (
            <div
              key={goal.id}
              className="wizard-decompose__goal"
              style={{ borderColor: color.border }}
            >
              <div className="wizard-decompose__goal-header">
                <div className="wizard-decompose__goal-info">
                  <span
                    className="wizard-decompose__goal-badge"
                    style={{ backgroundColor: color.border }}
                  >
                    {def.icon}
                  </span>
                  <span className="wizard-decompose__goal-title">{goal.title}</span>
                </div>
                <button
                  className={`wizard-decompose__toggle ${
                    isExpanded ? "wizard-decompose__toggle--active" : ""
                  }`}
                  onClick={() =>
                    setShowDecomposition((prev) => ({
                      ...prev,
                      [goal.id]: !prev[goal.id],
                    }))
                  }
                >
                  {isExpanded ? "Hide Quarters" : "Show Quarters"}
                </button>
              </div>

              {isExpanded && (
                <div className="wizard-decompose__quarters">
                  {quarterlyGoals.map((q, idx) => (
                    <div key={q.id} className="wizard-decompose__quarter">
                      <span className="wizard-decompose__quarter-label">
                        Q{idx + 1}
                      </span>
                      <span className="wizard-decompose__quarter-title">
                        {q.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render review step
  const renderReview = () => (
    <div className="wizard-step wizard-step--review">
      <h2 className="wizard-step__title">Review Your Goals</h2>
      <p className="wizard-step__description">
        Here's your annual plan. You can always adjust these later.
      </p>

      <div className="wizard-review__summary">
        <div className="wizard-review__stat">
          <span className="wizard-review__stat-value">{customGoals.length}</span>
          <span className="wizard-review__stat-label">Annual Goals</span>
        </div>
        <div className="wizard-review__stat">
          <span className="wizard-review__stat-value">
            {Object.values(showDecomposition).filter(Boolean).length * 4}
          </span>
          <span className="wizard-review__stat-label">Quarterly Milestones</span>
        </div>
        <div className="wizard-review__stat">
          <span className="wizard-review__stat-value">
            {customGoals.map((g) => g.loop).filter((v, i, a) => a.indexOf(v) === i).length}
          </span>
          <span className="wizard-review__stat-label">Loops Covered</span>
        </div>
      </div>

      <div className="wizard-review__goals">
        {customGoals.map((goal) => {
          const color = LOOP_COLORS[goal.loop];
          const def = LOOP_DEFINITIONS[goal.loop];
          const hasQuarters = showDecomposition[goal.id];

          return (
            <div
              key={goal.id}
              className="wizard-review__goal"
              style={{ borderLeftColor: color.border }}
            >
              <div className="wizard-review__goal-header">
                <span
                  className="wizard-review__goal-badge"
                  style={{ backgroundColor: color.border }}
                >
                  {def.icon} {goal.loop}
                </span>
                {hasQuarters && (
                  <span className="wizard-review__goal-tag">+ 4 quarters</span>
                )}
              </div>
              <h4 className="wizard-review__goal-title">{goal.title}</h4>
              {goal.description && (
                <p className="wizard-review__goal-description">{goal.description}</p>
              )}
              {goal.metrics && goal.metrics.length > 0 && (
                <div className="wizard-review__goal-metrics">
                  {goal.metrics.map((m) => (
                    <span key={m.id} className="wizard-review__goal-metric">
                      {m.name}: {m.target} {m.unit}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render current step
  const renderStep = () => {
    switch (step) {
      case "intro":
        return renderIntro();
      case "suggestions":
        return renderSuggestions();
      case "customize":
        return renderCustomize();
      case "decompose":
        return renderDecompose();
      case "review":
        return renderReview();
    }
  };

  // Get step progress
  const getStepNumber = () => {
    const steps: WizardStep[] = ["intro", "suggestions", "customize", "decompose", "review"];
    return steps.indexOf(step) + 1;
  };

  // Check if can proceed
  const canProceed = () => {
    switch (step) {
      case "suggestions":
        return selectedSuggestions.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="annual-goals-wizard">
      <div className="annual-goals-wizard__header">
        <h1 className="annual-goals-wizard__title">Annual Goals</h1>
        <div className="annual-goals-wizard__progress">
          <div className="annual-goals-wizard__progress-bar">
            <div
              className="annual-goals-wizard__progress-fill"
              style={{ width: `${(getStepNumber() / 5) * 100}%` }}
            />
          </div>
          <span className="annual-goals-wizard__progress-text">
            Step {getStepNumber()} of 5
          </span>
        </div>
      </div>

      <div className="annual-goals-wizard__content">{renderStep()}</div>

      <div className="annual-goals-wizard__footer">
        <button
          className="annual-goals-wizard__btn annual-goals-wizard__btn--secondary"
          onClick={step === "intro" ? onCancel : prevStep}
        >
          {step === "intro" ? "Cancel" : "Back"}
        </button>
        <button
          className="annual-goals-wizard__btn annual-goals-wizard__btn--primary"
          onClick={nextStep}
          disabled={!canProceed()}
        >
          {step === "review" ? "Create Goals" : "Continue"}
        </button>
      </div>
    </div>
  );
}

export default AnnualGoalsWizard;
