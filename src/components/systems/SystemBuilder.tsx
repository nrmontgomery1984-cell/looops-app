// System Builder - Guided wizard for creating behavior change systems
// Transforms goals into identity + habits + environment design
// Enhanced with archetype-aware personalization

import React, { useState, useEffect } from "react";
import {
  System,
  SystemTemplate,
  SYSTEM_TEMPLATES,
  Habit,
  HabitCue,
  HabitFrequency,
  Identity,
  EnvironmentTweak,
  LoopId,
  LOOP_DEFINITIONS,
  LOOP_COLORS,
  ALL_LOOPS,
  Goal,
} from "../../types";
import { useApp } from "../../context";
import { ARCHETYPE_OBSTACLES } from "../../engines/habitEngine";
import { ARCHETYPE_IDENTITY_TEMPLATES } from "../../engines/voiceEngine";
import { suggestSystemTemplatesForGoal } from "../../engines/systemEngine";

type WizardStep =
  | "select_template"
  | "define_goal"
  | "shape_identity"
  | "choose_habits"
  | "design_environment"
  | "plan_obstacles"
  | "review";

interface SystemBuilderProps {
  onComplete: (system: System, habits: Habit[]) => void;
  onCancel: () => void;
  initialLoop?: LoopId;
  linkedGoal?: Goal;
}

