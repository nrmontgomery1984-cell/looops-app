// Main directional document intake wizard

import React, { useState, useMemo, useCallback } from "react";
import {
  DirectionalDocument,
  DirectionalIntakeProgress,
  CoreIntakeStep,
  LoopIntakeStep,
  LoopId,
  ALL_LOOPS,
  ValueDimension,
  ConflictResolution,
  LoopDirections,
  createDirectionalDocument,
  createIntakeProgress,
  calculateCompletionProgress,
} from "../../types";
import { ValueSlider } from "./ValueSlider";
import { IdentitySelector } from "./IdentitySelector";
import { TradeoffScenario } from "./TradeoffScenario";
import { LoopPriorityRanker } from "./LoopPriorityRanker";
import { ResourceAllocationEditor } from "./ResourceAllocationEditor";
import { LoopDirectionsForm } from "./LoopDirectionsForm";
import {
  IDENTITY_STATEMENTS,
  VALUE_DIMENSIONS,
  TRADEOFF_SCENARIOS,
} from "../../data/directionalOptions";
import { LOOP_COLORS } from "../../types/core";

type DirectionalDocumentWizardProps = {
  userId: string;
  existingDocument?: DirectionalDocument | null;
  onComplete: (document: DirectionalDocument) => void;
  onCancel: () => void;
  onSaveProgress?: (document: DirectionalDocument) => void;
};

// Core step order
const CORE_STEPS: CoreIntakeStep[] = [
  "identity",
  "values",
  "tradeoffs",
  "priorities",
  "resources",
];

// Loop step order
const LOOP_STEPS: LoopIntakeStep[] = [
  "thriving",
  "nonnegotiables",
  "standards",
  "assessment",
  "dependencies",
  "season",
];