export function SystemBuilder({ onComplete, onCancel, initialLoop, linkedGoal }: SystemBuilderProps) {
  const { state } = useApp();
  const prototype = state.user.prototype;
  const archetype = prototype?.archetypeBlend?.primary;

  const [step, setStep] = useState<WizardStep>("select_template");
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
  const [selectedLoop, setSelectedLoop] = useState<LoopId>(linkedGoal?.loop || initialLoop || "Health");

  // Get suggested templates if we have a linked goal
  const suggestedTemplates = linkedGoal ? suggestSystemTemplatesForGoal(linkedGoal) : [];

  // Form state
  const [goalStatement, setGoalStatement] = useState(linkedGoal?.title || "");
  const [identityStatement, setIdentityStatement] = useState("");
  const [selectedHabits, setSelectedHabits] = useState<Array<{
    title: string;
    description: string;
    cue: HabitCue;
    response: string;
    reward?: string;
    frequency: HabitFrequency;
    timeOfDay?: "morning" | "afternoon" | "evening" | "anytime";
    enabled: boolean;
  }>>([]);
  const [environmentTweaks, setEnvironmentTweaks] = useState<EnvironmentTweak[]>([]);
  const [obstacles, setObstacles] = useState<Array<{ obstacle: string; solution: string }>>([]);
  const [customHabit, setCustomHabit] = useState({
    title: "",
    cueType: "time" as HabitCue["type"],
    cueValue: "",
    response: "",
    frequency: "daily" as HabitFrequency,
  });

  // Filter templates by selected loop
  const loopTemplates = SYSTEM_TEMPLATES.filter(t => t.loop === selectedLoop);

  const handleSelectTemplate = (template: SystemTemplate) => {
    setSelectedTemplate(template);
    setSelectedLoop(template.loop);
    setIdentityStatement(template.identityTemplate);
    setSelectedHabits(template.suggestedHabits.map(h => ({ ...h, enabled: true })));
    setEnvironmentTweaks(template.suggestedEnvironmentTweaks.map((t, i) => ({
      id: `env_${i}`,
      ...t,
      completed: false,
    })));
    setObstacles(template.commonObstacles);
    setStep("define_goal");
  };

  const handleStartCustom = () => {
    setSelectedTemplate(null);
    setSelectedHabits([]);
    setEnvironmentTweaks([]);
    setObstacles([]);
    setStep("define_goal");
  };

  const handleAddCustomHabit = () => {
    if (!customHabit.title.trim() || !customHabit.response.trim()) return;

    setSelectedHabits([
      ...selectedHabits,
      {
        title: customHabit.title,
        description: "",
        cue: { type: customHabit.cueType, value: customHabit.cueValue },
        response: customHabit.response,
        frequency: customHabit.frequency,
        timeOfDay: "anytime",
        enabled: true,
      },
    ]);
    setCustomHabit({
      title: "",
      cueType: "time",
      cueValue: "",
      response: "",
      frequency: "daily",
    });
  };

  const handleAddEnvironmentTweak = (type: "add" | "remove" | "modify") => {
    const descriptions = {
      add: "Add something to your environment...",
      remove: "Remove something from your environment...",
      modify: "Change something in your environment...",
    };
    setEnvironmentTweaks([
      ...environmentTweaks,
      {
        id: `env_${Date.now()}`,
        description: "",
        type,
        completed: false,
      },
    ]);
  };

  const handleAddObstacle = () => {
    setObstacles([...obstacles, { obstacle: "", solution: "" }]);
  };

  const handleComplete = () => {
    const now = new Date().toISOString();
    const systemId = `sys_${Date.now()}`;

    // Create identity
    const identity: Identity = {
      id: `id_${Date.now()}`,
      statement: identityStatement,
      loop: selectedLoop,
      createdAt: now,
      updatedAt: now,
    };

    // Create habits
    const habits: Habit[] = selectedHabits
      .filter(h => h.enabled)
      .map((h, i) => ({
        id: `hab_${Date.now()}_${i}`,
        title: h.title,
        description: h.description,
        loop: selectedLoop,
        type: "build" as const,
        cue: h.cue,
        craving: undefined,
        response: h.response,
        reward: h.reward,
        frequency: h.frequency,
        timeOfDay: h.timeOfDay,
        streak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        systemId,
        status: "active" as const,
        createdAt: now,
        updatedAt: now,
      }));

    // Create system
    const system: System = {
      id: systemId,
      title: selectedTemplate?.title || `${selectedLoop} System`,
      description: selectedTemplate?.description,
      loop: selectedLoop,
      goalStatement,
      linkedGoalId: linkedGoal?.id,
      identity,
      habitIds: habits.map(h => h.id),
      environmentTweaks: environmentTweaks.filter(t => t.description.trim()),
      metrics: selectedTemplate?.suggestedMetrics.map((m, i) => ({
        id: `metric_${i}`,
        name: m.name,
        unit: m.unit,
        entries: [],
      })) || [],
      obstaclePlaybook: obstacles.filter(o => o.obstacle.trim() && o.solution.trim()),
      status: "active",
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    onComplete(system, habits);
  };

  const nextStep = () => {
    const steps: WizardStep[] = [
      "select_template",
      "define_goal",
      "shape_identity",
      "choose_habits",
      "design_environment",
      "plan_obstacles",
      "review",
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: WizardStep[] = [
      "select_template",
      "define_goal",
      "shape_identity",
      "choose_habits",
      "design_environment",
      "plan_obstacles",
      "review",
    ];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const getStepNumber = () => {
    const steps: WizardStep[] = [
      "select_template",
      "define_goal",
      "shape_identity",
      "choose_habits",
      "design_environment",
      "plan_obstacles",
      "review",
    ];
    return steps.indexOf(step) + 1;
  };

  return (
    <div className="system-builder">
      <div className="system-builder-header">
        <div className="system-builder-progress">
          <span className="step-indicator">Step {getStepNumber()} of 7</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(getStepNumber() / 7) * 100}%` }}
            />
          </div>
        </div>
        <button className="system-builder-close" onClick={onCancel}>×</button>
      </div>

      <div className="system-builder-content">
        {/* Step 1: Select Template or Start Custom */}
        {step === "select_template" && (
          <div className="wizard-step">
            <h2>Build a Behavior System</h2>
            <p className="wizard-subtitle">
              Choose a template to get started, or create your own from scratch.
            </p>

            <div className="loop-filter">
              {ALL_LOOPS.map(loop => (
                <button
                  key={loop}
                  className={`loop-filter-btn ${selectedLoop === loop ? "active" : ""}`}
                  onClick={() => setSelectedLoop(loop)}
                  style={{
                    "--loop-color": LOOP_COLORS[loop],
                  } as React.CSSProperties}
                >
                  {LOOP_DEFINITIONS[loop].icon} {loop}
                </button>
              ))}
            </div>

            <div className="template-grid">
              {loopTemplates.map(template => (
                <button
                  key={template.id}
                  className="template-card"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="template-card-header">
                    <span className="template-difficulty">{template.difficulty}</span>
                    <span className="template-duration">{template.estimatedDuration}</span>
                  </div>
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
                  <div className="template-habits">
                    {template.suggestedHabits.length} habits included
                  </div>
                </button>
              ))}

              <button
                className="template-card template-card--custom"
                onClick={handleStartCustom}
              >
                <div className="custom-icon">+</div>
                <h3>Create Custom</h3>
                <p>Build your own system from scratch</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Define Goal */}
        {step === "define_goal" && (
          <div className="wizard-step">
            <h2>What's Your Goal?</h2>
            <p className="wizard-subtitle">
              {selectedTemplate?.goalPrompt || "What do you want to achieve?"}
            </p>

            <div className="goal-input-section">
              <textarea
                className="goal-input"
                value={goalStatement}
                onChange={(e) => setGoalStatement(e.target.value)}
                placeholder="I want to..."
                rows={3}
              />

              <div className="goal-tips">
                <h4>Tips for effective goals:</h4>
                <ul>
                  <li>Be specific about what success looks like</li>
                  <li>Focus on behavior, not just outcomes</li>
                  <li>Make it measurable when possible</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Shape Identity */}
        {step === "shape_identity" && (
          <div className="wizard-step">
            <h2>Who Do You Want to Become?</h2>
            <p className="wizard-subtitle">
              Every action is a vote for the type of person you want to be.
              Define the identity that makes your goal inevitable.
            </p>

            {/* Archetype context banner */}
            {archetype && (
              <div className="archetype-context-banner">
                <span className="archetype-badge">As a {archetype}</span>
                <span className="archetype-hint">
                  {ARCHETYPE_IDENTITY_TEMPLATES[archetype].style}
                </span>
              </div>
            )}

            <div className="identity-section">
              <div className="identity-prompt">
                <span className="identity-prefix">
                  {archetype ? ARCHETYPE_IDENTITY_TEMPLATES[archetype].prefix : "I am a person who"}
                </span>
                <textarea
                  className="identity-input"
                  value={identityStatement.replace(/^I am (a person|someone) who /, "")}
                  onChange={(e) => {
                    const prefix = archetype
                      ? ARCHETYPE_IDENTITY_TEMPLATES[archetype].prefix
                      : "I am a person who";
                    setIdentityStatement(`${prefix} ${e.target.value}`);
                  }}
                  placeholder="prioritizes their health..."
                  rows={2}
                />
              </div>

              <div className="identity-examples">
                <h4>
                  {archetype ? `Identity examples for ${archetype}s:` : "Identity examples:"}
                </h4>
                <ul>
                  {archetype ? (
                    ARCHETYPE_IDENTITY_TEMPLATES[archetype].examples.slice(0, 4).map((ex, i) => (
                      <li key={i}>
                        <button
                          className="identity-example-btn"
                          onClick={() => {
                            const prefix = ARCHETYPE_IDENTITY_TEMPLATES[archetype].prefix;
                            setIdentityStatement(`${prefix} ${ex}`);
                          }}
                        >
                          "...{ex}"
                        </button>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>"...shows up every day, even when it's hard"</li>
                      <li>"...makes healthy choices for my future self"</li>
                      <li>"...invests in relationships that matter"</li>
                      <li>"...does the work before feeling motivated"</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Choose Habits */}
        {step === "choose_habits" && (
          <div className="wizard-step">
            <h2>Build Your Habits</h2>
            <p className="wizard-subtitle">
              Small habits compound into remarkable results.
              Start with 2-3 habits you can do in 2 minutes or less.
            </p>

            <div className="habits-section">
              {selectedHabits.length > 0 && (
                <div className="suggested-habits">
                  <h4>Suggested Habits</h4>
                  {selectedHabits.map((habit, index) => (
                    <div key={index} className={`habit-card ${habit.enabled ? "" : "disabled"}`}>
                      <label className="habit-toggle">
                        <input
                          type="checkbox"
                          checked={habit.enabled}
                          onChange={() => {
                            const updated = [...selectedHabits];
                            updated[index].enabled = !updated[index].enabled;
                            setSelectedHabits(updated);
                          }}
                        />
                        <span className="checkmark" />
                      </label>
                      <div className="habit-card-content">
                        <h5>{habit.title}</h5>
                        <p className="habit-response">{habit.response}</p>
                        <div className="habit-meta">
                          <span className="habit-cue">{habit.cue.type}: {habit.cue.value}</span>
                          <span className="habit-frequency">{habit.frequency}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="add-custom-habit">
                <h4>Add Custom Habit</h4>
                <div className="custom-habit-form">
                  <input
                    type="text"
                    placeholder="Habit name (e.g., 'Drink water')"
                    value={customHabit.title}
                    onChange={(e) => setCustomHabit({ ...customHabit, title: e.target.value })}
                  />
                  <div className="custom-habit-row">
                    <select
                      value={customHabit.cueType}
                      onChange={(e) => setCustomHabit({
                        ...customHabit,
                        cueType: e.target.value as HabitCue["type"]
                      })}
                    >
                      <option value="time">Time-based</option>
                      <option value="location">Location-based</option>
                      <option value="preceding_action">After action</option>
                      <option value="emotional_state">Emotional state</option>
                    </select>
                    <input
                      type="text"
                      placeholder={
                        customHabit.cueType === "time" ? "e.g., 7:00 AM" :
                        customHabit.cueType === "location" ? "e.g., Kitchen" :
                        customHabit.cueType === "preceding_action" ? "e.g., After coffee" :
                        "e.g., When stressed"
                      }
                      value={customHabit.cueValue}
                      onChange={(e) => setCustomHabit({ ...customHabit, cueValue: e.target.value })}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="2-minute version (e.g., 'Drink one glass of water')"
                    value={customHabit.response}
                    onChange={(e) => setCustomHabit({ ...customHabit, response: e.target.value })}
                  />
                  <div className="custom-habit-row">
                    <select
                      value={customHabit.frequency}
                      onChange={(e) => setCustomHabit({
                        ...customHabit,
                        frequency: e.target.value as HabitFrequency
                      })}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekdays">Weekdays</option>
                      <option value="weekends">Weekends</option>
                      <option value="weekly">Weekly</option>
                    </select>
                    <button
                      className="add-habit-btn"
                      onClick={handleAddCustomHabit}
                      disabled={!customHabit.title.trim() || !customHabit.response.trim()}
                    >
                      + Add Habit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Design Environment */}
        {step === "design_environment" && (
          <div className="wizard-step">
            <h2>Design Your Environment</h2>
            <p className="wizard-subtitle">
              Make good habits obvious and easy. Make bad habits invisible and hard.
              Your environment shapes your behavior more than willpower.
            </p>

            <div className="environment-section">
              {environmentTweaks.map((tweak, index) => (
                <div key={tweak.id} className="environment-tweak">
                  <span className={`tweak-type tweak-type--${tweak.type}`}>
                    {tweak.type === "add" ? "➕ Add" : tweak.type === "remove" ? "➖ Remove" : "🔄 Modify"}
                  </span>
                  <input
                    type="text"
                    value={tweak.description}
                    onChange={(e) => {
                      const updated = [...environmentTweaks];
                      updated[index].description = e.target.value;
                      setEnvironmentTweaks(updated);
                    }}
                    placeholder={
                      tweak.type === "add" ? "What will you add to your environment?" :
                      tweak.type === "remove" ? "What will you remove?" :
                      "What will you change?"
                    }
                  />
                  <button
                    className="remove-tweak"
                    onClick={() => setEnvironmentTweaks(environmentTweaks.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="add-tweak-buttons">
                <button onClick={() => handleAddEnvironmentTweak("add")}>
                  ➕ Add Something
                </button>
                <button onClick={() => handleAddEnvironmentTweak("remove")}>
                  ➖ Remove Something
                </button>
                <button onClick={() => handleAddEnvironmentTweak("modify")}>
                  🔄 Change Something
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Plan for Obstacles */}
        {step === "plan_obstacles" && (
          <div className="wizard-step">
            <h2>Plan for Obstacles</h2>
            <p className="wizard-subtitle">
              "If [obstacle], then [solution]" - Having a plan for when things go wrong
              dramatically increases your chances of following through.
            </p>

            {/* Archetype-specific obstacle suggestions */}
            {archetype && ARCHETYPE_OBSTACLES[archetype] && (
              <div className="archetype-obstacles-suggestions">
                <h4>Common obstacles for {archetype}s:</h4>
                <div className="obstacle-suggestion-list">
                  {ARCHETYPE_OBSTACLES[archetype].slice(0, 3).map((suggestion, i) => (
                    <button
                      key={i}
                      className="obstacle-suggestion"
                      onClick={() => {
                        // Check if this obstacle is already added
                        const exists = obstacles.some(
                          o => o.obstacle === suggestion.obstacle
                        );
                        if (!exists) {
                          setObstacles([
                            ...obstacles,
                            { obstacle: suggestion.obstacle, solution: suggestion.strategy },
                          ]);
                        }
                      }}
                    >
                      <span className="suggestion-obstacle">{suggestion.obstacle}</span>
                      <span className="suggestion-arrow">→</span>
                      <span className="suggestion-strategy">{suggestion.strategy}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="obstacles-section">
              {obstacles.map((item, index) => (
                <div key={index} className="obstacle-item">
                  <div className="obstacle-if">
                    <span className="obstacle-label">If...</span>
                    <input
                      type="text"
                      value={item.obstacle}
                      onChange={(e) => {
                        const updated = [...obstacles];
                        updated[index].obstacle = e.target.value;
                        setObstacles(updated);
                      }}
                      placeholder="I don't feel like it / I'm too busy / etc."
                    />
                  </div>
                  <div className="obstacle-then">
                    <span className="obstacle-label">Then I will...</span>
                    <input
                      type="text"
                      value={item.solution}
                      onChange={(e) => {
                        const updated = [...obstacles];
                        updated[index].solution = e.target.value;
                        setObstacles(updated);
                      }}
                      placeholder="Do a 2-minute version / reschedule for tomorrow / etc."
                    />
                  </div>
                  <button
                    className="remove-obstacle"
                    onClick={() => setObstacles(obstacles.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button className="add-obstacle-btn" onClick={handleAddObstacle}>
                + Add Obstacle Plan
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Review */}
        {step === "review" && (
          <div className="wizard-step">
            <h2>Review Your System</h2>
            <p className="wizard-subtitle">
              Here's your complete behavior system. You can always adjust it later.
            </p>

            <div className="review-section">
              <div className="review-card">
                <h4>🎯 Goal</h4>
                <p>{goalStatement || "No goal set"}</p>
              </div>

              <div className="review-card">
                <h4>🪞 Identity</h4>
                <p>{identityStatement || "No identity defined"}</p>
              </div>

              <div className="review-card">
                <h4>🔥 Habits ({selectedHabits.filter(h => h.enabled).length})</h4>
                <ul>
                  {selectedHabits.filter(h => h.enabled).map((h, i) => (
                    <li key={i}>{h.title}</li>
                  ))}
                </ul>
              </div>

              <div className="review-card">
                <h4>🏠 Environment Changes ({environmentTweaks.filter(t => t.description).length})</h4>
                <ul>
                  {environmentTweaks.filter(t => t.description).map((t, i) => (
                    <li key={i}>{t.type}: {t.description}</li>
                  ))}
                </ul>
              </div>

              <div className="review-card">
                <h4>🛡️ Obstacle Plans ({obstacles.filter(o => o.obstacle && o.solution).length})</h4>
                <ul>
                  {obstacles.filter(o => o.obstacle && o.solution).map((o, i) => (
                    <li key={i}>If {o.obstacle}, then {o.solution}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="system-builder-footer">
        {step !== "select_template" && (
          <button className="wizard-btn wizard-btn--secondary" onClick={prevStep}>
            Back
          </button>
        )}
        <div className="footer-spacer" />
        {step === "review" ? (
          <button
            className="wizard-btn wizard-btn--primary"
            onClick={handleComplete}
            disabled={!goalStatement.trim() || selectedHabits.filter(h => h.enabled).length === 0}
          >
            Create System
          </button>
        ) : step !== "select_template" ? (
          <button className="wizard-btn wizard-btn--primary" onClick={nextStep}>
            Continue
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default SystemBuilder;