export function DirectionalDocumentWizard({
  userId,
  existingDocument,
  onComplete,
  onCancel,
  onSaveProgress,
}: DirectionalDocumentWizardProps) {
  // Initialize document (use existing or create new)
  const [document, setDocument] = useState<DirectionalDocument>(() =>
    existingDocument || createDirectionalDocument(userId)
  );

  // Track current step
  const [progress, setProgress] = useState<DirectionalIntakeProgress>(() => {
    if (existingDocument && existingDocument.status !== "complete") {
      // Resume from where we left off
      // For now, just restart from beginning
      return createIntakeProgress();
    }
    return createIntakeProgress();
  });

  // Current tradeoff scenario index (for tradeoffs step)
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

  // Calculate overall progress percentage
  const progressPercent = useMemo(
    () => calculateCompletionProgress(progress),
    [progress]
  );

  // Get step title
  const getStepTitle = useCallback(() => {
    if (progress.currentPhase === "core") {
      switch (progress.coreStep) {
        case "identity":
          return "Who Do You Want To Be?";
        case "values":
          return "Your Values";
        case "tradeoffs":
          return "Tradeoff Decisions";
        case "priorities":
          return "Loop Priorities";
        case "resources":
          return "Resource Philosophy";
      }
    } else {
      const loopName = progress.currentLoop || "";
      switch (progress.loopStep) {
        case "thriving":
          return `${loopName}: Vision of Thriving`;
        case "nonnegotiables":
          return `${loopName}: Non-Negotiables`;
        case "standards":
          return `${loopName}: Minimum Standards`;
        case "assessment":
          return `${loopName}: Current Assessment`;
        case "dependencies":
          return `${loopName}: Dependencies`;
        case "season":
          return `${loopName}: Current Season`;
      }
    }
    return "";
  }, [progress]);

  // Handle core updates
  const updateCore = useCallback(
    (updates: Partial<DirectionalDocument["core"]>) => {
      setDocument((prev) => ({
        ...prev,
        core: { ...prev.core, ...updates },
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  // Handle loop updates
  const updateLoop = useCallback(
    (loopId: LoopId, updates: Partial<LoopDirections>) => {
      setDocument((prev) => ({
        ...prev,
        loops: {
          ...prev.loops,
          [loopId]: { ...prev.loops[loopId], ...updates },
        },
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  // Navigation helpers
  const canGoBack = useMemo(() => {
    if (progress.currentPhase === "core") {
      return CORE_STEPS.indexOf(progress.coreStep!) > 0;
    }
    // In loop phase
    if (progress.loopStep !== LOOP_STEPS[0]) {
      return true;
    }
    // First step of loop - can go back to previous loop or core
    return true;
  }, [progress]);

  const goBack = useCallback(() => {
    setProgress((prev) => {
      if (prev.currentPhase === "core") {
        const currentIndex = CORE_STEPS.indexOf(prev.coreStep!);
        if (currentIndex > 0) {
          return {
            ...prev,
            coreStep: CORE_STEPS[currentIndex - 1],
            completedSteps: Math.max(0, prev.completedSteps - 1),
          };
        }
      } else {
        // Loop phase
        const stepIndex = LOOP_STEPS.indexOf(prev.loopStep!);
        if (stepIndex > 0) {
          return {
            ...prev,
            loopStep: LOOP_STEPS[stepIndex - 1],
            completedSteps: Math.max(0, prev.completedSteps - 1),
          };
        }
        // Go to previous loop or back to core
        const loopIndex = ALL_LOOPS.indexOf(prev.currentLoop!);
        if (loopIndex > 0) {
          return {
            ...prev,
            currentLoop: ALL_LOOPS[loopIndex - 1],
            loopStep: LOOP_STEPS[LOOP_STEPS.length - 1],
            completedSteps: Math.max(0, prev.completedSteps - 1),
          };
        }
        // Go back to core phase
        return {
          ...prev,
          currentPhase: "core",
          coreStep: CORE_STEPS[CORE_STEPS.length - 1],
          currentLoop: undefined,
          loopStep: undefined,
          completedSteps: Math.max(0, prev.completedSteps - 1),
        };
      }
      return prev;
    });
  }, []);

  const goNext = useCallback(() => {
    // Save progress if callback provided
    if (onSaveProgress) {
      onSaveProgress(document);
    }

    setProgress((prev) => {
      if (prev.currentPhase === "core") {
        const currentIndex = CORE_STEPS.indexOf(prev.coreStep!);
        if (currentIndex < CORE_STEPS.length - 1) {
          return {
            ...prev,
            coreStep: CORE_STEPS[currentIndex + 1],
            completedSteps: prev.completedSteps + 1,
          };
        }
        // Move to loop phase
        return {
          ...prev,
          currentPhase: "loops",
          coreStep: undefined,
          currentLoop: ALL_LOOPS[0],
          loopStep: LOOP_STEPS[0],
          completedSteps: prev.completedSteps + 1,
        };
      } else {
        // Loop phase
        const stepIndex = LOOP_STEPS.indexOf(prev.loopStep!);
        if (stepIndex < LOOP_STEPS.length - 1) {
          return {
            ...prev,
            loopStep: LOOP_STEPS[stepIndex + 1],
            completedSteps: prev.completedSteps + 1,
          };
        }
        // Move to next loop
        const loopIndex = ALL_LOOPS.indexOf(prev.currentLoop!);
        const completedLoops = [...prev.completedLoops, prev.currentLoop!];

        if (loopIndex < ALL_LOOPS.length - 1) {
          return {
            ...prev,
            currentLoop: ALL_LOOPS[loopIndex + 1],
            loopStep: LOOP_STEPS[0],
            completedLoops,
            completedSteps: prev.completedSteps + 1,
          };
        }
        // All done!
        return {
          ...prev,
          completedLoops,
          completedSteps: prev.totalSteps,
        };
      }
      return prev;
    });

    // Check if we just finished
    const isLastLoop =
      progress.currentPhase === "loops" &&
      progress.currentLoop === ALL_LOOPS[ALL_LOOPS.length - 1];
    const isLastStep =
      progress.loopStep === LOOP_STEPS[LOOP_STEPS.length - 1];

    if (isLastLoop && isLastStep) {
      // Complete the document
      const completedDoc: DirectionalDocument = {
        ...document,
        status: "complete",
        completionProgress: 100,
        updatedAt: new Date().toISOString(),
      };
      onComplete(completedDoc);
    }
  }, [document, progress, onComplete, onSaveProgress]);

  // Check if current step is valid to proceed
  const canProceed = useMemo(() => {
    if (progress.currentPhase === "core") {
      switch (progress.coreStep) {
        case "identity":
          return document.core.identityStatements.length >= 3;
        case "values":
          return true; // Values have defaults
        case "tradeoffs":
          // All scenarios must be answered
          return (
            document.core.tradeoffPriorities.conflictResolutions.length >=
            TRADEOFF_SCENARIOS.length
          );
        case "priorities":
          return (
            document.core.tradeoffPriorities.loopPriorityRanking.length ===
            ALL_LOOPS.length
          );
        case "resources":
          return true; // Has defaults
      }
    } else {
      // Loop steps always have valid defaults
      return true;
    }
    return false;
  }, [progress, document]);

  // Render current step content
  const renderStepContent = () => {
    if (progress.currentPhase === "core") {
      switch (progress.coreStep) {
        case "identity":
          return (
            <div className="directional-wizard__step">
              <p className="directional-wizard__step-intro">
                Select 3-7 statements that describe who you want to become. These
                aspirations form the foundation of your personal direction.
              </p>
              <IdentitySelector
                options={IDENTITY_STATEMENTS}
                selectedIds={document.core.identityStatements}
                onChange={(ids) => updateCore({ identityStatements: ids })}
                minSelections={3}
                maxSelections={7}
              />
            </div>
          );

        case "values":
          return (
            <div className="directional-wizard__step">
              <p className="directional-wizard__step-intro">
                Position yourself on each value dimension. There are no right or
                wrong answers - these reflect your authentic preferences.
              </p>
              <div className="directional-wizard__values-list">
                {VALUE_DIMENSIONS.map((dim) => (
                  <ValueSlider
                    key={dim.id}
                    dimension={dim}
                    value={document.core.valueSliders[dim.id]}
                    onChange={(id, value) =>
                      updateCore({
                        valueSliders: {
                          ...document.core.valueSliders,
                          [id]: value,
                        },
                      })
                    }
                  />
                ))}
              </div>
            </div>
          );

        case "tradeoffs":
          const scenario = TRADEOFF_SCENARIOS[currentScenarioIndex];
          const existingResolution =
            document.core.tradeoffPriorities.conflictResolutions.find(
              (r) => r.scenarioId === scenario.id
            );

          return (
            <div className="directional-wizard__step">
              <p className="directional-wizard__step-intro">
                When you can't have both, which do you choose? ({currentScenarioIndex + 1} of{" "}
                {TRADEOFF_SCENARIOS.length})
              </p>
              <TradeoffScenario
                scenario={scenario}
                selectedOption={existingResolution?.chosenOption || null}
                onSelect={(scenarioId, option) => {
                  const resolution: ConflictResolution = {
                    scenarioId,
                    chosenOption: option,
                    chosenLoop:
                      option === "A"
                        ? scenario.optionA.loopFocus
                        : scenario.optionB.loopFocus,
                    timestamp: new Date().toISOString(),
                  };

                  const existing =
                    document.core.tradeoffPriorities.conflictResolutions;
                  const updated = existing.filter(
                    (r) => r.scenarioId !== scenarioId
                  );
                  updated.push(resolution);

                  updateCore({
                    tradeoffPriorities: {
                      ...document.core.tradeoffPriorities,
                      conflictResolutions: updated,
                    },
                  });

                  // Auto-advance to next scenario after short delay
                  if (currentScenarioIndex < TRADEOFF_SCENARIOS.length - 1) {
                    setTimeout(() => {
                      setCurrentScenarioIndex((i) => i + 1);
                    }, 500);
                  }
                }}
              />
              <div className="directional-wizard__scenario-nav">
                <button
                  type="button"
                  disabled={currentScenarioIndex === 0}
                  onClick={() => setCurrentScenarioIndex((i) => i - 1)}
                  className="directional-wizard__scenario-btn"
                >
                  Previous
                </button>
                <span className="directional-wizard__scenario-counter">
                  {document.core.tradeoffPriorities.conflictResolutions.length} of{" "}
                  {TRADEOFF_SCENARIOS.length} answered
                </span>
                <button
                  type="button"
                  disabled={
                    currentScenarioIndex === TRADEOFF_SCENARIOS.length - 1
                  }
                  onClick={() => setCurrentScenarioIndex((i) => i + 1)}
                  className="directional-wizard__scenario-btn"
                >
                  Next
                </button>
              </div>
            </div>
          );

        case "priorities":
          return (
            <div className="directional-wizard__step">
              <p className="directional-wizard__step-intro">
                When time and energy are limited, which loops matter most? Drag
                to reorder from highest to lowest priority.
              </p>
              <LoopPriorityRanker
                ranking={document.core.tradeoffPriorities.loopPriorityRanking}
                onChange={(ranking) =>
                  updateCore({
                    tradeoffPriorities: {
                      ...document.core.tradeoffPriorities,
                      loopPriorityRanking: ranking,
                    },
                  })
                }
              />
            </div>
          );

        case "resources":
          return (
            <div className="directional-wizard__step">
              <p className="directional-wizard__step-intro">
                How do you want to allocate your resources across life areas?
              </p>
              <ResourceAllocationEditor
                timeAllocation={document.core.resourcePhilosophy.timeAllocation}
                energyManagement={
                  document.core.resourcePhilosophy.energyManagement
                }
                financialApproach={
                  document.core.resourcePhilosophy.financialApproach
                }
                onTimeChange={(allocation) =>
                  updateCore({
                    resourcePhilosophy: {
                      ...document.core.resourcePhilosophy,
                      timeAllocation: allocation,
                    },
                  })
                }
                onEnergyChange={(style) =>
                  updateCore({
                    resourcePhilosophy: {
                      ...document.core.resourcePhilosophy,
                      energyManagement: style,
                    },
                  })
                }
                onFinancialChange={(approach) =>
                  updateCore({
                    resourcePhilosophy: {
                      ...document.core.resourcePhilosophy,
                      financialApproach: approach,
                    },
                  })
                }
              />
            </div>
          );
      }
    } else {
      // Loop phase
      const loopId = progress.currentLoop!;
      const loopDir = document.loops[loopId];

      return (
        <div className="directional-wizard__step">
          <LoopDirectionsForm
            loopId={loopId}
            directions={loopDir}
            step={progress.loopStep!}
            onChange={(updates) => updateLoop(loopId, updates)}
          />
        </div>
      );
    }
  };

  return (
    <div className="directional-wizard">
      <div className="directional-wizard__header">
        <button
          type="button"
          className="directional-wizard__close"
          onClick={onCancel}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="directional-wizard__title">{getStepTitle()}</h2>
        <div className="directional-wizard__progress">
          <div className="directional-wizard__progress-bar">
            <div
              className="directional-wizard__progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="directional-wizard__progress-text">
            {progressPercent}% complete
          </span>
        </div>

        {/* Loop indicator for loop phase */}
        {progress.currentPhase === "loops" && progress.currentLoop && (
          <div className="directional-wizard__loop-indicator">
            {ALL_LOOPS.map((loopId) => (
              <span
                key={loopId}
                className={`directional-wizard__loop-dot ${
                  progress.completedLoops.includes(loopId)
                    ? "directional-wizard__loop-dot--completed"
                    : loopId === progress.currentLoop
                      ? "directional-wizard__loop-dot--current"
                      : ""
                }`}
                style={{ backgroundColor: LOOP_COLORS[loopId].border }}
                title={loopId}
              />
            ))}
          </div>
        )}
      </div>

      <div className="directional-wizard__content">{renderStepContent()}</div>

      <div className="directional-wizard__footer">
        <button
          type="button"
          className="directional-wizard__btn directional-wizard__btn--secondary"
          onClick={canGoBack ? goBack : onCancel}
        >
          {canGoBack ? "Back" : "Cancel"}
        </button>
        <button
          type="button"
          className="directional-wizard__btn directional-wizard__btn--primary"
          onClick={goNext}
          disabled={!canProceed}
        >
          {progress.currentPhase === "loops" &&
          progress.currentLoop === ALL_LOOPS[ALL_LOOPS.length - 1] &&
          progress.loopStep === LOOP_STEPS[LOOP_STEPS.length - 1]
            ? "Complete"
            : "Continue"}
        </button>
      </div>
    </div>
  );
}

export default DirectionalDocumentWizard;
